const DB_NAME='mm-studio-b03';const STORE='kv';let dbPromise;
function open(){if(!('indexedDB' in window))return Promise.resolve(null);if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbPromise;}
const memory=new Map();
let writes=Promise.resolve();
export async function read(key){try{const db=await open();if(!db) return memory.get(key)??null;return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(key);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error)})}catch(e){throw Error('Browser database unavailable: '+e.message)}}
export function write(key,value){
 const snapshot=structuredClone(value);
 const pending=writes.catch(()=>{}).then(async()=>{const db=await open();if(!db){memory.set(key,snapshot);return;}await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(snapshot,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});});
 writes=pending;return pending;
}
export async function remove(key){const db=await open();if(!db){memory.delete(key);return;}await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});}
export const storageMode = ()=>'indexedDB' in window?'IndexedDB':'TEMPORARY MEMORY — export your work';
export const isDurableStorage = ()=>'indexedDB' in window;
