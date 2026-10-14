import test from 'node:test';
import assert from 'node:assert/strict';

function fakeDatabase({firstOpenFails=false,firstOpenBlocked=false,holdWrites=false}={}){
 const data=new Map(),heldWrites=[];
 let openCalls=0,closed=0;
 const db={
  objectStoreNames:{contains:()=>true},
  createObjectStore(){},
  close(){closed++;},
  onversionchange:null,
  transaction(_store,_mode){
   const tx={error:null,oncomplete:null,onerror:null,onabort:null};
   tx.objectStore=()=>({
    get(key){const req={result:data.get(key),error:null,onsuccess:null,onerror:null};queueMicrotask(()=>req.onsuccess?.());return req;},
    put(value,key){const commit=()=>{data.set(key,value);queueMicrotask(()=>tx.oncomplete?.());};if(holdWrites)heldWrites.push(commit);else queueMicrotask(commit);},
    delete(key){queueMicrotask(()=>{data.delete(key);tx.oncomplete?.();});}
   });
   return tx;
  }
 };
 const indexedDB={open(){openCalls++;const req={result:db,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};queueMicrotask(()=>{
  if(firstOpenFails&&openCalls===1){req.error=Error('Transient IndexedDB open failure');req.onerror?.();}
  else if(firstOpenBlocked&&openCalls===1)req.onblocked?.();
  else req.onsuccess?.();
 });return req;}};
 return {indexedDB,db,data,heldWrites,get openCalls(){return openCalls;},get closed(){return closed;}};
}
async function freshStore(db){globalThis.window=db?{indexedDB:db.indexedDB}:{};if(db)globalThis.indexedDB=db.indexedDB;else delete globalThis.indexedDB;return import(`../src/storage.js?case=${Math.random()}`);}

test('D12: volatile browser storage is labeled temporary and snapshots writes',async()=>{
 const store=await freshStore(null);
 assert.equal(store.isDurableStorage(),false);
 assert.match(store.storageMode(),/TEMPORARY MEMORY/);
 const value={projects:[{name:'Original'}]};
 await store.write('test',value);value.projects[0].name='After write';
 assert.equal((await store.read('test')).projects[0].name,'Original');
 await store.remove('test');assert.equal(await store.read('test'),null);
});

test('STORAGE-025: remove cannot race and resurrect a queued write',async()=>{
 const db=fakeDatabase({holdWrites:true}),store=await freshStore(db);
 const write=store.write('project',{name:'saved'});
 const removal=store.remove('project');
 for(let i=0;i<20&&!db.heldWrites.length;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(db.heldWrites.length,1,'write transaction started');
 db.heldWrites.shift()();
 await Promise.all([write,removal]);
 assert.equal(await store.read('project'),null);
 assert.equal(db.data.has('project'),false);
});

test('STORAGE-025: read waits for queued writes to finish',async()=>{
 const db=fakeDatabase({holdWrites:true}),store=await freshStore(db);
 const write=store.write('project',{name:'latest'});
 const read=store.read('project');
 for(let i=0;i<20&&!db.heldWrites.length;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(db.heldWrites.length,1);
 db.heldWrites.shift()();
 await write;
 assert.deepEqual(await read,{name:'latest'});
});

test('STORAGE-025: transient IndexedDB open failure is recoverable on next attempt',async()=>{
 const db=fakeDatabase({firstOpenFails:true}),store=await freshStore(db);
 await assert.rejects(store.read('key'),/Transient IndexedDB open failure/);
 assert.equal(await store.read('key'),null);
 assert.equal(db.openCalls,2);
});

test('STORAGE-025: blocked IndexedDB upgrade fails promptly and can be retried',async()=>{
 const db=fakeDatabase({firstOpenBlocked:true}),store=await freshStore(db);
 await assert.rejects(Promise.race([store.read('key'),new Promise((_,reject)=>setTimeout(()=>reject(Error('hung blocked upgrade')),250))]),/upgrade blocked by another open tab/);
 assert.equal(await store.read('key'),null);
 assert.equal(db.openCalls,2);
});

test('STORAGE-025: versionchange closes stale handle and allows reopening',async()=>{
 const db=fakeDatabase(),store=await freshStore(db);
 await store.read('key');
 assert.equal(db.openCalls,1);
 db.db.onversionchange?.();
 assert.equal(db.closed,1);
 await store.read('key');
 assert.equal(db.openCalls,2);
});
