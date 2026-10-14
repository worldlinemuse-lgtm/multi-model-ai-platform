import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTextEdit,applyTextEdit,rollbackTextEdit} from '../src/review-edits.js';
const initial=()=>({'main.js':'let x=1;\nconsole.log(x);','readme.md':'original'});
test('Q04 preview is immutable read-only',()=>{
 const files=initial(), p=prepareTextEdit(files,'main.js','let x=2;\nconsole.log(x);');
 assert.match(p.preview,/\+let x=2/);assert.match(p.preview,/-let x=1/);assert.equal(files['main.js'],'let x=1;\nconsole.log(x);');
});
test('Q04 explicit accept and rollback are single-use',()=>{
 const files=initial(),p=prepareTextEdit(files,'main.js','new code');
 assert.throws(()=>applyTextEdit(files,p),/confirmation/);
 const applied=applyTextEdit(files,p,{confirmed:true});assert.equal(files['main.js'],'let x=1;\nconsole.log(x);');
 assert.equal(applied.files['main.js'],'new code');assert.throws(()=>applyTextEdit(files,p,{confirmed:true}),/expired/);
 assert.throws(()=>rollbackTextEdit(applied.files,applied.rollback),/confirmation/);
 assert.deepEqual(rollbackTextEdit(applied.files,applied.rollback,{confirmed:true}).files,files);
 assert.throws(()=>rollbackTextEdit(applied.files,applied.rollback,{confirmed:true}),/expired/);
});
test('Q04 stale project cannot apply/rollback',()=>{
 const files=initial(),p=prepareTextEdit(files,'main.js','new code');
 assert.throws(()=>applyTextEdit({...files,'readme.md':'changed'},p,{confirmed:true}),/changed/);
 const applied=applyTextEdit(files,p,{confirmed:true});
 assert.throws(()=>rollbackTextEdit({...applied.files,'readme.md':'later'},applied.rollback,{confirmed:true}),/changed/);
});
test('Q04 forged proposals refused',()=>{
 const files=initial();assert.throws(()=>applyTextEdit(files,{path:'main.js'},{confirmed:true}),/expired/);
 assert.throws(()=>rollbackTextEdit(files,{path:'main.js'},{confirmed:true}),/expired/);
});
test('Q04 protected file and traversal refused',()=>{
 const files=initial();assert.throws(()=>prepareTextEdit(files,'main.js','new',{protectedPaths:['main.js']}),/Protected/);
 assert.throws(()=>prepareTextEdit(files,'../etc/passwd','new'),/existing safe/);
});
test('Q04 invalid oversized replacement refused',()=>{
 const files=initial();assert.throws(()=>prepareTextEdit(files,'main.js',null),/must be text/);
 assert.throws(()=>prepareTextEdit(files,'main.js','x'.repeat(500001)),/limits/);
});
