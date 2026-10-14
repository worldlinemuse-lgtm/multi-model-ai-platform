/* Opt-in Groq metadata diagnostic: exactly one GET, never inference or automatic retry. */
const MODELS_URL='https://api.groq.com/openai/v1/models';
const MAX_RESPONSE_CHARS=96000;
const MODEL_ID=/^[A-Za-z0-9_/@.+:-]{1,130}$/;
const DESCRIPTIONS=Object.freeze({
  400:['bad-request','Groq rejected the request. Review the provider configuration.'],
  401:['credential-rejected','Groq rejected the saved API key. Check the credential in the Groq console.'],
  403:['permission-denied','Groq denied access for this key or account. Check the account permissions.'],
  404:['endpoint-unavailable','The Groq models endpoint was not found. Check the documented endpoint.'],
  429:['rate-limited','Groq rate-limited this request. Check the account limits before manually trying again.']
});
export function classifyProviderStatus(status){
  if(!Number.isSafeInteger(status)||status<100||status>599)return {state:'invalid-status',message:'No valid HTTP status was returned.'};
  const mapped=DESCRIPTIONS[status];
  if(mapped)return {state:mapped[0],message:mapped[1]};
  if(status>=500)return {state:'provider-unavailable',message:'Groq returned a server-side error. No automatic retry was made.'};
  return {state:'request-rejected',message:'The provider rejected this metadata request.'};
}
const FREE_PLAN_RETIRED=new Set(['llama-3.1-8b-instant','llama-3.3-70b-versatile']); // Groq free/developer shutoff 2026-08-16
export function recommendGroqModel(models,selected){
  if(!Array.isArray(models)||!models.length)return {model:null,reason:'No active models were returned. Do not guess or auto-switch.'};
  const choices=models.filter(id=>typeof id==='string'&&MODEL_ID.test(id));
  if(choices.includes(selected)&&!FREE_PLAN_RETIRED.has(selected))return {model:selected,reason:'The saved model is active; account free-tier eligibility is still unverified.'};
  for(const preferred of ['openai/gpt-oss-20b','openai/gpt-oss-120b']){
    if(choices.includes(preferred))return {model:preferred,reason:FREE_PLAN_RETIRED.has(selected)?'Saved Llama model was retired for the free/developer tier in August 2026. Suggested replacement appears active; verify exact account eligibility before saving.':'Suggested active text model only; verify free-plan eligibility before saving or making inference requests.'};
  }
  return {model:null,reason:'Available models need human review for chat capability and free-plan eligibility.'};
}
export async function probeGroqModels({credential,fetchImpl=fetch,signal,timeoutMs=12000}={}){
  if(!credential?.key||typeof credential.key!=='string'||credential.key.length>10000||credential.attested!==true)
    return {state:'missing-credential',message:'Unlock a saved Groq key and confirm account free-plan eligibility first.',networkAttempted:false};
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)
    return {state:'invalid-options',message:'Invalid diagnostic timeout.',networkAttempted:false};
  if(signal?.aborted)return {state:'cancelled',message:'Diagnostic cancelled before any network request.',networkAttempted:false};
  const aborter=new AbortController();
  let timedOut=false;
  const stop=()=>aborter.abort();
  signal?.addEventListener('abort',stop,{once:true});
  const timeout=setTimeout(()=>{timedOut=true;aborter.abort();},timeoutMs);
  try{
    const response=await fetchImpl(MODELS_URL,{
      method:'GET',
      headers:{Authorization:'Bearer '+credential.key,Accept:'application/json'},
      mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',
      referrerPolicy:'no-referrer',signal:aborter.signal
    });
    if(!response.ok){
      const result=classifyProviderStatus(response.status);
      return {...result,httpStatus:response.status,networkAttempted:true};
    }
    const declaredLength=Number(response.headers?.get?.('content-length')||0);
    if(declaredLength>MAX_RESPONSE_CHARS)return {state:'invalid-response',message:'Model listing exceeds the diagnostic size limit.',networkAttempted:true,httpStatus:response.status};
    const body=await response.text();
    if(body.length>MAX_RESPONSE_CHARS)return {state:'invalid-response',message:'Model listing exceeds the diagnostic size limit.',networkAttempted:true,httpStatus:response.status};
    let payload;try{payload=JSON.parse(body);}catch{return {state:'invalid-response',message:'Groq returned a non-JSON model listing.',networkAttempted:true,httpStatus:response.status};}
    if(!payload||!Array.isArray(payload.data))return {state:'invalid-response',message:'Groq returned an unexpected model listing.',networkAttempted:true,httpStatus:response.status};
    const models=[...new Set(payload.data.filter(v=>v&&v.active!==false&&typeof v.id==='string'&&MODEL_ID.test(v.id)).map(v=>v.id))].sort();
    return {state:'models-received',message:'Groq accepted the metadata request. Model presence does not prove free-plan eligibility, chat support, CORS for POST, or successful inference.',networkAttempted:true,httpStatus:response.status,models:models.slice(0,80),totalActiveModels:models.length};
  }catch{
    if(signal?.aborted)return {state:'cancelled',message:'Diagnostic stopped by the user.',networkAttempted:true};
    if(timedOut)return {state:'timeout',message:'The Groq metadata request timed out. No automatic retry was made.',networkAttempted:true};
    return {state:'browser-network-unverified',message:'Browser fetch failed. Network, TLS, or CORS may be responsible; this does not prove the key is invalid.',networkAttempted:true};
  }finally{
    clearTimeout(timeout);
    signal?.removeEventListener('abort',stop);
  }
}
