import test from 'node:test';
import assert from 'node:assert/strict';
import {probeGroqModels,recommendGroqModel,classifyProviderStatus} from '../src/provider-connection-probe.js';

const credential={key:'SYNTHETIC_TEST_KEY_NOT_REAL',model:'llama-3.3-70b-versatile',attested:true};
const ok=({data=[{id:'llama-3.1-8b-instant',active:true},{id:'old-inactive',active:false}]}={})=>({ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({data})});
test('Groq metadata probe is opt-in and missing key cannot contact provider',async()=>{
 let calls=0;const r=await probeGroqModels({fetchImpl:()=>{calls++;throw Error('should not call');}});
 assert.equal(calls,0);assert.equal(r.networkAttempted,false);assert.equal(r.state,'missing-credential');
});
test('Groq metadata GET uses no inference or retries, explicit CORS and omits cookies',async()=>{
 let calls=0;const r=await probeGroqModels({credential,fetchImpl:async(url,opts)=>{
  calls++;assert.equal(url,'https://api.groq.com/openai/v1/models');
  assert.equal(opts.method,'GET');assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'error');
  assert.equal(opts.mode,'cors');assert.equal(opts.cache,'no-store');assert.equal(opts.referrerPolicy,'no-referrer');
  assert.equal(opts.headers.Authorization,'Bearer '+credential.key);return ok();
 }});
 assert.equal(calls,1);assert.equal(r.state,'models-received');
 assert.deepEqual(r.models,['llama-3.1-8b-instant']);
 assert.equal(r.httpStatus,200);assert.equal(r.totalActiveModels,1);
 assert.doesNotMatch(JSON.stringify(r),/SYNTHETIC_TEST_KEY_NOT_REAL/);
});
test('HTTP failure classification distinguishes key, permission, quota and upstream service',async()=>{
 for(const [status,state]of [[401,'credential-rejected'],[403,'permission-denied'],[429,'rate-limited'],[500,'provider-unavailable']]){
  let calls=0;
  const r=await probeGroqModels({credential,fetchImpl:async()=>{calls++;return {ok:false,status};}});
  assert.equal(r.state,state);assert.equal(r.httpStatus,status);assert.equal(calls,1);
  assert.doesNotMatch(JSON.stringify(r),/SYNTHETIC_TEST_KEY_NOT_REAL/);
 }
 assert.equal(classifyProviderStatus(404).state,'endpoint-unavailable');
});
test('Network/CORS indistinguishable at fetch level, do not misdiagnose authentication',async()=>{
 const result=await probeGroqModels({credential,fetchImpl:async()=>{throw Error('SYNTHETIC_TEST_KEY_NOT_REAL CORS details');}});
 assert.equal(result.state,'browser-network-unverified');
 assert.doesNotMatch(JSON.stringify(result),/SYNTHETIC_TEST_KEY_NOT_REAL/);
});
test('Canceled before request makes no call and cannot leak key',async()=>{
 const ctrl=new AbortController();ctrl.abort();let calls=0;
 const r=await probeGroqModels({credential,signal:ctrl.signal,fetchImpl:()=>{calls++;return ok();}});
 assert.equal(calls,0);assert.equal(r.state,'cancelled');
});
test('Reject oversized payloads and malformed metadata',async()=>{
 for(const response of [
  {ok:true,status:200,headers:{get:()=>String(96001)},text:async()=>{throw Error('oversize should not read');}},
  {ok:true,status:200,headers:{get:()=>null},text:async()=>'{'},
  {ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({data:{}})}
 ]){const r=await probeGroqModels({credential,fetchImpl:async()=>response});assert.equal(r.state,'invalid-response');}
});
test('Model recommendation only uses received active list; never auto-switches',()=>{
 assert.deepEqual(recommendGroqModel(['llama-3.3-70b-versatile'],'llama-3.3-70b-versatile').model,'llama-3.3-70b-versatile');
 const recommended=recommendGroqModel(['llama-3.1-8b-instant','openai/gpt-oss-20b'],'missing');
 assert.equal(recommended.model,'llama-3.1-8b-instant');assert.match(recommended.reason,/verify free-plan/i);
 assert.equal(recommendGroqModel(['audio-only'],'missing').model,null);
 assert.equal(recommendGroqModel([], 'missing').model,null);
});
