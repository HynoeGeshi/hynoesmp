from pathlib import Path

watch_js_path=Path('assets/watch.mjs')
watch_html_path=Path('watch.html')
index_path=Path('index.html')
watch_js=watch_js_path.read_text()
watch_html=watch_html_path.read_text()
index_html=index_path.read_text()

# Hard privacy hold: keep local Legend scoring, block every external leaderboard path.
old="let leaderboardEndpoint='',globalBoard=null,leaderboardState='CONNECTING',leaderboardInFlight=false,leaderboardSyncTimer,lastSubmittedKey='';"
new="const GLOBAL_BOARD_ENABLED=false;let leaderboardEndpoint='',globalBoard=null,leaderboardState=GLOBAL_BOARD_ENABLED?'CONNECTING':'LOCAL ONLY · PRIVACY HOLD',leaderboardInFlight=false,leaderboardSyncTimer,lastSubmittedKey='';"
if old in watch_js:
    watch_js=watch_js.replace(old,new,1)
elif new not in watch_js:
    raise SystemExit('leaderboard state anchor missing')

old="async function syncLeaderboard(force=false){if(!leaderboardEndpoint||leaderboardInFlight)return;"
new="async function syncLeaderboard(force=false){if(!GLOBAL_BOARD_ENABLED)return;if(!leaderboardEndpoint||leaderboardInFlight)return;"
if old in watch_js: watch_js=watch_js.replace(old,new,1)
elif new not in watch_js: raise SystemExit('sync leaderboard anchor missing')

old="function queueLeaderboardSync(){if(!leaderboardEndpoint||leaderboardSyncTimer||leaderboardKey()===lastSubmittedKey)return;"
new="function queueLeaderboardSync(){if(!GLOBAL_BOARD_ENABLED)return;if(!leaderboardEndpoint||leaderboardSyncTimer||leaderboardKey()===lastSubmittedKey)return;"
if old in watch_js: watch_js=watch_js.replace(old,new,1)
elif new not in watch_js: raise SystemExit('queue leaderboard anchor missing')

old="async function connectLeaderboard(){try{"
new="async function connectLeaderboard(){if(!GLOBAL_BOARD_ENABLED)return;try{"
if old in watch_js: watch_js=watch_js.replace(old,new,1)
elif new not in watch_js: raise SystemExit('connect leaderboard anchor missing')

old="render();connectLeaderboard();"
new="render();if(GLOBAL_BOARD_ENABLED)connectLeaderboard();"
if old in watch_js: watch_js=watch_js.replace(old,new,1)
elif new not in watch_js: raise SystemExit('initial connect anchor missing')

# Make the local-only state visible in the game, not hidden in implementation details.
old="<div class=\"tab-content leaderboard\" id=\"leaderboard\" role=\"tabpanel\" aria-labelledby=\"tab-leaderboard\" hidden><div class=\"leader-stage\">"
new="<div class=\"tab-content leaderboard\" id=\"leaderboard\" role=\"tabpanel\" aria-labelledby=\"tab-leaderboard\" hidden><div class=\"notice leaderboard-privacy\"><strong>GLOBAL SYNC PAUSED</strong><p>Your local Legend score still works. External leaderboard uploads are paused while Hynoe finishes worldwide privacy and deletion controls. <a href=\"privacy.html\">Privacy</a> · <a href=\"data-deletion.html\">Data deletion</a></p></div><div class=\"leader-stage\">"
if old in watch_html: watch_html=watch_html.replace(old,new,1)
elif 'GLOBAL SYNC PAUSED' not in watch_html: raise SystemExit('leaderboard panel anchor missing')

watch_html=watch_html.replace('<small>GLOBAL OUTPOST LADDER</small>','<small>GLOBAL OUTPOST LADDER · GLOBAL SYNC PAUSED</small>',1)
watch_html=watch_html.replace('<strong id="leader-tier">ROOKIE</strong><span id="leader-rank">CONNECTING</span>','<strong id="leader-tier">ROOKIE</strong><span id="leader-rank">LOCAL ONLY · PRIVACY HOLD</span>',1)
watch_html=watch_html.replace('Your device keeps its player ID; the shared board keeps your best verified score. No save-file imports.','Your device keeps a local player ID for Legend scoring. Global uploads are paused; no save-file imports.',1)
watch_html=watch_html.replace('Every browser that plays joins this same board. Improve any major system to pass other real players.','Global sync is temporarily paused for privacy/deletion work. Your local Legend score and tiers continue normally.',1)
watch_html=watch_html.replace('<span id="leaderboard-live">CONNECTING</span>','<span id="leaderboard-live">LOCAL ONLY · PRIVACY HOLD</span>',1)

# Add visible legal navigation to Watch & Play.
old='<footer class="page-footer"><a href="index.html">← Back to the Hynoe world</a><span>© 2026 Hynoe · All rights reserved · <a href="COPYRIGHT.md">Usage rights</a></span></footer>'
new='<footer class="page-footer"><a href="index.html">← Back to the Hynoe world</a><span>Copyright © 2026 Hynoe · All rights reserved · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="data-deletion.html">Data deletion</a> · <a href="community-rules.html">Community rules</a> · <a href="COPYRIGHT.md">Usage rights</a></span></footer>'
if old in watch_html: watch_html=watch_html.replace(old,new,1)
elif 'href="privacy.html"' not in watch_html: raise SystemExit('watch footer anchor missing')

# Add legal routes to the homepage footer while preserving all existing discovery links.
old='<div class="footer-links"><a href="updates.html">Latest Update</a><a href="start.html">Start Here</a><a href="mca.html">Village Life</a><a href="progression.html">Progression</a><a href="economy.html">Economy</a><a href="bosses.html">Bosses</a><a href="https://streamlabs.com/hynoe_geshi" target="_blank" rel="noreferrer">Support</a><a href="join.html">Join</a></div>'
new='<div class="footer-links"><a href="updates.html">Latest Update</a><a href="start.html">Start Here</a><a href="mca.html">Village Life</a><a href="progression.html">Progression</a><a href="economy.html">Economy</a><a href="bosses.html">Bosses</a><a href="join.html">Join</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="data-deletion.html">Data deletion</a><a href="community-rules.html">Community rules</a><a href="https://streamlabs.com/hynoe_geshi" target="_blank" rel="noreferrer">Support</a></div>'
if old in index_html: index_html=index_html.replace(old,new,1)
elif 'href="privacy.html"' not in index_html: raise SystemExit('home footer anchor missing')

# Keep security-test ownership wording exact on the homepage.
index_html=index_html.replace('<small>© 2026 Hynoe. All rights reserved. Hynoe SMP is independent and is not affiliated with Mojang or Microsoft.', '<small>Copyright © 2026 Hynoe. All rights reserved. Hynoe SMP is independent and is not affiliated with Mojang or Microsoft.',1)

watch_js_path.write_text(watch_js)
watch_html_path.write_text(watch_html)
index_path.write_text(index_html)

assert 'GLOBAL_BOARD_ENABLED=false' in watch_js
assert 'if(GLOBAL_BOARD_ENABLED)connectLeaderboard()' in watch_js
assert 'GLOBAL SYNC PAUSED' in watch_html
assert 'local Legend score' in watch_html
for page in ('privacy.html','terms.html','data-deletion.html'):
    assert f'href="{page}"' in watch_html
    assert f'href="{page}"' in index_html
