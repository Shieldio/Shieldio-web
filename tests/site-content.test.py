"""Public Shieldio navigation, translated links and metadata stay consistent."""
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
from urllib.parse import urlsplit, unquote
import json, posixpath, re, xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
SECTIONS = {'index.html','faq.html','404.html','products','instructions','company','edu','aktuality'}
PAGES = {p.relative_to(ROOT).as_posix(): p.read_text() for p in ROOT.rglob('*.html') if p.relative_to(ROOT).parts[0] in SECTIONS and '.preview-static' not in p.parts}
D = json.loads((ROOT/'assets/data/i18n.json').read_text())
errors = []
class Page(HTMLParser):
    def __init__(self):super().__init__();self.ids=set();self.links=[];self.keys=[];self.redirect=False;self.footer=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:errors.append('Duplicate id: '+a['id'])
            self.ids.add(a['id'])
        for attr in ['href','src']:
            if a.get(attr):self.links.append(a[attr])
        for name,value in attrs:
            if name.startswith('data-i18n'):self.keys.append(value)
        if tag=='meta' and a.get('http-equiv','').lower()=='refresh':self.redirect=True
        if tag=='nav' and a.get('class')=='footer-nav':self.footer=True
    handle_startendtag=handle_starttag

def resolve(page,url):
    parsed=urlsplit(unescape(url))
    if parsed.scheme and not (parsed.scheme in ['http','https'] and parsed.netloc in ['shieldio.cz','www.shieldio.cz']):return None
    if parsed.netloc and parsed.netloc not in ['shieldio.cz','www.shieldio.cz']:return None
    path=unquote(parsed.path)
    target=posixpath.normpath(path.lstrip('/') if path.startswith('/') else posixpath.join(posixpath.dirname(page),path)) if path else page
    if target=='.':target='index.html'
    match=next((candidate for candidate in [target,target+'.html',target.rstrip('/')+'/index.html'] if (ROOT/candidate).is_file()),None)
    return match,unquote(parsed.fragment)

parsed={}
for path,html in PAGES.items():
    p=Page();p.feed(html);parsed[path]=p
    for key in p.keys:
        if key not in D:errors.append(f'{path}: missing translation {key}')
    for m in re.finditer(r'<([a-z0-9]+)\b[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)</\1>',html):
        if m[2] in D and m[3]!=D[m[2]]['cs']:errors.append(f'{path}: Czech fallback differs for {m[2]}')
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',html,re.S):
        try:json.loads(block)
        except ValueError as e:errors.append(f'{path}: invalid JSON-LD {e}')
    if not p.redirect and p.footer and not re.search(r'<nav class="footer-nav">[\s\S]*?/instructions/blokovy-editor.html[\s\S]*?</nav>',html):errors.append(f'{path}: footer has no programming link')
    if not p.redirect and re.search(r'href="(?:https?://)?(?:ide\.)?mblock\.cc',html):errors.append(f'{path}: primary link still leads to mBlock')

for path,html in PAGES.items():
    for language in ['cs','en']:
        def translate(m):return m[0][:m[0].index('>')+1]+D.get(m[2],{}).get(language,m[3])+'</'+m[1]+'>'
        rendered=re.sub(r'<([a-z0-9]+)\b[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)</\1>',translate,html)
        p=Page();p.feed(rendered)
        for url in p.links:
            try:result=resolve(path,url)
            except ValueError:errors.append(f'{path}: invalid URL {url}');continue
            if result is None:continue
            target,fragment=result
            if not target:errors.append(f'{path} ({language}): missing target {url}')
            elif fragment and target in parsed and fragment not in parsed[target].ids:errors.append(f'{path} ({language}): missing anchor {url}')

# Essential resources must remain one click from the homepage and the guide hub.
resource_paths=['instructions/baseline/red/sestaveni/index.html','instructions/baseline/red/prehled/index.html','instructions/jak-to-funguje/index.html','edu/index.html']
for page in ['index.html','instructions/index.html']:
    for language in ['cs','en']:
        rendered=re.sub(r'<([a-z0-9]+)\b[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)</\1>',lambda m:m[0][:m[0].index('>')+1]+D.get(m[2],{}).get(language,m[3])+'</'+m[1]+'>',PAGES[page])
        main=rendered.split('<main',1)[1].split('</main>',1)[0]
        p=Page();p.feed(main)
        targets={resolve(page,url)[0] for url in p.links if resolve(page,url)}
        for target in resource_paths:
            if target not in targets:errors.append(f'{page} ({language}): essential resource missing from main content: {target}')

for entry in json.loads((ROOT/'assets/data/search-index.json').read_text()):
    result=resolve('index.html',entry['url']);target=result[0] if result else None
    if target not in PAGES:errors.append('Search index target missing: '+entry['url'])
    elif parsed[target].redirect or re.search(r'name="robots"[^>]*content="[^"]*noindex',PAGES[target]):errors.append('Search index includes retired/draft page: '+target)
for line in (ROOT/'_redirects').read_text().splitlines():
    if not line.strip() or line.startswith('#'):continue
    source,destination,status=line.split()
    if status!='301' or not resolve('index.html',destination)[0]:errors.append('Invalid redirect: '+line)
    if source==destination:errors.append('Redirect loop: '+line)
for loc in ET.parse(ROOT/'sitemap.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
    result=resolve('index.html',loc.text)
    if not result or not result[0]:errors.append('Sitemap target missing: '+loc.text)
    elif result[0] in PAGES and (parsed[result[0]].redirect or re.search(r'name="robots"[^>]*content="[^"]*noindex',PAGES[result[0]])):errors.append('Sitemap includes retired/draft page: '+loc.text)

plain=lambda s:unescape(re.sub(r'<[^>]+>','',s))
# Teacher content must translate as fully as its navigation; neutral time ranges are shared.
class TeacherTranslations(HTMLParser):
    def __init__(self):super().__init__();self.active=False;self.stack=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='div' and a.get('class')=='hero':self.active=True
        if tag=='footer':self.active=False
        if tag not in {'img','input','meta','link','br','hr'}:self.stack.append((tag,a.get('data-i18n')))
    def handle_endtag(self,tag):
        if self.stack and self.stack[-1][0]==tag:self.stack.pop()
    def handle_data(self,text):
        if self.active and re.search(r'[A-Za-zÀ-ž]',text) and not re.fullmatch(r'\s*\d+–\d+ min\s*',text) and not any(key for _,key in self.stack):errors.append('Teacher content has untranslated text: '+text.strip())
teacher=TeacherTranslations();teacher.feed(PAGES['company/pro-ucitele.html'])
if 'href="products/RED.html#varianty"' not in PAGES['index.html']:errors.append('Homepage comparison must open the RED variants section')
if not re.search(r'<section id="varianty"[\s\S]*?<table[\s\S]*?RED DIY[\s\S]*?RED READY[\s\S]*?</table>',PAGES['products/RED.html']):errors.append('RED variants comparison is missing')
for key in ['about.step1_p','faq.a6','red.variants.status','teachers.availability']:
    if 'zatím neprodává' not in plain(D[key]['cs']):errors.append('Availability must use the current non-commercial status: '+key)
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',PAGES['faq.html'],re.S):
    obj=json.loads(block)
    if obj.get('@type')=='FAQPage':
        for index,question in enumerate(obj['mainEntity'],1):
            if question['acceptedAnswer']['text']!=plain(D[f'faq.a{index}']['cs']):errors.append('FAQ visible text and structured data disagree')
assert not errors, '\n'.join(sorted(set(errors)))
print(f'Site content: {len(PAGES)} pages; CS/EN links, anchors, translations, search, redirects, sitemap and JSON-LD passed.')
