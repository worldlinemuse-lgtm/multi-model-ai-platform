from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
class Inspector(HTMLParser):
    def __init__(self): super().__init__(); self.ids=set();self.duplicates=[];self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:self.duplicates.append(a['id'])
            self.ids.add(a['id'])
        if tag=='script':self.scripts.append(a.get('src'))
html=(root/'index.html').read_text()
ins=Inspector();ins.feed(html)
assert not ins.duplicates,ins.duplicates
assert ins.scripts==['./app.js']
js=(root/'app.js').read_text()
import re
referenced=set(re.findall(r"byId\('([^']+)'\)",js))
missing=referenced-ins.ids
assert not missing,missing
assert 'sandbox' in js and "'allow-scripts'" in js
assert "connect-src 'none'" in js
assert "safeFiles" in js
assert 'localStorage' in js
assert 'aistudio.google.com/api-keys' in js
assert html.count('data-view=')>=4
print('PASS: HTML IDs unique, references present, script linked, CSP and sandbox guards, local storage, free-key directory, navigation')
