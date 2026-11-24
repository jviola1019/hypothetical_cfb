import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/app.js'),css=read('src/console-era.css'),html=read('index.html');
test('console shell follows the real reference composition with three functional modes',()=>{
 assert.ok(html.indexOf('src/console-era.css')>html.indexOf('src/retro-06.css'));
 assert.match(app,/tabNames=\{game:'Game',playoff:'Playoffs',research:'Model & validation'\}/);
 for(const fn of ['consoleMenu','consoleScorecard','consolePlayerArt','consoleGamePane','consoleGameContext','consoleBracketBoard','consolePlayoffShell','consoleResearchShell','consoleKeys']){
   assert.ok(app.includes('function '+fn+'('),'Missing real component: '+fn);
 }
 for(const token of ['.era-console-board','.era-left-rail','.era-stage-main','.era-right-rail','.era-hero-grid','.era-bracket-preview','.era-research-grid','.era-keybar']){
   assert.ok(css.includes(token),'Missing period-layout rule: '+token);
 }
 assert.ok(app.includes("a.startsWith('era-pane-')"));
 assert.ok(app.includes("a.startsWith('era-nav-')"));
});
test('console scoreboards and playoff preview come from canonical generated games',()=>{
 for(const token of [
  'consoleScorecard(g)','quarterTable(g)','g.final[i]','g.seed','g.drives.slice(-6)',
  'statsTable(g)','playerBoxes(g)','driveLog(g)','playablePairs(t)',
  'm.game','m.game.final','t.champion','t.seedingSource','state.tournament.rounds',
  'scoreboxFor(g)','tournamentOverview()','scoreboardAudit()'
 ])assert.ok(app.includes(token),token);
 assert.ok(app.includes('Historical research is not the fictional drive generator'));
 assert.match(app,/Generated outcomes are separate and not calibrated odds/);
 assert.match(app,/Participants are not the final announced playoff field/);
 assert.match(app,/previously inspected and is not a pristine holdout/);
});
test('vintage visual language is square, condensed, accessible and not publisher-branded',()=>{
 for(const token of ['Roboto Condensed','--era-red:#982634','--era-white:#f1f0eb','era-menu-item.selected','.era-score-row','.era-quarter-wrap','.era-bracket-team.won','.era-research-panel','@media(max-width:720px)','prefers-reduced-motion:reduce'])assert.ok(css.includes(token),token);
 assert.match(css,/min-height:44px/);
 assert.doesNotMatch(css,/ea-sports-logo|ncaa-logo|\bEA SPORTS\b/);
 assert.ok(app.includes('not actual players or verified 2026 uniforms'));
 assert.ok(app.includes('data-uniform-team'));
 assert.ok(app.includes('era-athlete-matchup'));
});
test('release keeps interactive report sections and data provenance outside the console viewport',()=>{
 for(const component of ['gamedayHud()','matchupForecast()','gameDetail(g)','injuryTicker()','propTable()','rosterCoverageCard(g)','personnelDesk()','syntheticDistribution()','historyTable()','seedEditor()','fullBracketView()','scoreboardAudit()','playoffGameInspector()','calibrationGraphic()','reliabilityPlot()','scoreEvaluation()','playerEvaluation()'])
   assert.ok(app.includes(component),component);
 assert.ok(app.includes('id="research-calibration"'));
 assert.ok(app.includes('id="research-player"'));
 assert.ok(app.includes('id="research-methods"'));
});

test('unknown late-round opponents remain explicit placeholders, not fabricated winners',()=>{
 assert.ok(app.includes('era-future-match'));
 assert.ok(app.includes('WINNER R'));
 assert.ok(app.includes('t.rounds[stage]'));
 assert.ok(css.includes('.era-bracket-match.era-future-match'));
});

test('desktop award phase compacts the champion panel so actual MVP cards appear immediately',()=>{
 for(const selector of ['.dynasty-showcase.stage-awards .showcase-spotlight','.dynasty-showcase.stage-awards .showcase-winner','.dynasty-showcase.stage-awards .awards-grid','.dynasty-showcase.stage-awards .award-card']){
  assert.ok(css.includes(selector),selector);
 }
});
