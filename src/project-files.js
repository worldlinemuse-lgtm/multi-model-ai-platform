import {safeName,safeFiles} from './core.js';

// Project folders are virtual prefixes, not directories on a real filesystem.
// This module only manipulates validated in-memory file keys.
export function projectFolders(files){
 const seen=new Set();
 for(const name of Object.keys(files)){
  const components=name.split('/');
  for(let i=1;i<components.length;i++)seen.add(components.slice(0,i).join('/'));
 }
 return [...seen].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}
export function projectTreeEntries(files){
 const names=Object.keys(files).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const shown=new Set(),entries=[];
 for(const name of names){
  const pieces=name.split('/');
  for(let i=1;i<pieces.length;i++){
   const path=pieces.slice(0,i).join('/');
   if(!shown.has(path)){shown.add(path);entries.push({type:'folder',path,depth:i-1});}
  }
  entries.push({type:'file',path:name,depth:pieces.length-1});
 }
 return entries;
}
export function moveProjectFolder(files,active,source,target){
 if(!safeFiles(files))throw Error('Project files are invalid.');
 if(typeof source!=='string'||typeof target!=='string'||!safeName(source)||!safeName(target))
  throw Error('Choose valid relative folder paths.');
 if(!projectFolders(files).includes(source))throw Error('Source folder does not exist.');
 if(target===source||target.startsWith(source+'/'))throw Error('Cannot move a folder into itself.');
 const result={},moved=[];
 for(const [name,text] of Object.entries(files)){
  const next=name.startsWith(source+'/')?target+name.slice(source.length):name;
  if(Object.hasOwn(result,next))throw Error('Folder move collides with another file.');
  result[next]=text;
  if(next!==name)moved.push({from:name,to:next});
 }
 if(!safeFiles(result)||moved.length===0)throw Error('Folder move would exceed project limits.');
 // A collision with a path later in the iteration is caught above because
 // resulting destination names are unique, regardless of iteration order.
 return {files:result,active:active.startsWith(source+'/')?target+active.slice(source.length):active,moved};
}
