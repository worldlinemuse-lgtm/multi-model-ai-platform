/* Q22: local-only route checks and manual retry preparation. No network or billing. */
import {buildRequest} from './provider-api.js';
import {providerById} from './core.js';
const clean=(x,max=180)=>String(x||'').replace(/[\x00-\x1f\x7f]/g,' ').slice(0,max);
export function inspectProviderConfiguration(id,credential){
 const provider=providerById(id);
 if(!provider)return {state:'unsupported',provider:clean(id,80),issues:['Unknown route'],endpointHost:null,networkAttempted:false};
 if(!credential)return {state:'missing-key',provider:provider.name,issues:['Unlock a locally saved credential before using this route.'],endpointHost:null,networkAttempted:false};
 try{
  // buildRequest validates route, account and free-plan attestation. The returned key is
  // intentionally discarded and must never be exposed in the diagnostics payload.
  const {url}=buildRequest(id,credential,[{role:'user',content:'CONFIG_VALIDATION_ONLY_NO_NETWORK'}]);
  const parsed=new URL(url);
  if(parsed.protocol!=='https:')throw Error('Non-HTTPS transport is not permitted');
  return {state:'configured-unverified',provider:provider.name,endpointHost:parsed.hostname,issues:['Local configuration is valid. Network connectivity, account balance, eligibility and CORS remain unverified.'],networkAttempted:false};
 }catch(error){
  // Never echo a provider error that could accidentally interpolate a key or URL token.
  return {state:'invalid',provider:provider.name,endpointHost:null,issues:['Local provider configuration was rejected. Verify model, free-plan attestation, key and account format.'],networkAttempted:false};
 }
}
export function findManualRetryDraft(messages,route){
 if(!Array.isArray(messages)||typeof route!=='string'||!providerById(route))return null;
 for(let i=messages.length-1;i>=0;i--){
  const m=messages[i];
  if(m?.role!=='assistant'||m.provider!==route||m.error!==true)continue;
  for(let j=i-1;j>=0;j--){
   const prior=messages[j];if(prior?.role!=='user')continue;
   const text=typeof prior.content==='string'?prior.content.trim():'';
   if(!text||text.length>10000)return null;
   return {route,prompt:text,warning:'This is a draft only. Sending again is a new model request that may use quota. Previous request outcome may be unknown.'};
  }
 }
 return null;
}
export function manualRetryCooldown(lastAttemptMs,nowMs,{minimumMs=1000}={}){
 if(!Number.isFinite(lastAttemptMs)||!Number.isFinite(nowMs)||nowMs<lastAttemptMs||!Number.isSafeInteger(minimumMs)||minimumMs<0||minimumMs>60000)throw Error('Invalid local retry timing');
 return Math.max(0,Math.ceil(minimumMs-(nowMs-lastAttemptMs)));
}
