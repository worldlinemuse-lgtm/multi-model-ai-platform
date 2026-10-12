// Explicit note-archive schema; exported notes can be reimported without turning JSON into an inert text note.
import {MAX_NOTES} from './core.js';
export const NOTES_FORMAT='mm-studio-notes-v1';
export function exportNoteArchive(notes){return JSON.stringify({format:NOTES_FORMAT,notes},null,2);}
export function parseNoteArchive(text){
 let value;try{value=JSON.parse(text);}catch{return null;}
 const legacy=Array.isArray(value)&&value.every(n=>n&&typeof n==='object'&&('content' in n||'title' in n));
 if(!legacy && (!value||value.format!==NOTES_FORMAT))return null;
 const notes=legacy?value:value.notes;
 if(!Array.isArray(notes)||notes.length>MAX_NOTES)throw Error('Note archive must contain at most '+MAX_NOTES+' notes');
 if(!notes.every(n=>n&&typeof n==='object'&&!Array.isArray(n)&&typeof n.title==='string'&&n.title.length<=150&&typeof n.content==='string'&&n.content.length<=100000&&typeof n.created==='string'&&n.created.length<=80&&typeof n.id==='string'&&n.id.length<=140))throw Error('Note archive has invalid record fields');
 return notes.map(n=>({title:n.title,content:n.content,created:n.created}));
}
