/* Hardened ZIP entry decompression helper, browser-native and dependency-free.
 * Must be called after central directory header validation. No network access.
 */
export async function boundedInflateRaw(compressed,expectedBytes,{maxBytes=500_000}={}){
  if(!(compressed instanceof Uint8Array))throw Error('ZIP compressed input must be bytes');
  if(!Number.isSafeInteger(expectedBytes)||expectedBytes<0||expectedBytes>maxBytes)throw Error('ZIP declared uncompressed size limit');
  if(typeof DecompressionStream==='undefined')throw Error('ZIP decompressor unavailable');
  const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks=[];let size=0;
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>expectedBytes||size>maxBytes)throw Error('ZIP inflated size exceeds declared bounds');
      chunks.push(value);
    }
  }catch(e){await reader.cancel().catch(()=>{});throw e}
  if(size!==expectedBytes)throw Error('ZIP inflated size does not match declared bounds');
  const out=new Uint8Array(size);let p=0;for(const chunk of chunks){out.set(chunk,p);p+=chunk.length}return out;
}
