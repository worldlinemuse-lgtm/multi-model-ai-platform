import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalOtelPilot,WhitelistMemoryExporter} from '../otel-local-pilot.mjs';

test('actual SDK uses manual provider and exports completed spans to sanitized local buffer',async()=>{
 const api=createLocalOtelPilot();const parent=api.start('workshop.preview');const child=api.start('workshop.project_save',parent);
 assert.equal(api.finish(child,'error','storage-failed'),true);
 assert.equal(api.finish(parent),true);
 assert.equal(api.finish(parent),false);
 const s=api.snapshot();assert.equal(s.active,0);assert.equal(s.recorded,2);
 assert.equal(s.events[0].parentSpanId,s.events[1].spanId);
 assert.equal(s.events[0].traceId,s.events[1].traceId);
 assert.equal(s.events[0].reason,'storage-failed');
 await api.shutdown();
});

test('invalid strings and unknown parent rejected without exporting',async()=>{
 const api=createLocalOtelPilot();
 assert.throws(()=>api.start('workshop.secret-key'),/Invalid operation/);
 assert.throws(()=>api.start('workshop.preview',{}),/Unknown active parent/);
 const token=api.start('workshop.preview');
 assert.throws(()=>api.finish(token,'ok','https://example.com/secret'),/Invalid reason/);
 assert.equal(api.finish(token),true);assert.equal(api.snapshot().recorded,1);
 await api.shutdown();
});

test('a parent closes all children with non-success and leaves no active spans',async()=>{
 const api=createLocalOtelPilot();const p=api.start('workshop.boot');const c=api.start('workshop.project_save',p);
 api.finish(p,'timeout','time-limit');
 const s=api.snapshot();assert.equal(s.active,0);assert.equal(s.recorded,2);
 assert.equal(s.events[0].outcome,'unknown');assert.equal(s.events[0].reason,'parent-closed');
 assert.equal(s.events[1].outcome,'timeout');
 assert.equal(api.finish(c),false);await api.shutdown();
});

test('bounded local buffer, no network instrumentation and shutdown rejects new roots',async()=>{
 const api=createLocalOtelPilot();for(let i=0;i<180;i++){api.finish(api.start('workshop.snapshot'));}
 const s=api.snapshot();assert.equal(s.recorded,160);assert.equal(s.discarded,20);
 assert.ok(s.events.every(x=>Object.keys(x).sort().join(',')==='durationMs,op,outcome,parentSpanId,phases,reason,spanId,traceId'));
 await api.shutdown();assert.throws(()=>api.start('workshop.snapshot'),/shut down/);
});

test('too many active operations are dropped with a bounded counter',async()=>{
 const api=createLocalOtelPilot();const handles=Array.from({length:20},()=>api.start('workshop.code_run'));
 assert.equal(api.start('workshop.code_run'),null);assert.equal(api.snapshot().discardedStarts,1);
 handles.forEach(h=>api.finish(h));await api.shutdown();
});

test('exporter sanitizes unknown fields even from a forged foreign span',()=>{
 const sink=new WhitelistMemoryExporter();
 sink.export([{instrumentationScope:{name:'other'},name:'workshop.preview',attributes:{secret:'XXX'}}],()=>{});
 assert.equal(sink.snapshot().recorded,0);
 let response;
 sink.export([{instrumentationScope:{name:'mm.workshop.local-pilot'},name:'workshop.preview',attributes:{'mm.outcome':'XXX','mm.reason':'https://evil','secret':'XXX'},duration:[0,1000000],spanContext:()=>({traceId:'0'.repeat(32),spanId:'1'.repeat(16)})}],x=>response=x);
 assert.equal(response.code,0);
 const entry=sink.snapshot().events[0];assert.equal(entry.outcome,'unknown');assert.equal(entry.reason,'unobserved');
 assert.ok(!JSON.stringify(entry).includes('XXX'));assert.ok(!JSON.stringify(entry).includes('evil'));
});
