import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpressionSession} from '../src/expression-repl.js';
test('Q16 persistent variables and precedence',()=>{const s=createExpressionSession();assert.equal(s.execute('let x = (2+3)*4'),20);assert.equal(s.execute('x / 2 + 1'),11);assert.equal(s.execute('-x'),-20);s.reset();assert.throws(()=>s.execute('x'),/Unknown variable/)});
test('Q16 parser rejects access to JS, function calls and filesystem',()=>{const s=createExpressionSession();for(const input of ['fetch("url")','globalThis','constructor.constructor','1;alert(1)','process.env','Math.random()'])assert.throws(()=>s.execute(input),/Unsupported|Unknown|Unexpected/)});
test('Q16 no network or evaluation and bounds',()=>{const s=createExpressionSession();assert.throws(()=>s.execute('1/0'),/finite/);assert.throws(()=>s.execute('x'.repeat(201)),/200/);assert.throws(()=>s.execute('x'.repeat(121)),/token|Unknown/);assert.equal(s.execute('1+2*3'),7)});
test('Q16 malformed input and reset',()=>{const s=createExpressionSession();for(const e of ['','1+','(1+2','1=2','2 3'])assert.throws(()=>s.execute(e));assert.equal(s.execute('a=1'),1);assert.equal(s.execute('clear'),'Session cleared');assert.throws(()=>s.execute('a'),/Unknown/)});
