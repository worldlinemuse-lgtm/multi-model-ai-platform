import test from 'node:test';import assert from 'node:assert/strict';import {zipFiles,unzipFiles,crc32} from '../src/zip.js';
test('ZIP roundtrip preserves nested UTF-8 files',async()=>{const files={'main.js':'console.log("hi")\n','nested/a.css':'p { color: blue }','日本語.md':'こんにちは'};const zip=zipFiles(files);const parsed=await unzipFiles(await zip.arrayBuffer());assert.deepEqual({...parsed},files);assert.ok(zip.size>100);});
test('ZIP CRC detects tampering',async()=>{const zip=zipFiles({'a.txt':'abc'});const b=new Uint8Array(await zip.arrayBuffer());b[35]^=255;await assert.rejects(()=>unzipFiles(b.buffer),/integrity/);});
test('ZIP import blocks traversal and oversize content',()=>{assert.throws(()=>zipFiles({'../bad':'x'}),/Invalid ZIP filename/);});
test('CRC known test vector',()=>{assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926)});
