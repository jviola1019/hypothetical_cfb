import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/stadium-edition.css',import.meta.url),'utf8');
test('game result precedes provenance, and optional chart research follows core reporting',()=>{
 const page=app.slice(app.indexOf('function gamePage()'),app.indexOf('function tournamentOverview()'));
 assert.ok(page.indexOf('matchupPicker()}')<page.indexOf('game-canvas'));
 assert.ok(page.indexOf('scoreboard(g)')<page.indexOf('rosterCoverageCard(g)'));
 assert.ok(page.indexOf('gameDetail(g)')<page.indexOf('syntheticDistribution()'));
});
test('box scores precede optional game tape',()=>{
 const section=app.slice(app.indexOf('function gameDetail('),app.indexOf('function syntheticDistribution('));
 assert.ok(section.includes('game-tape'));
 assert.ok(section.indexOf('ledger-grid')<section.indexOf('game-tape'));
});
test('keyboard access and report focus are explicit',()=>{
 assert.ok(app.includes('class="skip-link"'));
 assert.ok(app.includes('current?.dataset?.field'));
 assert.ok(app.includes('next?.focus({preventScroll:true})'));
 assert.ok(app.includes("root.querySelector('#game-inspector')?.focus({preventScroll:true})"));
 assert.ok(html.includes('src/stadium-edition.css'));
 assert.ok(css.includes('.skip-link:focus'));
 assert.ok(css.includes('.table-scroll:focus-visible'));
});
test('title study discloses variable sample size instead of implying fixed 400',()=>{
 assert.equal(app.includes('replay the entire bracket 400 times'),false);
 assert.ok(app.includes('Sample counts depend on available browser capabilities'));
});
test('mobile scoreboard and reduced motion constraints remain',()=>{
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(css.includes('.fixture-score-number{font-size:clamp('));
});
