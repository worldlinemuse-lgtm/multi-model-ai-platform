import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window={};
import {KeyVault} from '../src/vault.js';
const pass='correct original passphrase 123',next='a better second passphrase 789';
test('Q21 export stores ciphertext only and imports to another unlocked session',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 await v.put('groq',{key:'TEST-SYNTHETIC-NOT-REAL-KEY',model:'llama-3.1-8b-instant',attested:true});
 const exported=await v.exportEncrypted();
 assert.match(exported,/mm-studio-encrypted-vault-v1/);
 assert.doesNotMatch(exported,/TEST-SYNTHETIC-NOT-REAL-KEY/);
 const second=new KeyVault();
 await assert.rejects(second.importEncrypted(exported,{passphrase:pass}),/explicit replacement/);
 await second.importEncrypted(exported,{replaceExisting:true,passphrase:pass});
 assert.equal(second.isUnlocked,false);
 await assert.rejects(second.unlock('wrong passphrase'),/incorrect/);
 await second.unlock(pass);
 assert.equal(second.get('groq').key,'TEST-SYNTHETIC-NOT-REAL-KEY');
 await second.erase();
});
test('Q21 malformed backups rejected without changing encrypted vault',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 const saved=await v.exportEncrypted();
 await assert.rejects(v.importEncrypted('{', {replaceExisting:true,passphrase:pass}),/invalid JSON/);
 await assert.rejects(v.importEncrypted(JSON.stringify({format:'mm-studio-encrypted-vault-v1',record:{version:1,iterations:1,salt:'abc',iv:'abc',ciphertext:'abc'}}),{replaceExisting:true,passphrase:pass}),/Unsupported encrypted vault/);
 assert.equal(await v.exportEncrypted(),saved);
 await v.erase();
});
test('Q21 rotation refuses wrong old passphrase without altering stored backup',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 const before=await v.exportEncrypted();
 await assert.rejects(v.rotatePassphrase('wrong original passphrase',next),/Current passphrase/);
 assert.equal(await v.exportEncrypted(),before);
 await v.erase();
});
test('Q21 rotation uses fresh salt/IV, keeps keys encrypted, invalidates old passphrase',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 await v.put('openrouter',{key:'TEST-ROTATION-KEY',model:'openrouter/free',attested:true});
 const old=JSON.parse(await v.exportEncrypted()).record;
 await v.rotatePassphrase(pass,next);
 const fresh=JSON.parse(await v.exportEncrypted()).record;
 assert.notEqual(fresh.salt,old.salt);assert.notEqual(fresh.iv,old.iv);
 assert.equal(v.get('openrouter').key,'TEST-ROTATION-KEY');
 v.lock();await assert.rejects(v.unlock(pass),/incorrect/);await v.unlock(next);
 assert.equal(v.get('openrouter').key,'TEST-ROTATION-KEY');
 await v.erase();
});

test('Q21 refuses a wrong backup password BEFORE replacing the existing vault',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 await v.put('groq',{key:'KEEP-SYNTHETIC',model:'llama-3.1-8b-instant',attested:true});
 const untouched=await v.exportEncrypted();
 await assert.rejects(()=>v.importEncrypted(untouched,{replaceExisting:true,passphrase:'wrong-password-123'}),/authentication failed/);
 assert.equal(await v.exportEncrypted(),untouched);
 assert.equal(v.get('groq').key,'KEEP-SYNTHETIC');
 await v.erase();
});
test('Q21 rejects an AES-GCM tag-corrupted backup without destroying old credentials',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 await v.put('groq',{key:'SYNTHETIC-KEEP-THIS',model:'llama-3.1-8b-instant',attested:true});
 const untouched=await v.exportEncrypted(),tampered=JSON.parse(untouched);
 const raw=Buffer.from(tampered.record.ciphertext,'base64');
 raw[raw.length-1]^=1;
 tampered.record.ciphertext=raw.toString('base64');
 await assert.rejects(()=>v.importEncrypted(JSON.stringify(tampered),{replaceExisting:true,passphrase:pass}),/authentication failed/);
 assert.equal(await v.exportEncrypted(),untouched);
 assert.equal(v.get('groq').key,'SYNTHETIC-KEEP-THIS');
 await v.erase();
});
test('Q21 refuses import without backup password even when replacing',async()=>{
 const v=new KeyVault();await v.erase();await v.create(pass);
 const initial=await v.exportEncrypted();
 await assert.rejects(()=>v.importEncrypted(initial,{replaceExisting:true}),/original encrypted backup passphrase/);
 assert.equal(await v.exportEncrypted(),initial);
 await v.erase();
});
