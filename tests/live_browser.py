#!/usr/bin/env python3
"""Real local HTTP ES modules + real browser Web Workers, not injected source stubs.

Chromium and WebKit desktop/mobile viewports. WebKit on Linux approximates
the rendering engine but is NOT physical iPhone Safari certification.
"""
from __future__ import annotations
import json
import os
import time
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
        assert page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(18, 19, 22)', "Console-era graphite background missing"
        assert page.locator('.brand-copy').evaluate("(el) => getComputedStyle(el).flexDirection")=='column', "Wordmark/subtitle should stack without collision"
        assert 'linear-gradient' in page.locator('.nav-item.active').evaluate("(e)=>getComputedStyle(e).backgroundImage"), "Console-era crimson selected navigation gradient missing"
        assert 'Roboto Condensed' in page.locator('.nav-item.active').evaluate("(e)=>getComputedStyle(e).fontFamily"), "Retro typography not applied"
        if not page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"):
            trace=page.evaluate("""() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:
              [...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:String(e.className?.baseVal||e.className||'').slice(0,80),
                right:Math.round(e.getBoundingClientRect().right),left:Math.round(e.getBoundingClientRect().left),
                width:Math.round(e.getBoundingClientRect().width)}))
                .filter(x=>x.right>innerWidth+2||x.left< -2).slice(0,32)
            })""")
            raise AssertionError(f"Console-era 320px body overflow: {json.dumps(trace)}")

        assert page.locator('.score-table tbody td').first.evaluate("(el) => getComputedStyle(el).backgroundColor")=='rgb(36, 40, 48)', "Retro-06 score table failed to style"
        assert page.locator('.score-table tbody td').first.evaluate("(el) => getComputedStyle(el).color")=='rgb(255, 255, 255)', "Retro-06 quarter scores lack readable contrast"

        assert "heritage-stadium.svg" in page.locator('.topbar').evaluate("(el) => getComputedStyle(el).backgroundImage"), "Console-era stadium masthead not used"
        assert page.evaluate("fetch('./public/assets/heritage-stadium.svg').then(r => r.ok)"), "Heritage stadium illustration missing"
        # The new console scorecard and the inspectable generated scorebug are one game.
        compact=page.locator('.era-score-row>strong').all_text_contents()
        canonical=page.locator('.fixture-score-number b').all_text_contents()
        assert [s.strip() for s in compact]==[s.strip() for s in canonical], 'Compact console scores diverge from canonical fixture'
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

        original_game_seed=page.locator('.game-canvas .fixture-score').get_attribute('data-game-seed')
        original_game_stats=page.locator('#game-details .stat-table').first.inner_text()
        page.locator('.game-canvas [data-action="new-game"]').click()
        replay_game_seed=page.locator('.game-canvas .fixture-score').get_attribute('data-game-seed')
        replay_game_stats=page.locator('#game-details .stat-table').first.inner_text()
        assert replay_game_seed!=original_game_seed, f"Single-game replay reused its prior seed ({replay_game_seed})"
        assert replay_game_stats!=original_game_stats, "Fresh game seed reproduced the identical complete team stat box"
        assert page.locator('.game-canvas .scorebox-verification.passed').count()==1, "Replayed game failed scorebook reconciliation"

        if engine=='chromium' and width==390:
            # Dated injury is game-specific, not a lifetime state. Select OSU
            # and confirm 2026 roster-linked QB replacement is source-graded.
            page.locator('[data-field="a"]').select_option('oregon-state')
            page.locator('[data-field="b"]').select_option('ohio-state')
            page.locator('.market-ledger').wait_for(timeout=60000)
            source_root=Path(__file__).resolve().parents[1]
            weekly=json.loads((source_root/'public/data/weekly-lineups-2026.json').read_text())
            from datetime import datetime, timezone
            day=datetime.now(timezone.utc).date().isoformat()
            expected_qb=weekly['teams']['oregon-state']['roles']['QB']['name']
            assert page.locator('.personnel-desk').get_by_text(expected_qb).count()>=1
            atkinson=next((r for r in weekly['teams']['oregon-state']['unavailable'] if r['name']=='Braden Atkinson'),None)
            current=weekly['weekStart']<=day<=weekly['weekEnd']
            if atkinson and current:
                assert page.locator('#game-availability').get_by_text('Braden Atkinson').count()>=1
            elif not current:
                assert page.locator('#game-availability').get_by_text('Braden Atkinson').count()==0, 'Expired injury must not remain reported current'
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Availability interaction introduced page overflow"

        if not page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"):
            trace=page.evaluate("""() => ({
              viewport:innerWidth,scroll:document.documentElement.scrollWidth,
              offenders:[...document.querySelectorAll('body *')]
                .map(e=>({tag:e.tagName,cls:String(e.className?.baseVal||e.className||'').slice(0,100),
                           text:(e.textContent||'').trim().slice(0,45),right:Math.round(e.getBoundingClientRect().right),
                           width:Math.round(e.getBoundingClientRect().width)}))
                .filter(x=>x.right>innerWidth+2 || x.width>innerWidth+16)
                .slice(0,22)
            })""")
            raise AssertionError(f"Mobile document overflow {engine} {width}: {json.dumps(trace)}")
        page.screenshot(path=str(OUT/f"{engine}-{width}-game.png"),full_page=width<1100,animations="disabled")
        # Full tournament must NOT instantly disclose the result: a genuinely
        # timed, deterministic, multi-stage broadcast runs before champion reveal.
        page.locator('[data-action="tab-playoff"]').click()
        page.locator('[data-field="format"]').select_option("fullFbs138")
        assert page.locator('.swap-desk .swap-label b').evaluate("(e)=>getComputedStyle(e).color")=='rgb(241, 239, 234)', "Seed-trade label must not be white-on-cream"
        assert page.locator('.swap-desk').evaluate("(e)=>getComputedStyle(e).backgroundColor")=='rgb(37, 40, 46)', "Retro seed-trade editor still inherits a cream surface"
        assert page.locator('.seed-expander summary').evaluate("(e)=>getComputedStyle(e).backgroundColor")=='rgb(37, 40, 46)', "Expanded field menu lacks the retro graphite bar"

        initial_tournament_seed=page.locator('.tournament-overview').get_attribute('data-tournament-seed')
        assert initial_tournament_seed and initial_tournament_seed.isdigit()
        assert page.locator('.playoff-theater').count()==1
        assert page.locator('[data-action="playoff-next"]').count()==1
        start_clock=time.monotonic()
        page.locator('[data-action="playoff-run"]').click(timeout=30000)
        page.locator('#dynasty-showcase').wait_for(timeout=5000)
        assert page.locator('#dynasty-showcase.stage-champion').count()==0, "Premature champion/award disclosure"
        assert page.locator('#dynasty-showcase .awards-showcase').count()==0
        assert page.locator('#dynasty-showcase').evaluate("(e)=>getComputedStyle(e).position")=="fixed"
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), "Broadcast overlay horizontal overflow"
        # It must progress through actual rounds while the viewer is watching.
        page.locator('#dynasty-showcase.stage-round').wait_for(timeout=9000)
        page.locator('#dynasty-showcase.stage-champion').wait_for(timeout=21000)
        elapsed=time.monotonic()-start_clock
        assert elapsed>=10.0, f"Champion revealed too early ({elapsed:.2f}s)"
        if engine=='chromium' and width in (390,1366):
            page.screenshot(path=str(OUT/f"{engine}-{width}-champion-reveal.png"),full_page=False,animations="allow")
        assert page.locator('#dynasty-showcase .showcase-winner').count()==1
        assert page.locator('#dynasty-showcase .era-ceremony-trophy').count()==1, "Original trophy illustration missing"
        assert page.locator('#dynasty-showcase .era-title-final').count()==1, "Generated championship score presentation missing"
        assert ':' in page.locator('#dynasty-showcase .era-title-final strong').inner_text(), "Championship score format missing"
        page.locator('#dynasty-showcase.stage-awards').wait_for(timeout=21000)
        assert page.locator('#dynasty-showcase .award-card').count()==4, "MVP OPOY DPOY and title-game MVP missing"
        if width<680:
            award_position=page.locator('#dynasty-showcase .awards-head').evaluate("(e)=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:innerHeight})")
            assert 0<=award_position['top']<award_position['height'] and award_position['bottom']>0, f"Mobile award ceremony announced off-screen: {award_position}"
        if engine=='chromium' and width in (390,1366):
            page.screenshot(path=str(OUT/f"{engine}-{width}-award-ceremony.png"),full_page=False,animations="allow")
        page.locator('#dynasty-showcase.stage-finish').wait_for(timeout=23000)
        if width<680:
            head_position=page.locator('#dynasty-showcase .awards-head').evaluate("(e)=>e.getBoundingClientRect().top")
            assert 0<=head_position<page.evaluate('innerHeight'), f"Final ceremony unexpectedly reset mobile trophy case scroll: {head_position}"
        assert page.locator('#dynasty-showcase [data-action="showcase-dismiss"]').count()==1
        page.locator('#dynasty-showcase [data-action="showcase-dismiss"]').click()
        assert page.locator('#dynasty-showcase').count()==0
        assert '137 / 137' in page.locator('.tournament-overview').inner_text(), "Not all 138-team games completed"
        assert page.locator('.tournament-overview').get_attribute('data-tournament-seed')==initial_tournament_seed, "Run changed seeds during its own rounds"
        assert page.locator('.awards-showcase .award-card').count()==4
        assert '137 / 137' in page.locator('.scorebox-audit-title').inner_text(), "Every scorebox must reconcile"
        assert page.locator('.scorebox-audit.failed').count()==0
        assert page.locator('.scorebox-directory').count()==1
        page.locator('[data-action="bracket-full"]').click()
        assert page.locator('.full-bracket').count()==1
        assert page.locator('.full-match.played').count()==137, "Complete all-round tree must show all played fixtures"
        assert page.locator('.full-bracket-scroll').evaluate("(e)=>e.scrollWidth>e.clientWidth"), "Full tree must be independently horizontally scrollable"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Full bracket caused body overflow"
        if engine=='chromium' and width==390:
            first_honors=page.locator('.titles-section .award-card .award-stat').all_text_contents()
            first_round_scorebook=page.locator('.scorebox-directory tbody tr').all_text_contents()[:10]
            page.locator('[data-action="playoff-reset"]').click()
            reset_seed=page.locator('.tournament-overview').get_attribute('data-tournament-seed')
            assert reset_seed!=initial_tournament_seed, "Reset recreated the old deterministic bracket instead of a new seeded run"
            page.locator('[data-action="playoff-next"]').click()
            assert '10 / 137' in page.locator('.tournament-overview').inner_text(), "Incorrect 138-team opening play-in"
            second_round_scorebook=page.locator('.scorebox-directory tbody tr').all_text_contents()
            assert second_round_scorebook!=first_round_scorebook, "Reseeded first-round scorebook did not change"
            assert page.locator('.tournament-overview').get_attribute('data-tournament-seed')==reset_seed, "Seed changed during a stepwise tournament"
            page.locator('[data-action="playoff-next"]').click()
            assert '74 / 137' in page.locator('.tournament-overview').inner_text(), "Incorrect 64-game second stage"
            page.locator('[data-action="playoff-run"]').click()
            page.locator('#dynasty-showcase.stage-finish').wait_for(timeout=25000)
            page.locator('#dynasty-showcase [data-action="showcase-dismiss"]').click()
            assert '137 / 137' in page.locator('.tournament-overview').inner_text(), "Resume-from-round full tournament failed"
            replay_honors=page.locator('.titles-section .award-card .award-stat').all_text_contents()
            assert replay_honors!=first_honors, "New tournament awards reused stale player statistics"
            assert page.locator('.tournament-overview').get_attribute('data-tournament-seed')==reset_seed
        page.screenshot(path=str(OUT/f"{engine}-{width}-playoffs.png"),full_page=width<1100,animations="disabled")
        if engine=='chromium' and width==390:
            previous_complete_seed=page.locator('.tournament-overview').get_attribute('data-tournament-seed')
            page.locator('[data-action="playoff-next"]').click()
            next_title_seed=page.locator('.tournament-overview').get_attribute('data-tournament-seed')
            assert next_title_seed!=previous_complete_seed, "New round after a completed title reused the previous tournament seed"
        page.locator('[data-action="tab-research"]').click()
        page.locator(".audit-section").first.wait_for(timeout=30000)
        assert page.locator('.era-reports .coverage-intro').first.evaluate("(el) => getComputedStyle(el).backgroundColor")=='rgb(36, 39, 45)', "Retro-06 uncertainty metric panel missing"
        assert page.locator('.era-research-board .coverage-intro').count()==1, "Compact console validation interval study missing"

        assert page.locator('.coverage-intro strong').first.evaluate("""(el) => {
            const luminance = color => {
              const v=color.match(/\\d+/g).slice(0,3).map(Number).map(x=>{
                const n=x/255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;
              });
              return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
            };
            const fg=luminance(getComputedStyle(el).color);
            const bg=luminance(getComputedStyle(el.closest('.coverage-intro')).backgroundColor);
            return (Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05)>=4.5;
        }"""), "Historical uncertainty numbers must meet 4.5:1 contrast, whether white or warm off-white"
        assert page.locator('.audit-explainer p b').first.evaluate("(el) => getComputedStyle(el).color")=='rgb(246, 244, 239)', "Retro-06 explanatory emphasis lacks light-on-dark contrast"

        displayed=page.locator('.data-grid article strong').all_text_contents()
        source_root=Path(__file__).resolve().parents[1]
        season=json.loads((source_root/'public/data/season-2026.json').read_text())
        roster=json.loads((source_root/'public/data/rosters-2026.json').read_text())
        expected=[str(season['allFbsSchoolsIdentified']),f"{season['gamesWithScores']:,}",f"{roster['totalPlayers']:,}"]
        assert displayed[:3]==expected, f"Research source labels mismatch committed data: expected {expected}, got {displayed}"

        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+2"), "Research document overflow"
        page.screenshot(path=str(OUT/f"{engine}-{width}-research.png"),full_page=width<1100,animations="disabled")
        assert not exceptions,f"{engine} JS exceptions: {exceptions}"
        print(json.dumps({"engine":engine,"width":width,"realWorker":True,"forecastRuns":850,
                          "fbs138Bracket":True,"screenshots":3,"javascriptErrors":0}))
        ctx.close()
    finally:
        browser.close()

if __name__=="__main__":
    with sync_playwright() as pw:
        for engine in ("chromium","webkit"):
            for width in (320,390,430,768,1024,1366,1920):
                check(getattr(pw,engine),engine,width)
