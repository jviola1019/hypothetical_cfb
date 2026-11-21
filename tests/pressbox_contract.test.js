import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_CONFIG,simulateBatch,simulateGame,hash32} from '../src/engine.js';
import {createTournament,simulateTournament} from '../src/tournament.js';
import {evaluatedMatchup} from '../src/research.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');

test('pressbox keeps exactly three distinct top-level destinations and only three editable game selectors',()=>{
 assert.match(app,/tabNames=\{game:'Game',playoff:'Playoffs',research:'Model & validation'\}/);
 const builder=app.slice(app.indexOf('function matchupPicker(){'),app.indexOf('function matchupForecast(){'));
 const actual=[...builder.matchAll(/ctl\('(a|b|venue)'/g)].map(m=>m[1]).sort();
 assert.deepEqual(actual,['a','b','venue']);
 assert.doesNotMatch(builder,/data-field="(pace|spread|total|seed|injury|shift)"/);
});
test('research probabilities are never substituted by fictitious sample percentages in the primary research presentation',()=>{
 const research=app.slice(app.indexOf('function matchupForecast(){'),app.indexOf('function scoreboard('));
 assert.match(research,/evaluatedMatchup\(state\.config\.a,state\.config\.b,state\.config\.venue\)/);
 assert.match(research,/if\(!e\)return/);
 assert.match(research,/No independently fitted projection loaded/);
 assert.match(research,/percent\(e\.pA\)/);
 assert.doesNotMatch(research,/percent\(m\.pA\)/);
});
test('generated game uses same final score as team boxes, scoring table and drive-tape data',()=>{
 const game=simulateGame(DEFAULT_CONFIG);
 assert.equal(game.final[0],game.teams[0].points);
 assert.equal(game.final[1],game.teams[1].points);
 assert.equal(game.total,game.final[0]+game.final[1]);
 const margin=game.final[0]-game.final[1];
 assert.equal(game.margin,margin);
 assert.equal(simulateGame(DEFAULT_CONFIG).final.join(':'),game.final.join(':'));
});
test('simulated win frequencies are complementary and clearly unlike an empirical prediction when model artifact absent',()=>{
 const m=simulateBatch(DEFAULT_CONFIG,250);
 assert.equal(m.pA+m.pB,1);
 assert.equal(evaluatedMatchup('ole-miss','georgia','neutral'),null);
 assert.ok(m.pA>=0&&m.pA<=1);
 assert.ok(m.mcse<=.5/Math.sqrt(m.n)+1e-12);
});
test('every bracket result is inspectable by a unique played game and exactly N-1 games occur',()=>{
 for(const fmt of ['fbs12','fbs24','custom68']){
  const t=simulateTournament(createTournament(fmt));
  const games=t.rounds.flatMap(r=>r.matches.filter(m=>m.game));
  assert.equal(games.length,t.participants.length-1);
  assert.equal(new Set(games.map(x=>x.game.id)).size,games.length);
  assert.ok(t.champion);
 }
});
test('three-tab navigation, reduced motion, visible focus, and data provenance remain present in the stylesheet',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/--night:#080c0b/);
 assert.match(app,/Hypothetical • uncalibrated/);
 assert.match(app,/2026 is not pristine holdout data/);
 assert.match(app,/Missing games and nonparticipation are not modeled as zeros/);
 assert.match(app,/Official format geometry, hypothetical entrants/);
});
