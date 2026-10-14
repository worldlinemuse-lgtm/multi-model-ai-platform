import test from 'node:test';
import assert from 'node:assert/strict';
import {PROVIDER_PRESET_FORMAT,parseProviderPresets,exportProviderPresets,validateProviderPresets,resolvePresetRoute} from '../src/provider-presets.js';
const source=[{label:'Research preferred',provider:'openrouter',model:'openrouter/free'},{label:'Fast draft',provider:'groq',model:'llama-3.3-70b-versatile'}];
test('Q26 safe data-only preset roundtrip, no credentials or network calls',()=>{
 const json=exportProviderPresets(source),restored=parseProviderPresets(json);
 assert.equal(PROVIDER_PRESET_FORMAT,'mm-studio-provider-presets-v1');
 assert.deepEqual(restored,source);
 assert.deepEqual(resolvePresetRoute(restored,1),{provider:'groq',model:'llama-3.3-70b-versatile',requiresKey:true,freeEligibility:'unverified',networkAttempted:false});
});
test('Q26 no arbitrary transport URLs, script code or external plugin fields',()=>{
 assert.equal(validateProviderPresets([{label:'inject',provider:'groq',model:'valid',url:'https://evil.test'}]),false);
 assert.equal(validateProviderPresets([{label:'x',provider:'my-server',model:'foo'}]),false);
 assert.equal(validateProviderPresets([{label:'<script>',provider:'groq',model:'foo'}]),false);
 assert.equal(validateProviderPresets([{label:'x',provider:'groq',model:'valid',executor:'eval'}]),false);
});
test('Q26 OpenRouter fixed free-model grammar and 20 slot cap remain',()=>{
 assert.equal(validateProviderPresets([{label:'Paid',provider:'openrouter',model:'other/paid'}]),false);
 assert.equal(validateProviderPresets([...source,...source]),false);
 assert.equal(validateProviderPresets(Array.from({length:21},(_,i)=>({label:'x'+i,provider:'groq',model:'m'+i}))),false);
});
test('Q26 malformed import and oversized files fail closed',()=>{
 assert.throws(()=>parseProviderPresets('{'),/invalid JSON/);
 assert.throws(()=>parseProviderPresets('x'.repeat(16000)),/below 15 KB/);
 assert.throws(()=>parseProviderPresets(JSON.stringify({format:'unknown',presets:source})),/failed strict validation/);
 assert.throws(()=>resolvePresetRoute(source,99),/Unknown/);
});
