/* Q24: deterministic bounded page views over already-local Knowledge search results.
 * No network requests, embeddings or hidden deletion of matches.
 */
export const KNOWLEDGE_PAGE_SIZE=20;
export function knowledgePage(results,page=0,{pageSize=KNOWLEDGE_PAGE_SIZE}={}){
 if(!Array.isArray(results))throw TypeError('Knowledge matches must be an array.');
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100)throw Error('Invalid knowledge page size.');
 if(!Number.isSafeInteger(page)||page<0)throw Error('Invalid knowledge page index.');
 const total=results.length,pages=Math.max(1,Math.ceil(total/pageSize));
 const current=Math.min(page,pages-1),from=current*pageSize;
 return {items:results.slice(from,from+pageSize),page:current,pages,total,from:total?from+1:0,to:Math.min(total,from+pageSize)};
}
