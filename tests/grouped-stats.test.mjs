import test from 'node:test';
import assert from 'node:assert/strict';
import {groupNumericStats} from '../src/data-tools.js';
const parsed={columns:['team','points'],records:[{team:'A',points:'10'},{team:'A',points:''},{team:'B',points:'5'},{team:'B',points:'-2'}]};
test('Q15 skip-missing grouping calculates counts and mean',()=>assert.deepEqual(groupNumericStats(parsed,{groupColumn:'team',valueColumn:'points'}),[
 {label:'A',count:2,observed:1,missing:1,total:10,mean:10,min:10,max:10},
 {label:'B',count:2,observed:2,missing:0,total:3,mean:1.5,min:-2,max:5}]));
test('Q15 zero missing policy explicit',()=>{const x=groupNumericStats(parsed,{groupColumn:'team',valueColumn:'points',missingPolicy:'zero'});assert.equal(x[0].mean,5);assert.equal(x[0].missing,0)});
test('Q15 bad columns and policy fail',()=>{assert.throws(()=>groupNumericStats(parsed,{groupColumn:'missing',valueColumn:'points'}),/distinct/);assert.throws(()=>groupNumericStats(parsed,{groupColumn:'team',valueColumn:'points',missingPolicy:'bogus'}),/policy/)});
test('Q15 distinct key cap enforced',()=>{const p={columns:['group','value'],records:Array.from({length:51},(_,i)=>({group:'k'+i,value:i}))};assert.throws(()=>groupNumericStats(p,{groupColumn:'group',valueColumn:'value'}),/50/)});
test('Q15 detects numeric overflow',()=>{const p={columns:['g','v'],records:[{g:'A',v:1e308},{g:'A',v:1e308}]};assert.throws(()=>groupNumericStats(p,{groupColumn:'g',valueColumn:'v'}),/numeric range/)});
