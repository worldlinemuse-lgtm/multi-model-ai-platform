import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkshopMetrics,WORKSHOP_OPERATIONS} from '../src/request-trace.js';

test('duration success, error, timeouts, stop and rolling percentiles',()=>{
 let time=0;const m=createWorkshopMetrics({clock:()=>time});
 const a=m.begin('code-run');time=10;assert.equal(m.finish(a),true);assert.equal(m.finish(a),false);
 const b=m.begin('code-run');time=1010;m.finish(b,'timeout','time-limit');
 const c=m.begin('code-run');time=1020;m.finish(c,'error','runtime-error');
 const d=m.begin('code-run');time=1030;m.finish(d,'cancelled','user-stop');
 const s=m.summary().byOperation.find(e=>e.op==='code-run');
 assert.deepEqual([s.total,s.ok,s.errors,s.timeouts,s.cancelled,s.p50Ms,s.p95Ms],[4,1,1,1,1,10,1000]);
});
test('event ring is bounded and increments discarded count',()=>{
 const m=createWorkshopMetrics({limit:2,clock:()=>0});
 for(let i=0;i<6;i++)m.record('ui-error','warning','uncaught-error');
 assert.equal(m.summary().recorded,2);assert.equal(m.summary().discarded,4);
});
test('only typed fixed operation, outcome and reason fields are accepted',()=>{
 const m=createWorkshopMetrics({clock:()=>0});
 for(const op of ['https://example.com/?key=SECRET','my private filename','',null])assert.throws(()=>m.begin(op),TypeError);
 assert.throws(()=>m.record('save','error','Bearer SECRET'),TypeError);
 assert.throws(()=>m.record('save','raw-secret'),TypeError);
 assert.deepEqual(m.summary().recent,[]);
});
test('no payload arguments or error objects are captured in exported reports',()=>{
 const m=createWorkshopMetrics({clock:()=>42});
 const secret='PRIVATE_CODE_49NQ';
 m.record('ui-error','error','uncaught-error', {detail:secret});
 assert.equal(m.exportReport().includes(secret),false);
 assert.equal(m.exportReport().includes('http'),false);
});
test('disable drops open spans; fresh metrics remain usable on reenable',()=>{
 let t=0;const m=createWorkshopMetrics({clock:()=>t});const a=m.begin('save');m.setEnabled(false);t=25;
 assert.equal(m.finish(a),false);assert.equal(m.begin('save'),null);m.setEnabled(true);
 const b=m.begin('save');t=35;m.finish(b,'ok');assert.equal(m.summary().recorded,1);
});
test('concurrent bound is enforced, events do not create memory leak',()=>{
 const m=createWorkshopMetrics({clock:()=>0});const tokens=Array.from({length:24},()=>m.begin('preview'));
 assert.equal(tokens.filter(Boolean).length,20);assert.equal(m.summary().discarded,4);
 for(const x of tokens)m.finish(x);assert.equal(m.summary().active,0);
});
test('reset clears counters and active spans',()=>{
 const m=createWorkshopMetrics({clock:()=>0});const x=m.begin('boot');m.record('ui-error');m.reset();
 assert.equal(m.finish(x),false);assert.equal(m.summary().recorded,0);
});
test('full fixed vocabulary includes only workshop functions',()=>{
 assert.ok(WORKSHOP_OPERATIONS.includes('code-run'));
 assert.ok(!WORKSHOP_OPERATIONS.includes('provider-call'));
});
test('no network, persistence or external services required',()=>{
 const m=createWorkshopMetrics({clock:()=>0});const x=m.begin('preview');m.finish(x,'warning','unsupported-asset');
 assert.equal(JSON.parse(m.exportReport()).byOperation.find(r=>r.op==='preview').warnings,1);
});
