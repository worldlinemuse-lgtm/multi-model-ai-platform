import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipFiles,crc32} from '../src/zip.js';
const E=new TextEncoder();
function put16(b,p,v){b[p]=v&255;b[p+1]=(v>>>8)&255}
function put32(b,p,v){put16(b,p,v);put16(b,p+2,v>>>16)}
function archive(entries){
  const locals=[],centrals=[];let offset=0;
  for(const {centralName,localName=centralName,content} of entries){
    const localN=E.encode(localName),centralN=E.encode(centralName),raw=E.encode(content),crc=crc32(raw);
    const lh=new Uint8Array(30+localN.length+raw.length);put32(lh,0,0x04034b50);put16(lh,4,20);put16(lh,6,0x800);put16(lh,8,0);put32(lh,14,crc);put32(lh,18,raw.length);put32(lh,22,raw.length);put16(lh,26,localN.length);lh.set(localN,30);lh.set(raw,30+localN.length);
    const cd=new Uint8Array(46+centralN.length);put32(cd,0,0x02014b50);put16(cd,4,20);put16(cd,6,20);put16(cd,8,0x800);put16(cd,10,0);put32(cd,16,crc);put32(cd,20,raw.length);put32(cd,24,raw.length);put16(cd,28,centralN.length);put32(cd,42,offset);cd.set(centralN,46);
    locals.push(lh);centrals.push(cd);offset+=lh.length;
  }
  const directorySize=centrals.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22);
  put32(end,0,0x06054b50);put16(end,8,entries.length);put16(end,10,entries.length);put32(end,12,directorySize);put32(end,16,offset);
  const out=new Uint8Array(offset+directorySize+22);let p=0;for(const b of [...locals,...centrals,end]){out.set(b,p);p+=b.length;}return out.buffer;
}
test('reject duplicate central names instead of silently overwriting earlier content',async()=>{
  await assert.rejects(unzipFiles(archive([{centralName:'same.txt',content:'trusted'},{centralName:'same.txt',content:'untrusted'}])),/duplicate/i);
});
test('reject mismatch between local and central filenames',async()=>{
  await assert.rejects(unzipFiles(archive([{centralName:'good.txt',localName:'evil.txt',content:'data'}])),/local.*name|name.*mismatch/i);
});
test('accept consistent single entry',async()=>{
  assert.equal((await unzipFiles(archive([{centralName:'good.txt',content:'data'}])))['good.txt'],'data');
});
