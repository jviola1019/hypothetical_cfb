"""Design audit / source-injected Chromium only; not native Safari or Web Worker."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
from browser_bundle import make_bundle
root=Path(__file__).resolve().parents[1]
old=(root/'tests/season_browser.py').read_text()
mock=re.search(r'mock="""\n(.*?)\n"""',old,re.S).group(1)
stub=re.search(r'stub="""(.*?)"""',old,re.S).group(1)
html=(root/'index.html').read_text()
css=(root/'src/styles.css').read_text()
css=re.sub(r'^@import[^\n]+$', '', css, flags=re.M)
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>')
html=html.replace('<link rel="stylesheet" href="./src/refinements.css">',f'<style>{(root/"src/refinements.css").read_text()}</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in (320,360,390,768,1024,1370):
  page=browser.new_page(viewport={'width':width,'height':950},reduced_motion='reduce')
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.add_script_tag(content=make_bundle(root,extra=mock,stub=stub))
  page.wait_for_timeout(250)
  assert not errors,(width,errors)
  assert page.locator('[data-field="a"]').count()==1
  assert page.locator('[data-field="b"]').count()==1
  assert page.locator('[data-field="venue"]').count()==1
  assert page.locator('.game-canvas').count()==1
  assert page.locator('.game-tape:not([open])').count()==1
  assert page.locator('.skip-link').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'page overflow {width}'
  assert page.evaluate("document.querySelector('.game-canvas').compareDocumentPosition(document.querySelector('.roster-coverage')) & Node.DOCUMENT_POSITION_FOLLOWING")
  assert page.evaluate("document.querySelector('.ledger-grid').compareDocumentPosition(document.querySelector('.game-tape')) & Node.DOCUMENT_POSITION_FOLLOWING")
  page.keyboard.press('Tab')
  assert page.evaluate("document.activeElement.classList.contains('skip-link')"),f'missing skip link at {width}'
  page.locator('[data-field="a"]').focus()
  page.locator('[data-field="a"]').select_option('ohio-state')
  assert page.evaluate("document.activeElement?.dataset.field==='a'"),f'focus lost at {width}'
  page.locator('[data-action="tab-playoff"]').click()
  assert page.evaluate("document.activeElement?.dataset.action==='tab-playoff'")
  assert page.title()=='Playoffs | GRIDIRON LAB'
  page.locator('[data-action="tab-research"]').click()
  assert page.title()=='Model & validation | GRIDIRON LAB'
  page.locator('[data-action="tab-game"]').click()
  assert page.title()=='Game | GRIDIRON LAB'
  page.locator('.game-tape summary').click()
  assert page.locator('.game-tape[open]').count()==1
  assert page.locator('.table-scroll[role="region"][tabindex="0"]').count()>=3
  assert not errors,errors
  print(f'PASS design usability {width}px')
  page.close()
 browser.close()
