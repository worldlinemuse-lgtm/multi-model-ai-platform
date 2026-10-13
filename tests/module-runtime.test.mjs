import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {moduleRunnerDocument,shouldRunAsModule} from '../src/module-runtime.js';
const files={
 'src/main.mjs':'import {sum} from "./math.js";\nconsole.log("RESULT",sum(2,3));',
 'src/math.js':'export const sum=(a,b)=>a+b;'
};
test('Q03 generated frame is opaque-origin CSP and no network',()=>{
 const html=moduleRunnerDocument(files,'src/main.mjs','nonce');
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/worker-src blob:/);
 assert.doesNotMatch(html,/allow-same-origin/);
 assert.match(html,/Module execution complete/);
 const script=html.match(/<script>([\s\S]+?)<\/script>/)?.[1];
 assert.ok(script);assert.doesNotThrow(()=>new vm.Script(script));
});
test('Q03 no script breakout from user module text',()=>{
 const html=moduleRunnerDocument({'main.mjs':'console.log("</script><script>bad</script>")'},'main.mjs','n');
 assert.equal((html.match(/<script>/g)||[]).length,1);
 assert.equal((html.match(/<\/script>/g)||[]).length,1);
});
test('Q03 reject missing module and root traversal before Worker launch',()=>{
 assert.throws(()=>moduleRunnerDocument({'main.mjs':'import "./missing.js"'},'main.mjs','n'),/Missing local module/);
 assert.throws(()=>moduleRunnerDocument({'main.mjs':'import "../secret.js"'},'main.mjs','n'),/escapes virtual project root/);
});
test('Q03 module detection does not alter classic JS default',()=>{
 assert.equal(shouldRunAsModule('console.log(1)','main.js'),false);
 assert.equal(shouldRunAsModule('import {x} from "./x.js"','main.js'),true);
 assert.equal(shouldRunAsModule('console.log(1)','main.mjs'),true);
});

test('Q03 reject comment-obfuscated dynamic imports before browser execution',()=>{
 assert.throws(()=>moduleRunnerDocument({'main.mjs':"const x=import/*concealed*/('blob:unsafe')"},'main.mjs','n'),/Dynamic import/);
 assert.throws(()=>moduleRunnerDocument({'main.mjs':"const x=import/*a*/ /*b*/('https://example.com')"},'main.mjs','n'),/Dynamic import/);
});