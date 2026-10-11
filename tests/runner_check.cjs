const fs=require('fs'), vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const start=source.indexOf('  const jsRunner = code => {'),end=source.indexOf("  window.addEventListener('message'",start);
assert(start>=0&&end>start);
const runner=new Function(source.slice(start,end)+'\nreturn jsRunner;')();
async function run(code) {
 const html=runner(code), script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]; assert(script,'script found');
 new Function(script); const messages=[];
 const context={parent:{postMessage:(data)=>messages.push(data)},window:{addEventListener(){}}};
 await vm.runInNewContext(script,context,{timeout:1000});
 await new Promise(resolve=>setImmediate(resolve));
 return {html,messages};
}
(async()=>{
 let r=await run('console.log("result", 4 + 4)');
 assert(r.messages.some(m=>m.type==='log'&&m.message==='result 8'));
 assert(r.messages.some(m=>m.type==='done'));
 r=await run('throw new Error("expected")');
 assert(r.messages.some(m=>m.type==='error'&&m.message.includes('expected')));
 r=await run('console.log("</script><script>BAD</script>")');
 assert(!r.html.includes('</script><script>BAD</script>'),'payload cannot break script boundary');
 console.log('PASS: generated runner parses, executes, captures output/errors, and escapes markup');
})().catch(e=>{console.error(e);process.exitCode=1});
