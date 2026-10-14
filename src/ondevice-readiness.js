/* Q27 first scope: privacy-preserving user-triggered WebGPU readiness check.
 * Does not request a GPUDevice, load model weights, or run any inference.
 */
export const LOCAL_MODEL_BUDGET_MIB=96;
const MAX_INPUT_BYTES=LOCAL_MODEL_BUDGET_MIB*1024*1024;
export function checkLocalModelSize(bytes,{limitBytes=MAX_INPUT_BYTES}={}){
 if(!Number.isSafeInteger(bytes)||bytes<0||!Number.isSafeInteger(limitBytes)||limitBytes<1048576||limitBytes>MAX_INPUT_BYTES)throw Error('Invalid local model resource estimate');
 return {allowed:bytes>0&&bytes<=limitBytes,inputBytes:bytes,limitBytes,kind:'planning-only',noAllocation:true,modelExecution:false};
}
function safeResult(state,summary){
 return {state,summary,networkAttempted:false,modelDownloaded:false,deviceRequested:false,modelExecuted:false,adapterIdentifiersCollected:false};
}
export async function probeWebGPUReadiness(env=globalThis,{deadlineMs=3500}={}){
 if(!Number.isSafeInteger(deadlineMs)||deadlineMs<100||deadlineMs>10000)throw Error('Invalid probe deadline');
 if(env.isSecureContext===false)return safeResult('insecure','WebGPU requires a secure HTTPS or localhost context.');
 const gpu=env.navigator?.gpu;
 if(!gpu||typeof gpu.requestAdapter!=='function')return safeResult('unavailable','No accessible WebGPU adapter API. Browser-local GPU inference is not available in this context.');
 let timeoutId;
 try{
  // Adapter discovery is not an inference/model operation; do not requestDevice,
  // expose vendor details, fetch weights or enumerate exact hardware limits.
  const adapter=await Promise.race([
   gpu.requestAdapter({powerPreference:'low-power'}),
   new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(Error('adapter timeout')),deadlineMs);})
  ]);
  if(!adapter)return safeResult('no-adapter','The browser returned no WebGPU adapter; GPU inference is not available here.');
  return safeResult('adapter-only','Browser provided a WebGPU adapter. No model weights or local inference runtime are installed; inference has NOT been verified.');
 }catch{
  return safeResult('probe-failed','WebGPU adapter probe failed or timed out. No GPU device or model was started.');
 }finally{clearTimeout(timeoutId);}
}
