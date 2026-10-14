/* Q10 private request timing and correlation. NEVER store prompts, headers, keys or response bodies. */
export function traceDuration(start,end){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;
 return Math.min(120000,Math.round(end-start));
}
export function auditTraceFields(metadata={}){
 if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return {};
 const clean={};
 if(typeof metadata.requestId==='string'&&/^[a-f0-9-]{36}$/i.test(metadata.requestId))clean.requestId=metadata.requestId;
 if(typeof metadata.model==='string'&&/^[\w@/:.+-]{1,130}$/.test(metadata.model))clean.model=metadata.model;
 if(metadata.latencyMs===null||(Number.isSafeInteger(metadata.latencyMs)&&metadata.latencyMs>=0&&metadata.latencyMs<=120000))clean.latencyMs=metadata.latencyMs;
 if(metadata.httpStatus===null||(Number.isSafeInteger(metadata.httpStatus)&&metadata.httpStatus>=100&&metadata.httpStatus<=599))clean.httpStatus=metadata.httpStatus;
 if(Object.keys(clean).length)clean.observation='local-browser';
 return clean;
}
