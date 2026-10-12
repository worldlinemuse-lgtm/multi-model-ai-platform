import test from 'node:test';
import assert from 'node:assert/strict';
import {readBrowserCapabilities} from '../src/capability-probes.js';
const byId=items=>Object.fromEntries(items.map(x=>[x.id,x]));
test('P30 supported API presence stays distinct from verified end-to-end operation',async()=>{
 let permissionQueries=0;
 const env={isSecureContext:true,indexedDB:{},Worker:function Worker(){},
  WebAssembly:{validate:bytes=>bytes.length===8},speechSynthesis:{},SpeechRecognition:function SpeechRecognition(){},
  crypto:{subtle:{}},navigator:{gpu:{},serviceWorker:{controller:{}},
   storage:{persisted:async()=>true},
   permissions:{query:async({name})=>{assert.equal(name,'microphone');permissionQueries++;return {state:'granted'};}}}};
 const readings=await readBrowserCapabilities(env),m=byId(readings);
 assert.equal(m['secure-context'].status,'SECURE');
 assert.equal(m['worker'].status,'API PRESENT');
 assert.equal(m['wasm'].status,'MINIMAL VALIDATION PASSED');
 assert.equal(m['webgpu'].status,'API PRESENT');
 assert.match(m['webgpu'].detail,/does not prove/);
 assert.equal(m['mic-permission'].status,'GRANTED');
 assert.equal(permissionQueries,1);
 assert.equal(m['persistence'].status,'PERSISTENT STORAGE GRANTED');
 assert.equal(m['providers'].status,'NOT VERIFIED');
 assert.equal(m['serviceworker'].status,'CONTROLLING');
});
test('P30 missing/blocked capabilities are reported honestly and never prompt',async()=>{
 const env={navigator:{permissions:{query:async()=>{throw Error('not exposed');}},
 storage:{persisted:async()=>{throw Error('blocked');}}},isSecureContext:false};
 const m=byId(await readBrowserCapabilities(env));
 assert.equal(m['worker'].status,'NOT AVAILABLE');
 assert.equal(m['wasm'].status,'NOT VERIFIED');
 assert.equal(m['webgpu'].status,'NOT AVAILABLE');
 assert.equal(m['mic-permission'].status,'QUERY UNSUPPORTED');
 assert.equal(m['persistence'].status,'UNAVAILABLE TO QUERY');
 assert.equal(m['serviceworker'].status,'NOT AVAILABLE');
 assert.equal(m['secure-context'].status,'INSECURE');
 assert.equal(m['providers'].status,'NOT VERIFIED');
});
