import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedInflateRaw} from '../src/bounded-deflate.js';
import {deflateRawSync} from 'node:zlib';

test('bounded raw inflate accepts exact declared output', async()=>{
 const original=new TextEncoder().encode('safe content');
 const compressed=new Uint8Array(deflateRawSync(original));
 assert.deepEqual(await boundedInflateRaw(compressed,original.length),original);
});
test('bounded raw inflate rejects undersized declared output', async()=>{
 const original=new TextEncoder().encode('A'.repeat(100000));
 const compressed=new Uint8Array(deflateRawSync(original));
 await assert.rejects(boundedInflateRaw(compressed,100),/exceeds declared bounds/);
});
test('bounded raw inflate rejects overlarge declared size before inflation', async()=>{
 await assert.rejects(boundedInflateRaw(new Uint8Array([3,0]),500001),/declared uncompressed size limit/);
});
test('bounded raw inflate rejects invalid raw deflate', async()=>{
 await assert.rejects(boundedInflateRaw(new Uint8Array([255,255,255]),100),/./);
});
