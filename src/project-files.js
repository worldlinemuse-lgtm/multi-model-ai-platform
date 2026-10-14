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

/* Copy a virtual folder without touching disk and never overwrite existing file keys. */
export function copyProjectFolder(files,active,source,target){
 if(!safeFiles(files))throw Error('Project files are invalid.');
 if(typeof source!=='string'||typeof target!=='string'||!safeName(source)||!safeName(target))throw Error('Choose valid relative folder paths.');
 if(!projectFolders(files).includes(source))throw Error('Source folder does not exist.');
 if(source===target||target.startsWith(source+'/'))throw Error('Cannot copy a folder inside itself.');
 const selected=Object.entries(files).filter(([name])=>name.startsWith(source+'/'));
 if(!selected.length)throw Error('Folder has no files.');
 const additions={};const copied=[];
 for(const [name,value] of selected){
  const next=target+name.slice(source.length);
  if(Object.hasOwn(files,next)||Object.hasOwn(additions,next))throw Error('Folder copy collides with an existing file.');
  additions[next]=value;copied.push({from:name,to:next});
 }
 const result={...files,...additions};
 if(!safeFiles(result))throw Error('Folder copy exceeds workspace limits.');
 return {files:result,active,copied};
}
