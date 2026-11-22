#!/usr/bin/env python3
"""Real local HTTP ES modules + real browser Web Workers, not injected source stubs.

Chromium and WebKit desktop/mobile viewports. WebKit on Linux approximates
the rendering engine but is NOT physical iPhone Safari certification.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

URL=os.environ.get("GRIDIRON_TEST_URL","http://127.0.0.1:4173/")
OUT=Path(os.environ.get("GRIDIRON_SCREENSHOTS","/tmp/gridiron-browser"))
OUT.mkdir(parents=True,exist_ok=True)

def check(browser_type,engine,width):
    args={"headless":True}
    if engine=="chromium":
        args["args"]=["--no-sandbox"]
    browser=browser_type.launch(**args)
    try:
        ctx=browser.new_context(viewport={"width":width,"height":852},
            device_scale_factor=2 if width<500 else 1,reduced_motion="reduce")
        # Keep real Worker; count its creation without replacing or emulating work.
        ctx.add_init_script("""(() => {
            const NativeWorker = window.Worker;
            window.__realWorkersCreated = 0;
            if (NativeWorker) window.Worker = class extends NativeWorker {
                constructor(...a) { super(...a); window.__realWorkersCreated++; }
            };
        })()""")
        page=ctx.new_page()
        exceptions=[]
        page.on("pageerror",lambda e:exceptions.append(str(e)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        assert response and response.ok, "Local deployed-style module navigation failed"
        page.locator(".fixture-score-number").wait_for(timeout=30000)
        page.locator(".market-ledger").wait_for(timeout=60000)
        # The fallback computes 450; a real 850-run Worker is the only supported
        # way to reach 850 on the game screen.
        text=page.locator(".market-ledger").inner_text()
        assert "850" in text, f"{engine} {width}: expected real Worker 850-run forecast, got {text[:400]}"
        assert page.evaluate("window.__realWorkersCreated")>=1, "Browser Web Worker was not created"
        assert page.locator('.gameday-hud').count()==1, "Pregame game-screen scouting interface missing"
        assert page.locator('.hud-playart svg').count()==1, "Original animated playbook art missing"
        assert page.locator('.gameday-nav a').count()==5, "Gameday quick navigation incomplete"
        assert page.locator('#game-availability').count()==1, "Dated injury report should never be hidden"
        assert page.locator('#game-player-props .prop-table tbody tr').count()>0, "Named-player model sheet unavailable"
        assert page.locator('#game-player-props .player-cards article').count()>=2, "Player scouting visual cards missing"
        assert page.locator('.forecast-agreement').count()==1, "Synthetic probability vs Elo reference comparison absent"
        assert 'synthetic' in page.locator('.fixture-meta').inner_text().lower(), "Simulated scores cannot masquerade as observed or calibrated"
        # The scoreboards must not rely on private or unlicensed team photography.
        assert page.locator('.hud-school').count()==2 and page.locator('.hud-monogram').count()==2

        # Verify the actual new game CSS and locally served stadium asset, rather
        # than passing on DOM-only assertions while a stylesheet 404s.
        assert page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(233, 233, 229)', "Old/absent site skin"
        assert page.locator('.brand-copy').evaluate("(el) => getComputedStyle(el).flexDirection")=='column', "Wordmark/subtitle should stack without collision"
        assert page.locator('.score-table tbody td').first.evaluate("(el) => getComputedStyle(el).backgroundColor")=='rgb(21, 29, 38)', "Quarter table is using old olive background"
        assert page.locator('.score-table tbody td').first.evaluate("(el) => getComputedStyle(el).color")=='rgb(242, 245, 247)', "Quarter scores lack readable contrast"

        assert "night-stadium.svg" in page.locator('.page-intro').evaluate("(el) => getComputedStyle(el).backgroundImage"), "Stadium asset not used"
        assert page.evaluate("fetch('./public/assets/night-stadium.svg').then(r => r.ok)"), "Local stadium illustration failed to load"
        # The visible score pair must reproduce the printed point total and margin.
        estimates=page.locator('.snapshot-figures strong').all_text_contents()
        import re
        parts=re.findall(r'\d+\.\d+',estimates[0])
        assert len(parts)==2, f"Expected paired scoring-rate estimates; got {estimates}"
        a,b=map(float,parts)
        margin=float(estimates[1].replace('+',''))
        total=float(estimates[2])
        assert abs(a-b-margin)<.051, f"Displayed score margin inconsistency: {estimates}"
        assert abs(a+b-total)<.051, f"Displayed score total inconsistency: {estimates}"

        if engine=='chromium' and width==390:
            # Dated injury is game-specific, not a lifetime state. Select OSU
            # and confirm 2026 roster-linked QB replacement is source-graded.
            page.locator('[data-field="a"]').select_option('oregon-state')
            page.locator('[data-field="b"]').select_option('ohio-state')
            page.locator('.market-ledger').wait_for(timeout=60000)
            assert page.locator('.game-availability').count()==0  # source section has its own semantic ID
            assert page.locator('#game-availability').get_by_text('Braden Atkinson').count()>=1
            assert page.locator('.personnel-desk').get_by_text('Maalik Murphy').count()>=1
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Availability interaction introduced page overflow"

        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Mobile document overflow"
        page.screenshot(path=str(OUT/f"{engine}-{width}-game.png"),full_page=True,animations="disabled")
        page.locator('[data-action="tab-playoff"]').click()
        page.locator('[data-field="format"]').select_option("fullFbs138")
        page.locator('[data-action="playoff-run"]').click(timeout=30000)
        page.locator(".champion-banner").wait_for(timeout=30000)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Playoff document overflow"
        page.screenshot(path=str(OUT/f"{engine}-{width}-playoffs.png"),full_page=True,animations="disabled")
        page.locator('[data-action="tab-research"]').click()
        page.locator(".audit-section").first.wait_for(timeout=30000)
        assert page.locator('.coverage-intro').evaluate("(el) => getComputedStyle(el).backgroundColor")=='rgb(32, 41, 53)', "Old dark olive uncertainty metric panel"
        assert page.locator('.coverage-intro strong').first.evaluate("(el) => getComputedStyle(el).color")=='rgb(255, 255, 255)', "Historical uncertainty numbers must contrast with dark metrics panel"
        assert page.locator('.audit-explainer p b').first.evaluate("(el) => getComputedStyle(el).color")=='rgb(27, 40, 51)', "Explainer emphasis cannot be white-on-white"

        displayed=page.locator('.data-grid article strong').all_text_contents()
        source_root=Path(__file__).resolve().parents[1]
        season=json.loads((source_root/'public/data/season-2026.json').read_text())
        roster=json.loads((source_root/'public/data/rosters-2026.json').read_text())
        expected=[str(season['allFbsSchoolsIdentified']),f"{season['gamesWithScores']:,}",f"{roster['totalPlayers']:,}"]
        assert displayed[:3]==expected, f"Research source labels mismatch committed data: expected {expected}, got {displayed}"

        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Research document overflow"
        page.screenshot(path=str(OUT/f"{engine}-{width}-research.png"),full_page=True,animations="disabled")
        assert not exceptions,f"{engine} JS exceptions: {exceptions}"
        print(json.dumps({"engine":engine,"width":width,"realWorker":True,"forecastRuns":850,
                          "fbs138Bracket":True,"screenshots":3,"javascriptErrors":0}))
        ctx.close()
    finally:
        browser.close()

if __name__=="__main__":
    with sync_playwright() as pw:
        for engine in ("chromium","webkit"):
            for width in (320,390,768,1370):
                check(getattr(pw,engine),engine,width)
