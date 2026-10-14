from html.parser import HTMLParser
from pathlib import Path
import re,json,sys
root=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.screen=[];self.scripts=[];self.nav=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if 'id' in d:self.ids.append(d['id'])
  if d.get('data-screen'):self.screen.append(d['data-screen'])
  if tag=='script' and d.get('src'):self.scripts.append(d['src'])
  if d.get('data-view'):self.nav.append(d['data-view'])
p=Parser();p.feed((root/'index.html').read_text());assert len(p.ids)==len(set(p.ids)),'duplicate IDs';assert len(p.screen)>=12 and set(p.screen)==set(p.nav),'Missing navigation screens'
for x in p.scripts:assert (root/x).is_file(),x
src=(root/'src/main.js').read_text();referenced=set(re.findall(r"\$\('([^']+)'\)",src))|set(re.findall(r"el\('([^']+)'\)",src));assert referenced.issubset(p.ids),f'Missing UI IDs: {referenced-set(p.ids)}'
for name in ['core','storage','provider-api','vault','sandbox','zip','labs','knowledge','snapshot-diff']:assert (root/'src'/f'{name}.js').exists()
zip_source=(root/'src/zip.js').read_text();assert 'crc32' in zip_source and 'maxBytes' in zip_source
sandbox=(root/'src/sandbox.js').read_text();assert "worker-src blob:" in sandbox and "connect-src 'none'" in sandbox
vault=(root/'src/vault.js').read_text();assert 'PBKDF2' in vault and 'AES-GCM' in vault and '260000' in vault
assert (root/'sw.js').is_file();assert (root/'provider-guides.js').is_file()
print(f'PASS HTML: {len(p.ids)} unique controls; {len(p.screen)} wired sections; module files, CSP guards, vault encryption and ZIP bounds found')
