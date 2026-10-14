/* Conservative resolver for browser-local JavaScript module graphs.
 * This validates and orders a deliberately limited static-import subset.
 * It does NOT execute code, install packages or fetch URLs.
 */
const PATH_SEGMENT = /^[\p{L}\p{N}_-][\p{L}\p{N}_.+@ -]*$/u;
const DEFAULT_LIMITS = Object.freeze({maxFiles:32,maxFileChars:50000,maxTotalChars:150000});
const own=(obj,key)=>Object.hasOwn(obj,key);
function validPath(path){
 return typeof path==='string'&&path.length<=100&&!path.startsWith('/')&&!path.endsWith('/')&&
  path.split('/').every(s=>s!=='.'&&s!=='..'&&PATH_SEGMENT.test(s)&&!s.startsWith('.'));
}
function resolveRelative(from,specifier){
 if(typeof specifier!=='string'||specifier.length>150||!/^\.\.?\//.test(specifier)||specifier.includes('\\')||specifier.includes('//')||specifier.endsWith('/')||/[?#%:]/.test(specifier))
  throw Error('Only literal relative .js/.mjs imports are supported: '+String(specifier).slice(0,100));
 const parts=from.split('/').slice(0,-1);
 for(const segment of specifier.split('/')){
  if(segment===''||segment==='.')continue;
  if(segment==='..'){
   if(!parts.length)throw Error('Import escapes virtual project root: '+specifier);
   parts.pop();
  }else{
   if(!PATH_SEGMENT.test(segment)||segment.startsWith('.'))throw Error('Unsafe import path segment: '+specifier);
   parts.push(segment);
  }
 }
 const path=parts.join('/');
 if(!validPath(path)||!/\.(?:js|mjs)$/.test(path))throw Error('Import must resolve to a virtual .js or .mjs file: '+specifier);
 return path;
}
const IMPORT_LINE=/^\s*import\s+(?:(?:[^'";\n]+?)\s+from\s+)?(['"])([^'"\n]+)\1\s*;?\s*(?:\/\/.*)?$/;
const REEXPORT_LINE=/^\s*export\s+(?:\*|\*\s+as\s+[\w$]+|\{[^}\n]*\})\s+from\s+(['"])([^'"\n]+)\1\s*;?\s*(?:\/\/.*)?$/;
function importsFor(source,from){
 if(source.includes('`'))throw Error('Template literals require a full JavaScript parser: '+from);
 if(/\bimport\s*(?:\/\*[\s\S]*?\*\/\s*)*\(/.test(source))throw Error('Dynamic import() is not supported: '+from);
 if(/\bimport\.meta\b/.test(source))throw Error('import.meta is not supported: '+from);
 const dependencies=[];
 let inBlock=false;
 for(const line of source.split('\n')){
  const trimmed=line.trim();
  if(inBlock){
   if(trimmed.includes('*/')){
    if(trimmed.slice(trimmed.indexOf('*/')+2).trim())throw Error('Code after a block comment is not supported: '+from);
    inBlock=false;
   }
   continue;
  }
  if(trimmed.startsWith('/*')){
   const close=trimmed.indexOf('*/');
   if(close<0)inBlock=true;
   else if(trimmed.slice(close+2).trim())throw Error('Code after a block comment is not supported: '+from);
   continue;
  }
  if(!trimmed||trimmed.startsWith('//'))continue;
  if(/;\s*import\b/.test(line))throw Error('Put imports on their own lines: '+from);
  if(/\bexport\b.*\bfrom\s*['"]/.test(line)&&!/^export\b/.test(trimmed))throw Error('Put re-exports on their own lines: '+from);
  if(/^import\b/.test(trimmed)){
   const match=line.match(IMPORT_LINE);
   if(!match)throw Error('Unsupported static import syntax in '+from+': '+trimmed.slice(0,90));
   dependencies.push({specifier:match[2],path:resolveRelative(from,match[2])});
  }else if(/^export\b/.test(trimmed)&&/\bfrom\s*['"]/.test(trimmed)){
   const match=line.match(REEXPORT_LINE);
   if(!match)throw Error('Unsupported re-export syntax in '+from+': '+trimmed.slice(0,90));
   dependencies.push({specifier:match[2],path:resolveRelative(from,match[2])});
  }
 }
 if(inBlock)throw Error('Unclosed block comment in '+from);
 return dependencies;
}
export function compileModuleGraph(files,entry,limits={}){
 const config={...DEFAULT_LIMITS,...limits};
 if(!files||typeof files!=='object'||Array.isArray(files))throw TypeError('Virtual files must be an object.');
 const names=Object.keys(files);
 if(!names.length||names.length>config.maxFiles)throw Error('Module project file-count limit exceeded.');
 let total=0;
 for(const name of names){
  const content=files[name];
  if(!validPath(name)||typeof content!=='string')throw Error('Invalid virtual file: '+name);
  if(content.length>config.maxFileChars)throw Error('Module file character limit exceeded: '+name);
  total+=content.length;
 }
 if(total>config.maxTotalChars)throw Error('Module project character limit exceeded.');
 if(!validPath(entry)||!/\.(js|mjs)$/.test(entry)||!own(files,entry))throw Error('Choose an existing .js or .mjs entrypoint.');
 const visiting=new Set(),visited=new Set(),ordered=[];
 function visit(path){
  if(visiting.has(path))throw Error('Circular static module dependency: '+path);
  if(visited.has(path))return;
  if(!own(files,path))throw Error('Missing local module: '+path);
  if(!/\.(js|mjs)$/.test(path))throw Error('Module is not JavaScript: '+path);
  visiting.add(path);
  const imports=importsFor(files[path],path);
  for(const dependency of imports)visit(dependency.path);
  visiting.delete(path);visited.add(path);
  ordered.push({path,source:files[path],imports});
 }
 visit(entry);
 return {entry,modules:ordered,totalChars:total,limit:config.maxFiles};
}