from pathlib import Path

watch_path = Path('watch.html')
js_path = Path('assets/watch.mjs')
watch = watch_path.read_text()
js = js_path.read_text()

watch = watch.replace('id="podium-name-2">WAITING</b>', 'id="podium-name-2">LOCAL</b>')
watch = watch.replace('id="podium-name-1">SYNCING</b>', 'id="podium-name-1">PRIVACY HOLD</b>')
watch = watch.replace('id="podium-name-3">FOR PLAYERS</b>', 'id="podium-name-3">NO UPLOADS</b>')

old_hub = "$('hub-leaderboard-stat').textContent=me&&Number.isFinite(Number(me.rank))?'#'+me.rank+' of '+total+' · '+tier.name+' · '+fmt(bestScore):'Syncing · '+tier.name+' · '+fmt(bestScore);"
new_hub = "$('hub-leaderboard-stat').textContent=me&&Number.isFinite(Number(me.rank))?'#'+me.rank+' of '+total+' · '+tier.name+' · '+fmt(bestScore):(GLOBAL_BOARD_ENABLED?'Syncing · ':'Local only · ')+tier.name+' · '+fmt(bestScore);"
if old_hub not in js:
    raise SystemExit('leaderboard hub status anchor missing')
js = js.replace(old_hub, new_hub, 1)

old_podium = "(podium[i]?.callsign||['SYNCING','WAITING','FOR PLAYERS'][i]).slice(0,12).toUpperCase()"
new_podium = "(podium[i]?.callsign||(GLOBAL_BOARD_ENABLED?['SYNCING','WAITING','FOR PLAYERS'][i]:['PRIVACY HOLD','LOCAL','NO UPLOADS'][i])).slice(0,12).toUpperCase()"
if old_podium not in js:
    raise SystemExit('leaderboard podium anchor missing')
js = js.replace(old_podium, new_podium, 1)

watch_path.write_text(watch)
js_path.write_text(js)

check_watch = watch_path.read_text()
check_js = js_path.read_text()
assert 'id="podium-name-1">SYNCING<' not in check_watch
assert 'id="podium-name-2">WAITING<' not in check_watch
assert "'Syncing · '+tier.name" not in check_js
assert "['SYNCING','WAITING','FOR PLAYERS'][i]" not in check_js
assert "'Local only · '" in check_js
assert "['PRIVACY HOLD','LOCAL','NO UPLOADS'][i]" in check_js
