/* Bounded, read-only, browser-local snapshot comparison.
 * No filesystem, network, mutation, or silent patch application.
 * Large inputs are explicitly omitted, never represented as a full diff.
 */
const MAX_CHARS = 60000;
const MAX_LINES = 500;
const MAX_CELLS = 200000;
const MAX_DIFF_CHARS = 16000;
const splitLines = text => text === '' ? [] : text.split('\n');
const omitted = reason => ({status: 'omitted', text: '[Line diff omitted: ' + reason + ']', added: null, removed: null});

export function lineDiff(before, after, options = {}) {
  if (typeof before !== 'string' || typeof after !== 'string') throw TypeError('Snapshot contents must be text.');
  if (before === after) return {status: 'identical', text: '', added: 0, removed: 0};
  const maxChars = options.maxChars ?? MAX_CHARS;
  const maxLines = options.maxLines ?? MAX_LINES;
  const maxCells = options.maxCells ?? MAX_CELLS;
  const maxOutput = options.maxOutput ?? MAX_DIFF_CHARS;
  if (before.length > maxChars || after.length > maxChars) return omitted('file exceeds ' + maxChars + ' characters');
  const a = splitLines(before), b = splitLines(after), n = a.length, m = b.length;
  if (n > maxLines || m > maxLines) return omitted('file exceeds ' + maxLines + ' lines');
  if ((n + 1) * (m + 1) > maxCells) return omitted('comparison exceeds ' + maxCells + ' matrix cells');
  const stride = m + 1, dp = new Uint16Array((n + 1) * stride);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    const pos = i * stride + j;
    dp[pos] = a[i] === b[j] ? 1 + dp[pos + stride + 1] : Math.max(dp[pos + stride], dp[pos + 1]);
  }
  const ops = []; let i = 0, j = 0, added = 0, removed = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { ops.push([' ', a[i]]); i++; j++; }
    else if (j < m && (i === n || dp[i * stride + j + 1] >= dp[(i + 1) * stride + j])) { ops.push(['+', b[j]]); j++; added++; }
    else { ops.push(['-', a[i]]); i++; removed++; }
  }
  const changes = [];
  for (let k = 0; k < ops.length; k++) if (ops[k][0] !== ' ') changes.push(k);
  const oldPrefix = [0], newPrefix = [0];
  for (const [kind] of ops) {
    oldPrefix.push(oldPrefix.at(-1) + (kind === '+' ? 0 : 1));
    newPrefix.push(newPrefix.at(-1) + (kind === '-' ? 0 : 1));
  }
  const intervals = [];
  for (const k of changes) {
    const start = Math.max(0, k - 2), end = Math.min(ops.length, k + 3);
    const last = intervals.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else intervals.push([start, end]);
  }
  const out = [];
  for (const [start, end] of intervals) {
    const oldCount = oldPrefix[end] - oldPrefix[start], newCount = newPrefix[end] - newPrefix[start];
    const oldStart = oldCount ? oldPrefix[start] + 1 : oldPrefix[start];
    const newStart = newCount ? newPrefix[start] + 1 : newPrefix[start];
    out.push('@@ -' + oldStart + ',' + oldCount + ' +' + newStart + ',' + newCount + ' @@');
    for (let k = start; k < end; k++) out.push(ops[k][0] + ops[k][1]);
  }
  const text = out.join('\n');
  if (text.length > maxOutput) return omitted('output exceeds ' + maxOutput + ' characters');
  return {status: 'ok', text, added, removed};
}

export function compareProjectFiles(snapshotFiles, currentFiles, options = {}) {
  if (!snapshotFiles || !currentFiles || typeof snapshotFiles !== 'object' || typeof currentFiles !== 'object') throw TypeError('Project files are required.');
  const names = [...new Set([...Object.keys(snapshotFiles), ...Object.keys(currentFiles)])].sort();
  const added = [], removed = [], changed = [], identical = [];
  for (const name of names) {
    if (!Object.hasOwn(snapshotFiles, name)) added.push(name);
    else if (!Object.hasOwn(currentFiles, name)) removed.push(name);
    else if (snapshotFiles[name] !== currentFiles[name]) changed.push(name);
    else identical.push(name);
  }
  const section = (heading, items) => heading + ' (' + items.length + ')' + (items.length ? '\n  ' + items.join('\n  ') : '');
  const summary = [section('Added since snapshot', added), section('Removed since snapshot', removed), section('Modified since snapshot', changed), section('Unchanged', identical)].join('\n\n');
  const totalCap = options.totalCap ?? 25000, fileCap = options.fileCap ?? 30;
  const details = ['Line-level differences (read-only; + current, - snapshot):'];
  let used = details[0].length, shown = 0, skipped = 0;
  for (const name of [...added, ...removed, ...changed].sort()) {
    if (shown >= fileCap) { skipped++; continue; }
    const oldText = Object.hasOwn(snapshotFiles, name) ? snapshotFiles[name] : '';
    const newText = Object.hasOwn(currentFiles, name) ? currentFiles[name] : '';
    const result = lineDiff(oldText, newText, options);
    const block = '--- snapshot/' + name + '\n+++ current/' + name + '\n' + result.text;
    if (used + block.length + 2 > totalCap) { skipped++; continue; }
    details.push(block); used += block.length + 2; shown++;
  }
  if (skipped) details.push('[Omitted ' + skipped + ' file diff(s) because the display is bounded. The summary above includes every file.]');
  if (!added.length && !removed.length && !changed.length) details.push('No line changes.');
  return {summary, details: details.join('\n\n'), counts: {added: added.length, removed: removed.length, changed: changed.length, identical: identical.length, omitted: skipped}};
}