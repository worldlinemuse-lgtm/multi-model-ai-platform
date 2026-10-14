import test from 'node:test';
import assert from 'node:assert/strict';
import {compileWorkflowPlan,validateSavedWorkflowPlan,stageInput,shouldRunStage,stageInstruction} from '../src/workflow-plan.js';
const allowed=['groq','openrouter','gemini'];
const compile=(s,d='groq')=>compileWorkflowPlan(s,d,allowed);
test('Q17 legacy plain stage labels compile safely',()=>{
 const p=compile('Plan\nWrite\nReview');assert.equal(p.length,3);
 assert.deepEqual(p.map(x=>x.route),['groq','groq','groq']);
 assert.equal(p[0].save,'stage1');assert.ok(validateSavedWorkflowPlan(p));
});
test('Q18 each stage may explicitly choose a previously connected route',()=>{
 const p=compile('Plan | route=gemini | save=outline\nWrite | route=openrouter | input=outline\nReview | route=groq');
 assert.deepEqual(p.map(x=>x.route),['gemini','openrouter','groq']);
 assert.equal(p[1].input,'outline');
});
test('Q18 unknown or unavailable route fails before requests',()=>{
 assert.throws(()=>compile('Plan | route=absent\nReview'),/no saved authorized key/);
 assert.throws(()=>compile('Plan\nReview','nosuch'),/no saved authorized key/);
});
test('Q17 conditions branch only on completed bounded output text',()=>{
 const plan=compile('Draft | save=outline\nCheck | when=contains:decision | input=outline\nSkip | when=not-contains:decision');
 const done=[{savedAs:'outline',status:'complete',content:'A decision is needed'}];
 assert.equal(stageInput(plan[1],done),'A decision is needed');
 assert.equal(shouldRunStage(plan[1],stageInput(plan[1],done)),true);
 assert.equal(shouldRunStage(plan[2],stageInput(plan[2],done)),false);
 assert.equal(shouldRunStage(plan[2],''),true);
});
test('Q17 no eval or shell injection directives or circular variable dependencies',()=>{
 for(const s of ['Plan | foo=bar\nReview','Plan | when=contains:yes\nReview','Plan | input=future\nReview | save=future','Plan | save=a\nReview | save=a','Plan | route=groq | route=gemini\nReview','Plan | save=a\nReview | input=unknown','Plan | save=a\nReview | when=contains:<script>'])assert.throws(()=>compile(s));
});
test('Q17 stage limits and text bounds are enforced',()=>{
 for(const s of ['', 'Alone',Array.from({length:7},(_,i)=>'Step '+i).join('\n'),'A\nB\nC'.repeat(201)])assert.throws(()=>compile(s));
 assert.throws(()=>compile('A\nB',''),/default model route/);
 assert.equal(compile('A\nB').length,2);
});
test('Q17 stage instructions label previous output untrusted, bounded',()=>{
 const stage=compile('Plan\nReview')[1];
 const instruction=stageInstruction(stage,'Task','x'.repeat(12000),1);
 assert.match(instruction,/UNTRUSTED/);assert.ok(instruction.length<8500);assert.match(instruction,/Review/);
});
test('Q17 saved plan rejects malformed or future stage references',()=>{
 const plan=compile('Plan\nReview');
 assert.equal(validateSavedWorkflowPlan([{...plan[0],save:'same'},{...plan[1],save:'same'}]),false);
 assert.equal(validateSavedWorkflowPlan([{...plan[0],input:'stage2'},plan[1]]),false);
 assert.equal(validateSavedWorkflowPlan(plan.slice(0,1)),false);
});
test('Q17 consume only successful previous output, including skipped branches',()=>{
 const stage=compile('First\nSecond\nThird')[2];
 assert.equal(stageInput(stage,[{status:'complete',content:'yes'}, {status:'skipped',content:'Skipped'}]),'yes');
});
