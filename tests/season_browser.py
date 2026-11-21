"""Inlined-source Chromium smoke test. Browser network / real WebWorker are NOT verified."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import re
import sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text();css=(root/'src/styles.css').read_text();css=__import__('re').sub(r'@import[^;]+;', '', css)
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
bundle='\n'.join(re.sub(r'^import .*?;\s*$', '', (root/f'src/{name}').read_text(),flags=re.M).replace('export ','') for name in ['catalog.js','observed.js','engine.js','tournament.js','charts.js','app.js'])
bundle=bundle.replace('import.meta.url',"'https://example.invalid/src/app.js'")
stub="""class Worker {constructor(){this.onmessage=null;}terminate(){}postMessage(m){setTimeout(()=>{try{let value;if(m.type==='forecast'){const games=[];for(let i=0;i<m.n;i++)games.push(simulateGame(m.config,hash32(m.config.seed+':'+i)));value={...outcomeSummary(games,m.config),props:namedPropSummaries(games,m.config)};}else if(m.type==='tournament'){value=monteCarloTournament(createTournament(m.tournament.formatId,m.tournament.participants,m.tournament.seed),m.n,m.config);}this.onmessage?.({data:{task:m.task,type:'result',value}})}catch(e){this.onmessage?.({data:{task:m.task,type:'error',message:String(e)}})}},20)}}"""
fixture=json.dumps({'schemaVersion':1,'season':2026,'sourceUrl':'https://github.com/sportsdataverse/cfbfastR-data','lastCompletedGame':'2026-11-15T18:00:00.000Z','teams':[{'id':id,'school':name,'conference':'TEST','games':10,'wins':6,'losses':4,'pointsFor':31.3,'pointsAgainst':22.1} for id,name in [('ole-miss','Ole Miss'),('georgia','Georgia')]]})
# Need 100+ rows to satisfy validation. Build synthetic test fixtures from real catalog in-browser, without producing purported historical data artifacts.
mock="""
window.fetch=async (url)=>{
 const schoolFixture=FBS_TEAMS.map((t,i)=>({id:t.id,school:t.name,conference:'TEST FIXTURE',games:10,wins:5,losses:5,pointsFor:27,pointsAgainst:22}));
 let payload;
 if(String(url).includes('season-2026'))payload={schemaVersion:1,season:2026,sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',lastCompletedGame:'2026-11-15T18:00:00.000Z',teams:schoolFixture};
 else if(String(url).includes('rosters-2026'))payload={schemaVersion:1,season:2026,sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',published:'2026-11-16',schools:{'ole-miss':[{name:'Current Test Quarterback',position:'QB'},{name:'Current Test Receiver',position:'WR'},{name:'Another Test Receiver',position:'WR'}],'georgia':[{name:'Georgia Test Quarterback',position:'QB'}]}};
 else return {ok:false};
 return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(payload)};
};
"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in ([(390,844)] if "--mobile" in sys.argv else [(1370,850)]):
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  # Make FBS_TEAMS available to mocked fetch after app code loads (functions execute after bundle)
  # Move mock ahead of app.js, but catalog first.
  script='\n'.join(re.sub(r'^import .*?;\s*$', '', (root/f'src/{name}').read_text(),flags=re.M).replace('export ','') for name in ['catalog.js','observed.js','engine.js','tournament.js','charts.js']) + '\n' + mock + '\n' + stub + '\n' + re.sub(r'^import .*?;\s*$', '', (root/'src/app.js').read_text(),flags=re.M).replace('import.meta.url',"'https://example.invalid/src/app.js'")
  page.add_script_tag(content=script)
  page.wait_for_timeout(1700)
  print('VIEW',width,'menu',page.locator('[data-field="a"] option').count(),'props',page.locator('.props-table tbody tr').count(),'errors',errors)
  print('WIDTH',page.evaluate('({scroll:document.documentElement.scrollWidth,inner:window.innerWidth})'))
  assert not errors,errors
  assert page.locator('[data-field="a"] option').count()==138
  assert page.get_by_text('Current Test Quarterback').count()>=1
  assert page.get_by_text('138 FBS').count()>=1 or page.get_by_text('138 programs').count()>=1
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
  path=f'/mnt/data/gridiron-v05-{width}.png';page.screenshot(path=path,full_page=False,animations='disabled',timeout=7000)
  print('SELECT B',flush=True);page.locator('[data-field="b"]').select_option('georgia',timeout=3500);print('SELECT DONE',flush=True)
  page.wait_for_timeout(1200)
  assert page.get_by_text('Georgia Test Quarterback').count()>=1
  print('TAB',flush=True);page.locator('[data-action="tab-playoff"]').click(timeout=3500);print('TAB DONE',flush=True)
  print('RUN BRACKET',flush=True);page.locator('[data-action="playoff-run"]').click(timeout=3500);print('RUN DONE',flush=True)
  assert page.locator('.bracket-match.finished').count()==11
  page.locator('.bracket-match.finished').first.click()
  assert page.locator('#game-inspector').count()==1
  page.locator('[data-field="format"]').select_option('fbs24')
  print('RUN BRACKET',flush=True);page.locator('[data-action="playoff-run"]').click(timeout=3500);print('RUN DONE',flush=True)
  assert page.locator('.bracket-match.finished').count()==23
  print('PASS viewport',width,'playoff inspected, no overflow')
  page.close()
 browser.close()
