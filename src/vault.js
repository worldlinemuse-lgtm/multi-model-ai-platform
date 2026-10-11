import {read,write,remove} from './storage.js';
const KEY='vault.v1';const te=new TextEncoder();const td=new TextDecoder();const ITER=260000;const toB64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));const fromB64=s=>Uint8Array.from(atob(s),v=>v.charCodeAt(0));
export class KeyVault{
 constructor(){this.cryptoKey=null;this.entries={};this.salt=null;}
 get isUnlocked(){return !!this.cryptoKey;}
 get count(){return this.isUnlocked?Object.keys(this.entries).length:0;}
 async exists(){return !!(await read(KEY));}
 async derive(pass,salt){if(!crypto.subtle)throw Error('Web Crypto is unavailable: open this page using HTTPS or localhost.');const material=await crypto.subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITER,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
 async create(pass){if(pass.length<10)throw Error('Use a passphrase of at least 10 characters.');if(await this.exists())throw Error('Vault already exists; unlock it instead.');this.salt=crypto.getRandomValues(new Uint8Array(16));this.cryptoKey=await this.derive(pass,this.salt);this.entries={};await this.save();}
 async unlock(pass){const record=await read(KEY);if(!record)throw Error('No vault exists yet.');const salt=fromB64(record.salt);const cryptoKey=await this.derive(pass,salt);let plaintext;try{plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(record.iv),additionalData:te.encode(KEY)},cryptoKey,fromB64(record.ciphertext));}catch{throw Error('Passphrase incorrect or encrypted vault damaged.');}const entries=JSON.parse(td.decode(plaintext));if(!entries||typeof entries!=='object'||Array.isArray(entries))throw Error('Invalid encrypted vault payload');this.salt=salt;this.cryptoKey=cryptoKey;this.entries=entries;}
 async save(){if(!this.isUnlocked)throw Error('Unlock vault first.');const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:te.encode(KEY)},this.cryptoKey,te.encode(JSON.stringify(this.entries)));await write(KEY,{version:1,iterations:ITER,salt:toB64(this.salt),iv:toB64(iv),ciphertext:toB64(ciphertext)});}
 async put(provider,{key,model,account,attested}){if(!this.isUnlocked)throw Error('Unlock vault first.');if(!attested)throw Error('Free plan attestation required.');if(!key||!model)throw Error('API key and eligible model ID required.');this.entries[provider]={key,model,account:account||'',attested:true,updated:new Date().toISOString()};await this.save();}
 async drop(provider){if(!this.isUnlocked)throw Error('Unlock vault first.');delete this.entries[provider];await this.save();}
 get(provider){if(!this.isUnlocked)return null;const p=this.entries[provider];return p?{...p}:null;}
 list(){if(!this.isUnlocked)return [];return Object.entries(this.entries).map(([id,c])=>({id,model:c.model,updated:c.updated}));}
 lock(){this.cryptoKey=null;this.entries={};this.salt=null;}
 async erase(){this.lock();await remove(KEY);}
}
