/* Independent tests of the real OpenTelemetry local-only pilot.
 * Does not change or work around any previously denied application/SDK source write.
 * All tests use synthetic operation names; no credentials, filenames or user data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalOtelPilot, WhitelistMemoryExporter} from '../otel-local-pilot.mjs';

const hasOnlySafeKeys = item => Object.keys(item).sort().join(',') ===
  'durationMs,op,outcome,parentSpanId,phases,reason,spanId,traceId';

test('real SDK: asynchronous boundaries preserve parent-child links only when parent handle supplied', async () => {
  const otel=createLocalOtelPilot();
  const root=otel.start('workshop.boot');
  await Promise.resolve();
  const child=otel.start('workshop.storage_check',root);
  await Promise.resolve();
  assert.equal(otel.finish(child,'warning','offline-unavailable'),true);
  assert.equal(otel.finish(root,'ok','none'),true);
  const events=otel.snapshot().events;
  assert.equal(events.length,2);
  assert.equal(events[0].parentSpanId,events[1].spanId);
  assert.equal(events[0].traceId,events[1].traceId);
  assert.equal(events[0].outcome,'warning');
  assert.ok(events.every(hasOnlySafeKeys));
  await otel.shutdown();
});

test('real SDK: shutdown explicitly closes unfinished descendants without fabricating success', async () => {
  const otel=createLocalOtelPilot();
  const parent=otel.start('workshop.snapshot');
  const child=otel.start('workshop.project_save',parent);
  await otel.shutdown();
  const s=otel.snapshot();
  assert.equal(s.active,0);
  assert.equal(s.recorded,2);
  assert.ok(s.events.every(x=>x.outcome==='unknown' && x.reason==='parent-closed'));
  assert.equal(otel.finish(parent,'ok','none'),false);
  assert.equal(otel.finish(child,'ok','none'),false);
});

test('real SDK: bounded retained events are exactly the most recent 160', async () => {
  const otel=createLocalOtelPilot();
  for(let i=0;i<367;i++){
    const h=otel.start('workshop.data_analyze');
    assert.ok(h);
    otel.finish(h,i%2===0?'ok':'error',i%2===0?'none':'invalid-input');
  }
  const report=otel.snapshot();
  assert.equal(report.recorded,160);
  assert.equal(report.discarded,207);
  assert.equal(report.active,0);
  assert.equal(report.events.filter(e=>e.outcome==='ok').length,80);
  await otel.shutdown();
});

test('real SDK: an explicit no-fetch policy does not depend on a network exporter', async () => {
  const original=globalThis.fetch;
  let attempts=0;
  globalThis.fetch=async()=>{attempts++;throw new Error('unexpected external request');};
  try {
    const otel=createLocalOtelPilot();
    for(let i=0;i<5;i++)otel.finish(otel.start('workshop.preview'),'error','unsupported');
    await otel.shutdown();
    assert.equal(attempts,0);
    assert.equal(otel.snapshot().recorded,5);
  } finally {
    if(original===undefined)delete globalThis.fetch;
    else globalThis.fetch=original;
  }
});

test('real exporter: arbitrary raw text in foreign and accepted spans is never copied into events', () => {
  const exporter=new WhitelistMemoryExporter();
  const marker='SENTINEL_SHOULD_NEVER_EXPORT';
  const forged={
    instrumentationScope:{name:'mm.workshop.local-pilot'},
    name:'workshop.preview',
    attributes:{'mm.outcome':marker,'mm.reason':marker,'url.full':marker,'exception.message':marker,'user.code':marker},
    duration:[0,123000000],
    parentSpanContext:{spanId:'e'.repeat(16)},
    spanContext:()=>({traceId:'c'.repeat(32),spanId:'d'.repeat(16)})
  };
  exporter.export([forged],()=>{});
  const exported=JSON.stringify(exporter.snapshot());
  assert.ok(!exported.includes(marker));
  assert.ok(!exported.includes('url.full'));
  assert.ok(!exported.includes('exception.message'));
  assert.ok(!exported.includes('user.code'));
  assert.equal(exporter.snapshot().events[0].outcome,'unknown');
  assert.ok(exporter.snapshot().events.every(hasOnlySafeKeys));
});
