#!/usr/bin/env python3
"""Real-browser visual contract for period-style menu shell.
Pixel screenshots are uploaded for manual review; logic tests use actual modules
and actual DOM, not static mock images or screenshots substituted for controls.
"""
from __future__ import annotations
import os
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
        assert page.locator('.era-game-board .era-action-art svg').count()==1
        assert page.locator('.era-game-board .era-right-rail .era-context-card').count()==2
        assert page.locator('.era-game-board [data-field="a"]').count()==1
        assert page.locator('.era-game-board [data-field="b"]').count()==1
        assert page.locator('.era-game-board [data-field="venue"]').count()==1
        actual=[x.strip() for x in page.locator('.era-score-row>strong').all_text_contents()]
        generated=[x.strip() for x in page.locator('.fixture-score-number b').all_text_contents()]
        assert actual==generated, f'Console scoreboard mismatches canonical generated result: {actual} != {generated}'
        assert page.locator('.era-game-board').bounding_box()['y']<200
        assert page.locator('.era-subtabs button').count()==4
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), 'Game page body overflow'
        page.screenshot(path=str(OUT/f'{engine}-{width}-game.png'), full_page=width<600,animations='disabled')

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
        assert not exceptions, f'{engine}/{width} uncaught JS: {exceptions}'
        print(f'PASS {engine} {width}: live game score, tabs, 12/138 brackets, research, 3 screenshots, no overflow/errors',flush=True)
        context.close()
    finally:
        browser.close()

if __name__=='__main__':
    with sync_playwright() as pw:
        for engine in ('chromium','webkit'):
            for width in (390,768,1366):
                check(getattr(pw,engine), engine, width)
