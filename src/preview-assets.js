/* Browser-local preview asset resolution. This is not a bundler or network loader.
 * Only referenced virtual project CSS and classic JS are inlined, in page order.
 * The caller must place the result in an opaque-origin sandbox with allow-scripts only.
 */
const owns=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const safeTagText=(input,closing)=>String(input).replace(new RegExp('</'+closing,'gi'),'<\\/'+closing);
const htmlAttr=(value)=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function attribute(attributes,key){
 const expression=new RegExp('(?:^|\\s)'+key+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i');
 const result=attributes.match(expression);
 return result?result[1]??result[2]??result[3]??'':null;
}
function assetPath(files,page,ref){
 if(typeof ref!=='string'||!ref.trim())return {error:'empty local reference'};
 const trimmed=ref.trim();
 if(/^[a-z][a-z0-9+.-]*:/i.test(trimmed)||trimmed.startsWith('//'))return {error:'external reference blocked'};
 if(trimmed.startsWith('#')||trimmed.startsWith('?'))return {error:'reference without a local path'};
 let value;
 try{value=decodeURIComponent(trimmed.split(/[?#]/,1)[0]);}catch{return {error:'invalid URL encoding'};}
 if(/[\x00-\x1f\\]/.test(value)||value.startsWith('//'))return {error:'unsafe path'};
 const parts=value.startsWith('/')?[]:page.split('/').slice(0,-1);
 for(const part of value.split('/')){
  if(!part||part==='.')continue;
  if(part==='..'){if(!parts.length)return {error:'reference outside project root'};parts.pop();continue;}
  parts.push(part);
 }
 const path=parts.join('/');
 if(!path||!owns(files,path))return {error:'local asset not found: '+path};
 if(typeof files[path]!=='string')return {error:'non-text virtual asset unsupported'};
 return {path,content:files[path]};
}
export function previewReport(files,htmlName){
 if(!files||!owns(files,htmlName)||typeof files[htmlName]!=='string')throw Error('Select an existing HTML file to preview.');
 const warnings=[];
 const report=(type,ref,reason)=>{warnings.push(type+' '+String(ref??'')+': '+reason);return '';};
 let html=files[htmlName];
 // Only <link rel="stylesheet" href="local.css"> is resolved. Other links are left to CSP.
 html=html.replace(/<link\b([^>]*?)\/?>/gi,(whole,attrs)=>{
  const rel=attribute(attrs,'rel')||'';
  if(!rel.split(/\s+/).some(x=>x.toLowerCase()==='stylesheet'))return whole;
  const ref=attribute(attrs,'href'),asset=assetPath(files,htmlName,ref);
  if(asset.error)return report('CSS',ref,asset.error);
  if(!asset.path.toLowerCase().endsWith('.css'))return report('CSS',ref,'expected a .css project file');
  return '<style data-local-href="'+htmlAttr(asset.path)+'">'+safeTagText(asset.content,'style')+'</style>';
 });
 // Inserting at each original script location preserves ordering with inline scripts.
 // Explicitly skip external, missing and module scripts; never network-load them.
 html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,(whole,attrs,body)=>{
  const ref=attribute(attrs,'src');
  if(ref===null)return whole;
  const type=attribute(attrs,'type');
  if(type&&type.toLowerCase().trim()==='module')return report('JS',ref,'module imports are not supported by this preview');
  if(type&&!['text/javascript','application/javascript'].includes(type.toLowerCase().trim()))return report('JS',ref,'script type not supported');
  const asset=assetPath(files,htmlName,ref);
  if(asset.error)return report('JS',ref,asset.error);
  if(!/\.(js|mjs|cjs)$/i.test(asset.path))return report('JS',ref,'expected a JavaScript project file');
  return '<script data-local-src="'+htmlAttr(asset.path)+'">'+safeTagText(asset.content,'script')+'</script>';
 });
 const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; connect-src \'none\'; form-action \'none\'; base-uri \'none\';">';
 const document='<!doctype html><html><head><meta charset="utf-8">'+csp+'</head><body>'+html+'</body></html>';
 return {document,warnings};
}
export function previewDocument(files,htmlName){return previewReport(files,htmlName).document;}
