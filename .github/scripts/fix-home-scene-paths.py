from pathlib import Path

path=Path('index.html')
html=path.read_text()
bad="--scene:url('assets/images/"
good="--scene:url('images/"
count=html.count(bad)
if count!=5:
    raise SystemExit(f'Expected 5 broken scene asset paths, found {count}')
html=html.replace(bad,good)
path.write_text(html)
assert bad not in html
assert html.count(good)==5
