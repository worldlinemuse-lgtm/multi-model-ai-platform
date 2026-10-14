import test from 'node:test';
import assert from 'node:assert/strict';
import {binaryRecord,decodeBinaryRecord,validateBinaryAssets,exportBinaryBytes,MAX_BINARY_FILE_BYTES} from '../src/binary-assets.js';
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const wav=Uint8Array.from([82,73,70,70,1,0,0,0,87,65,86,69,0,0,0,0]);
test('Q25 PNG exact bytes and metadata survive JSON export/import',()=>{
 const record=binaryRecord('assets/sample.png',png);
 assert.equal(record.mime,'image/png');
 assert.equal(record.bytes,png.length);
 const json=JSON.parse(JSON.stringify({'assets/sample.png':record}));
 assert.deepEqual(decodeBinaryRecord('assets/sample.png',json['assets/sample.png']),png);
 assert.deepEqual(exportBinaryBytes(json)['assets/sample.png'],png);
});
test('Q25 WAV audio accepted, JavaScript masquerading as image rejected',()=>{
 const rec=binaryRecord('audio/sample.wav',wav);
 assert.equal(rec.mime,'audio/wav');
 assert.throws(()=>binaryRecord('evil.png',new TextEncoder().encode('<script>evil()</script>')),/signature/);
});
test('Q25 paths, unsupported file types, empty or massive bytes rejected',()=>{
 assert.throws(()=>binaryRecord('../secret.png',png),/Unsafe/);
 assert.throws(()=>binaryRecord('file.svg',png),/Unsupported/);
 assert.throws(()=>binaryRecord('file.png',new Uint8Array(MAX_BINARY_FILE_BYTES+1)),/400 KB/);
 assert.throws(()=>binaryRecord('file.png',new Uint8Array()),/empty/);
});
test('Q25 stored payload tampering and MIME spoof blocked',()=>{
 const record=binaryRecord('file.png',png);
 assert.equal(validateBinaryAssets({'file.png':record}),true);
 assert.equal(validateBinaryAssets({'file.png':{...record,mime:'text/html'}}),false);
 assert.equal(validateBinaryAssets({'file.png':{...record,bytes:record.bytes+1}}),false);
 assert.equal(validateBinaryAssets({'file.png':{...record,base64:'%%%%'}}),false);
 assert.equal(validateBinaryAssets({'file.png':record},{'file.png':'bad collision'}),false);
});
test('Q25 8-file cap and local byte sum enforced',()=>{
 const entries=Object.fromEntries(Array.from({length:9},(_,i)=>['asset'+i+'.png',binaryRecord('asset'+i+'.png',png)]));
 assert.equal(validateBinaryAssets(entries),false);
 assert.equal(validateBinaryAssets(Object.fromEntries(Object.entries(entries).slice(0,8))),true);
});
