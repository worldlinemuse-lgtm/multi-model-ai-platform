import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectProviderConfiguration,findManualRetryDraft,manualRetryCooldown} from '../src/connection-diagnostics.js';
test('Q22 invalid/missing routes do not send network calls or echo keys',()=>{
 const missing=inspectProviderConfiguration('groq',null);assert.equal(missing.state,'missing-key');assert.equal(missing.networkAttempted,false);
 const unknown=inspectProviderConfiguration('evil',null);assert.equal(unknown.state,'unsupported');
 const bad=inspectProviderConfiguration('groq',{key:'SECRET_IN_TEST_SHOULD_NOT_LEAK',model:'',attested:false});assert.equal(bad.state,'invalid');
 assert.doesNotMatch(JSON.stringify(bad),/SECRET_IN_TEST_SHOULD_NOT_LEAK/);
});
test('Q22 valid local config only reports host, never credentials nor eligibility',()=>{
 const good=inspectProviderConfiguration('openrouter',{key:'FAKE_NOT_REAL_SECRET',model:'openrouter/free',attested:true});
 assert.equal(good.state,'configured-unverified');assert.equal(good.endpointHost,'openrouter.ai');assert.equal(good.networkAttempted,false);
 assert.doesNotMatch(JSON.stringify(good),/FAKE_NOT_REAL_SECRET/);assert.match(good.issues[0],/unverified/);
});
test('Q22 manual retry locates last matching failed model and original message',()=>{
 const history=[{role:'user',content:'first'},{role:'assistant',provider:'groq',error:true,content:'CORS'},{role:'user',content:'second'},{role:'assistant',provider:'gemini',error:true,content:'HTTP 429'}];
 assert.deepEqual(findManualRetryDraft(history,'groq').prompt,'first');
 assert.equal(findManualRetryDraft(history,'gemini').prompt,'second');
 assert.equal(findManualRetryDraft(history,'openrouter'),null);
});
test('Q22 manual retry never executes requests and rejects mismatched input',()=>{
 assert.equal(findManualRetryDraft([], 'groq'),null);
 assert.equal(findManualRetryDraft([{role:'assistant',provider:'groq',error:true}],'groq'),null);
 assert.equal(findManualRetryDraft([{role:'user',content:'x'.repeat(10001)},{role:'assistant',provider:'groq',error:true}],'groq'),null);
});
test('Q22 min retry cooldown is explicit and pure',()=>{
 assert.equal(manualRetryCooldown(1000,1200),800);assert.equal(manualRetryCooldown(1000,3000),0);
 assert.throws(()=>manualRetryCooldown(3000,1000),/timing/);
});
