/* Executable real-SDK metrics tests. Manual collection only, zero network, no user content. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalOtelMetrics,OPERATIONS} from '../otel-local-metrics.mjs';

test('actual MeterProvider on-demand MetricReader exposes fixed SDK instruments',async()=>{
 const s=createLocalOtelMetrics({clock:(()=>{let i=0;return()=>++i*10;})()});
 const t=s.begin('workshop.boot');
 assert.ok(t);assert.equal(s.finish(t,'ok'),true);assert.equal(s.finish(t,'ok'),false);
 const r=await s.collect();
 assert.equal(r.collectionStatus,'observed');
 assert.ok(r.sdkInstrumentNames.includes('mm.workshop.operation.completed'));
 assert.ok(r.sdkInstrumentNames.includes('mm.workshop.operation.duration'));
 assert.ok(r.sdkInstrumentNames.includes('mm.workshop.operation.active'));
 assert.equal(r.byOperation.find(x=>x.operation==='workshop.boot').total,1);
 assert.equal(r.active,0);assert.equal(r.sdkErrorCount,0);
 await s.shutdown();
});

test('unknown source strings and unsafe outcome rejected before SDK',async()=>{
 const s=createLocalOtelMetrics();
 assert.throws(()=>s.begin('https://example.com/secret'),/Invalid operation/);
 assert.throws(()=>s.record('workshop.preview','secret'),/Invalid outcome/);
 assert.equal(s.summary().byOperation.reduce((sum,x)=>sum+x.total,0),0);
 await s.shutdown();
});

test('20 active bounded; unfinished spans become unknown on shutdown',async()=>{
 const s=createLocalOtelMetrics();
 const tokens=Array.from({length:20},()=>s.begin('workshop.code_run'));
 assert.equal(s.begin('workshop.code_run'),null);
 assert.equal(s.summary().rejectedStarts,1);
 await s.shutdown();
 const r=s.summary();
 assert.equal(r.active,0);
 assert.equal(r.byOperation.find(x=>x.operation==='workshop.code_run').unknown,20);
 tokens.forEach(t=>assert.equal(s.finish(t,'ok'),false));
});

test('manual collection reports only approved fixed fields',async()=>{
 const s=createLocalOtelMetrics();
 for(const op of OPERATIONS)s.record(op,'warning');
 const report=await s.collect();
 const txt=JSON.stringify(report);
 for(const key of ['resourceMetrics','scopeMetrics','exception.message','url.full','filename','stack','attributes','dataPoints'])assert.ok(!txt.includes('"'+key+'"'));
 assert.equal(report.byOperation.length,11);
 await s.shutdown();
});

test('manual collection requires no fetch or telemetry backend',async()=>{
 const before=globalThis.fetch;let calls=0;
 globalThis.fetch=()=>{calls++;throw Error('Unexpected fetch')};
 try{
  const s=createLocalOtelMetrics();
  s.record('workshop.preview','ok');
  await s.collect();await s.shutdown();
  assert.equal(calls,0);
 }finally{
  if(before===undefined)delete globalThis.fetch;
  else globalThis.fetch=before;
 }
});

test('cumulative counters independent of bounded tracing history',async()=>{
 const s=createLocalOtelMetrics();
 for(let i=0;i<200;i++)s.record('workshop.snapshot',i%2?'error':'ok');
 const r=await s.collect();
 assert.equal(r.byOperation.find(x=>x.operation==='workshop.snapshot').total,200);
 assert.equal(r.byOperation.find(x=>x.operation==='workshop.snapshot').errors,100);
 await s.shutdown();
});
