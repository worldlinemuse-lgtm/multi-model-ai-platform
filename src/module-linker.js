/* Q03 stage 2: deterministic URL linking for a previously validated virtual module graph.
 * No evaluation, network access, filesystem reads, or implicit permissions occur here.
 * The caller owns URL creation/revocation and must run entryUrl only in a disposable
 * opaque-origin, CSP-restricted Worker with a hard timeout and bounded output.
 */
const IMPORT_LINE=/^\s*import\s+(?:(?:[^'";\n]+?)\s+from\s+)?(['"])([^'"\n]+)\1\s*;?\s*(?:\/\/.*)?$/;
const REEXPORT_LINE=/^\s*export\s+(?:\*|\*\s+as\s+[\w$]+|\{[^}\n]*\})\s+from\s+(['"])([^'"\n]+)\1\s*;?\s*(?:\/\/.*)?$/;

export function rewrite(source, path, urls, imports) {
  const mapped = new Map(imports.map(x=>[x.specifier,x.path]));
  let inBlock = false;
  return source.split('\n').map(line=>{
    const trimmed=line.trim();
    if (inBlock) {
      if(trimmed.includes('*/'))inBlock=false;
      return line;
    }
    if(trimmed.startsWith('/*')) {
      if(!trimmed.includes('*/'))inBlock=true;
      return line;
    }
    if(!trimmed || trimmed.startsWith('//'))return line;
    const declaration=/^import\b/.test(trimmed);
    const reexport=/^export\b/.test(trimmed)&&/\bfrom\s*['"]/.test(trimmed);
    if (!declaration && !reexport) {
      // Conservative: reject any syntax that could contain a hidden module import.
      // False positives in strings/comments are intentional until a real parser exists.
      if (/\bimport\b|\bexport\b[^\n]*\bfrom\b/.test(line))
        throw Error('Unsupported inline module syntax: '+path);
      return line;
    }
    const match=line.match(declaration?IMPORT_LINE:REEXPORT_LINE);
    if(!match)throw Error('Unsupported module declaration: '+path);
    const destination=mapped.get(match[2]);
    if(!destination||!urls.has(destination))throw Error('Module graph is incomplete: '+path);
    const literal=match[1]+match[2]+match[1];
    const start=line.indexOf(literal);
    if(start<0)throw Error('Could not locate import literal: '+path);
    const url=urls.get(destination);
    if(typeof url!=='string'||!/^(blob:|data:)/.test(url))throw Error('Unsafe module URL: '+path);
    return line.slice(0,start)+JSON.stringify(url)+line.slice(start+literal.length);
  }).join('\n');
}

export function linkModuleGraph(graph, createURL, revokeURL=()=>{}) {
  if(!graph||!Array.isArray(graph.modules)||typeof graph.entry!=='string'||typeof createURL!=='function'||typeof revokeURL!=='function')
    throw TypeError('Expected validated graph and URL functions.');
  const urls=new Map(),created=[];
  let closed=false;
  const revoke=()=>{if(closed)return;closed=true;for(const url of created.reverse())try{revokeURL(url)}catch{}};
  try{
    for(const module of graph.modules){
      if(urls.has(module.path)||typeof module.source!=='string'||!Array.isArray(module.imports))throw Error('Invalid module graph.');
      const rewritten=rewrite(module.source,module.path,urls,module.imports);
      const url=createURL(rewritten,module.path);
      if(typeof url!=='string'||!/^(blob:|data:)/.test(url))throw Error('URL factory must return a blob: or data: URL.');
      urls.set(module.path,url);created.push(url);
    }
    if(!urls.has(graph.entry))throw Error('Entrypoint missing from graph.');
    return {entryUrl:urls.get(graph.entry),urls:new Map(urls),revoke};
  }catch(e){revoke();throw e;}
}

// Worker-safe serialization of the exact tested linker and its lexical dependencies.
export function linkerWorkerSource(){
 return 'const IMPORT_LINE='+IMPORT_LINE.toString()+';\nconst REEXPORT_LINE='+REEXPORT_LINE.toString()+';\n'+rewrite.toString()+'\n'+linkModuleGraph.toString();
}