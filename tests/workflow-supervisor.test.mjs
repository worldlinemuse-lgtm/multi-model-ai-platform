import test from 'node:test';
import assert from 'node:assert/strict';
import {compileWorkflowPlan} from '../src/workflow-plan.js';
import {executeSavedPlan} from '../src/workflow-supervisor.js';
const mk=plan=>({goal:'Explain tests',status:'running',steps:[],plan,inFlightStage:null});
const plan=s=>compileWorkflowPlan(s,'groq',['groq','gemini']);
test('Q17 sequential steps checkpoint before charged calls, variables and skips',async()=>{
 const w=mk(plan('Draft | route=groq | save=outline\nSkip | when=contains:MISSING\nReview | route=gemini | input=outline'));
 const snapshots=[],calls=[];
 await executeSavedPlan(w,{persist:async r=>snapshots.push(JSON.parse(JSON.stringify(r))),callStage:async (stage,prompt)=>{
  assert.equal(snapshots.at(-1).inFlightStage,calls.length+Number(calls.length>0)); // first index 0; third index 2
  calls.push({route:stage.route,prompt});
  return{text:'SYNTHETIC_RESPONSE '+calls.length,model:'fake'};
 }});
 assert.equal(w.status,'complete');assert.deepEqual(calls.map(x=>x.route),['groq','gemini']);
 assert.equal(w.steps[1].status,'skipped');assert.match(calls[1].prompt,/SYNTHETIC_RESPONSE 1/);
 assert.equal(snapshots.at(-1).status,'complete');
});
test('Q17 fail-closed checkpoint storage failure sends no requests',async()=>{
 const w=mk(plan('First\nSecond'));let calls=0;
 await assert.rejects(executeSavedPlan(w,{persist:async()=>{throw Error('storage unavailable')},callStage:async()=>{calls++}}),/storage unavailable/);
 assert.equal(calls,0);
});
test('Q17 restart explicit continuation never re-runs completed stages',async()=>{
 const w=mk(plan('First\nSecond\nThird'));w.steps.push({stage:'First',provider:'groq',status:'complete',content:'already computed',savedAs:'stage1'});
 let calls=0;await executeSavedPlan(w,{persist:async()=>{},callStage:async()=>({text:String(++calls)})});
 assert.equal(calls,2);assert.equal(w.steps.length,3);
});
test('Q17 cancellation before new stage prevents second request',async()=>{
 const controller=new AbortController();const w=mk(plan('First\nSecond'));let calls=0;
 await executeSavedPlan(w,{persist:async()=>{},signal:controller.signal,callStage:async()=>{calls++;controller.abort();return{text:'done'};}});
 assert.equal(calls,1);assert.equal(w.status,'stopped');
});
test('Q17 failed external call stops without fallback',async()=>{
 const w=mk(plan('First | route=gemini\nSecond | route=groq'));let calls=0;
 await executeSavedPlan(w,{persist:async()=>{},callStage:async()=>{calls++;throw Error('synthetic offline failure');}});
 assert.equal(calls,1);assert.equal(w.status,'failed');assert.equal(w.steps[0].status,'failed');
});
