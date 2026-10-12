/* Read-only browser capability diagnostics. Never request new permissions, fetch remote URLs or claim provider health. */
const available=(ok)=>ok?'API PRESENT':'NOT AVAILABLE';
export async function readBrowserCapabilities(env=globalThis){
 const nav=env.navigator||{},rows=[],add=(id,label,status,detail)=>rows.push({id,label,status,detail});
 const secure=typeof env.isSecureContext==='boolean'?(env.isSecureContext?'SECURE':'INSECURE'):'UNKNOWN';
 add('secure-context','Secure browser context',secure,'Read-only window.isSecureContext indication.');
 add('indexeddb','IndexedDB interface',available(!!env.indexedDB),'Presence does not prove write success or eviction resistance.');
 add('worker','Isolated JavaScript Workers',available(typeof env.Worker==='function'),'Feature availability only; actual worker execution is covered by separate tests.');
 let wasm=false;
 try{wasm=typeof env.WebAssembly?.validate==='function'&&env.WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0]));}catch{}
 add('wasm','WebAssembly minimal module',wasm?'MINIMAL VALIDATION PASSED':'NOT VERIFIED','Checks a minimal module; does not prove external Python/CDN availability.');
 add('webgpu','WebGPU interface',available(!!nav.gpu),'An exposed API does not prove a GPU adapter or model inference.');
 add('speech','Browser speech synthesis',available(!!env.speechSynthesis),'Voice availability or audio output is not tested.');
 add('dictation','Browser speech recognition',available(typeof env.SpeechRecognition==='function'||typeof env.webkitSpeechRecognition==='function'),'Microphone operation and transcript quality are not tested.');
 const sw=nav.serviceWorker;
 add('serviceworker','Offline service-worker controller',sw?.controller?'CONTROLLING':sw?'NOT CONTROLLING':'NOT AVAILABLE','Controlling is not proof of offline coverage on this device.');
 const subtle=!!(env.crypto&&env.crypto.subtle);
 add('cryptography','Web Crypto SubtleCrypto',available(subtle),'Presence only. Vault encryption has a separate functional test.');
 let persistence='UNKNOWN';
 if(typeof nav.storage?.persisted==='function'){
  try{persistence=await nav.storage.persisted()?'PERSISTENT STORAGE GRANTED':'PERSISTENCE NOT GUARANTEED';}
  catch{persistence='UNAVAILABLE TO QUERY';}
 }else persistence='QUERY UNSUPPORTED';
 add('persistence','Persistent-storage grant',persistence,'A denied grant does not mean IndexedDB cannot save; browser may evict data.');
 let mic='UNKNOWN';
 if(typeof nav.permissions?.query==='function'){
  try{const permission=await nav.permissions.query({name:'microphone'});mic=({granted:'GRANTED',denied:'DENIED',prompt:'PROMPT REQUIRED'})[permission?.state]||'UNKNOWN';}
  catch{mic='QUERY UNSUPPORTED';}
 }else mic='QUERY UNSUPPORTED';
 add('mic-permission','Microphone permission status',mic,'Read-only query; does not request microphone access or record audio.');
 add('providers','Remote model providers','NOT VERIFIED','Live account/model/CORS/quota cannot be confirmed without a user-owned key.');
 return rows;
}
