import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDocxText,docxTextLimits} from '../src/docx-text.js';
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function stored(files){
 const chunks=[],central=[];let off=0;
 for(const [name,text] of files){
  const nm=Buffer.from(name),plain=Buffer.from(text),crc=crc32(plain);
  const local=Buffer.alloc(30+nm.length);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(plain.length,18);local.writeUInt32LE(plain.length,22);local.writeUInt16LE(nm.length,26);nm.copy(local,30);
  chunks.push(local,plain);
  const c=Buffer.alloc(46+nm.length);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(plain.length,20);c.writeUInt32LE(plain.length,24);c.writeUInt16LE(nm.length,28);c.writeUInt32LE(off,42);nm.copy(c,46);central.push(c);off+=local.length+plain.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(off,16);
 return new Uint8Array(Buffer.concat([...chunks,directory,end]));
}
const doc=body=>stored([['[Content_Types].xml','<Types/>'],['word/document.xml','<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'</w:body></w:document>']]);
test('Q06 DOCX stored ZIP main body extracts escaped text and paragraphs',async()=>assert.equal(await extractDocxText(doc('<w:p><w:r><w:t>Hello &amp; World</w:t></w:r></w:p><w:p><w:r><w:t>Second</w:t></w:r></w:p>')),'Hello & World\nSecond'));
test('Q06 invalid ZIP rejected',async()=>await assert.rejects(extractDocxText(Uint8Array.from([1,2,3])),/not a ZIP/));
test('Q06 duplicate document entry rejected',async()=>{const p='<w:document><w:body/></w:document>';await assert.rejects(extractDocxText(stored([['word/document.xml',p],['word/document.xml',p]])),/duplicate/)});
test('Q06 archive byte limit enforced',async()=>await assert.rejects(extractDocxText(doc('<w:p/>'),{archiveBytes:10}),/archive size limit/));
test('Q06 cannot increase safety limits',async()=>await assert.rejects(extractDocxText(doc(''),{archiveBytes:docxTextLimits.archiveBytes+1}),/invalid limit/));
test('Q06 DTD refused',async()=>await assert.rejects(extractDocxText(stored([['word/document.xml','<!DOCTYPE foo><w:document><w:body/></w:document>']])),/DTD/));
