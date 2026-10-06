from pathlib import Path
import runpy

source = Path('.github/scripts/fix-home-outpost.py').read_text()
source = source.replace('class="world-dashboard reveal"', 'class="world-dashboard"')
source = source.replace("assert 'class=\"world-dashboard\"' in check", "assert 'class=\"world-dashboard\"' in check")
tmp = Path('/tmp/fix-home-outpost-corrected.py')
tmp.write_text(source)
runpy.run_path(str(tmp), run_name='__main__')
