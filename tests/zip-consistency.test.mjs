import test from 'node:test';
import assert from 'node:assert/strict';
import {zipFiles,unzipFiles} from '../src/zip.js';

async function bytes(files){return new Uint8Array(await zipFiles(files).arrayBuffer());}
function set16(b,n,x){b[n]=x&255;b[n+1]=(x>>>8)&255}
function set32(b,n,x){set16(b,n,x);set16(b,n+2,x>>>16)}
function findCentral(b){for(let i=0;i<b.length-4;i++)if(b[i]===0x50&&b[i+1]===0x4b&&b[i+2]===1&&b[i+3]===2)return i;throw Error('missing central')}
test('valid single entry still round trips',async()=>assert.deepEqual({...await unzipFiles(await bytes({'a.txt':'hi'}))},{'a.txt':'hi'}));
test('local header name cannot disagree with central name',async()=>{const b=await bytes({'a.txt':'hi'});b[30]='b'.charCodeAt(0);await assert.rejects(unzipFiles(b),/ZIP local filename mismatch/);});
test('duplicate names in central directory rejected',async()=>{const b=await bytes({'a.txt':'hi','b.txt':'hi'});const cd=findCentral(b);const len=5;const second=cd+46+len;b.set(new TextEncoder().encode('a.txt'),second+46);await assert.rejects(unzipFiles(b),/ZIP duplicate filename/);});
