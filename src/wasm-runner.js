/* Explicit local WASM runner. Worker termination bounds time, not process-level memory.
 * No WASI imports, provider calls or arbitrary file access.
 */
import {inspectWasmBytes,WASM_LIMITS} from './wasm-policy.js';
export async function runLocalWasm(input,{entry='main',timeoutMs=WASM_LIMITS.timeoutMs,signal}={}){
 const {bytes}=inspectWasmBytes(input);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<50||timeoutMs>WASM_LIMITS.timeoutMs)throw Error('WASM invalid timeout');
 if(signal?.aborted)throw Error('WASM execution cancelled');
 const worker=new Worker(new URL('./wasm-worker.js',import.meta.url),{type:'module',name:'local-wasm-runner'});
 return new Promise((resolve,reject)=>{
  let settled=false;
  function finish(err,value){if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',onAbort);worker.terminate();err?reject(err):resolve(value)}
  function onAbort(){finish(Error('WASM execution cancelled'))}
  const timer=setTimeout(()=>finish(Error('WASM execution time limit')),timeoutMs);
  worker.onmessage=e=>e.data?.ok?finish(null,e.data):finish(Error(String(e.data?.error||'WASM worker error')));
  worker.onerror=e=>{e.preventDefault?.();finish(Error('WASM worker failed to load or execute'))};
  worker.onmessageerror=()=>finish(Error('WASM worker message error'));
  signal?.addEventListener('abort',onAbort,{once:true});
  try{worker.postMessage({bytes:new Uint8Array(bytes),entry});}catch(e){finish(e)}
 });
}