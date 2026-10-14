import test from 'node:test';
import assert from 'node:assert/strict';
import {imageGeometry,paintEditedImage} from '../src/image-transform.js';
test('Q08 center crop and rotation geometry',()=>{
 const a=imageGeometry(800,600,{cropPercent:25});assert.deepEqual([a.sx,a.sy,a.sw,a.sh,a.width,a.height],[200,150,400,300,400,300]);
 const r=imageGeometry(800,600,{cropPercent:25,rotation:90});assert.deepEqual([r.width,r.height],[300,400]);
 const s=imageGeometry(4000,2000,{rotation:270});assert.deepEqual([s.width,s.height],[800,1600]);
});
test('Q08 original export reports actual changed geometry',()=>{
 const a=imageGeometry(2000,1000,{cropPercent:10,rotation:90,original:true});
 assert.deepEqual([a.width,a.height],[800,1600]);
});
test('Q08 rejects malicious dimensions and settings',()=>{
 for(const dim of [[0,2],[8193,1],[8192,8192],[NaN,5],[2,-3]])assert.throws(()=>imageGeometry(...dim),/dimensions/);
 assert.throws(()=>imageGeometry(400,500,{cropPercent:41}),/crop/);
 assert.throws(()=>imageGeometry(400,500,{rotation:45}),/rotation/);
});
test('Q08 canvas save/restore and draw order',()=>{
 const calls=[];const ctx={canvas:{width:0,height:0},save:()=>calls.push('save'),restore:()=>calls.push('restore'),clearRect:()=>calls.push('clear'),translate:()=>calls.push('translate'),rotate:()=>calls.push('rotate'),drawImage:()=>calls.push('draw'),filter:'none'};
 const spec=paintEditedImage(ctx,{width:300,height:200},{cropPercent:20,rotation:90},'brightness(125%)');
 assert.deepEqual([spec.width,spec.height],[120,180]);
 assert.deepEqual(calls,['save','clear','translate','rotate','draw','restore']);
});
