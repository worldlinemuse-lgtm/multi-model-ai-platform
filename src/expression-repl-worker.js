import {createExpressionSession} from './expression-repl.js';
const repl=createExpressionSession();
self.onmessage=event=>{
 const {id,expression,reset}=event.data||{};
 try{
  if(reset){repl.reset();self.postMessage({id,ok:true,value:'Session reset'});return;}
  const value=repl.execute(expression);
  self.postMessage({id,ok:true,value});
 }catch(error){self.postMessage({id,ok:false,error:String(error?.message||error).slice(0,250)});}
};
