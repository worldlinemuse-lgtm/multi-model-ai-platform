import test from 'node:test';
import assert from 'node:assert/strict';
import {lineDiff, compareProjectFiles} from '../src/snapshot-diff.js';

test('P23: unchanged content is not displayed as modified', () => {
 assert.deepEqual(lineDiff('alpha\nbeta', 'alpha\nbeta'), {status:'identical', text:'', added:0, removed:0});
});
test('P23: edits show line context, removal and addition without mutation', () => {
 const old='first\nsecond\nthird', current='first\nchanged\nthird';
 const result=lineDiff(old,current);
 assert.equal(result.status,'ok');
 assert.match(result.text,/@@ -1,3 \+1,3 @@/);
 assert.match(result.text,/-second/);
 assert.match(result.text,/\+changed/);
 assert.equal(result.added,1);
 assert.equal(result.removed,1);
 assert.equal(old,'first\nsecond\nthird');
});
test('P23: inserted and removed files are visible and original objects remain unchanged', () => {
 const old={'a.js':'one\ntwo','gone.txt':'bye','same.js':'x'};
 const current={'a.js':'one\nthree','new.txt':'hello','same.js':'x'};
 const before=JSON.stringify([old,current]);
 const report=compareProjectFiles(old,current);
 assert.match(report.summary,/Added since snapshot \(1\)/);
 assert.match(report.summary,/Removed since snapshot \(1\)/);
 assert.match(report.summary,/Modified since snapshot \(1\)/);
 assert.match(report.details,/--- snapshot\/a.js/);
 assert.match(report.details,/-two/);
 assert.match(report.details,/\+three/);
 assert.match(report.details,/--- snapshot\/gone.txt/);
 assert.match(report.details,/\+hello/);
 assert.equal(JSON.stringify([old,current]),before);
});
test('P23: CRLF and trailing newline changes are not silently normalized', () => {
 assert.equal(lineDiff('a\r\n','a\n').status,'ok');
 assert.equal(lineDiff('a','a\n').status,'ok');
});
test('P23: large file and matrix limits are explicit', () => {
 assert.match(lineDiff('x'.repeat(60001),'y').text,/omitted/);
 const a=Array.from({length:499},(_,i)=>'a'+i).join('\n');
 const b=Array.from({length:499},(_,i)=>'b'+i).join('\n');
 assert.match(lineDiff(a,b).text,/matrix cells/);
 assert.match(lineDiff('x','y',{maxOutput:2}).text,/omitted/);
});
test('P23: large project reports every file count but caps displayed details', () => {
 const old={},current={};
 for(let i=0;i<40;i++){old['f'+i+'.js']='old';current['f'+i+'.js']='new';}
 const report=compareProjectFiles(old,current,{fileCap:3});
 assert.equal(report.counts.changed,40);
 assert.equal(report.counts.omitted,37);
 assert.match(report.details,/Omitted 37 file diff/);
});
test('P23: content that resembles HTML remains literal diff text', () => {
 const result=lineDiff('a','<b data-example="literal">');
 assert.match(result.text,/<b data-example="literal">/);
});