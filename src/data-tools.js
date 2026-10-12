// Pure, bounded Data Lab operations. All work stays on the user's device.
export const MAX_SAVED_DATASETS=8;
export const MAX_SAVED_DATASET_CHARS=500000;
export const MAX_SAVED_DATASET_TOTAL_CHARS=2000000;

export function validateSavedDatasets(items){
 if(items===undefined)return true; // Older backups predate saved datasets.
 if(!Array.isArray(items)||items.length>MAX_SAVED_DATASETS)return false;
 const ids=new Set();
 let total=0;
 for(const item of items){
  if(!item||typeof item!=='object'||Array.isArray(item)||
     typeof item.id!=='string'||!item.id||item.id.length>140||
     typeof item.title!=='string'||!item.title.trim()||item.title.length>90||
     typeof item.created!=='string'||item.created.length>80||
     typeof item.content!=='string'||item.content.length>MAX_SAVED_DATASET_CHARS||
     ids.has(item.id))return false;
  ids.add(item.id);
  total+=item.content.length;
  if(total>MAX_SAVED_DATASET_TOTAL_CHARS)return false;
 }
 return true;
}
function numerical(value){
 if(value===null||value===undefined||typeof value==='boolean'||typeof value==='object')return null;
 if(typeof value==='string'&&value.trim()==='')return null;
 const number=Number(value);
 return Number.isFinite(number)?number:null;
}
function cell(row,column){return Object.hasOwn(row,column)?row[column]:null;}
function asText(value){if(value===null||value===undefined)return '';if(typeof value==='object')return JSON.stringify(value);return String(value);}
function compareCells(a,b){
 const na=numerical(a),nb=numerical(b);
 if(na===null&&asText(a).trim()==='')return nb===null&&asText(b).trim()===''?0:1;
 if(nb===null&&asText(b).trim()==='')return -1;
 if(na!==null&&nb!==null)return na-nb;
 return asText(a).localeCompare(asText(b),undefined,{numeric:true,sensitivity:'base'});
}
export const DATA_TRANSFORMS=Object.freeze(['filter-contains','filter-equals','filter-gt','filter-lt','sort-asc','sort-desc','dedupe']);
export function transformDataset(parsed,{operation,column='',value=''}={}){
 if(!parsed||!Array.isArray(parsed.columns)||!Array.isArray(parsed.records))throw Error('Analyze a dataset first.');
 if(!DATA_TRANSFORMS.includes(operation))throw Error('Choose an available transformation.');
 if(column&&!parsed.columns.includes(column))throw Error('Choose a column in this dataset.');
 if(operation!=='dedupe'&&!column)throw Error('Choose a column first.');
 const rows=parsed.records.slice(),input=String(value);
 let result;
 if(operation==='filter-contains'){
  result=rows.filter(row=>asText(cell(row,column)).toLocaleLowerCase().includes(input.toLocaleLowerCase()));
 }else if(operation==='filter-equals'){
  result=rows.filter(row=>asText(cell(row,column))===input);
 }else if(operation==='filter-gt'||operation==='filter-lt'){
  const threshold=numerical(input);
  if(threshold===null)throw Error('Numeric filters require a finite number.');
  result=rows.filter(row=>{const number=numerical(cell(row,column));return number!==null&&(operation==='filter-gt'?number>threshold:number<threshold);});
 }else if(operation==='sort-asc'||operation==='sort-desc'){
  result=rows.sort((a,b)=>{const cmp=compareCells(cell(a,column),cell(b,column));return operation==='sort-desc'?-cmp:cmp;});
 }else {
  const seen=new Set();
  result=rows.filter(row=>{const key=column?JSON.stringify(cell(row,column)):JSON.stringify(parsed.columns.map(name=>cell(row,name)));
   if(seen.has(key))return false;seen.add(key);return true;});
 }
 return {columns:parsed.columns.slice(),records:result};
}
export function serializeDataset(parsed){
 if(!parsed||!Array.isArray(parsed.records))throw Error('No dataset to export.');
 // JSON retains numeric and quoted-string distinctions (CSV rewriting would not).
 return JSON.stringify(parsed.records,null,2);
}
