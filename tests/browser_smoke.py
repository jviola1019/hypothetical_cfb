"""DOM interaction smoke test under admin-restricted Playwright navigation.
This harness inlines the *same application source* and replaces module Worker with
an in-page computation stub. It DOES NOT certify real module loading or Worker threading.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text();css=(root/'src/styles.css').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>').replace('<script type="module" src="./src/app.js"></script>','')
bundle='\n'.join(re.sub(r'^import .*?;\s*$', '', (root/f'src/{name}').read_text(),flags=re.M).replace('export ', '') for name in ['engine.js','tournament.js','charts.js','app.js'])
bundle=bundle.replace('import.meta.url',"'http://example.invalid/src/app.js'")
stub='''class Worker {constructor(){this.onmessage=null;}terminate(){}postMessage(m){setTimeout(()=>{try{let value;if(m.type==='forecast'){let g=[];for(let i=0;i<m.n;i++)g.push(simulateGame(m.config,hash32(m.config.seed+':'+i)));value=outcomeSummary(g,m.config);}else if(m.type==='tournament')value=monteCarloTournament(createTournament(m.tournament.formatId,m.tournament.participants,m.tournament.seed),m.n,m.config);else if(m.type==='prop')value=propDistribution(m.config,m.stat,m.role,m.threshold,m.n);this.onmessage?.({data:{task:m.task,type:'result',value}});}catch(err){this.onmessage?.({data:{task:m.task,type:'error',message:String(err)}})}},10);}}'''
# correct note: worker stub is only a module-load workaround
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1365,860),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.add_script_tag(content=stub+'\n'+bundle)
  page.wait_for_timeout(2000)
  print('viewport:',width,'x',height,'initial metric:',page.locator('.number').first.inner_text() if page.locator('.number').count() else 'NONE')
  assert page.locator('h1').count() == 1
  print('document scrollWidth / viewport:',page.evaluate('document.documentElement.scrollWidth'),width)
  assert page.evaluate('document.documentElement.scrollWidth')<=width+2
  assert 'GAME SIMULATION' in page.locator('.primarynav').inner_text()
  assert page.get_by_role('button',name='SIMULATE GAME').count()==1
  page.get_by_role('button',name='SIMULATE GAME').click()
  assert page.locator('.story').count()==1
  assert page.locator('.story h2').count()==1
  page.get_by_role('tab',name='PLAYOFF SIMULATION').click()
  assert page.get_by_role('button',name='PLAY TO CHAMPION').count()==1
  page.get_by_role('button',name='PLAY TO CHAMPION').click()
  assert page.locator('.champion h3').count()==1
  assert page.locator('.matchcard [data-action=inspect-match]').count()==11
  page.locator('.matchcard [data-action=inspect-match]').first.click()
  assert page.locator('#inspector .scroll-table').count()>=2
  if width<500:
   # Scroll width can exceed viewport intentionally only inside the explicit bracket scroller.
   assert page.locator('.round-flex').count()==1
  page.screenshot(path=str(root.parent/f'gridiron-{width}.png'),full_page=True)
  print('champ:',page.locator('.champion h3').inner_text(),'inspector populated','errors:',errors)
  assert errors==[],errors
  page.close()
 browser.close()
print('Browser DOM harness: PASS (module URL navigation blocked by sandbox)')
