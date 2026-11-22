"""Maintained responsive DOM smoke test for College Championship theme.

Page uses bundled module code with mocked fetch and Worker; it cannot establish
native production browser module/Worker or physical iPhone Safari operation.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_bundle import make_bundle
import re

root = Path(__file__).resolve().parents[1]
prior = (root / 'tests/season_browser.py').read_text()
mock = re.search(r'mock="""\n(.*?)\n"""', prior, re.S).group(1)
stub = re.search(r'stub="""(.*?)"""', prior, re.S).group(1)
html = (root / 'index.html').read_text()
base_css = re.sub(r'^@import[^\n]+$', '', (root/'src/styles.css').read_text(), flags=re.M)
college_css = re.sub(r'^@import[^\n]+$', '', (root/'src/college-theme.css').read_text(), flags=re.M)
html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./src/styles.css">', f'<style>{base_css}</style>')
html = html.replace('<link rel="stylesheet" href="./src/college-theme.css">', f'<style>{college_css}</style>')
html = html.replace('<script type="module" src="./src/app.js"></script>', '')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width in [320, 360, 390, 768, 1024, 1370]:
        page = browser.new_page(viewport={'width':width,'height':860}, reduced_motion='reduce')
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(html)
        page.add_script_tag(content=make_bundle(root, extra=mock, stub=stub))
        page.wait_for_timeout(450)
        assert not errors, (width,errors)
        assert page.locator('.nav-item').count()==3
        assert page.locator('.brand-mark b').inner_text()=='GL'
        # Guard inherited legacy grid columns: GL must be fully within its shield.
        assert page.evaluate("(()=>{const a=document.querySelector('.brand-mark').getBoundingClientRect(),b=document.querySelector('.brand-mark b').getBoundingClientRect();return b.left>=a.left+2 && b.right<=a.right-2})()"), 'clipped shield monogram'
        assert page.locator('.team-control select').count()==2
        assert page.locator('.play-console select').count()==3
        assert page.locator('.fixture-score-number').count()==1
        assert page.locator('.market-ledger table').count()==2
        assert page.locator('main').count()==1
        assert page.evaluate("getComputedStyle(document.body).backgroundColor")=='rgb(241, 245, 250)'
        assert page.evaluate("getComputedStyle(document.querySelector('.topbar')).backgroundColor")=='rgb(7, 26, 50)'
        # Visually meaningful theme checks, including readable light/dark layer.
        assert page.evaluate("getComputedStyle(document.querySelector('.play-console')).backgroundColor")=='rgb(255, 255, 255)'
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), f'Horizontal overflow at {width}: '+str(page.evaluate('document.documentElement.scrollWidth'))
        assert page.evaluate("getComputedStyle(document.querySelector('.fixture-score')).animationName") in ('none','college-score-enter')
        # Keyboard and actions must remain accessible.
        page.locator('[data-field="a"]').focus()
        assert page.evaluate("document.activeElement.getAttribute('data-field')")=='a'
        page.locator('[data-field="a"]').select_option('georgia')
        page.wait_for_timeout(180)
        assert page.locator('.fixture-score').count()==1
        page.locator('[data-action="tab-playoff"]').click()
        assert page.locator('.playoff-console').count()==1
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"),f'Playoff overflow {width}'
        page.locator('[data-action="playoff-run"]').click()
        assert page.locator('.fixture-bracket.is-final').count()>=11
        page.locator('[data-action="tab-research"]').click()
        assert page.locator('.model-table').count()==1
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"),f'Research overflow {width}'
        if width in (390,1370):
            page.locator('[data-action="tab-game"]').click()
            page.locator('.market-ledger').screenshot(path=f'/mnt/data/gridiron-college-market-{width}.png', animations='disabled')
            page.locator('[data-action="tab-playoff"]').click()
            page.screenshot(path=f'/mnt/data/gridiron-college-playoff-{width}.png', full_page=False, animations='disabled')
            page.locator('[data-action="tab-game"]').click()
            page.screenshot(path=f'/mnt/data/gridiron-college-{width}.png', full_page=False, animations='disabled')
        assert not errors,(width,errors)
        print(f'PASS College Championship DOM viewport {width}: design, game, three tabs, bracket, ledger, keyboard, overflow')
        page.close()
    browser.close()
