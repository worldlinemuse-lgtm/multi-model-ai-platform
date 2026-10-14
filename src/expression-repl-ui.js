/* REPL is persistent only in this tab/worker. Explicit run, reset and bounded text output. */
export function setupExpressionRepl({el,toast}){
 const input=el('repl-expression'),run=el('repl-execute'),reset=el('repl-reset'),output=el('repl-output');
 if(!input||!run||!reset||!output)throw Error('Expression REPL controls missing');
 let worker=null,id=0,busy=false,timer=null;
 function attach(){
  worker?.terminate();
  worker=new Worker(new URL('./expression-repl-worker.js',import.meta.url),{type:'module'});
 }
 function record(line){output.textContent=(output.textContent+'\n'+line).slice(-5500);}
 function finish(){busy=false;run.disabled=false;reset.disabled=false;clearTimeout(timer);timer=null;}
 async function submit(resetSession=false){
  if(busy)return;
  if(!resetSession&&!input.value.trim())return toast('Enter an arithmetic expression first.',true);
  if(!worker)attach();
  const command=input.value,token=++id;busy=true;run.disabled=true;reset.disabled=true;
  timer=setTimeout(()=>{record('Error: Expression worker stopped (750 ms deadline).');worker.terminate();worker=null;finish();},750);
  worker.onmessage=event=>{
   const message=event.data;if(!busy||message?.id!==token)return;
   if(resetSession){output.textContent='Expression console reset.';}
   else record('> '+command.slice(0,200)+'\n'+(message.ok?'= '+String(message.value):'Error: '+message.error));
   finish();
  };
  worker.onerror=()=>{record('Error: expression worker failed.');worker?.terminate();worker=null;finish();};
  try{worker.postMessage({id:token,expression:command,reset:resetSession});}catch(error){record('Error: worker unavailable.');worker?.terminate();worker=null;finish();}
 }
 run.addEventListener('click',()=>submit(false));
 reset.addEventListener('click',()=>{worker?.terminate();worker=null;output.textContent='Expression console reset. Variables cleared.';finish()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit(false);}});
 return {reset:()=>{worker?.terminate();worker=null;finish();}};
}
