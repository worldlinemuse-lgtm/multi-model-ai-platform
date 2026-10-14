import {extractDocxText,docxTextLimits} from './docx-text.js';
/* Returns plain text only. The UI must use textContent, not innerHTML. */
export async function readKnowledgeDocument(file){
  if(!file||typeof file.name!=='string'||!Number.isFinite(file.size))throw Error('Invalid local file');
  const lower=file.name.toLowerCase();
  if(lower.endsWith('.pdf'))throw Error('PDF text extraction is not available in this build; no text was imported.');
  if(!lower.endsWith('.docx'))throw Error('Only DOCX files are supported by this document extractor.');
  if(file.size>docxTextLimits.archiveBytes)throw Error('DOCX exceeds the 8 MB local import limit');
  const text=await extractDocxText(await file.arrayBuffer(),{outputCharacters:100000});
  if(!text.trim())throw Error('DOCX contains no readable main-body text');
  return {text,format:'docx-main-body',title:file.name.slice(0,100)};
}
