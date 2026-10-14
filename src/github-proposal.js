/* Q28: offline GitHub change-proposal payload, NOT repository synchronization.
 * Never accesses accounts or calls GitHub; human controls all future writes.
 */
import {safeName} from './core.js';
export const GITHUB_PROPOSAL_FORMAT='mm-studio-github-proposal-v1';
export const MAX_PROPOSAL_TEXT=100000;
const safeSegment=s=>typeof s==='string'&&s.length>=1&&s.length<=100&&/^[A-Za-z0-9_.-]+$/.test(s)&&s!=='.'&&s!=='..'&&!s.startsWith('.');
export function parseGitHubRepo(text){
 if(typeof text!=='string'||text.length>205)throw Error('Enter an owner/repository name, not a URL');
 const parts=text.trim().split('/');
 if(parts.length!==2||!parts.every(safeSegment))throw Error('GitHub target must be a safe owner/repository name');
 return {owner:parts[0],repository:parts[1]};
}
export function createGitHubProposal({repository,path,content,claimedBaseCommit=''}){
 const {owner,repository:name}=parseGitHubRepo(repository);
 if(!safeName(path))throw Error('Unsafe proposed file path');
 if(typeof content!=='string'||content.length>MAX_PROPOSAL_TEXT)throw Error('Proposed text file exceeds 100000 characters');
 if(typeof claimedBaseCommit!=='string'||(claimedBaseCommit!==''&&!/^[a-f0-9]{40}$/.test(claimedBaseCommit)))throw Error('Base commit must be an optional full 40-character SHA-1');
 return {
  format:GITHUB_PROPOSAL_FORMAT,
  destination:{owner,repository:name,path},
  claimedBaseCommit:claimedBaseCommit||null,
  remoteStateVerified:false,
  writePerformed:false,
  approvalGranted:false,
  includesPlaintext:true,
  purpose:'human-review-only; must obtain current remote content and verify branch/permissions/conflicts before any proposed write',
  proposedContent:content
 };
}
export function validateGitHubProposal(proposal){
 if(!proposal||typeof proposal!=='object'||Array.isArray(proposal)||proposal.format!==GITHUB_PROPOSAL_FORMAT)return false;
 const keys=Object.keys(proposal).sort();
 const exact=['format','destination','claimedBaseCommit','remoteStateVerified','writePerformed','approvalGranted','includesPlaintext','purpose','proposedContent'].sort();
 if(keys.join('|')!==exact.join('|'))return false;
 try{
  const rebuilt=createGitHubProposal({repository:proposal.destination.owner+'/'+proposal.destination.repository,path:proposal.destination.path,content:proposal.proposedContent,claimedBaseCommit:proposal.claimedBaseCommit||''});
  return JSON.stringify(rebuilt)===JSON.stringify(proposal);
 }catch{return false;}
}
