from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
PAGES=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','watch.html','privacy.html','terms.html','data-deletion.html','community-rules.html']
TOKEN='20261006e'

def patch_csp(html:str)->str:
    m=re.search(r'<meta\s+http-equiv=["\']Content-Security-Policy["\']\s+content=["\']([^"\']*)["\']',html,re.I)
    if not m:
        return html
    value=m.group(1)
    directives={}
    order=[]
    for part in value.split(';'):
        part=part.strip()
        if not part: continue
        bits=part.split()
        directives[bits[0]]=bits[1:]
        order.append(bits[0])
    def add(name,*sources):
        if name not in directives:
            directives[name]=[]; order.append(name)
        for source in sources:
            if source not in directives[name]: directives[name].append(source)
    add('script-src',"'self'",'https://challenges.cloudflare.com')
    add('connect-src',"'self'",'https://*.workers.dev','https://challenges.cloudflare.com')
    add('frame-src','https://challenges.cloudflare.com')
    rebuilt='; '.join(name+' '+' '.join(directives[name]) for name in order).strip()+';'
    return html[:m.start(1)]+rebuilt+html[m.end(1):]

def patch_page(path:Path):
    html=path.read_text(encoding='utf-8')
    html=html.replace('20261006d',TOKEN)
    if 'assets/community.css?' not in html:
        html=html.replace('</head>',f'<link rel="stylesheet" href="assets/community.css?v={TOKEN}"><script type="module" src="assets/community-shell.mjs?v={TOKEN}"></script></head>')
    html=patch_csp(html)
    if path.name=='watch.html':
        html=re.sub(r'<a href="#campfire">[^<]*Server chat\s*<small>SETUP PENDING</small></a>', '<a href="#community">💬 Global Chat <small>HYNOE COMMUNITY</small></a>', html, flags=re.I)
        html=html.replace('Server chat','Global Chat').replace('SERVER CHAT','GLOBAL CHAT').replace('SETUP PENDING','HYNOE COMMUNITY')
    path.write_text(html,encoding='utf-8')

for name in PAGES: patch_page(ROOT/name)
for test in ROOT.joinpath('tests').glob('*.mjs'):
    text=test.read_text(encoding='utf-8')
    if '20261006d' in text:
        test.write_text(text.replace('20261006d',TOKEN),encoding='utf-8')
print(f'Applied Hynoe Community surface to {len(PAGES)} public pages with {TOKEN}')
