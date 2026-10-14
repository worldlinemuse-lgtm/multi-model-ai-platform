import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSpeechSettings,chooseVoice} from '../src/speech-settings.js';
test('Q09 validates bounded rate and pitch',()=>{
 assert.deepEqual(validateSpeechSettings(),{rate:1,pitch:1,voiceURI:''});
 assert.deepEqual(validateSpeechSettings({rate:'1.2',pitch:'0.8'}),{rate:1.2,pitch:0.8,voiceURI:''});
 for(const v of [0,-1,2.1,NaN,Infinity,'bad',''])assert.throws(()=>validateSpeechSettings({rate:v}),/rate/);
 for(const v of [-1,3,NaN])assert.throws(()=>validateSpeechSettings({pitch:v}),/pitch/);
});
test('Q09 only chooses browser supplied voices',()=>{
 const voices=[{voiceURI:'local:1',name:'A'}];
 assert.equal(chooseVoice(voices,'local:1'),voices[0]);
 assert.equal(chooseVoice(voices,'missing'),null);
 assert.equal(chooseVoice([], 'local:1'),null);
});
