#!/usr/bin/env python3
"""Real-browser visual contract for period-style menu shell.
Pixel screenshots are uploaded for manual review; logic tests use actual modules
and actual DOM, not static mock images or screenshots substituted for controls.
"""
from __future__ import annotations
import os
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = os.environ.get('GRIDIRON_TEST_URL', 'http://127.0.0.1:4173/')
OUT = Path(os.environ.get('GRIDIRON_CONSOLE_CAPTURES', '/tmp/console-era'))
OUT.mkdir(parents=True, exist_ok=True)

def check(browser_type, engine, width):
    kw = {'headless':True}
    if engine == 'chromium':
        kw['args']=['--no-sandbox']
    browser=browser_type.launch(**kw)
    try:
        context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
        page=context.new_page()
        exceptions=[]
        page.on('pageerror', lambda error: exceptions.append(str(error)))
        response=page.goto(ROOT, wait_until='domcontentloaded', timeout=30000)
        assert response and response.ok
        page.locator('.era-game-board').wait_for(timeout=30000)
        page.locator('.fixture-score-number').wait_for(timeout=30000)
        assert page.locator('.era-left-rail .era-menu-item').count()==3
        assert page.locator('.era-game-board .era-score-row').count()==2
        assert page.locator('.era-game-board .era-quarter-wrap .score-table').count()==1
        assert page.locator('.era-game-board .era-action-art .uniform-athlete-svg').count()==2
        assert page.locator('.era-game-board .era-team-emblem .uniform-helmet-svg').count()==2
        assert page.locator('.era-game-board .era-action-art [data-uniform-team]').count()==4
        assert page.locator('.era-game-board .era-right-rail .era-context-card').count()==2
        assert page.locator('.era-game-board [data-field="a"]').count()==1
        assert page.locator('.era-game-board [data-field="b"]').count()==1
        assert page.locator('.era-game-board [data-field="venue"]').count()==1
        actual=[x.strip() for x in page.locator('.era-score-row>strong').all_text_contents()]
        generated=[x.strip() for x in page.locator('.fixture-score-number b').all_text_contents()]
        assert actual==generated, f'Console scoreboard mismatches canonical generated result: {actual} != {generated}'
        assert page.locator('.era-game-board').bounding_box()['y']<200
        assert page.locator('.era-subtabs button').count()==4
        if not page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'):
            trace=page.evaluate("""() => {
              const cases=[
                'svg.era-action-art{display:none!important}',
                '.era-action-art{display:none!important}',
                '.era-subtabs{display:none!important}',
                '.era-dual-stat{display:none!important}',
                '.era-console-board{display:none!important}',
                '.era-reports{display:none!important}',
                '.topbar{display:none!important}',
                '.site-width{overflow:clip!important}',
                '.era-console-board{overflow:clip!important}',
                '.era-console-board{display:none!important}.era-reports{display:none!important}',
                '.era-action-art svg{display:none!important}.era-subtabs{display:none!important}.era-stat{display:none!important}',
              ];
              const result={width:innerWidth,before:document.documentElement.scrollWidth,cases:[]};
              for(const css of cases){
                const st=document.createElement('style');st.textContent=css;document.head.append(st);
                result.cases.push([css,document.documentElement.scrollWidth]);
                st.remove();
              }
              const checks=['html','body','#app','.site-main','.site-width','.era-console-board','.era-stage-main','.era-hero-grid','.era-action-art','.era-subtabs','.era-dual-stat','.era-stat','.era-stat .table-scroll','.era-reports','.game-canvas'];
              result.elements=checks.map(q=>{const e=document.querySelector(q);if(!e)return null;const b=e.getBoundingClientRect();return [q,Math.round(b.left),Math.round(b.right),e.scrollWidth,e.clientWidth,getComputedStyle(e).overflowX];}).filter(Boolean);
              return result;
            }""")
            page.screenshot(path=str(OUT/f'{engine}-{width}-overflow-debug.png'),full_page=False)
            raise AssertionError('Game page body overflow '+json.dumps(trace))
        page.screenshot(path=str(OUT/f'{engine}-{width}-game.png'), full_page=width<600,animations='disabled')
        if engine=='chromium' and width in (390,1366):
            # Actual team selection must recolor the uniform geometry; identity
            # is not an image placeholder or hardcoded Ohio/Georgia mockup.
            page.locator('[data-field="a"]').select_option('oregon')
            page.locator('[data-field="b"]').select_option('lsu')
            left=page.locator('.era-athlete-left')
            right=page.locator('.era-athlete-right')
            assert left.get_attribute('data-uniform-team')=='oregon'
            assert right.get_attribute('data-uniform-team')=='lsu'
            assert left.evaluate("(e)=>e.style.getPropertyValue('--school-main').trim()")=='#154733', 'Oregon green did not render'
            assert right.evaluate("(e)=>e.style.getPropertyValue('--school-main').trim()")=='#461D7C', 'LSU purple did not render'
            assert page.locator('.era-athlete-left .uniform-athlete-svg').get_attribute('data-uniform-team')=='oregon'
            assert page.locator('.era-athlete-right .uniform-athlete-svg').get_attribute('data-uniform-team')=='lsu'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), 'Dynamic jersey update introduced overflow'
            page.screenshot(path=str(OUT/f'{engine}-{width}-oregon-lsu-uniforms.png'),animations='disabled')


        page.locator('[data-action="era-pane-players"]').click()
        assert page.locator('.era-subpane-one').count()==1
        assert page.locator('.era-subtabs button[aria-pressed="true"]').count()==1
        page.locator('[data-action="era-pane-box"]').click()
        assert page.locator('.era-dual-stat').count()==1
        if width>=768:
            assert page.locator('.era-hero-grid').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==2
        page.locator('[data-action="tab-playoff"]').click()
        page.locator('.era-playoff-board').wait_for()
        assert page.locator('.era-bracket-preview').count()==1
        assert page.locator('.era-bracket-column').count()>=2
        assert page.locator('.era-bracket-match').count()>=4, 'Expected four actual opening-round 12-team matchups'
        assert page.locator('.era-bracket-team[data-uniform-team] .era-bracket-helmet .uniform-helmet-svg').count()>=8, 'Retro bracket should show team-specific helmet marks'

        qf=page.locator('.era-bracket-column').nth(1).locator('.era-bracket-team b').all_text_contents()
        assert any(v.strip()!='Awaiting result' for v in qf), 'Known first-round bye seeds must be shown, not blank next-round panels'
        assert (page.locator('.era-bracket-column').first.locator('.era-bracket-team span').first.inner_text().strip().isdigit()), 'Real seed positions must label teams'

        assert page.locator('[data-field="format"]').count()==1
        assert page.locator('[data-action="playoff-run"]').count()==1
        assert page.locator('[data-action="playoff-next"]').count()==1
        assert page.locator('.era-bracket-scroller').evaluate('(e)=>getComputedStyle(e).overflowX')=='auto'
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), 'Playoff body overflow'
        page.screenshot(path=str(OUT/f'{engine}-{width}-playoffs.png'),full_page=width<600,animations='disabled')
        page.locator('[data-field="format"]').select_option('fullFbs138')
        assert '138' in page.locator('.era-bracket-preview .era-red-strip').inner_text()
        assert page.locator('.era-bracket-match').count()>=4
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), '138 bracket body overflow'

        page.locator('[data-action="tab-research"]').click()
        page.locator('.era-research-board').wait_for()
        assert page.locator('.era-research-panel').count()>=5
        assert page.locator('.era-research-menu a').count()>=5
        assert page.locator('.era-research-grid').count()==1
        text=page.locator('.era-research-board').inner_text().lower()
        assert '2026' in text and 'not a pristine holdout' in text
        assert 'model validated' not in text
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), 'Research body overflow'
        page.screenshot(path=str(OUT/f'{engine}-{width}-research.png'),full_page=width<600,animations='disabled')
        if engine=='chromium' and width==1366:
            # Independent fast visual regression: 13.2s award phase must be
            # shown on-screen, rather than just existing below the viewport.
            page.locator('[data-action="tab-playoff"]').click()
            page.locator('[data-action="playoff-run"]').click()
            page.locator('#dynasty-showcase.stage-awards').wait_for(timeout=26000)
            assert page.locator('#dynasty-showcase .award-card').count()==4
            assert page.locator('#dynasty-showcase .award-card .uniform-athlete-svg').count()==4, 'Player uniform portraits missing from honors'

            r=page.locator('#dynasty-showcase .award-card').first.bounding_box()
            assert r and 0<=r['y'] and r['y']+r['height']<=page.viewport_size['height']-24, (
                f'Champion awards below desktop fold at reveal: {r}'
            )
            page.screenshot(path=str(OUT/'chromium-1366-visible-mvp.png'),animations='disabled')
        assert not exceptions, f'{engine}/{width} uncaught JS: {exceptions}'
        print(f'PASS {engine} {width}: live game score, tabs, 12/138 brackets, research, 3 screenshots, no overflow/errors',flush=True)
        context.close()
    finally:
        browser.close()

if __name__=='__main__':
    with sync_playwright() as pw:
        for engine in ('chromium','webkit'):
            for width in (320,390,768,1366):
                check(getattr(pw,engine), engine, width)
