/* Q26: explicit data-only model presets for existing supported provider transports.
 * NOT executable plugins, untrusted endpoint registration or proof of free quota.
 */
import {providerById} from './core.js';
import {validateModel} from './provider-api.js';
const FORMAT='mm-studio-provider-presets-v1';
const MAX_PRESETS=20,MAX_IMPORT=15000;
const clean=str=>typeof str==='string'&&str.trim().length>0&&str.length<=80&&!/[\x00-\x1f\x7f<>]/.test(str);
export const PROVIDER_PRESET_FORMAT=FORMAT;
export function validateProviderPresets(items){
 if(!Array.isArray(items)||items.length>MAX_PRESETS)return false;
 const seen=new Set();
 for(const item of items){
  if(!item||typeof item!=='object'||Array.isArray(item)||!clean(item.label)||!providerById(item.provider)||typeof item.model!=='string'||item.model.length>130)return false;
  try{validateModel(item.provider,item.model);}catch{return false;}
  const key=item.provider+'\0'+item.model;
  if(seen.has(key))return false;
  seen.add(key);
  if(Object.keys(item).some(k=>!['label','provider','model'].includes(k)))return false;
 }
 return true;
}
export function parseProviderPresets(text){
 if(typeof text!=='string'||text.length>MAX_IMPORT)throw Error('Provider preset file must be JSON below 15 KB');
 let x;try{x=JSON.parse(text);}catch{throw Error('Provider presets are invalid JSON');}
 if(!x||x.format!==FORMAT||!validateProviderPresets(x.presets))throw Error('Provider preset list failed strict validation');
 return x.presets.map(({label,provider,model})=>({label,provider,model}));
}
export function exportProviderPresets(items){
 if(!validateProviderPresets(items))throw Error('Invalid local provider presets');
 return JSON.stringify({format:FORMAT,presets:items.map(x=>({label:x.label,provider:x.provider,model:x.model}))},null,2);
}
export function resolvePresetRoute(items,index){
 if(!validateProviderPresets(items)||!Number.isSafeInteger(index)||index<0||index>=items.length)throw Error('Unknown provider preset');
 const {provider,model}=items[index];
 return {provider,model,requiresKey:true,freeEligibility:'unverified',networkAttempted:false};
}
