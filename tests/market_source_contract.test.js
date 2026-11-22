import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
test('public Game tab reports auditable exact counts instead of unlabeled sampling odds',()=>{
 const game=app.slice(app.indexOf('function marketLedgerView('),app.indexOf('function propTable()'));
 for(const key of ['v.wins.a','v.wins.b','v.cover.a','v.cover.b','v.cover.push','v.points.over','v.points.under','v.points.push','v.joint.winAndNoCover','v.joint.lossAndCover']) assert.ok(game.includes(key),key);
 assert.match(game,/same .*? synthetic games as the histograms/);
 assert.match(game,/marketLedgerView\(m\)/);
 assert.match(game,/histogram\(m\.margin,m\.markets\?\.reference\.marginThreshold/);
 assert.match(game,/histogram\(m\.total,m\.markets\?\.reference\.totalLine/);
});
test('research probability and scoring-rate point-pair arithmetic remain separate and internally exact',()=>{
 const research=app.slice(app.indexOf('function matchupForecast()'),app.indexOf('function scoreboard('));
 assert.match(research,/aTenths=Math\.round\(e\.expectedA\*10\),bTenths=Math\.round\(e\.expectedB\*10\)/);
 assert.match(research,/const displayedMargin=\(aTenths-bTenths\)\/10,displayedTotal=\(aTenths\+bTenths\)\/10/);
 assert.match(research,/e\.expectedMargin/);
 assert.match(research,/SCORE-ESTIMATE MARGIN/);
 assert.match(research,/SCORE-ESTIMATE TOTAL/);
 assert.match(research,/These are NOT validated sportsbook spreads/);
 assert.doesNotMatch(research,/illustrativeMarginFromProbability/);
});
test('the ledger is scrollable and small screen evidence labels cannot expand the page',()=>{
 assert.match(css,/\.ledger-scroll\{[^}]*overflow-x:auto/);
 assert.match(css,/\.snapshot-head\{flex-wrap:wrap\}/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
