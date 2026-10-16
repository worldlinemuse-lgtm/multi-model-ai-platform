/* Strict-CSP local-only OpenTelemetry SDK fixture. Test-only; no workshop import. */
import {createLocalOtelPilot} from './dist/otel-local-pilot.js';
import {createLocalOtelMetrics} from './dist/otel-local-metrics.js';
const result=document.getElementById('csp-result');
let violations=0;
document.addEventListener('securitypolicyviolation',()=>{violations++;result.textContent='FAIL';});
try {
  const traces=createLocalOtelPilot();
  const metrics=createLocalOtelMetrics();
  const operation='workshop.preview';
  const root=traces.start(operation);
  const meter=metrics.begin(operation);
  await Promise.resolve();
  const child=traces.start('workshop.project_save',root);
  const saved=metrics.begin('workshop.project_save');
  traces.finish(child,'error','storage-failed');
  metrics.finish(saved,'error');
  traces.finish(root,'ok','none');
  metrics.finish(meter,'ok');
  const traceSnapshot=traces.snapshot();
  const metricSnapshot=await metrics.collect();
  const ok=traceSnapshot.recorded===2&&traceSnapshot.active===0
     &&traceSnapshot.events[0].traceId===traceSnapshot.events[1].traceId
     &&metricSnapshot.collectionStatus==='observed'
     &&metricSnapshot.sdkInstrumentNames.includes('mm.workshop.operation.completed')
     &&metricSnapshot.sdkInstrumentNames.includes('mm.workshop.operation.duration')
     &&metricSnapshot.active===0&&violations===0;
  await traces.shutdown();await metrics.shutdown();
  result.textContent=ok?'PASS':'FAIL';
}catch {
  result.textContent='FAIL';
}
