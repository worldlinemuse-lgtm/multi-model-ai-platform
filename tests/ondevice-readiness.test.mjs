import test from 'node:test';
import assert from 'node:assert/strict';
import {probeWebGPUReadiness,checkLocalModelSize,LOCAL_MODEL_BUDGET_MIB} from '../src/ondevice-readiness.js';
test('Q27 no WebGPU reports unsupported with no inference or fetch',async()=>{
 const result=await probeWebGPUReadiness({isSecureContext:true,navigator:{}});
 assert.equal(result.state,'unavailable');assert.equal(result.modelExecuted,false);assert.equal(result.modelDownloaded,false);assert.equal(result.deviceRequested,false);
});
test('Q27 invalid context and declined adapter fail without touching model resources',async()=>{
 assert.equal((await probeWebGPUReadiness({isSecureContext:false,navigator:{gpu:{requestAdapter:()=>{throw Error('should not call')}}}})).state,'insecure');
 let calls=0;const result=await probeWebGPUReadiness({isSecureContext:true,navigator:{gpu:{requestAdapter:async()=>{calls++;return null;}}}});
 assert.equal(calls,1);assert.equal(result.state,'no-adapter');
});
test('Q27 WebGPU adapter alone does not become a false inference success',async()=>{
 let deviceCalls=0;
 const result=await probeWebGPUReadiness({isSecureContext:true,navigator:{gpu:{requestAdapter:async()=>({requestDevice:()=>{deviceCalls++;return null;},info:{vendor:'PRIVATE-NEVER-LOG'}})}}});
 assert.equal(result.state,'adapter-only');assert.equal(deviceCalls,0);assert.equal(result.modelExecuted,false);assert.equal(result.adapterIdentifiersCollected,false);
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE-NEVER-LOG/);
});
test('Q27 rejected probe is a bounded unknown state',async()=>{
 const result=await probeWebGPUReadiness({isSecureContext:true,navigator:{gpu:{requestAdapter:async()=>{throw Error('device driver no permission')}}}});
 assert.equal(result.state,'probe-failed');assert.equal(result.networkAttempted,false);
});
test('Q27 planning budget does not allocate and never promises inference',()=>{
 const check=checkLocalModelSize(8*1024*1024);
 assert.equal(LOCAL_MODEL_BUDGET_MIB,96);assert.equal(check.allowed,true);assert.equal(check.noAllocation,true);assert.equal(check.modelExecution,false);
 assert.equal(checkLocalModelSize(200*1024*1024).allowed,false);
 assert.throws(()=>checkLocalModelSize(-1),/estimate/);
});
