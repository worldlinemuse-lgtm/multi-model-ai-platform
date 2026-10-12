/* Local Knowledge Library note operations. Never overwrite or dedupe notes implicitly. */
export function editLocalNote(notes,id,title,content,updated){
 if(!Array.isArray(notes)||typeof id!=='string'||!id)throw Error('Invalid note selection.');
 if(typeof title!=='string'||!title.trim()||title.length>150)throw Error('Title must contain 1–150 characters.');
 if(typeof content!=='string'||!content.trim()||content.length>100000)throw Error('Note content must contain 1–100,000 characters.');
 if(typeof updated!=='string'||updated.length>80)throw Error('Invalid edit timestamp.');
 let matched=0;
 const result=notes.map(note=>{
  if(note.id!==id)return note;
  matched++;
  return {...note,title:title.trim(),content,updated};
 });
 if(matched!==1)throw Error('Selected note no longer exists or is ambiguous.');
 return result;
}
export function findExactNoteDuplicates(notes){
 if(!Array.isArray(notes))throw Error('Invalid notes collection.');
 const byContent=new Map();
 for(const note of notes){
  if(!note||typeof note.content!=='string'||!note.content.trim())continue;
  // Only normalize line-ending differences and surrounding blank whitespace.
  // Case, punctuation and word boundaries remain significant.
  const key=note.content.replace(/\r\n?/g,'\n').trim();
  const group=byContent.get(key)||[];
  group.push({id:note.id,title:note.title,created:note.created});
  byContent.set(key,group);
 }
 return [...byContent.values()].filter(group=>group.length>1).map(group=>({count:group.length,notes:group}));
}
