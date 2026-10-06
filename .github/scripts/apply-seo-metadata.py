from pathlib import Path

PAGES = {
    'start.html': (
        'Start Here | Hynoe SMP',
        'Hynoe SMP First-Day Guide | Modded Minecraft Survival',
        'Start Hynoe SMP with the first-day route: learn Genesis Ages, key commands, travel, economy basics, safe storage, and your next campaign goals.'
    ),
    'progression.html': (
        'Progression | Hynoe SMP',
        'Hynoe SMP Progression Guide | Campaign, Genesis Ages & Gear',
        'Explore Hynoe SMP progression: Genesis Ages, the 31-stage campaign, gear tiers, rare equipment, milestones, and the long-term path to endgame.'
    ),
    'economy.html': (
        'Economy | Hynoe SMP',
        'Hynoe SMP Economy Guide | Jobs, Dollars, Tokens & Trading',
        'Learn the Hynoe SMP economy: Hynoe Dollars, Tokens, Jobs+, player trading, server selling, and how progression rewards connect to survival.'
    ),
    'mca.html': (
        'Village Life | Hynoe SMP',
        'Hynoe SMP Village Life Guide | MCA Families & Settlements',
        'Build a living settlement in Hynoe SMP with Minecraft Comes Alive: relationships, marriage, children, homes, jobs, guards, and generations.'
    ),
    'bosses.html': (
        'Bosses | Hynoe SMP',
        'Hynoe SMP Boss Guide | Endgame Fights, Gear & Rewards',
        'Prepare for Hynoe SMP bosses with encounter routes, gear goals, Token rewards, rare drops, and endgame fights built for long-term progression.'
    ),
    'modpack.html': (
        'Install Modpack | Hynoe SMP',
        'Install the Hynoe SMP Modpack | Minecraft Java Fabric',
        'Install the Hynoe SMP Fabric modpack for Minecraft Java with the guided Modrinth setup, required client content, and recommended shader instructions.'
    ),
}

for filename, (old_title, new_title, description) in PAGES.items():
    path = Path(filename)
    text = path.read_text()
    old_tag = f'<title>{old_title}</title>'
    new_tag = f'<title>{new_title}</title>'
    if old_tag not in text and new_tag not in text:
        raise SystemExit(f'{filename}: title anchor missing')
    text = text.replace(old_tag, new_tag, 1)
    desc_tag = f'<meta name="description" content="{description}">'
    if desc_tag not in text:
        viewport = '<meta name="viewport" content="width=device-width,initial-scale=1">'
        if viewport not in text:
            raise SystemExit(f'{filename}: viewport anchor missing')
        text = text.replace(viewport, viewport + '\n' + desc_tag, 1)
    path.write_text(text)

watch_path = Path('watch.html')
watch = watch_path.read_text()
old_watch = '<title>Watch & Play | Hynoe SMP</title>'
new_watch = '<title>Watch Hynoe & Play Hynoe Outpost | Hynoe SMP</title>'
if old_watch not in watch and new_watch not in watch:
    raise SystemExit('watch.html: title anchor missing')
watch = watch.replace(old_watch, new_watch, 1)
watch_path.write_text(watch)

# Guard the approved scope.
for filename, (_, title, description) in PAGES.items():
    text = Path(filename).read_text()
    assert f'<title>{title}</title>' in text
    assert f'<meta name="description" content="{description}">' in text
assert new_watch in watch_path.read_text()
