/* Dedicated module worker; static same-origin asset, no Blob URL or network imports. */
import {inspectWasmBytes} from './wasm-policy.js';
self.onmessage=async ({data})=>{
 try{
  const {bytes}=inspectWasmBytes(data.bytes);
  const module=await WebAssembly.compile(bytes);
  const imports=WebAssembly.Module.imports(module);
  if(imports.length)throw Error('WASM imports are not supported');
  const exports=WebAssembly.Module.exports(module).map(({name,kind})=>({name,kind}));
  const entry=data.entry;
  if(typeof entry!=='string'||!/^[A-Za-z_][\w.$-]{0,80}$/.test(entry))throw Error('Invalid WASM entry name');
  if(!exports.some(x=>x.name===entry&&x.kind==='function'))throw Error('WASM function export not found: '+entry);
  const instance=await WebAssembly.instantiate(module,{});
  if(instance.exports[entry].length!==0)throw Error('WASM entry must be a zero-argument function');
  const result=instance.exports[entry]();
  const memory=Object.values(instance.exports).find(x=>x instanceof WebAssembly.Memory);
  self.postMessage({ok:true,entry,exported:exports,result:typeof result==='bigint'?result.toString()+'n':result??null,memoryBytes:memory?.buffer.byteLength??null});
 }catch(error){self.postMessage({ok:false,error:String(error?.message||error).slice(0,350)});}
};