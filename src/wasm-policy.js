/* Restrictive browser-local WebAssembly binary admission policy.
 * Not a complete Wasm validator; WebAssembly.compile validates module semantics.
 * Reject imports, tables/elements, start functions, memory64/multi-memory.
 */
export const WASM_LIMITS=Object.freeze({moduleBytes:262144,memoryPages:256,timeoutMs:1500});
function reject(s){throw Error('WASM rejected: '+s)}
function readVarU32(b,state,end){
 let result=0;
 for(let shift=0;shift<=28;shift+=7){
  if(state.pos>=end)reject('truncated unsigned LEB128');
  const v=b[state.pos++];
  if(shift===28&&(v&0xf0))reject('oversized unsigned LEB128');
  result+=(v&0x7f)*2**shift;
  if(!(v&0x80))return result;
 }
 reject('unsigned LEB128 too long');
}
export function inspectWasmBytes(input,opts={}){
 const limits={...WASM_LIMITS,...opts};
 for(const k of ['moduleBytes','memoryPages'])if(!Number.isSafeInteger(limits[k])||limits[k]<1||limits[k]>WASM_LIMITS[k])reject('invalid '+k);
 const b=input instanceof Uint8Array?input:input instanceof ArrayBuffer?new Uint8Array(input):null;
 if(!b)reject('input must be Uint8Array or ArrayBuffer');
 if(b.byteLength>limits.moduleBytes)reject('module size limit');
 if(b.length<8||b[0]!==0||b[1]!==0x61||b[2]!==0x73||b[3]!==0x6d||b[4]!==1||b[5]!==0||b[6]!==0||b[7]!==0)reject('invalid magic/version');
 const state={pos:8};let declaredMemories=0;
 while(state.pos<b.length){
  const id=b[state.pos++],length=readVarU32(b,state,b.length),end=state.pos+length;
  if(end>b.length)reject('section exceeds module bounds');
  if(id===2)reject('imports unsupported');
  if(id===4||id===9)reject('tables/elements unsupported');
  if(id===8)reject('start section unsupported');
  if(id===5){
   const count=readVarU32(b,state,end);
   if(count>1)reject('multiple memories unsupported');
   declaredMemories+=count;
   if(declaredMemories>1)reject('multiple memories unsupported');
   for(let i=0;i<count;i++){
    const flags=readVarU32(b,state,end);
    if(flags!==1)reject('memory must declare an unshared 32-bit maximum');
    const min=readVarU32(b,state,end),max=readVarU32(b,state,end);
    if(min>max||max>limits.memoryPages)reject('linear memory exceeds cap');
   }
   if(state.pos!==end)reject('invalid memory section');
  }
  state.pos=end;
 }
 return {bytes:b,bytesLength:b.byteLength,memoryMaxPages:limits.memoryPages,declaredMemories};
}