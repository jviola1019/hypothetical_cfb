"""Actual Chromium DOM interactions via source injection. Native localhost browsing is blocked by environment.
Exercise the 138-team format, rank initialization, seed exchange, 16-game pages, championship and inspector.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_bundle import make_bundle
import re

ROOT=Path(__file__).resolve().parents[1]
old=(ROOT/'tests/season_browser.py').read_text()
mock=re.search(r'mock="""\n(.*?)\n"""',old,re.S).group(1)
stub=re.search(r'stub="""(.*?)"""',old,re.S).group(1)
html=(ROOT/'index.html').read_text()
css=(ROOT/'src/styles.css').read_text()
css=re.sub(r'^@import[^\n]+$','',css,flags=re.M)
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1370,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html)
  page.add_script_tag(content=make_bundle(ROOT,extra=mock,stub=stub))
  page.wait_for_timeout(950)
  assert page.locator('.nav-item').count()==3
  assert page.locator('.roster-coverage').count()==1
  assert not errors,errors
  page.locator('[data-action="tab-playoff"]').click()
  page.locator('[data-field="format"]').select_option('fullFbs138')
  assert page.locator('.seed-leaders .seed-row').count()==16
  assert '138' in page.locator('.seed-intro h3').inner_text()
  assert page.locator('.bracket-grid .fixture-bracket').count()==10, '10 play-ins, not 128 empty cards'
  assert '2026 Elo' in page.locator('.seed-intro p').inner_text()
  high=page.locator('.seed-row span').first.inner_text()
  # Last synthetic fixture rating belongs to FBS_TEAMS[-1] (Wyoming).
  assert high=='Wyoming',f'2026 rank fixture should put Wyoming first, got {high}'
  page.locator('[data-field="swap-from"]').select_option('0')
  page.locator('[data-field="swap-to"]').select_option('137')
  page.locator('[data-action="swap-seeds"]').click()
  after=page.locator('.seed-row span').first.inner_text()
  assert after !=high, 'pre-run seed swap must change top seed'
  page.locator('[data-action="restore-ranked"]').click()
  assert page.locator('.seed-row span').first.inner_text()==high
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'pre-run overflow {width}'
  page.screenshot(path=f'/mnt/data/gridiron-v10-{width}-seeds.png',animations='disabled',full_page=False)
  page.locator('[data-action="playoff-run"]').click()
  page.wait_for_timeout(350)
  assert '137 / 137' in page.locator('.tournament-overview').inner_text()
  assert page.locator('.champion-banner h2').inner_text().strip()!='A CHAMPION AWAITS.'
  assert page.locator('.bracket-grid .fixture-bracket.is-final').count()==1
  page.locator('[data-action="round:0"]').click()
  assert page.locator('.bracket-grid .fixture-bracket.is-final').count()==10
  page.locator('.bracket-grid .fixture-bracket.is-final').first.click()
  assert page.locator('#game-inspector').count()==1
  page.locator('[data-action="close-inspector"]').click()
  assert page.locator('#game-inspector').count()==0
  page.locator('[data-action="round:1"]').click()
  assert page.locator('.bracket-grid .fixture-bracket').count()==16
  page.locator('[data-action="page:1"]').click()
  assert '2/' in page.locator('.atlas-topline p').inner_text()
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'post-run overflow {width}'
  print(f'PASS national open DOM {width}px: 2026 rating seed, reversible swap, 138→128 play-ins, 137 games, game inspector, paging, no overflow')
  page.close()
 browser.close()
