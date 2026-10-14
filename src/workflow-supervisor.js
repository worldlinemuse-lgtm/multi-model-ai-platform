/* Deterministic Q17/Q18 supervised executor. Model calls and persistence are injected.
 * No network or time-triggered activity in this module. */
import {validateSavedWorkflowPlan,stageInput,shouldRunStage,stageInstruction} from './workflow-plan.js';
export async function executeSavedPlan(run,{callStage,persist,signal,onStage=()=>{}}){
 if(!run||!validateSavedWorkflowPlan(run.plan)||!Array.isArray(run.steps)||run.steps.length>run.plan.length)throw Error('Invalid saved workflow.');
 if(typeof callStage!=='function'||typeof persist!=='function')throw Error('Workflow requires an authorized call and persistent checkpoint callbacks.');
 if(signal?.aborted)throw Error('Workflow was already stopped.');
 run.status='running';
 await persist(run);
 for(let i=run.steps.length;i<run.plan.length;i++){
  if(signal?.aborted)break;
  const stage=run.plan[i];
  let input;
  try{input=stageInput(stage,run.steps);}catch(error){
   run.status='failed';run.inFlightStage=null;
   run.steps.push({stage:stage.label,provider:stage.route,status:'failed',content:'Variable reference failed: '+error.message});
   await persist(run);onStage(run,i,'failed');return run;
  }
  if(!shouldRunStage(stage,input)){
   run.steps.push({stage:stage.label,provider:stage.route,status:'skipped',content:'Skipped: condition '+stage.when+' did not match.'});
   await persist(run);onStage(run,i,'skipped');continue;
  }
  run.inFlightStage=i;
  await persist(run); // Persist before any request; failed persistence means no new provider request.
  onStage(run,i,'running');
  let response;
  try{response=await callStage(stage,stageInstruction(stage,run.goal,input,i),signal);}
  catch(error){
   run.inFlightStage=null;
   if(signal?.aborted||error?.name==='AbortError'){run.status='stopped';await persist(run);onStage(run,i,'stopped');return run;}
   run.steps.push({stage:stage.label,provider:stage.route,status:'failed',content:String(error?.message||error).slice(0,2000)});
   run.status='failed';await persist(run);onStage(run,i,'failed');return run;
  }
  if(!response||typeof response.text!=='string')throw Error('Provider response lacks text.');
  run.steps.push({stage:stage.label,provider:stage.route,status:'complete',content:response.text.slice(0,30000),model:String(response.model||'').slice(0,130),savedAs:stage.save});
  run.inFlightStage=null;
  await persist(run);onStage(run,i,'done');
 }
 if(run.status==='running')run.status=signal?.aborted?'stopped':run.steps.length===run.plan.length?'complete':'stopped';
 run.inFlightStage=null;
 await persist(run);
 return run;
}
