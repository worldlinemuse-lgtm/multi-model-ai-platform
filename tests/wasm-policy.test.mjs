import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectWasmBytes,WASM_LIMITS} from '../src/wasm-policy.js';
const head=[0,97,115,109,1,0,0,0],section=(id,...data)=>[id,data.length,...data],bytes=(...x)=>Uint8Array.from([...head,...x]);
test('Q07 valid magic and input cap',()=>{assert.equal(inspectWasmBytes(bytes()).declaredMemories,0);assert.throws(()=>inspectWasmBytes(Uint8Array.from([1,2,3])),/magic/);assert.throws(()=>inspectWasmBytes(new Uint8Array(WASM_LIMITS.moduleBytes+1)),/size limit/)});
test('Q07 blocks imports, start, tables and elements',()=>{for(const id of [2,4,8,9])assert.throws(()=>inspectWasmBytes(bytes(...section(id,0))),/unsupported/)});
test('Q07 enforces bounded memory',()=>{assert.equal(inspectWasmBytes(bytes(...section(5,1,1,1,2))).declaredMemories,1);assert.throws(()=>inspectWasmBytes(bytes(...section(5,1,0,1)),/unshared 32-bit maximum/);assert.throws(()=>inspectWasmBytes(bytes(...section(5,1,1,1,0x81,0x02))),/exceeds cap/)});
test('Q07 detects corrupt LEB128 sections',()=>{assert.throws(()=>inspectWasmBytes(bytes(5,0x80)),/truncated/);assert.throws(()=>inspectWasmBytes(bytes(5,8,1,1)),/section exceeds/)});
test('Q07 real zero-arg exported WASM returns 42',async()=>{const wasm=bytes(1,5,1,0x60,0,1,0x7f,3,2,1,0,7,8,1,4,109,97,105,110,0,0,10,6,1,4,0,0x41,42,0x0b);inspectWasmBytes(wasm);assert.equal((await WebAssembly.instantiate(await WebAssembly.compile(wasm))).exports.main(),42)});
