"""v0.9 Chromium DOM smoke suite. No native navigation, modules, workers or iOS claims."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_bundle import make_bundle
import re
root=Path(__file__).resolve().parents[1]
old=(root/'tests/season_browser.py').read_text()
mock=re.search(r'mock="""\n(.*?)\n"""',old,re.S).group(1)
stub=re.search(r'stub="""(.*?)"""',old,re.S).group(1)
html=(root/'index.html').read_text()
css=(root/'src/styles.css').read_text()
css=re.sub(r'^@import[^\n]+$', '', css, flags=re.M)
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1370,900),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce')
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html)
  page.add_script_tag(content=make_bundle(root,extra=mock,stub=stub))
  page.wait_for_timeout(900)
  assert not errors,errors
  assert page.evaluate("getComputedStyle(document.body).backgroundColor")=='rgb(8, 12, 11)'
  assert page.locator('.nav-item').count()==3
  assert page.locator('.nav-item.active').inner_text().lower()=='game'
  assert page.locator('.play-console select').count()==3
  assert page.locator('[data-field="a"] option').count()==138
  assert page.locator('.fixture-score-number').count()==1
  assert page.locator('.fixture-score-number').inner_text().strip()
  assert page.locator('.research-snapshot').count()==1
  assert page.locator('.snapshot-lead').count()==1, 'fixture research should show empirical with mocked data'
  assert page.locator('.player-desk').count()==1
  assert page.locator('.personnel-desk').count()==1
  page.locator('.personnel-desk summary').click()
  assert page.locator('.personnel-columns').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'overflow {width}'
  page.screenshot(path=f'/mnt/data/gridiron-v09-{width}.png',full_page=False,animations='disabled')
  oldscore=page.locator('.fixture-score-number').inner_text()
  page.locator('[data-action="new-game"]').first.click()
  page.wait_for_timeout(700)
  assert page.locator('.fixture-score-number').count()==1
  assert page.locator('.fixture-score-number').inner_text().strip()
  page.locator('[data-field="b"]').select_option('alabama')
  page.wait_for_timeout(700)
  assert page.get_by_text('Alabama').count()>=1
  page.locator('[data-action="tab-research"]').click()
  assert page.locator('.model-table').count()==1
  assert page.locator('.coverage-bars').count()==1
  assert page.locator('.evaluation-bar').count()==1
  assert page.locator('.data-grid').count()==1
  assert page.locator('.play-console').count()==0
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'research overflow {width}'
  page.locator('[data-action="tab-playoff"]').click()
  assert page.locator('.playoff-picker').count()==1
  page.locator('[data-action="playoff-run"]').click()
  assert page.locator('.fixture-bracket.is-final').count()==11
  page.locator('.fixture-bracket.is-final').first.click()
  assert page.locator('#game-inspector').count()==1
  page.locator('[data-action="close-inspector"]').click()
  page.locator('[data-field="format"]').select_option('fbs24')
  page.locator('[data-action="playoff-run"]').click()
  assert page.locator('.fixture-bracket.is-final').count()==23
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'bracket overflow {width}'
  assert not errors,errors
  print(f'PASS v0.9 browser DOM viewport={width}: nav, match, replay, empirical/model, bracket 12/24, inspector, overflow')
  page.close()
 # Empty-source stress case: functionality must survive unavailable external artifacts.
 page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
 page.set_content(html)
 page.add_script_tag(content=make_bundle(root,extra='window.fetch=async()=>({ok:false});',stub=stub))
 page.wait_for_timeout(600)
 assert page.locator('.research-snapshot.unavailable').count()==1
 assert page.locator('.fixture-score-number').count()==1
 page.locator('[data-action="new-game"]').first.click()
 assert page.locator('.fixture-score-number').count()==1
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
 print('PASS unavailable-data case: gameplay still runs without invented empirical odds')
 page.close()
 browser.close()
