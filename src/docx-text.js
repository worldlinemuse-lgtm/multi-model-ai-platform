/* Browser-local DOCX main-body text extraction, stage 1. No network, no dependencies.
 * Accepts Uint8Array/ArrayBuffer. The caller MUST display output with textContent.
 * Does not parse embedded objects, images, comments, footnotes, headers or PDF.
 */
const DEFAULT_LIMITS = Object.freeze({archiveBytes:8*1024*1024, entries:300, totalUncompressed:16*1024*1024, documentBytes:2*1024*1024, outputCharacters:1_000_000});
const decoder = new TextDecoder('utf-8',{fatal:true});
function fail(reason){throw new Error(`DOCX rejected: ${reason}`)}
function u16(b,p){return b[p] | (b[p+1]<<8)}
function u32(b,p){return (b[p] | (b[p+1]<<8) | (b[p+2]<<16) | (b[p+3]<<24))>>>0}
function checkRange(b,p,n){if(!Number.isSafeInteger(p)||!Number.isSafeInteger(n)||p<0||n<0||p+n>b.length) fail('ZIP bounds')}
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function limitsFor(custom={}){const out={};for(const [k,v] of Object.entries(DEFAULT_LIMITS)){const n=custom[k]??v;if(!Number.isSafeInteger(n)||n<1||n>v)fail(`invalid limit ${k}`);out[k]=n}return out}
function centralDirectory(b,limits){
  if(b.length<22)fail('not a ZIP');
  let eocd=-1;
  for(let p=b.length-22;p>=Math.max(0,b.length-22-65535);p--){if(u32(b,p)===0x06054b50&&p+22+u16(b,p+20)===b.length){eocd=p;break}}
  if(eocd<0)fail('ZIP directory missing');
  if(u16(b,eocd+4)!==0||u16(b,eocd+6)!==0)fail('multi-disk ZIP unsupported');
  const count=u16(b,eocd+10),centralBytes=u32(b,eocd+12),centralStart=u32(b,eocd+16);
  if(count===0xffff||centralBytes===0xffffffff||centralStart===0xffffffff)fail('ZIP64 unsupported');
  if(count!==u16(b,eocd+8)||count>limits.entries)fail('entry count');
  checkRange(b,centralStart,centralBytes);
  if(centralStart+centralBytes>eocd)fail('directory overlaps end record');
  let p=centralStart,total=0,target=null;
  const seen=new Set();
  for(let i=0;i<count;i++){
    checkRange(b,p,46);if(u32(b,p)!==0x02014b50)fail('invalid central directory');
    const flags=u16(b,p+8),method=u16(b,p+10),crc=u32(b,p+16),compressed=u32(b,p+20),uncompressed=u32(b,p+24);
    const nameLen=u16(b,p+28),extraLen=u16(b,p+30),commentLen=u16(b,p+32),disk=u16(b,p+34),offset=u32(b,p+42);
    checkRange(b,p+46,nameLen+extraLen+commentLen);
    const name=decoder.decode(b.subarray(p+46,p+46+nameLen));
    if(!name||name.startsWith('/')||name.includes('\\')||name.split('/').some(x=>x==='..'||x==='.')||name.includes('\0'))fail('unsafe ZIP member path');
    if(seen.has(name))fail('duplicate ZIP member');seen.add(name);
    if(flags&1||flags&0x40)fail('encrypted ZIP unsupported');
    if(method!==0&&method!==8)fail('unsupported ZIP compression');
    if(disk!==0||offset===0xffffffff||compressed===0xffffffff||uncompressed===0xffffffff)fail('ZIP64/multi-disk unsupported');
    total+=uncompressed;if(total>limits.totalUncompressed)fail('uncompressed archive size limit');
    if(name==='word/document.xml')target={flags,method,crc,compressed,uncompressed,offset,name};
    p+=46+nameLen+extraLen+commentLen;
  }
  if(p!==centralStart+centralBytes)fail('directory size mismatch');
  if(!target)fail('missing word/document.xml');
  if(target.uncompressed>limits.documentBytes)fail('document size limit');
  return {target,centralStart};
}
async function inflateBounded(compressed,maxBytes){
  if(typeof DecompressionStream==='undefined')fail('deflate decompressor unavailable');
  let stream;
  try{stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))}
  catch{fail('deflate-raw decompressor unavailable')}
  const reader=stream.getReader(),parts=[];let total=0;
  try{
    for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>maxBytes)fail('decompression output limit');parts.push(value)}
  }finally{if(total>maxBytes)await reader.cancel().catch(()=>{})}
  const out=new Uint8Array(total);let pos=0;for(const p of parts){out.set(p,pos);pos+=p.length}return out;
}
async function extractMainXml(b,limits){
  const {target:t,centralStart}=centralDirectory(b,limits);const p=t.offset;
  checkRange(b,p,30);if(u32(b,p)!==0x04034b50)fail('local file header invalid');
  if(u16(b,p+8)!==t.method||u16(b,p+6)!==t.flags)fail('local/central ZIP header mismatch');
  const nameLen=u16(b,p+26),extraLen=u16(b,p+28);
  checkRange(b,p+30,nameLen+extraLen);
  if(decoder.decode(b.subarray(p+30,p+30+nameLen))!==t.name)fail('local/central filename mismatch');
  const start=p+30+nameLen+extraLen;
  checkRange(b,start,t.compressed);
  if(start+t.compressed>centralStart)fail('ZIP member overlaps directory');
  const data=b.subarray(start,start+t.compressed);
  const xml=t.method===0?data:await inflateBounded(data,Math.min(t.uncompressed,limits.documentBytes));
  if(xml.length!==t.uncompressed)fail('uncompressed length mismatch');
  if(crc32(xml)!==t.crc)fail('CRC mismatch');
  return decoder.decode(xml);
}
function decodeEntities(s){
  return s.replace(/&([^;]+);/g,(_,ent)=>{
    const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};if(Object.hasOwn(named,ent))return named[ent];
    if(/^#(?:x[0-9a-fA-F]+|[0-9]+)$/.test(ent)){
      const cp=ent[1]==='x'?parseInt(ent.slice(2),16):parseInt(ent.slice(1),10);
      if(cp>0&&cp<=0x10ffff&&!(cp>=0xd800&&cp<=0xdfff))return String.fromCodePoint(cp);
    }
    fail('invalid XML entity');
  });
}
function mainBodyText(xml,limits){
  if(/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml))fail('DTD/entities unsupported');
  const bodyStart=xml.search(/<w:body(?:\s|>)/);
  if(bodyStart<0)fail('missing WordprocessingML body');
  const bodyEnd=xml.indexOf('</w:body>',bodyStart);
  if(bodyEnd<0)fail('unclosed WordprocessingML body');
  const body=xml.slice(bodyStart,bodyEnd);
  let out='',inText=false,inParagraph=false,hasText=false;
  function add(s){out+=s;if(out.length>limits.outputCharacters)fail('text output limit')}
  // XML tokenization respects > inside quoted attributes, and rejects malformed tags.
  for(let p=0;p<body.length;){
    if(body[p]!=='<'){
      const next=body.indexOf('<',p),end=next<0?body.length:next;
      if(inText){const s=body.slice(p,end);if(/&(?!(?:amp|lt|gt|quot|apos|#(?:x[\da-fA-F]+|\d+));)/.test(s))fail('unknown XML entity');add(decodeEntities(s));hasText=true}
      p=end;continue;
    }
    if(body.startsWith('<!--',p)){const end=body.indexOf('-->',p+4);if(end<0)fail('unterminated XML comment');p=end+3;continue}
    let q=p+1,quote=null;
    for(;q<body.length;q++){const ch=body[q];if(quote){if(ch===quote)quote=null}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='>')break}
    if(q===body.length)fail('unterminated XML tag');
    const tag=body.slice(p,q+1),close=/^<\//.test(tag),self=/\/\s*>$/.test(tag);
    const match=tag.match(/^<\/?([A-Za-z][\w:.-]*)\b/);
    if(!match){if(!/^<\?/.test(tag))fail('malformed XML tag');p=q+1;continue}
    const name=match[1];
    if(name==='w:p'){
      if(close){if(inParagraph){add('\n');inParagraph=false}}
      else{if(inParagraph)fail('nested Word paragraphs');inParagraph=true;if(self){add('\n');inParagraph=false}}
    }else if(name==='w:t'){if(close)inText=false;else if(inParagraph)inText=!self}
    else if(inParagraph&&!close&&(name==='w:tab'||name==='w:br'||name==='w:cr'))add(name==='w:tab'?'\t':'\n');
    p=q+1;
  }
  if(!hasText)return '';
  return out.replace(/\n+$/,'');
}
export async function extractDocxText(input,options={}){
  const limits=limitsFor(options),bytes=input instanceof Uint8Array?input:input instanceof ArrayBuffer?new Uint8Array(input):null;
  if(!bytes)fail('expected Uint8Array or ArrayBuffer');
  if(bytes.byteLength>limits.archiveBytes)fail('archive size limit');
  const xml=await extractMainXml(bytes,limits);
  return mainBodyText(xml,limits);
}
export const docxTextLimits=DEFAULT_LIMITS;