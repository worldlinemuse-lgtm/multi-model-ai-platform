import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkshopMetrics} from '../src/request-trace.js';
import {attachOtel,otelDiagnosticsText} from '../src/otel-workshop.js';
import {createLocalOtelPilot} from '../observability/otel-local-pilot.mjs';
import {createLocalOtelMetrics} from '../observability/otel-local-metrics.mjs';

const bridge = () => ({pilot: createLocalOtelPilot(), metrics: createLocalOtelMetrics()});

test('null bridge returns the base object untouched', () => {
  const base = createWorkshopMetrics({clock: () => 0});
  assert.equal(attachOtel(base, null), base);
});

test('begin/finish mirror to real OTel spans and metrics', () => {
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), bridge());
  const t = m.begin('save');
  assert.ok(t);
  assert.equal(m.finish(t, 'ok', 'none'), true);
  const snap = m.otelSnapshot();
  assert.equal(snap.recorded, 1);
  assert.equal(snap.events[0].op, 'workshop.project_save');
  assert.equal(snap.events[0].outcome, 'ok');
  assert.equal(snap.events[0].reason, 'none');
});

test('app reasons map to the OTel reason dictionary', () => {
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), bridge());
  const t = m.begin('code-run');
  m.finish(t, 'error', 'runtime-error');
  const snap = m.otelSnapshot();
  assert.equal(snap.events[0].reason, 'runtime-failed');
  const t2 = m.begin('code-run');
  m.finish(t2, 'error', 'storage-error');
  assert.equal(m.otelSnapshot().events[1].reason, 'storage-failed');
});

test('unmapped operations are not mirrored but still recorded locally', () => {
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), bridge());
  const t = m.begin('ui-error');
  m.record('ui-error', 'error', 'uncaught-error');
  m.finish(t, 'error', 'uncaught-error');
  assert.equal(m.otelSnapshot().recorded, 0);
  assert.ok(m.summary().recorded >= 2);
});

test('invalid operations still throw exactly as before', () => {
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), bridge());
  assert.throws(() => m.begin('https://example.com/?key=SECRET'), TypeError);
  assert.throws(() => m.begin('my private filename'), TypeError);
});

test('OTel mirror faults never break workshop behavior', () => {
  const badBridge = {
    pilot: {start() { throw Error('boom'); }, finish() { throw Error('boom'); }, snapshot() { throw Error('boom'); }},
    metrics: {begin() { throw Error('boom'); }, finish() { throw Error('boom'); }, record() { throw Error('boom'); }, summary() { throw Error('boom'); }},
  };
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), badBridge);
  const t = m.begin('save');
  assert.equal(m.finish(t, 'ok'), true);
  assert.equal(m.summary().byOperation.find(o => o.op === 'save').total, 1);
});

test('otelDiagnosticsText reports real SDK state', async () => {
  const b = bridge();
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), b);
  const t = m.begin('boot');
  m.finish(t, 'ok');
  const text = await otelDiagnosticsText(b);
  assert.match(text, /workshop\.boot/);
  assert.match(text, /1 recorded/);
});

test('otelDiagnosticsText degrades gracefully without a bridge', async () => {
  const text = await otelDiagnosticsText(null);
  assert.match(text, /not loaded/);
});

test('new snapshot and data-analyze operations are accepted', () => {
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), bridge());
  const s = m.begin('snapshot');
  m.finish(s, 'ok');
  const d = m.begin('data-analyze');
  m.finish(d, 'ok');
  const snap = m.otelSnapshot();
  assert.deepEqual(snap.events.map(e => e.op), ['workshop.snapshot', 'workshop.data_analyze']);
});
