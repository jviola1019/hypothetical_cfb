import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHOWCASE} from '../src/dynastyCeremony.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('src/retro-06.css');
const app=read('src/app.js'),charts=read('src/charts.js');
const contrast=(a,b)=>{
 const lum=h=>h.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)/255)
 .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
 .reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
test('Retro 06 loads last, with readable graphite/crimson independent brand',()=>{
 assert.match(html,/src\/retro-06\.css/);
 assert.ok(html.indexOf('src/retro-06.css')>html.indexOf('src/heritage-dynasty.css'));
 assert.ok(html.indexOf('src/retro-06.css')>html.indexOf('src/stadium-edition.css'));
 assert.match(css,/--retro-red:#a52b39/);
 assert.match(css,/--retro-slate:#24272d/);
 assert.match(css,/Roboto Condensed/);
 assert.match(css,/Arial Narrow/);
 assert.match(css,/\.nav-item\.active/);
 assert.match(css,/\.page-intro/);
 assert.match(css,/\.showcase-scorestrip/);
 assert.match(css,/\.award-card/);
 assert.ok(contrast('#f1efe9','#111318')>15);
 assert.ok(contrast('#ffffff','#9b2836')>=4.5);
 assert.doesNotMatch(css,/ncaa-logo\.svg|ea-sports\.png|https?:\/\/.*\/team-logos/i);
});
test('design covers game, tournament, model graphics and table families',()=>{
 for(const selector of [
  '.fixture-score','.fixture-score-number','.score-table','.stat-table',
  '.game-canvas','.player-card','.prop-table','.viz-sheet','svg.viz',
  '.audit-meter','.market-ledger','.playoff-console','.tournament-overview',
  '.bracket-scroll','.full-bracket-scroll','.playoff-theater','.dynasty-showcase',
  '.showcase-progress-track','.awards-showcase','.award-card'
 ])assert.ok(css.includes(selector),'Missing retro theme for '+selector);
 for(const term of ['@media(max-width:1050px)','@media(max-width:760px)','@media(max-width:410px)',
  'prefers-reduced-motion:reduce',':focus-visible','min-height:44px','overflow-x:auto'])
   assert.ok(css.includes(term),'Missing '+term);
 for(const fn of ['function awardsShowcase(', 'function fullBracketView(',
    'function scoreboardAudit(', 'function playoffTheater('])
   assert.ok(app.includes(fn),'Missing functional component '+fn);
 assert.ok(app.includes('role="progressbar"'));
 assert.match(charts,/export function histogram/);
});
test('retro skin cannot misrepresent fictional output as validated prediction',()=>{
 assert.doesNotMatch(css,/calibrated gameplay|guaranteed win|Model Validated/i);
 assert.match(app,/2026 is not pristine holdout data/);
 assert.match(app,/SCOREBOX RECONCILED/);
 assert.match(app,/synthetic allocations/);
 assert.equal(SHOWCASE.championRevealMs,11600);
 assert.equal(SHOWCASE.awardRevealMs,13200);
 assert.equal(SHOWCASE.finishMs,15000);
});
