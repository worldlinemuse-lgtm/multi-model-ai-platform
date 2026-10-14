import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOutputCap,ALLOWED_OUTPUT_CAPS} from '../src/model-request-settings.js';
import {buildRequest} from '../src/provider-api.js';
const cred=(model='llama-3.3-70b-versatile')=>({model,key:'TEST-DO-NOT-USE',attested:true});
test('Q20 output caps are explicit integers and bounded',()=>{
 assert.deepEqual(ALLOWED_OUTPUT_CAPS,[128,256,512,1024]);
 for(const val of ALLOWED_OUTPUT_CAPS)assert.equal(validateOutputCap(val),val);
 for(const val of [0,64,2048,NaN,'512',-1,512.1])assert.throws(()=>validateOutputCap(val),/allowed output-token cap/);
});
test('Q20 OpenAI-compatible route maps explicit output cap',()=>{
 const request=buildRequest('groq',cred(),[{role:'user',content:'Hello'}],{maxOutputTokens:256});
 assert.equal(request.body.max_tokens,256);assert.equal(request.body.model,cred().model);
 assert.equal(buildRequest('groq',cred(),[{role:'user',content:'Hello'}]).body.max_tokens,512);
});
test('Q20 Gemini REST maxOutputTokens',()=>{
 const request=buildRequest('gemini',cred('gemini-2.5-flash-lite'),[{role:'user',content:'Hello'}],{maxOutputTokens:128});
 assert.equal(request.body.generationConfig.maxOutputTokens,128);
 assert.ok(request.headers['x-goog-api-key']);
});
test('Q20 Cloudflare REST max_tokens',()=>{
 const request=buildRequest('cloudflare',{...cred('@cf/meta/llama-3.1-8b-instruct'),account:'0123456789abcdef0123456789abcdef'},[{role:'user',content:'Hello'}],{maxOutputTokens:1024});
 assert.equal(request.body.max_tokens,1024);
});
test('Q20 invalid cap rejected before constructing provider request',()=>{
 assert.throws(()=>buildRequest('groq',cred(),[{role:'user',content:'Hi'}],{maxOutputTokens:8192}),/allowed output-token cap/);
});
