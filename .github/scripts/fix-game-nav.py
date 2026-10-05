from pathlib import Path
import re

html_path=Path('watch.html')
css_path=Path('assets/watch.css')
html=html_path.read_text()
css=css_path.read_text()

# Restore access to the rest of the website from Watch & Play.
if 'class="site-pages"' not in html:
    html=html.replace(
        '</header>\n<main>',
        '</header>\n<nav class="site-pages" aria-label="Hynoe SMP pages"><a href="index.html">World</a><a href="start.html">Start Here</a><a href="mca.html">Village Life</a><a href="progression.html">Progression</a><a href="economy.html">Economy</a><a href="bosses.html">Bosses</a><a href="join.html">Join</a><a href="modpack.html">Get the Pack</a></nav>\n<main>',
        1
    )

# Remove the redundant replacement hub that duplicated real navigation.
html, count = re.subn(
    r'\n<section class="simple-hub".*?</section>\n(?=<section class="stream-run")',
    '\n',
    html,
    count=1,
    flags=re.S,
)
if count != 1 and 'class="simple-hub"' in html:
    raise SystemExit('Could not remove simple hub cleanly')

# Add Mine to the real section navigation and keep every existing game section reachable.
tabs_anchor='<div class="tabs" role="tablist" aria-label="Mining activities">'
if 'class="mine-tab"' not in html:
    if tabs_anchor not in html:
        raise SystemExit('Game tabs anchor missing')
    html=html.replace(tabs_anchor,tabs_anchor+'<button type="button" class="mine-tab" data-go="mine">⛏ Mine</button>',1)

# Cache-bust the corrected layout.
html=html.replace('assets/watch.css?v=20261005b','assets/watch.css?v=20261005c')
html_path.write_text(html)

# Stop hiding the real tabs. Keep only obsolete duplicate navigation hidden.
css=css.replace('.game-loop,.room-grid,.tabs,.system-atlas{display:none!important}', '.game-loop,.room-grid,.system-atlas{display:none!important}')

marker='/* NAV ACCESS FIX 2026-10-05 */'
if marker not in css:
    css += r'''

/* NAV ACCESS FIX 2026-10-05 */
.site-pages{max-width:1440px;margin:0 auto;padding:8px 28px;display:flex;gap:6px;overflow-x:auto;white-space:nowrap;border-bottom:1px solid var(--line);background:#12110e}.site-pages a{flex:0 0 auto;text-decoration:none;color:#cfc7b6;font-size:11px;font-weight:700;padding:8px 11px;border:1px solid transparent;border-radius:6px}.site-pages a:hover,.site-pages a:focus-visible{color:var(--gold);border-color:#554a36;background:#262118}.tabs{display:flex!important;gap:4px;padding:8px 10px;overflow-x:auto;white-space:nowrap;background:#181713;border-top:1px solid var(--line);border-bottom:1px solid var(--line);scrollbar-width:thin}.tabs button{flex:0 0 auto;padding:11px 12px;border:1px solid transparent;border-radius:7px;background:transparent;color:#aaa08d;font-size:11px}.tabs button:hover{background:#29251d;color:#f0d6a4}.tabs button[aria-selected=true]{background:#3a301f;color:var(--gold);border-color:#6e5933}.tabs .mine-tab{color:#d7ccb6}.tabs .mine-tab:before{content:''}.stream-run{margin-top:16px}.simple-hub{display:none!important}
@media(max-width:730px){.site-pages{padding-inline:12px}.tabs{padding-inline:8px}.tabs button{padding:10px;font-size:10px}}
'''
css_path.write_text(css)

# Static assertions so we do not hide navigation again.
check_html=html_path.read_text()
check_css=css_path.read_text()
assert 'class="site-pages"' in check_html
assert 'class="simple-hub"' not in check_html
assert 'class="mine-tab"' in check_html
for target in ['tab-operations','tab-leaderboard','tab-frontier','tab-crew','tab-research','tab-upgrades','tab-expeditions','tab-journal']:
    assert target in check_html
assert '.game-loop,.room-grid,.tabs,.system-atlas{display:none!important}' not in check_css
assert '/* NAV ACCESS FIX 2026-10-05 */' in check_css
