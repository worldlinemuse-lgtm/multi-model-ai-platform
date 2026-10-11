(() => {
  'use strict';
  const PROVIDERS = Object.freeze([
    { name: 'GroqCloud', window: 'Minute / day', summary: 'Free-tier request and token limits vary by model and organization. Verify live limits in your console.', keys: 'https://console.groq.com/keys', docs: 'https://console.groq.com/docs/rate-limits' },
    { name: 'OpenRouter Free', window: 'Minute / day', summary: 'Selected :free models use an account-scoped daily and per-minute allowance; published limits may change.', keys: 'https://openrouter.ai/settings/keys', docs: 'https://openrouter.ai/pricing' },
    { name: 'Google Gemini API', window: 'Minute / day', summary: 'Only eligible free-tier models; model/project-specific limits and Pacific-time daily reset.', keys: 'https://aistudio.google.com/api-keys', docs: 'https://ai.google.dev/gemini-api/docs/rate-limits' },
    { name: 'Cloudflare Workers AI', window: 'Daily', summary: 'Free Workers plan includes a recurring daily Neurons allowance; model eligibility differs.', keys: 'https://dash.cloudflare.com/', docs: 'https://developers.cloudflare.com/workers-ai/platform/pricing/' },
    { name: 'Mistral Studio Free', window: 'Recurring rate windows', summary: 'Free mode has recurring limits; check account-specific eligibility and current usage.', keys: 'https://console.mistral.ai/', docs: 'https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key' },
    { name: 'Ollama Cloud Free', window: 'Monthly', summary: 'Included starter-model usage on the free plan; available models and reset follow account rules.', keys: 'https://ollama.com/settings/keys', docs: 'https://ollama.com/pricing' },
    { name: 'Hugging Face Inference Providers', window: 'Monthly', summary: 'Small monthly included routed-inference credits on eligible free accounts; check your billing view.', keys: 'https://huggingface.co/settings/tokens', docs: 'https://huggingface.co/docs/inference-providers/pricing' },
    { name: 'Aion Labs', window: 'Minute / day', summary: 'Published recurring free rate and token ceilings; confirm current plan and reset schedule.', keys: 'https://www.aionlabs.ai/accounts/signup/', docs: 'https://www.aionlabs.ai/docs/rate-limits/' }
  ]);
  const KEY = 'mm-platform-browser-b01';
  const starter = { active: 'main.js', files: {
    'main.js': '// JavaScript runs inside an isolated, time-limited browser frame.\nconst greeting = "Hello from your AI development workspace";\nconsole.log(greeting);\nconsole.log("2 + 2 =", 2 + 2);',
    'index.html': '<h1>Hello, builder!</h1>\n<p>This preview is isolated from the main application.</p>\n<button onclick="document.getElementById(\'demo\').textContent = \'It works!\'">Test interaction</button>\n<p id="demo"></p>',
    'style.css': 'body { font: 16px system-ui; padding: 24px; color: #202a45; }\nh1 { color: #4865ba; }\nbutton { padding: 8px 14px; }'
  }};
  const byId = id => document.getElementById(id);
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const safeFiles = files => files && typeof files === 'object' && !Array.isArray(files) && Object.keys(files).length > 0 && Object.keys(files).length <= 100 && Object.entries(files).every(([name, content]) => /^[-\w.\/ ]{1,100}$/.test(name) && !name.includes('..') && typeof content === 'string' && content.length <= 500000);
  function load() { try { const value = JSON.parse(localStorage.getItem(KEY)); if (value && safeFiles(value.files) && typeof value.active === 'string' && Object.hasOwn(value.files, value.active)) return value; } catch {} return clone(starter); }
  let project = load(), runFrame = null, runTimer = null, activeRun = null;
  const editor = byId('editor');
  function show(view) {
    for (const button of document.querySelectorAll('[data-view]')) { const on = button.dataset.view === view; button.classList.toggle('active', on); if (on) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); }
    for (const panel of document.querySelectorAll('.view')) { const on = panel.id === `view-${view}`; panel.hidden = !on; panel.classList.toggle('active', on); }
    byId('page-title').textContent = ({ overview: 'Overview', workspace: 'Code workspace', providers: 'Free API directory', about: 'Build status' })[view] || 'Overview';
  }
  document.querySelectorAll('[data-view], [data-goto]').forEach(el => el.addEventListener('click', () => show(el.dataset.view || el.dataset.goto)));
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(project)); byId('save-status').textContent = 'Saved locally'; } catch { byId('save-status').textContent = 'Storage unavailable — export your work'; } }
  function drawFiles() {
    const list = byId('file-list'); list.replaceChildren();
    for (const name of Object.keys(project.files).sort()) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'file-entry' + (name === project.active ? ' active' : ''); button.textContent = '▤ ' + name; button.dataset.filename = name; button.setAttribute('role', 'listitem'); button.addEventListener('click', () => select(name)); list.append(button);
    }
    byId('active-file-label').textContent = project.active; editor.value = project.files[project.active] ?? '';
  }
  function select(name) { if (!Object.hasOwn(project.files, name)) return; project.active = name; drawFiles(); persist(); }
  editor.addEventListener('input', () => { project.files[project.active] = editor.value; persist(); });
  editor.addEventListener('keydown', event => { if (event.key === 'Tab') { event.preventDefault(); const a = editor.selectionStart, b = editor.selectionEnd; editor.setRangeText('  ', a, b, 'end'); editor.dispatchEvent(new Event('input')); } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); runJS(); } });
  const nameValid = name => /^[\w.-][\w.\-/ ]{0,99}$/.test(name) && !name.includes('..');
  byId('new-file').addEventListener('click', () => { const name = prompt('New file name (for example utils.js):'); if (name == null) return; if (!nameValid(name) || Object.hasOwn(project.files, name)) { alert('Use a unique, simple file name.'); return; } if (Object.keys(project.files).length >= 100) { alert('Maximum 100 files.'); return; } project.files[name] = ''; select(name); editor.focus(); });
  byId('rename-file').addEventListener('click', () => { const name = prompt('Rename file:', project.active); if (name == null || name === project.active) return; if (!nameValid(name) || Object.hasOwn(project.files, name)) { alert('Use a unique, simple file name.'); return; } const files = {}; for (const [key, value] of Object.entries(project.files)) files[key === project.active ? name : key] = value; project.files = files; select(name); });
  byId('delete-file').addEventListener('click', () => { if (Object.keys(project.files).length === 1) { alert('Keep at least one file.'); return; } if (!confirm(`Delete ${project.active}?`)) return; delete project.files[project.active]; select(Object.keys(project.files)[0]); });
  const output = byId('console-output');
  const print = value => { output.textContent += (output.textContent ? '\n' : '') + String(value); output.scrollTop = output.scrollHeight; };
  function stopRun(reason) { if (runTimer !== null) clearTimeout(runTimer); runTimer = null; if (runFrame) { runFrame.remove(); runFrame = null; } activeRun = null; byId('stop-run').disabled = true; if (reason) print(reason); }
  byId('stop-run').addEventListener('click', () => stopRun('Execution stopped.'));
  byId('clear-console').addEventListener('click', () => { output.textContent = ''; });
  const jsRunner = code => {
    const payload = JSON.stringify(code).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src data:; form-action 'none'; base-uri 'none';"><meta charset="utf-8"></head><body><script>\n(async function(){\nconst code=${payload};\nconst send=(type,message)=>parent.postMessage({channel:'mm-run-v1',type,message},'*');\nconst fmt=(v)=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}};\nconst console={log:(...a)=>send('log',a.map(fmt).join(' ')),info:(...a)=>send('log',a.map(fmt).join(' ')),warn:(...a)=>send('log','WARN: '+a.map(fmt).join(' ')),error:(...a)=>send('log','ERROR: '+a.map(fmt).join(' '))};\nwindow.addEventListener('error',e=>{send('error',e.message)});\nwindow.addEventListener('unhandledrejection',e=>{send('error',String(e.reason))});\ntry{await (new Function('console', 'return (async()=>{'+code+'\\n})()'))(console);send('done','Execution complete.')}catch(e){send('error',e&&e.stack?e.stack:String(e))}\n})();\n<\/script></body></html>`;
  };
  window.addEventListener('message', event => { if (!activeRun || !runFrame || event.source !== runFrame.contentWindow) return; const data = event.data; if (!data || data.channel !== 'mm-run-v1' || !['log', 'error', 'done'].includes(data.type) || typeof data.message !== 'string') return; print(data.message.slice(0, 10000)); if (data.type === 'error' || data.type === 'done') stopRun(); });
  function runJS() {
    const filename = project.active; if (!filename.endsWith('.js')) { output.textContent = 'Select a .js file to execute.'; return; }
    stopRun(); output.textContent = `Running ${filename} (maximum 5 seconds)…`;
    const frame = document.createElement('iframe'); frame.hidden = true; frame.setAttribute('sandbox', 'allow-scripts'); frame.setAttribute('title', 'Isolated JavaScript execution'); runFrame = frame; activeRun = true; frame.srcdoc = jsRunner(project.files[filename]); document.body.append(frame); byId('stop-run').disabled = false;
    runTimer = setTimeout(() => stopRun('Execution timed out after 5 seconds.'), 5000);
  }
  byId('run-js').addEventListener('click', runJS);
  function previewHTML() {
    const name = project.active.endsWith('.html') ? project.active : Object.keys(project.files).find(f => f.endsWith('.html'));
    if (!name) { output.textContent = 'No HTML file found. Create index.html to preview.'; return; }
    const css = Object.entries(project.files).filter(([key]) => key.endsWith('.css')).map(([, code]) => code).join('\n');
    const html = project.files[name];
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'">`;
    const style = `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`;
    const frame = document.createElement('iframe'); frame.title = 'Sandboxed HTML preview'; frame.setAttribute('sandbox', 'allow-scripts'); frame.setAttribute('referrerpolicy', 'no-referrer'); frame.srcdoc = csp + style + html;
    byId('frame-host').replaceChildren(frame); output.textContent = `Previewing ${name}. External network requests are blocked.`;
  }
  byId('preview-html').addEventListener('click', previewHTML);
  byId('export-project').addEventListener('click', () => { const blob = new Blob([JSON.stringify({ format: 'mm-platform-b01', ...project }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mm-platform-project.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  byId('import-project').addEventListener('change', async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; if (file.size > 2000000) { alert('Project exceeds 2 MB import limit.'); return; } try { const raw = JSON.parse(await file.text()); if (!raw || raw.format !== 'mm-platform-b01' || !safeFiles(raw.files) || !Object.hasOwn(raw.files, raw.active)) throw Error('Unexpected project format'); if (!confirm('Replace the current local project with the imported project?')) return; stopRun(); project = { active: raw.active, files: raw.files }; drawFiles(); persist(); } catch (err) { alert('Import failed: ' + err.message); } });
  const cards = byId('provider-grid');
  function renderProviders(query = '') {
    cards.replaceChildren(); let count = 0;
    for (const p of PROVIDERS) { if (!(p.name + p.window + p.summary).toLowerCase().includes(query.toLowerCase())) continue; count++;
      const card = document.createElement('article'); card.className = 'provider-card';
      const h = document.createElement('h3'); h.textContent = p.name;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = 'RESET WINDOW · ' + p.window;
      const desc = document.createElement('p'); desc.textContent = p.summary;
      const links = document.createElement('div'); links.className = 'links';
      for (const [label, url] of [['Key setup ↗', p.keys], ['Limits & terms ↗', p.docs]]) { const a = document.createElement('a'); a.textContent = label; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; links.append(a); }
      card.append(h, meta, desc, links); cards.append(card);
    }
    if (!count) { const p = document.createElement('p'); p.textContent = 'No providers match that search.'; cards.append(p); }
  }
  byId('provider-search').addEventListener('input', e => renderProviders(e.target.value));
  drawFiles(); renderProviders(); persist();
})();
