import test from 'node:test';
import assert from 'node:assert/strict';
import {readKnowledgeDocument} from '../src/knowledge-documents.js';
test('Q06 PDF refused before reading bytes',async()=>await assert.rejects(readKnowledgeDocument({name:'report.pdf',size:100,arrayBuffer:async()=>{throw Error('must not read')}}),/PDF text extraction/));
test('Q06 unknown formats rejected',async()=>await assert.rejects(readKnowledgeDocument({name:'photo.png',size:100}),/Only DOCX/));
test('Q06 DOCX over 8MiB rejected before reading',async()=>await assert.rejects(readKnowledgeDocument({name:'large.docx',size:10_000_000}),/8 MB/));
test('Q06 invalid input rejected',async()=>await assert.rejects(readKnowledgeDocument(null),/Invalid local file/));
test('Q06 malformed DOCX rejected',async()=>await assert.rejects(readKnowledgeDocument({name:'bad.docx',size:3,arrayBuffer:async()=>Uint8Array.from([1,2,3]).buffer}),/not a ZIP/));
