import test from 'node:test';
import assert from 'node:assert/strict';
import {traceDuration,auditTraceFields} from '../src/request-trace.js';
const requestId='11111111-2222-4333-8444-555555555555';
test('Q10 stable request correlation and bounded latency',()=>{
 assert.deepEqual(auditTraceFields({requestId,model:'openrouter/free',latencyMs:125,httpStatus:200}),{requestId,model:'openrouter/free',latencyMs:125,httpStatus:200,observation:'local-browser'});
 assert.equal(traceDuration(100,125),25);assert.equal(traceDuration(100,50),null);assert.equal(traceDuration(0,999999),120000);
});
test('Q10 redacts unexpected fields and secrets and rejects unsafe model',()=>{
 const event=auditTraceFields({requestId,model:'model\\nAuthorization: token',latencyMs:-3,httpStatus:999,Authorization:'SECRET',prompt:'PRIVATE DATA',key:'EXFIL'});
 assert.deepEqual(event,{requestId,observation:'local-browser'});
 assert.doesNotMatch(JSON.stringify(event),/SECRET|PRIVATE|EXFIL|Authorization/);
 assert.deepEqual(auditTraceFields(null),{});
});
