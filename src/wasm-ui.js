/* Browser-local WASM file chooser: human-triggered, bounded, no provider calls. */
import {runLocalWasm} from './wasm-runner.js';
import {WASM_LIMITS} from './wasm-policy.js';
export function setupWasmImport({el,toast,run=runLocalWasm}){
 const input=el('wasm-file'),entryInput=el('wasm-entry'),start=el('wasm-run'),stop=el('wasm-stop'),output=el('wasm-output');
 if(!input||!entryInput||!start||!stop||!output)throw Error('WASM import UI controls missing');
 let controller=null;
 async function execute(){
  if(controller)return;
  const file=input.files?.[0];
  if(!file||!file.name.toLowerCase().endsWith('.wasm'))return toast('Select a local .wasm file first.',true);
  if(!Number.isSafeInteger(file.size)||file.size>WASM_LIMITS.moduleBytes)return toast('WASM exceeds 256 KiB input limit.',true);
  const entry=entryInput.value.trim();
  if(!/^[A-Za-z_][\w.$-]{0,80}$/.test(entry))return toast('Enter a valid exported function name.',true);
  controller=new AbortController();const signal=controller.signal;
  start.disabled=true;stop.disabled=false;output.textContent='Running '+file.name+' in an isolated, time-limited worker…';
  try{
   const bytes=new Uint8Array(await file.arrayBuffer());
   if(signal.aborted)throw Error('WASM execution cancelled');
   const result=await run(bytes,{entry,signal});
   output.textContent='WASM function: '+entry+'\nResult: '+String(result.result)+'\nMemory bytes: '+String(result.memoryBytes??'not exported');
   toast('Local WASM execution completed.');
  }catch(error){output.textContent='WASM execution rejected: '+String(error?.message||error);toast('WASM failed: '+String(error?.message||error),true);}
  finally{controller=null;start.disabled=false;stop.disabled=true;}
 }
 start.addEventListener('click',execute);
 stop.addEventListener('click',()=>controller?.abort());
 return {isRunning:()=>controller!==null};
}