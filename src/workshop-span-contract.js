/* Standalone, opt-in, content-free OpenTelemetry-aligned workshop span CONTRACT.
 * Deliberately not connected to main.js, worker code, IndexedDB, network or exporter.
 * No external dependency, auto instrumentation, side effects or user-content fields.
 */
export const SPAN_OPERATIONS = Object.freeze([
  'workshop.boot','workshop.code_run','workshop.project_save',
  'workshop.preview','workshop.snapshot','workshop.project_import',
  'workshop.project_export','workshop.data_analyze',
  'workshop.offline_refresh','workshop.storage_check'
]);
export const SPAN_OUTCOMES = Object.freeze(['ok','error','timeout','cancelled','warning','unknown']);
export const SPAN_REASONS = Object.freeze([
  'none','invalid-input','worker-failed','runtime-failed','time-limit',
  'user-stop','superseded','parent-closed','storage-failed',
  'offline-unavailable','resource-limit','unsupported','unobserved'
]);
const OPS=new Set(SPAN_OPERATIONS), OUTCOMES=new Set(SPAN_OUTCOMES), REASONS=new Set(SPAN_REASONS);
const DEFAULT_LIMIT=160, DEFAULT_ACTIVE=20;
const validate=(v,set,field)=>{if(typeof v!=='string'||!set.has(v))throw new TypeError('Invalid '+field);return v;};
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
function secureBytes(length){
  if(typeof globalThis.crypto?.getRandomValues!=='function')throw new Error('Cryptographically secure random source required');
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}
function secureId(bytes,randomBytes){
  const v=randomBytes(bytes);
  if(!(v instanceof Uint8Array)||v.length!==bytes)throw TypeError('Invalid secure random source');
  if(v.every(n=>n===0))throw Error('Invalid all-zero span identifier');
  return toHex(v);
}
const status=outcome=>outcome==='error'||outcome==='timeout'?'ERROR':outcome==='ok'?'OK':'UNSET';
/** Local trace model. NOT an OTel SDK, wire-format/OTLP implementation, or execution wrapper. */
export function createWorkshopSpanContract({clock=()=>performance.now(),randomBytes=secureBytes,limit=DEFAULT_LIMIT,maxActive=DEFAULT_ACTIVE}={}){
  if(typeof clock!=='function'||typeof randomBytes!=='function'||!Number.isSafeInteger(limit)||limit<1||limit>500||!Number.isSafeInteger(maxActive)||maxActive<1||maxActive>50)throw TypeError('Invalid contract options');
  const active=new Map(),finished=[];
  const counts=new Map(SPAN_OPERATIONS.map(name=>[name,{completed:0,errors:0,cancelled:0}]));
  let dropped=0,issued=0;
  const now=()=>{const t=clock();if(!Number.isFinite(t)||t<0)throw Error('Invalid monotonic time');return t;};
  function retain(span){finished.push(Object.freeze(span));if(finished.length>limit){finished.shift();dropped++;}}
  function begin(operation,{parent=null}={}){
    validate(operation,OPS,'operation');
    if(parent!==null&&!active.has(parent))throw TypeError('Parent must be an active local span');
    if(active.size>=maxActive){dropped++;return null;}
    const time=now(),parentInfo=parent===null?null:active.get(parent);
    const token=Object.freeze({seq:++issued});
    active.set(token,{operation,traceId:parentInfo?.traceId||secureId(16,randomBytes),spanId:secureId(8,randomBytes),parentSpanId:parentInfo?.spanId||null,start:time,parent});
    return token;
  }
  function closeOne(token,outcome,reason){
    const span=active.get(token);if(!span)return false;
    const elapsed=now()-span.start;
    active.delete(token);
    const stat=counts.get(span.operation);stat.completed++;if(status(outcome)==='ERROR')stat.errors++;if(outcome==='cancelled')stat.cancelled++;
    retain({name:span.operation,traceId:span.traceId,spanId:span.spanId,
      parentSpanId:span.parentSpanId,kind:'INTERNAL',status:status(outcome),
      outcome,reason,durationMs:Math.max(0,Math.min(600000,Math.round(elapsed)))});
    return true;
  }
  function end(token,{outcome='ok',reason='none'}={}){
    validate(outcome,OUTCOMES,'outcome');validate(reason,REASONS,'reason');
    if(!active.has(token))return false;
    // Close descendants, deepest first, instead of silently orphaning children.
    const descendants=[];
    const walk=ancestor=>{for(const [child,info] of active){if(info.parent===ancestor){walk(child);descendants.push(child);}}};
    walk(token);
    for(const child of descendants)closeOne(child,'cancelled','parent-closed');
    return closeOne(token,outcome,reason);
  }
  function finishOutstanding(){
    // Explicit app-initiated shutdown only. Crashes cannot be observed retrospectively.
    const count=active.size;
    for(const token of [...active.keys()])if(active.has(token))end(token,{outcome:'unknown',reason:'unobserved'});
    return count;
  }
  function report(){
    const rows=SPAN_OPERATIONS.map(name=>{
      const totals=counts.get(name);
      return {name,coverage:totals.completed?'OBSERVED':'NOT_OBSERVED',...totals};
    });
    return {schema:'mm-otel-local-spans-v1',exportedAutomatically:false,
      active:active.size,retained:finished.length,dropped,
      coverage:rows,spans:finished.map(x=>({...x}))};
  }
  return Object.freeze({begin,end,finishOutstanding,report});
}
