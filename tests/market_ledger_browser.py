"""DOM audit, not native ES modules or physical iPhone Safari."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_bundle import make_bundle
import re
root=Path(__file__).resolve().parents[1]
old=(root/'tests/season_browser.py').read_text()
mock=re.search(r'mock="""\n(.*?)\n"""',old,re.S).group(1)
stub=re.search(r'stub="""(.*?)"""',old,re.S).group(1)
html=(root/'index.html').read_text()
css=re.sub(r'^@import[^\n]+$', '', (root/'src/styles.css').read_text(), flags=re.M)
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '',html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in (320,390,768,1370):
  page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.add_script_tag(content=make_bundle(root,extra=mock,stub=stub))
  page.wait_for_timeout(800)
  assert not errors,errors
  ledger=page.locator('.market-ledger')
  assert ledger.count()==1,'missing single-sample market ledger'
  assert page.locator('.market-ledger table').count()==2
  assert page.locator('.sample-outlook .viz').count()>=2
  assert page.locator('.research-snapshot').count()==1
  def parse_rows():
   tables=page.locator('.market-ledger table')
   outputs=[]
   for t in range(2):
    rows=tables.nth(t).locator('tbody tr')
    vals=[]
    for i in range(rows.count()):
     m=re.search(r'([0-9,]+)\s*/\s*([0-9,]+)',rows.nth(i).locator('td').inner_text())
     assert m,rows.nth(i).inner_text()
     vals.append((int(m.group(1).replace(',','')),int(m.group(2).replace(',',''))))
    outputs.append(vals)
   return outputs
  wins,totals=parse_rows()
  n=wins[0][1]
  assert n in (850,450),n
  assert all(d==n for _,d in wins+totals)
  assert wins[0][0]+wins[1][0]==n,'win counts fail conservation'
  assert wins[2][0]+wins[3][0]+wins[4][0]==n,'spread cover counts fail conservation'
  assert totals[0][0]+totals[1][0]+totals[2][0]==n,'over/under counts fail conservation'
  if not page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'):
   print('OVERFLOW',width,page.evaluate("({body:document.body.scrollWidth,doc:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>innerWidth+3).slice(0,12).map(x=>({tag:x.tagName,cls:x.className?.baseVal||x.className,right:Math.round(x.getBoundingClientRect().right)}))})"));
   print('PARENTS',page.evaluate("(()=>{let e=document.querySelector('.score-table'),a=[];while(e){const r=e.getBoundingClientRect(),c=getComputedStyle(e);a.push([e.tagName, e.className,Math.round(r.x),Math.round(r.width),e.scrollWidth,c.overflowX]);e=e.parentElement;}return a})()")); raise AssertionError(f'overflow at {width}')
  page.locator('[data-action="new-game"]').first.click()
  page.wait_for_timeout(500)
  assert page.locator('.market-ledger').count()==1
  assert not errors,errors
  
  if width==390: ledger.screenshot(path='/mnt/data/cfb-market-ledger-mobile.png',animations='disabled')
  print('PASS market DOM',width,'N',n,'win counts',wins[:2],'cover counts',wins[2:5])
  page.close()
 browser.close()
