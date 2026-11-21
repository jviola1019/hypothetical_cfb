"""Actual source inlined for DOM interaction smoke tests: no network/module-worker assertion."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_bundle import make_bundle
import re
import sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text();css=(root/'src/styles.css').read_text();css=re.sub(r'@import[^;]+;', '',css)
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',f'<style>{css}</style>')
html=html.replace('<script type="module" src="./src/app.js"></script>','')
stub="""class Worker {constructor(){this.onmessage=null;}terminate(){}postMessage(m){setTimeout(()=>{try{let value;if(m.type==='forecast'){const games=[];for(let i=0;i<m.n;i++)games.push(simulateGame(m.config,hash32(m.config.seed+':'+i)));value={...outcomeSummary(games,m.config),props:namedPropSummaries(games,m.config)};}else if(m.type==='tournament'){const f=monteCarloTournament(createTournament(m.tournament.formatId,m.tournament.participants,m.tournament.seed),m.n,m.config);value=f;}this.onmessage?.({data:{task:m.task,type:'result',value}})}catch(e){this.onmessage?.({data:{task:m.task,type:'error',message:String(e)}})}},20)}}"""
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [((int(sys.argv[1]),844) if len(sys.argv)>1 else (390,844))]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html)
        page.add_script_tag(content=make_bundle(root,stub=stub))
        page.wait_for_timeout(2200)
        print('VIEW',width,'page title',page.title(),'score shown?',page.locator('.score-number .numbers b').all_text_contents(),'props',page.locator('.props-table tbody tr').count(),'errors',errors)
        print('BODY OVERFLOW', page.evaluate('({scroll:document.documentElement.scrollWidth,inner:window.innerWidth})'))
        if width in [390,1370]:
            page.screenshot(path=f'/mnt/data/gridiron-redesign-{width}.png',full_page=False,animations='disabled')
        assert not errors, errors
        # Without fetched observed rosters and event ledgers the UI must not
        # invent a "2026 starter" or pretend to show a validated prop table.
        assert page.locator('[data-field="a"] option').count()==138
        assert page.locator('.score-team').count()==2
        page.locator('[data-field="b"]').select_option('indiana')
        page.wait_for_timeout(600)
        print('Selected right team:',page.locator('.score-team.right h2').first.inner_text()); assert page.locator('.score-team.right h2').first.inner_text().strip().casefold()=='indiana'
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
        page.locator('[data-action="tab-playoff"]').click()
        assert page.get_by_text('A bracket you can trace.').count()==1
        page.locator('[data-action="playoff-run"]').click()
        assert page.locator('.bracket-match.finished').count()==11
        print('BRACKET',page.locator('.bracket-match.finished').count())
        page.locator('.bracket-match.finished').first.click()
        print('INSPECT',page.locator('#game-inspector').count(),page.locator('#game-inspector .player-table').count())
        assert page.locator('#game-inspector').count()==1
        page.locator('[data-field="format"]').select_option('fbs24')
        page.locator('[data-action="playoff-run"]').click()
        print('BRACKET24',page.locator('.bracket-match.finished').count())
        assert page.locator('.bracket-match.finished').count()==23
        print("END",width,flush=True)
        page.close()
    browser.close()
