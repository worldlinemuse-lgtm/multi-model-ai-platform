import test from 'node:test';
import assert from 'node:assert/strict';
import {copyProjectFolder} from '../src/project-files.js';
const files=()=>({'main.js':'root','src/lib/a.js':'A','src/lib/b.js':'B','src/shared.js':'shared'});
test('Q14 copy preserves source, active and nested prefixes',()=>{
 const source=files(),copy=copyProjectFolder(source,'src/lib/a.js','src/lib','pkg/modules');
 assert.equal(copy.files['src/lib/a.js'],'A');assert.equal(copy.files['pkg/modules/a.js'],'A');
 assert.equal(copy.files['pkg/modules/b.js'],'B');assert.equal(copy.active,'src/lib/a.js');
 assert.equal(source['pkg/modules/a.js'],undefined);assert.equal(copy.copied.length,2);
});
test('Q14 collision and traversal fail closed',()=>{
 const source=files();
 for(const [from,to,pattern] of [['src/lib','src/lib/deep',/inside itself/],['src/lib','../escape',/valid relative/],['missing','dest',/does not exist/],['src/lib','src/lib',/inside itself/]])assert.throws(()=>copyProjectFolder(source,'main.js',from,to),pattern);
 const collision={...source,'backup/a.js':'preserve'};assert.throws(()=>copyProjectFolder(collision,'main.js','src/lib','backup'),/collides/);
 assert.equal(collision['backup/a.js'],'preserve');
});
test('Q14 cannot exceed bounded virtual file capacity',()=>{
 const huge={'main.js':'x','src/lib/a.js':'A'};
 for(let i=0;i<118;i++)huge['f'+i+'.js']='x';
 assert.throws(()=>copyProjectFolder(huge,'main.js','src/lib','backup'),/limits/);
});
