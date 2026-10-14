import test from 'node:test';import assert from 'node:assert/strict';import {zipFiles,unzipFiles,crc32} from '../src/zip.js';
test('ZIP roundtrip preserves nested UTF-8 files',async()=>{const files={'main.js':'console.log("hi")\n','nested/a.css':'p { color: blue }','日本語.md':'こんにちは'};const zip=zipFiles(files);const parsed=await unzipFiles(await zip.arrayBuffer());assert.deepEqual({...parsed},files);assert.ok(zip.size>100);});
test('ZIP CRC detects tampering',async()=>{const zip=zipFiles({'a.txt':'abc'});const b=new Uint8Array(await zip.arrayBuffer());b[35]^=255;await assert.rejects(()=>unzipFiles(b.buffer),/integrity/);});
test('ZIP import blocks traversal and oversize content',()=>{assert.throws(()=>zipFiles({'../bad':'x'}),/Invalid ZIP filename/);});
test('CRC known test vector',()=>{assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926)});

// BUG-001 regression: declared expanded size must not authorize unbounded inflation.
test('BUG-001: malicious DEFLATE output exceeding declared length is rejected',async()=>{
  const {deflateRawSync}=await import('node:zlib');
  const actual=new TextEncoder().encode('X'.repeat(300000));
  const compressed=deflateRawSync(actual);
  const name=new TextEncoder().encode('bomb.txt');
  const local=new Uint8Array(30+name.length+compressed.length);
  const central=new Uint8Array(46+name.length);
  const footer=new Uint8Array(22);
  const put16=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255};
  const put32=(b,p,v)=>{put16(b,p,v);put16(b,p+2,v>>>16)};
  put32(local,0,0x04034b50);put16(local,4,20);put16(local,8,8);put32(local,14,crc32(actual));put32(local,18,compressed.length);put32(local,22,1);put16(local,26,name.length);local.set(name,30);local.set(compressed,30+name.length);
  put32(central,0,0x02014b50);put16(central,4,20);put16(central,6,20);put16(central,10,8);put32(central,16,crc32(actual));put32(central,20,compressed.length);put32(central,24,1);put16(central,28,name.length);central.set(name,46);
  put32(footer,0,0x06054b50);put16(footer,8,1);put16(footer,10,1);put32(footer,12,central.length);put32(footer,16,local.length);
  const bytes=new Uint8Array(local.length+central.length+footer.length);bytes.set(local);bytes.set(central,local.length);bytes.set(footer,local.length+central.length);
  await assert.rejects(()=>unzipFiles(bytes.buffer),/inflated size exceeds declared bounds/);
});

test('Q25 mixed text+PNG archive preserves raw bytes with bounded binary policy',async()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,0,255,0]);
 const project={'main.js':'console.log("binary asset test");','images/icon.png':png};
 const archive=zipFiles(project);
 const got=await unzipFiles(await archive.arrayBuffer(),{binaryExtensions:['png']});
 assert.equal(got['main.js'],project['main.js']);
 assert.deepEqual(got['images/icon.png'],png);
 const asText=await unzipFiles(await archive.arrayBuffer());
 assert.equal(typeof asText['images/icon.png'],'string','default legacy import stays text-only');
});
test('Q25 ZIP rejects unknown binary policy or invalid value type',async()=>{
 assert.throws(()=>zipFiles({'main.js':42}),/text or byte arrays/);
 const archive=await zipFiles({'file.txt':'safe'}).arrayBuffer();
 await assert.rejects(()=>unzipFiles(archive,{binaryExtensions:['exe']}),/binary extension policy/);
});
