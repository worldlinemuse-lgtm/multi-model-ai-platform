/* Real OpenTelemetry SDK metrics: independent, local-only manual-pull pilot.
 * NOT imported by the live workshop. No global provider, periodic collector,
 * network exporter, automatic instrumentation, console capture or raw errors.
 * Only approved operation/outcome dictionaries reach SDK instruments.
 */
import {resourceFromAttributes} from '@opentelemetry/resources';
import {MeterProvider,MetricReader} from '@opentelemetry/sdk-metrics';

export const OPERATIONS=Object.freeze([
 'workshop.boot','workshop.code_run','workshop.project_save','workshop.preview',
 'workshop.snapshot','workshop.project_import','workshop.project_export',
 'workshop.data_analyze','workshop.offline_refresh','workshop.storage_check'
]);
export const OUTCOMES=Object.freeze(['ok','error','timeout','cancelled','warning','unknown']);
const OP=new Set(OPERATIONS),OUT=new Set(OUTCOMES);
const NAMES=Object.freeze(['mm.workshop.operation.completed','mm.workshop.operation.duration','mm.workshop.operation.active']);
const NAME_SET=new Set(NAMES),MAX_ACTIVE=20,MAX_MS=600000,MAX_REPORT_BYTES=65536;
class OnDemandReader extends MetricReader {
 selectCardinalityLimit(){return 80;}
 async onForceFlush(){}
 async onShutdown(){}
}
const valid=(v,set,kind)=>{if(typeof v!=='string'||!set.has(v))throw TypeError('Invalid '+kind);return v;};
export function createLocalOtelMetrics({clock=()=>performance.now()}={}){
 if(typeof clock!=='function')throw TypeError('Invalid monotonic clock');
 const reader=new OnDemandReader();
 const provider=new MeterProvider({
  resource:resourceFromAttributes({'service.name':'mm-workshop-local-metrics','service.version':'0.1.0'}),
  readers:[reader]
 });
 const meter=provider.getMeter('mm.workshop.local-metrics','0.1.0');
 const complete=meter.createCounter(NAMES[0],{description:'Completed local workshop operations',unit:'1'});
 const duration=meter.createHistogram(NAMES[1],{description:'Local operation duration',unit:'ms'});
 const activeGauge=meter.createUpDownCounter(NAMES[2],{description:'Started minus completed local operations',unit:'1'});
 const active=new Map();
 const totals=new Map(OPERATIONS.map(op=>[op,{total:0,ok:0,errors:0,timeouts:0,cancelled:0,warnings:0,unknown:0,durationSamples:0}]));
 let disposed=false,rejectedStarts=0,collectionGeneration=0;
 const now=()=>{const n=clock();return Number.isFinite(n)&&n>=0?n:null;};
 function tally(op,outcome,elapsed){
  const t=totals.get(op);t.total++;
  const key={ok:'ok',error:'errors',timeout:'timeouts',cancelled:'cancelled',warning:'warnings',unknown:'unknown'}[outcome];
  t[key]++;
  const attrs={'mm.operation':op,'mm.outcome':outcome};
  complete.add(1,attrs);
  if(elapsed!==null){duration.record(elapsed,attrs);t.durationSamples++;}
 }
 function begin(op){
  valid(op,OP,'operation');
  if(disposed)throw Error('Metrics provider is shut down');
  if(active.size>=MAX_ACTIVE){rejectedStarts++;return null;}
  const token=Object.freeze({});
  active.set(token,{op,start:now()});
  activeGauge.add(1,{'mm.operation':op});
  return token;
 }
 function finish(token,outcome='ok'){
  valid(outcome,OUT,'outcome');
  if(!active.has(token))return false;
  const item=active.get(token);active.delete(token);
  activeGauge.add(-1,{'mm.operation':item.op});
  const end=now();
  const elapsed=end!==null&&item.start!==null&&end>=item.start?Math.min(MAX_MS,Math.round(end-item.start)):null;
  tally(item.op,outcome,elapsed);
  return true;
 }
 function record(op,outcome='warning'){
  valid(op,OP,'operation');valid(outcome,OUT,'outcome');
  if(disposed)throw Error('Metrics provider is shut down');
  tally(op,outcome,null);return true;
 }
 function summary(){
  return Object.freeze({
   schema:'mm-workshop-otel-metrics-local-v1',scope:'in-memory-only',
   emittedByProduction:false,active:active.size,rejectedStarts,
   byOperation:OPERATIONS.map(operation=>({operation,...totals.get(operation)}))
  });
 }
 async function collect(){
  if(disposed)throw Error('Metrics provider is shut down');
  const generation=++collectionGeneration;
  try{
   const result=await reader.collect();
   if(disposed||generation!==collectionGeneration)return Object.freeze({collectionStatus:'superseded'});
   const observed=new Set();
   for(const scope of result.resourceMetrics?.scopeMetrics||[]){
    // Never copy SDK resources, data points, error objects, or arbitrary attributes.
    for(const metric of scope.metrics||[]){
     const name=metric.descriptor?.name;
     if(NAME_SET.has(name))observed.add(name);
    }
   }
   const report={...summary(),collectionStatus:'observed',
    sdkInstrumentNames:NAMES.filter(x=>observed.has(x)),
    sdkErrorCount:Array.isArray(result.errors)?Math.min(result.errors.length,9999):0};
   if(JSON.stringify(report).length>MAX_REPORT_BYTES)throw Error('Diagnostic report resource limit');
   return Object.freeze(report);
  }catch{
   return Object.freeze({...summary(),collectionStatus:'error',sdkInstrumentNames:[],sdkErrorCount:1});
  }
 }
 async function shutdown(){
  if(disposed)return;
  for(const token of [...active.keys()])finish(token,'unknown');
  disposed=true;collectionGeneration++;
  await provider.shutdown();
 }
 /** Reset retained state without shutting down: active tokens are closed
  *  (gauges return to zero) and all counters/totals are zeroed. */
 function clear(){
  for(const [token,item] of [...active]){
   active.delete(token);
   try{activeGauge.add(-1,{'mm.operation':item.op});}catch{}
  }
  for(const op of OPERATIONS)totals.set(op,{total:0,ok:0,errors:0,timeouts:0,cancelled:0,warnings:0,unknown:0,durationSamples:0});
  rejectedStarts=0;
 }
 return Object.freeze({begin,finish,record,summary,collect,shutdown,clear});
}
