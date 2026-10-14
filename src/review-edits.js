/* Q04: human-approved virtual text edits. No network or automatic apply. */
import {safeFiles, safeName} from './core.js';
import {lineDiff} from './snapshot-diff.js';
const pending = new WeakMap(), undo = new WeakMap();
const own = (obj, key) => Object.hasOwn(obj, key);
const copy = files => Object.freeze({...files});
const sameFiles = (a, b) => {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
  const names = Object.keys(a), expected = Object.keys(b);
  return names.length === expected.length && expected.every(name => own(a, name) && a[name] === b[name]);
};
const checkProtected = (path, protectedPaths) => {
  if (!Array.isArray(protectedPaths) || !protectedPaths.every(safeName)) throw TypeError('Protected paths must be a valid path array.');
  if (protectedPaths.includes(path)) throw Error('Protected virtual file cannot be changed.');
};
export function prepareTextEdit(files, path, replacement, {protectedPaths = []} = {}) {
  if (!safeFiles(files)) throw Error('Invalid virtual project.');
  if (!safeName(path) || !own(files, path)) throw Error('Edit requires an existing safe virtual file.');
  checkProtected(path, protectedPaths);
  if (typeof replacement !== 'string') throw TypeError('Replacement must be text.');
  if (files[path] === replacement) throw Error('No change to review.');
  const before = copy(files), after = copy({...files, [path]: replacement});
  if (!safeFiles(after)) throw Error('Proposed edit exceeds project limits.');
  const diff = lineDiff(before[path], replacement);
  if (diff.status !== 'ok') throw Error('Edit preview cannot be shown within safe bounds: ' + diff.text);
  const proposal = Object.freeze({path, preview: diff.text, added: diff.added, removed: diff.removed});
  pending.set(proposal, {before, after, protectedPaths: Object.freeze([...protectedPaths])});
  return proposal;
}
export function applyTextEdit(files, proposal, {confirmed = false, protectedPaths = []} = {}) {
  if (confirmed !== true) throw Error('Explicit human confirmation is required.');
  const state = pending.get(proposal);
  if (!state) throw Error('Unknown or expired edit proposal.');
  checkProtected(proposal.path, [...state.protectedPaths, ...protectedPaths]);
  if (!safeFiles(files) || !sameFiles(files, state.before)) throw Error('Project changed since proposal; review again.');
  const after = {...state.after};
  if (!safeFiles(after)) throw Error('Proposed project no longer validates.');
  pending.delete(proposal);
  const rollback = Object.freeze({path: proposal.path});
  undo.set(rollback, {before: state.before, after: state.after});
  return {files: after, rollback};
}
export function rollbackTextEdit(files, rollback, {confirmed = false, protectedPaths = []} = {}) {
  if (confirmed !== true) throw Error('Explicit rollback confirmation is required.');
  const state = undo.get(rollback);
  if (!state) throw Error('Unknown or expired rollback token.');
  checkProtected(rollback.path, protectedPaths);
  if (!safeFiles(files) || !sameFiles(files, state.after)) throw Error('Project changed since apply; do not overwrite newer work.');
  const restored = {...state.before};
  if (!safeFiles(restored)) throw Error('Rollback project is invalid.');
  undo.delete(rollback);
  return {files: restored};
}
