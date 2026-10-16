import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createWorkshopMetrics} from '../src/request-trace.js';
import {attachOtel} from '../src/otel-workshop.js';
import {createLocalOtelPilot} from '../observability/otel-local-pilot.mjs';
import {createLocalOtelMetrics} from '../observability/otel-local-metrics.mjs';

/* Security: the OTel integration must never transmit anything, anywhere,
 * and must never retain user content. These tests pin those properties. */

const NETWORK_PATTERNS = [
  /fetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/,
  /EventSource/, /navigator\.onLine/, /OTLP/i,
];

function checkNoNetwork(path) {
  assert.ok(existsSync(path), 'missing file: ' + path);
  let src = readFileSync(path, 'utf8');
  src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  for (const p of NETWORK_PATTERNS) {
    assert.ok(!p.test(src), `${path} contains network pattern ${p}`);
  }
}

test('pilot and metrics sources contain no network or OTLP code', () => {
  checkNoNetwork(new URL('../observability/otel-local-pilot.mjs', import.meta.url));
  checkNoNetwork(new URL('../observability/otel-local-metrics.mjs', import.meta.url));
});

test('built browser bundles contain no network or OTLP code', () => {
  checkNoNetwork(new URL('../observability/dist/otel-local-pilot.js', import.meta.url));
  checkNoNetwork(new URL('../observability/dist/otel-local-metrics.js', import.meta.url));
});

test('bridge source contains no network code', () => {
  checkNoNetwork(new URL('../src/otel-workshop.js', import.meta.url));
});

test('trace snapshots contain only fixed fields, never user content', () => {
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), {
    state: 'ready', bridge: {pilot: createLocalOtelPilot(), metrics: createLocalOtelMetrics()},
  });
  const t = m.begin('save');
  m.finish(t, 'error', 'storage-error');
  const snap = m.otelSnapshot();
  const allowedKeys = new Set(['op', 'outcome', 'reason', 'durationMs', 'traceId', 'spanId', 'parentSpanId', 'phases']);
  for (const e of snap.events) {
    for (const k of Object.keys(e)) assert.ok(allowedKeys.has(k), 'unexpected field in trace event: ' + k);
    assert.match(e.op, /^workshop\.[a-z_]+$/);
    assert.ok(/^[0-9a-f]{32}$/.test(e.traceId) || e.traceId === null);
  }
  const text = JSON.stringify(snap);
  assert.ok(!text.includes('secret') && !text.includes('BEGIN'));
});

test('metrics reports contain only fixed operation/outcome labels', async () => {
  const bridge = {pilot: createLocalOtelPilot(), metrics: createLocalOtelMetrics()};
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), {state: 'ready', bridge});
  const t = m.begin('code-run');
  m.finish(t, 'timeout', 'time-limit');
  const report = await m.otelCollect();
  const text = JSON.stringify(report);
  assert.ok(!/\.js|\.py|https?:|Bearer|sk-/i.test(text), 'suspicious content in metrics report');
  const row = report.byOperation.find(o => o.operation === 'workshop.code_run');
  assert.equal(row.timeouts, 1);
});

test('invalid labels throw before reaching either SDK', () => {
  const bridge = {pilot: createLocalOtelPilot(), metrics: createLocalOtelMetrics()};
  const m = attachOtel(createWorkshopMetrics({clock: () => 0}), {state: 'ready', bridge});
  for (const bad of ['../../../etc/passwd', 'workshop.save; DROP TABLE', '', 'CODE-RUN']) {
    assert.throws(() => m.begin(bad), TypeError);
  }
  assert.equal(m.otelSnapshot().recorded, 0);
  assert.equal(m.summary().recorded, 0);
});
