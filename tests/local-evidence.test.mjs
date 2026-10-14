import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveLocalEvidence,formatLocalEvidence} from '../src/local-evidence.js';
const docs=[{kind:'note',id:'note1',title:'Research notes',content:'Other\nExact local evidence appears here.\nThird'},{kind:'file',id:'main.js',title:'Project / main.js',content:'let x=2;\n// evidence for tests'}];
test('Q19 local evidence citations quote exact lines and provenance',()=>{
 const r=retrieveLocalEvidence(docs,'local evidence');
 assert.equal(r[0].ref,'L1');assert.equal(r[0].line,2);assert.equal(r[0].title,'Research notes');
 const rendered=formatLocalEvidence(r);assert.match(rendered,/\[L1\] note Research notes \(line 2\)/);
 assert.match(rendered,/Exact local evidence appears here/);
});
test('Q19 unmatched text does not invent sources',()=>{
 assert.deepEqual(retrieveLocalEvidence(docs,'quasarunicorn'),[]);
 assert.match(formatLocalEvidence([]),/No matching passage/);
});
test('Q19 user-supplied HTML remains literal source text',()=>{
 const r=retrieveLocalEvidence([{kind:'note',id:'x',title:'<img src=x>',content:'<script>evidence</script>'}],'evidence');
 assert.match(formatLocalEvidence(r),/<script>evidence<\/script>/);
});
test('Q19 bounded result ranking and stable IDs',()=>{
 const r=retrieveLocalEvidence(Array.from({length:60},(_,i)=>({kind:'note',id:String(i),title:'Item '+i,content:'repeated evidence'})),'evidence');
 assert.equal(r.length,8);assert.deepEqual(r.map(x=>x.ref),['L1','L2','L3','L4','L5','L6','L7','L8']);
});
test('Q19 malformed query and result limit rejected',()=>{
 assert.throws(()=>retrieveLocalEvidence(docs,'x'.repeat(161)),/too long/);
 assert.throws(()=>retrieveLocalEvidence(docs,'abc',{maxResults:999}),/limit/);
 assert.throws(()=>formatLocalEvidence([{ref:'L999',kind:'note'}]),/reference/);
});
