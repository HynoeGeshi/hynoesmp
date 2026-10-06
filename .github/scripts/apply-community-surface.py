from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
PAGES=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','watch.html','privacy.html','terms.html','data-deletion.html','community-rules.html']
TOKEN='20261006e'
CSP="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://i.ytimg.com; connect-src 'self' https://hynoe-global-leaderboard.rellyoukno.chatgpt.site https://*.workers.dev https://challenges.cloudflare.com; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com; form-action 'self'; manifest-src 'self'; upgrade-insecure-requests"

def patch_csp(html:str)->str:
    pattern=re.compile(r'(<meta\s+http-equiv=["\']Content-Security-Policy["\']\s+content=)(["\'])(.*?)(\2)',re.I|re.S)
    m=pattern.search(html)
    if not m:
        return html
    replacement=m.group(1)+m.group(2)+CSP+m.group(2)
    return html[:m.start()]+replacement+html[m.end():]

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
