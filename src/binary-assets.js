/* Q25: small, explicitly typed local image/audio records. No execution or upload.
 * Base64 is for JSON backups; ZIP entries use the exact decoded bytes.
 */
export const MAX_BINARY_FILE_BYTES=400000;
export const MAX_PROJECT_BINARY_BYTES=1250000;
export const MAX_BINARY_FILES=8;
export const BINARY_TYPES=Object.freeze({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',wav:'audio/wav',mp3:'audio/mpeg'});
const safePath=name=>typeof name==='string'&&name.length<=100&&/^[\p{L}\p{N}_-][\p{L}\p{N}_.+@ /-]*$/u.test(name)&&!name.endsWith('/')&&name.split('/').every(part=>part&&part!=='.'&&part!=='..'&&!part.startsWith('.'));
export const binaryExtension=name=>typeof name==='string'?name.split('.').at(-1)?.toLowerCase()||'':'';
function contentMatches(ext,b){
 if(ext==='png')return b.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
 if(ext==='jpg'||ext==='jpeg')return b.length>=4&&b[0]===255&&b[1]===216&&b[2]===255;
 if(ext==='webp')return b.length>=16&&[82,73,70,70].every((x,i)=>b[i]===x)&&[87,69,66,80].every((x,i)=>b[i+8]===x);
 if(ext==='wav')return b.length>=16&&[82,73,70,70].every((x,i)=>b[i]===x)&&[87,65,86,69].every((x,i)=>b[i+8]===x);
 if(ext==='mp3')return b.length>=4&&((b[0]===73&&b[1]===68&&b[2]===51)||(b[0]===255&&(b[1]&0xe0)===0xe0));
 return false;
}
function bytesToBase64(b){
 let parts=[];
 for(let i=0;i<b.length;i+=8192)parts.push(String.fromCharCode(...b.subarray(i,i+8192)));
 return btoa(parts.join(''));
}
export function binaryRecord(name,input){
 if(!safePath(name))throw Error('Unsafe binary asset filename');
 const ext=binaryExtension(name),mime=BINARY_TYPES[ext];
 if(!mime)throw Error('Unsupported binary asset extension');
 const b=input instanceof Uint8Array?input:input instanceof ArrayBuffer?new Uint8Array(input):null;
 if(!b||b.length<4||b.length>MAX_BINARY_FILE_BYTES)throw Error('Binary asset exceeds 400 KB or is empty');
 if(!contentMatches(ext,b))throw Error('Binary asset signature does not match its extension');
 return {mime,bytes:b.length,base64:bytesToBase64(b)};
}
export function decodeBinaryRecord(name,record){
 if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.base64!=='string'||record.base64.length>540000
 ||record.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(record.base64)
 ||!Number.isSafeInteger(record.bytes)||record.bytes<4||record.bytes>MAX_BINARY_FILE_BYTES)throw Error('Invalid stored binary asset record');
 const ext=binaryExtension(name);
 if(!safePath(name)||record.mime!==BINARY_TYPES[ext])throw Error('Invalid stored binary MIME or filename');
 let bytes;try{bytes=Uint8Array.from(atob(record.base64),ch=>ch.charCodeAt(0));}catch{throw Error('Stored binary asset base64 is invalid');}
 if(bytes.length!==record.bytes||!contentMatches(ext,bytes)||bytesToBase64(bytes)!==record.base64)throw Error('Stored binary bytes do not match validated metadata');
 return bytes;
}
export function validateBinaryAssets(assets,textFiles={}){
 if(!assets||typeof assets!=='object'||Array.isArray(assets))return false;
 const names=Object.keys(assets);
 if(names.length>MAX_BINARY_FILES)return false;
 let total=0;
 try{
  for(const [name,entry]of Object.entries(assets)){
   if(Object.hasOwn(textFiles,name))return false;
   total+=decodeBinaryRecord(name,entry).length;
   if(total>MAX_PROJECT_BINARY_BYTES)return false;
  }
 }catch{return false}
 return true;
}
export function exportBinaryBytes(assets){
 if(!validateBinaryAssets(assets))throw Error('Cannot export malformed binary asset state');
 return Object.fromEntries(Object.entries(assets).map(([name,entry])=>[name,decodeBinaryRecord(name,entry)]));
}
