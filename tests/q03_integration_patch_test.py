"""Unit acceptance for fail-closed integration anchors."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from apply_q03_integration import patch_sandbox,patch_main

class PatchTests(unittest.TestCase):
 def test_sandbox_patch(self):
  s="const escapeScript=s=>\nrun(code,lang,onEvent,limitMs=lang==='python'?60000:6000){this.stop();const nonce=crypto.randomUUID();const frame=document.createElement('iframe');frame.srcdoc=runnerDocument(code,lang,nonce);"
  out=patch_sandbox(s)
  self.assertIn('moduleRunnerDocument(project.files,project.entry,nonce)',out)
  self.assertIn('frame.srcdoc=html;',out)
  self.assertIn('project=null',out)
  with self.assertRaises(ValueError):patch_sandbox(out)
 def test_main_patch(self):
  s="},lang==='python'?120000:6000);audit('run',lang,'started');"
  out=patch_main(s)
  self.assertIn("lang==='javascript'?{files:p.files,entry:filename}:null",out)
  with self.assertRaises(ValueError):patch_main(out)
 def test_unknown_layout_is_rejected(self):
  with self.assertRaises(ValueError):patch_main('some other version')
  with self.assertRaises(ValueError):patch_sandbox('some other version')

if __name__=='__main__':unittest.main()