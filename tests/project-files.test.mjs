import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFolders,projectTreeEntries,moveProjectFolder} from '../src/project-files.js';
import {safeFiles} from '../src/core.js';

const files=()=>({'src/main.js':'entry','src/lib/a.js':'a','src/lib/b.js':'b','README.md':'instructions'});
test('P13 project tree represents nested folders with real file keys',()=>{
 const paths=projectFolders(files());
 assert.deepEqual(paths,['src','src/lib']);
 const entries=projectTreeEntries(files());
 assert.ok(entries.some(x=>x.type==='folder'&&x.path==='src/lib'&&x.depth===1));
 assert.ok(entries.some(x=>x.type==='file'&&x.path==='src/lib/a.js'&&x.depth===2));
 assert.equal(entries.filter(x=>x.type==='file').length,4);
 assert.equal(entries.filter(x=>x.type==='folder'&&x.path==='src').length,1);
});
test('P13 move full folder atomically including active file and descendants',()=>{
 const initial=files(),r=moveProjectFolder(initial,'src/lib/a.js','src/lib','packages/tools');
 assert.equal(safeFiles(r.files),true);
 assert.deepEqual(r.moved.map(x=>x.to),['packages/tools/a.js','packages/tools/b.js']);
 assert.equal(r.active,'packages/tools/a.js');
 assert.equal(r.files['packages/tools/a.js'],'a');
 assert.equal(r.files['src/main.js'],'entry');
 assert.deepEqual(initial,files(),'input files remain unchanged until an explicit commit');
});
test('P13 collisions and traversal are rejected without losing original files',()=>{
 const input={...files(),'lib/a.js':'existing'};
 assert.throws(()=>moveProjectFolder(input,'README.md','src/lib','lib'),/collides/);
 assert.throws(()=>moveProjectFolder(input,'README.md','src/lib','../unsafe'),/valid relative/);
 assert.throws(()=>moveProjectFolder(input,'README.md','src','src/sub'),/into itself/);
 assert.throws(()=>moveProjectFolder(input,'README.md','nonexistent','other'),/does not exist/);
 assert.deepEqual(input,{...files(),'lib/a.js':'existing'});
});
