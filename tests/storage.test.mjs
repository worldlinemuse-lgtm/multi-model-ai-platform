import test from 'node:test';
import assert from 'node:assert/strict';

test('D12: volatile browser storage is labeled temporary and snapshots writes',async()=>{
 globalThis.window={};
 const store=await import('../src/storage.js');
 assert.equal(store.isDurableStorage(),false);
 assert.match(store.storageMode(),/TEMPORARY MEMORY/);
 const value={projects:[{name:'Original'}]};
 await store.write('test',value);value.projects[0].name='After write';
 assert.equal((await store.read('test')).projects[0].name,'Original');
 await store.remove('test');assert.equal(await store.read('test'),null);
});
