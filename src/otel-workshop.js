/* OpenTelemetry workshop bridge.
 *
 * Wires the real OTel SDK pilot bundles (observability/dist/) into the
 * workshop's existing metrics surface without changing any call site.
 * main.js wraps its workshopMetrics object with attachOtel(); every
 * begin/finish/record then mirrors to the real SDK automatically.
 *
 * Safety properties (all load-bearing):
 * - Dynamic import with timeout: a missing, corrupt, or unreachable bundle
 *   disables OTel silently. The workshop runs exactly as before.
 * - Fixed dictionaries only: only pre-approved operation/outcome/reason
 *   labels ever reach the SDK. Never user content, filenames, or errors.
 * - Local-only: the pilot uses memory exporters. No network, no global
 *   tracer provider, no auto-instrumentation.
 * - OTel failures never propagate: every mirror call is guarded so a
 *   telemetry fault cannot break workshop behavior.
 */

// App operation -> OTel operation. Unmapped ops (e.g. ui-error) are not mirrored.
const OTEL_OPS = Object.freeze({
  'boot': 'workshop.boot',
  'code-run': 'workshop.code_run',
  'save': 'workshop.project_save',
  'preview': 'workshop.preview',
  'snapshot': 'workshop.snapshot',
  'project-import': 'workshop.project_import',
  'project-export': 'workshop.project_export',
  'data-analyze': 'workshop.data_analyze',
  'offline-refresh': 'workshop.offline_refresh',
  'storage-check': 'workshop.storage_check',
});
// App reason -> OTel reason (pilot REASONS dictionary). Unknown -> 'unobserved'.
const OTEL_REASONS = Object.freeze({
  'none': 'none',
  'runtime-error': 'runtime-failed',
  'uncaught-error': 'runtime-failed',
  'unhandled-rejection': 'runtime-failed',
  'user-stop': 'user-stop',
  'time-limit': 'time-limit',
  'output-limit': 'resource-limit',
  'storage-error': 'storage-failed',
  'invalid-input': 'invalid-input',
  'unsupported-asset': 'unsupported',
  'worker-error': 'worker-failed',
  'offline-unavailable': 'offline-unavailable',
  'unknown': 'unobserved',
});
const OTEL_OUTCOMES = new Set(['ok', 'error', 'timeout', 'cancelled', 'warning', 'unknown']);
const INIT_TIMEOUT_MS = 5000;

/** Load the OTel bundles and create one tracing pilot + one metrics provider.
 *  Returns {pilot, metrics} or null when the SDK is unavailable. Never throws. */
export async function initOtelBridge() {
  try {
    const load = Promise.all([
      import('../observability/dist/otel-local-pilot.js'),
      import('../observability/dist/otel-local-metrics.js'),
    ]);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('otel-init-timeout')), INIT_TIMEOUT_MS));
    const [traceMod, metricsMod] = await Promise.race([load, timeout]);
    const pilot = traceMod.createLocalOtelPilot();
    const metrics = metricsMod.createLocalOtelMetrics();
    return { pilot, metrics };
  } catch {
    return null;
  }
}

/** Wrap a workshopMetrics-compatible object so begin/finish/record also
 *  mirror to the real OTel SDK. All other methods delegate unchanged.
 *  When bridge is null, returns the base object untouched. */
export function attachOtel(base, bridge) {
  if (!bridge || !bridge.pilot || !bridge.metrics) return base;
  const { pilot, metrics } = bridge;
  const active = new Map(); // base token -> {traceToken, metricsToken}
  const mapOutcome = outcome => (OTEL_OUTCOMES.has(outcome) ? outcome : 'unknown');
  const mapReason = reason => OTEL_REASONS[reason] || 'unobserved';

  function begin(op) {
    const token = base.begin(op); // throws on invalid op, exactly as before
    const otelOp = OTEL_OPS[op];
    if (token && otelOp) {
      try {
        active.set(token, {
          traceToken: pilot.start(otelOp), // may be null under backpressure
          metricsToken: metrics.begin(otelOp),
        });
      } catch {
        active.delete(token);
      }
    }
    return token;
  }
  function finish(token, outcome = 'ok', reason = 'none') {
    const mirror = token ? active.get(token) : undefined;
    if (mirror) {
      active.delete(token);
      const o = mapOutcome(outcome), r = mapReason(reason);
      try {
        if (mirror.traceToken) pilot.finish(mirror.traceToken, o, r);
      } catch { /* telemetry must never break the app */ }
      try {
        if (mirror.metricsToken) metrics.finish(mirror.metricsToken, o);
      } catch { /* telemetry must never break the app */ }
    }
    return base.finish(token, outcome, reason);
  }
  function record(op, outcome = 'warning', reason = 'unknown') {
    const otelOp = OTEL_OPS[op];
    if (otelOp) {
      try {
        metrics.record(otelOp, mapOutcome(outcome));
      } catch { /* telemetry must never break the app */ }
    }
    return base.record(op, outcome, reason);
  }
  return Object.freeze({
    begin,
    finish,
    record,
    setEnabled: (...args) => base.setEnabled(...args),
    reset: (...args) => {
      active.clear();
      return base.reset(...args);
    },
    summary: (...args) => base.summary(...args),
    exportReport: (...args) => base.exportReport(...args),
    otelActive: true,
    otelSnapshot() {
      try {
        return pilot.snapshot();
      } catch {
        return null;
      }
    },
    async otelCollect() {
      try {
        return await metrics.collect();
      } catch {
        return null;
      }
    },
  });
}

/** Render real SDK state as plain text for the diagnostics panel. Never throws. */
export async function otelDiagnosticsText(bridge) {
  if (!bridge || !bridge.pilot || !bridge.metrics) {
    return 'OpenTelemetry SDK: not loaded (bundle missing or failed to initialize). Workshop counters above are unaffected.';
  }
  const lines = [];
  try {
    const snap = bridge.pilot.snapshot();
    lines.push(
      `OpenTelemetry traces (local-only, in-memory): ${snap.recorded} recorded, ` +
      `${snap.discarded} discarded, ${snap.active} active`
    );
    for (const e of snap.events.slice(-8).reverse()) {
      lines.push(
        `  ${e.op} · ${e.outcome} · ${e.reason} · ` +
        `${e.durationMs === null ? 'duration n/a' : e.durationMs + 'ms'}` +
        `${e.parentSpanId ? ' · child of ' + String(e.parentSpanId).slice(0, 8) : ''}`
      );
    }
    if (!snap.events.length) lines.push('  no spans recorded yet');
  } catch {
    lines.push('Trace snapshot unavailable.');
  }
  try {
    const report = await bridge.metrics.collect();
    const rows = (report.byOperation || []).filter(o => o.total > 0);
    lines.push(
      `OpenTelemetry metrics: collection ${report.collectionStatus || 'unknown'}` +
      `${report.rejectedStarts ? `, ${report.rejectedStarts} rejected starts (backpressure)` : ''}`
    );
    for (const o of rows) {
      lines.push(
        `  ${o.operation}: ${o.total} total / ${o.ok} ok / ${o.errors} error / ` +
        `${o.timeouts} timeout / ${o.cancelled} cancelled`
      );
    }
    if (!rows.length) lines.push('  no operations recorded yet');
  } catch {
    lines.push('Metrics collection unavailable.');
  }
  return lines.join('\n');
}
