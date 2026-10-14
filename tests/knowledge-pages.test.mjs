import test from 'node:test';
import assert from 'node:assert/strict';
import {knowledgePage,KNOWLEDGE_PAGE_SIZE} from '../src/knowledge-pages.js';
const records=Array.from({length:43},(_,i)=>({id:'note-'+i,title:'Pagination QA '+i}));
test('Q24 all 43 local results remain reachable across pages',()=>{
 assert.equal(KNOWLEDGE_PAGE_SIZE,20);
 const first=knowledgePage(records,0),second=knowledgePage(records,1),third=knowledgePage(records,2);
 assert.equal(first.total,43);assert.equal(first.pages,3);
 assert.equal(first.items.length,20);assert.equal(second.items.length,20);assert.equal(third.items.length,3);
 assert.deepEqual([...first.items,...second.items,...third.items],records);
});
test('Q24 last-page clamp prevents invalid empty page after deletion',()=>{
 const r=knowledgePage(records.slice(0,4),900);
 assert.equal(r.page,0);assert.equal(r.items.length,4);assert.equal(r.to,4);
});
test('Q24 zero results have sensible stable empty pagination',()=>{
 const r=knowledgePage([],0);assert.equal(r.total,0);assert.equal(r.from,0);assert.equal(r.to,0);assert.equal(r.pages,1);assert.deepEqual(r.items,[]);
});
test('Q24 safe page boundaries reject invalid page size and negative, fractional cursor',()=>{
 assert.throws(()=>knowledgePage(records,-1),/index/);
 assert.throws(()=>knowledgePage(records,1.5),/index/);
 assert.throws(()=>knowledgePage(records,0,{pageSize:1000}),/size/);
});
test('Q24 source array is never modified by paging',()=>{
 const frozen=Object.freeze([...records]);knowledgePage(frozen,1);assert.deepEqual(frozen,records);
});
