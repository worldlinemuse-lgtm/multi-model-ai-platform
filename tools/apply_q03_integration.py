"""Apply Q03 module runner wiring to an exact-compatible B0.3.x source checkout.

Idempotent, fail-closed: refuses an unknown source layout rather than silently patching.
Does not touch the historical Library releases or GitHub main.
"""
from pathlib import Path
import sys


def once(source, old, new, label):
    count=source.count(old)
    if count!=1:
        raise ValueError(f'{label}: expected exactly one source anchor, got {count}')
    return source.replace(old,new,1)


def patch_sandbox(source):
    if "from './module-runtime.js'" in source:
        raise ValueError('Q03 module runtime already imported; refusing to reapply')
    source=once(source,
        "const escapeScript=s=>",
        "import {moduleRunnerDocument,shouldRunAsModule} from './module-runtime.js';\nconst escapeScript=s=>",
        'sandbox import')
    source=once(source,
        "run(code,lang,onEvent,limitMs=lang==='python'?60000:6000){this.stop();const nonce=crypto.randomUUID();const frame=document.createElement('iframe');",
        "run(code,lang,onEvent,limitMs=lang==='python'?60000:6000,project=null){this.stop();const nonce=crypto.randomUUID();const html=lang==='javascript'&&project&&shouldRunAsModule(code,project.entry)?moduleRunnerDocument(project.files,project.entry,nonce):runnerDocument(code,lang,nonce);const frame=document.createElement('iframe');",
        'runner method')
    source=once(source,'frame.srcdoc=runnerDocument(code,lang,nonce);','frame.srcdoc=html;','sandbox srcdoc')
    return source


def patch_main(source):
    return once(source,
        "},lang==='python'?120000:6000);audit('run',lang,'started');",
        "},lang==='python'?120000:6000,lang==='javascript'?{files:p.files,entry:filename}:null);audit('run',lang,'started');",
        'main runCode call')


def apply(root):
    root=Path(root)
    a=root/'src/sandbox.js';b=root/'src/main.js'
    original_a=a.read_text();original_b=b.read_text()
    next_a=patch_sandbox(original_a);next_b=patch_main(original_b)
    # All replacements are computed and validated before any file is written.
    a.write_text(next_a);b.write_text(next_b)
    print('Q03 sandbox/main integration applied; review diff and run full tests before PR.')


if __name__=='__main__':
    if len(sys.argv)!=2:sys.exit('usage: apply_q03_integration.py <checkout-root>')
    apply(sys.argv[1])