import test from 'node:test';
import assert from 'node:assert/strict';
import {GITHUB_PROPOSAL_FORMAT,parseGitHubRepo,createGitHubProposal,validateGitHubProposal} from '../src/github-proposal.js';
test('Q28 explicit human-review-only text proposal is bounded and not a GitHub write',()=>{
 const v=createGitHubProposal({repository:'worldlinemuse-lgtm/multi-model-ai-platform',path:'src/demo.js',content:'console.log("safe")'});
 assert.equal(v.format,GITHUB_PROPOSAL_FORMAT);assert.equal(v.writePerformed,false);assert.equal(v.remoteStateVerified,false);
 assert.equal(v.approvalGranted,false);assert.equal(v.claimedBaseCommit,null);assert.equal(v.proposedContent,'console.log("safe")');
 assert.equal(validateGitHubProposal(v),true);
});
test('Q28 user-supplied SHA is never represented as verified',()=>{
 const sha='a'.repeat(40);const v=createGitHubProposal({repository:'worldlinemuse-lgtm/multi-model-ai-platform',path:'README.md',content:'test',claimedBaseCommit:sha});
 assert.equal(v.claimedBaseCommit,sha);assert.equal(v.remoteStateVerified,false);
});
test('Q28 reject GitHub URLs, path traversal and invalid SHA',()=>{
 assert.throws(()=>parseGitHubRepo('https://github.com/owner/repo'),/safe owner/);
 assert.throws(()=>createGitHubProposal({repository:'owner/repo',path:'../secret.env',content:'no'}),/Unsafe/);
 assert.throws(()=>createGitHubProposal({repository:'owner/repo',path:'file.txt',content:'x',claimedBaseCommit:'abc123'}),/Base commit/);
});
test('Q28 guard excessive size, unsafe extra props, fake approval and fake verified remote',()=>{
 assert.throws(()=>createGitHubProposal({repository:'owner/repo',path:'file.txt',content:'x'.repeat(100001)}),/100000/);
 const q=createGitHubProposal({repository:'owner/repo',path:'file.txt',content:'new'});
 assert.equal(validateGitHubProposal({...q,writePerformed:true}),false);
 assert.equal(validateGitHubProposal({...q,remoteStateVerified:true}),false);
 assert.equal(validateGitHubProposal({...q,accessToken:'do not allow secret fields'}),false);
});
