import test from 'node:test';
import assert from 'node:assert/strict';
import {editLocalNote,findExactNoteDuplicates} from '../src/note-tools.js';
import {freshState,validateState,clone} from '../src/core.js';
import {exportNoteArchive,parseNoteArchive} from '../src/knowledge.js';

const notes=[
 {id:'note-a',title:'first',content:'same\r\ntext',created:'2026-10-12T00:00:00Z'},
 {id:'note-b',title:'second',content:'  same\ntext  ',created:'2026-10-12T00:01:00Z'},
 {id:'note-c',title:'third',content:'Different text',created:'2026-10-12T00:02:00Z'}
];
test('P15 exact duplicate report respects content but does not modify sources',()=>{
 const original=clone(notes);
 const groups=findExactNoteDuplicates(notes);
 assert.equal(groups.length,1);
 assert.equal(groups[0].count,2);
 assert.deepEqual(groups[0].notes.map(x=>x.id),['note-a','note-b']);
 assert.deepEqual(notes,original);
 assert.equal(findExactNoteDuplicates([{id:'x',title:'x',content:'A'}, {id:'y',title:'y',content:'a'}]).length,0,'Case changes must not be collapsed');
});
test('P15 explicit note edit retains record ID and creation metadata',()=>{
 const result=editLocalNote(notes,'note-a',' Renamed ','Updated body','2026-10-12T01:00:00Z');
 assert.notStrictEqual(result,notes);
 assert.equal(result[0].title,'Renamed');
 assert.equal(result[0].content,'Updated body');
 assert.equal(result[0].id,'note-a');
 assert.equal(result[0].created,notes[0].created);
 assert.equal(result[0].updated,'2026-10-12T01:00:00Z');
 assert.deepEqual(result[1],notes[1]);
 assert.equal(notes[0].title,'first');
 assert.equal(findExactNoteDuplicates(result).length,0);
});
test('P15 invalid note edits do not alter originals',()=>{
 const original=clone(notes);
 assert.throws(()=>editLocalNote(notes,'absent','t','v','now'),/no longer exists/);
 assert.throws(()=>editLocalNote(notes,'note-a',' ','v','now'),/Title/);
 assert.throws(()=>editLocalNote(notes,'note-a','t',' ','now'),/content/);
 assert.throws(()=>editLocalNote(notes,'note-a','t','x'.repeat(100001),'now'),/100,000/);
 assert.deepEqual(notes,original);
});
test('P15 edited note survives archive and full workspace backup',()=>{
 const edited=editLocalNote(notes,'note-a','Updated','Here is saved note','2026-10-12T02:00:00Z');
 const state=freshState();state.notes=[edited[0]];
 assert.equal(validateState(state),true);
 const archived=parseNoteArchive(exportNoteArchive(state.notes));
 assert.equal(archived[0].updated,'2026-10-12T02:00:00Z');
 const legacy=clone(state);delete legacy.notes[0].updated;
 assert.equal(validateState(legacy),true);
 const invalid=clone(state);invalid.notes[0].updated=10;
 assert.equal(validateState(invalid),false);
});
