import test from 'node:test';
import assert from 'node:assert/strict';
import {simulatedMarketLedger,illustrativeMarginFromProbability} from '../src/marketAudit.js';
import {DEFAULT_CONFIG,simulateGame,simulateBatch,hash32} from '../src/engine.js';
const g=(a,b)=>({final:[a,b],margin:a-b,total:a+b,config:{a:'team-a',b:'team-b'},winner:a>b?'team-a':'team-b'});
test('win, cover, and over are different events with exact auditable counts',()=>{
  const x=simulatedMarketLedger([g(21,17),g(17,21),g(17,14),g(28,20)],{spreadA:-3.5,totalLine:39.5});
  assert.equal(x.n,4);assert.deepEqual(x.wins,{a:3,b:1});assert.deepEqual(x.cover,{a:2,b:2,push:0});
  assert.deepEqual(x.points,{over:1,under:3,push:0});
  assert.equal(x.joint.winAndCover,2);assert.equal(x.joint.winAndNoCover,1);assert.equal(x.joint.lossAndNoCover,1);
  assert.equal(x.rates.winA,.75);assert.equal(x.rates.coverA,.5);
});
test('integer spread/total push is visible and reconciled',()=>{
  const x=simulatedMarketLedger([g(24,21),g(25,21),g(17,21)],{spreadA:-3,totalLine:45});
  assert.deepEqual(x.cover,{a:1,b:1,push:1});assert.deepEqual(x.points,{over:1,under:1,push:1});
  assert.equal(x.joint.winAndPush,1);
});
test('default reference is a half-point and sample mean is exact',()=>{
 const x=simulatedMarketLedger([g(35,20),g(14,21),g(17,10)]);
 assert.equal(x.reference.spreadA%1,-.5);assert.equal(x.reference.totalLine%1,.5);
 assert.equal(x.wins.a+x.wins.b,x.n);assert.equal(x.meanMargin,5);
});
test('rejects fabricated or impossible scores, bad lines and samples',()=>{
 for(const fixture of [[],[g(21,21)],[{...g(21,7),margin:13}],[{...g(21,7),winner:'team-b'}],[g(-1,21)]])assert.throws(()=>simulatedMarketLedger(fixture));
 for(const opt of [{spreadA:Infinity},{totalLine:-1},{spreadA:'-3.5'}])assert.throws(()=>simulatedMarketLedger([g(17,14)],opt));
});
test('outcomeSummary uses the same 850-game ledger, not estimated counts',()=>{
 const c={...DEFAULT_CONFIG,a:'ole-miss',b:'georgia'};
 const x=simulateBatch(c,850,hash32('market-fixture'));
 assert.equal(x.markets.n,x.n);assert.equal(x.markets.wins.a/x.n,x.pA);assert.equal(x.markets.wins.b/x.n,x.pB);
 assert.equal(x.markets.cover.a+x.markets.cover.b+x.markets.cover.push,x.n);
 assert.equal(x.markets.points.over+x.markets.points.under+x.markets.points.push,x.n);
 assert.equal(x.markets.joint.winAndCover+x.markets.joint.winAndNoCover+x.markets.joint.winAndPush,x.markets.wins.a);
 assert.equal(x.markets.meanMargin,Number(x.marginMean.toFixed(10)));
});
test('probability-to-margin illustration always has the same favorite direction',()=>{
 for(const p of [.001,.05,.25,.49,.5,.51,.8,.98,.999]){
  const x=illustrativeMarginFromProbability(p,[-24,25]);assert.ok(x);
  assert.equal(Math.sign(x.margin),Math.sign(p-.5));
  assert.ok(Math.abs(1/(1+Math.exp(-x.margin/x.scale))-p)<1e-12);
 }
 for(const bad of [0,1,NaN,Infinity])assert.equal(illustrativeMarginFromProbability(bad,[-20,20]),null);
});

test('outcomeSummary refuses to merge samples from different team orders or venues',async()=>{
 const {outcomeSummary}=await import('../src/engine.js');
 const first=simulateGame(DEFAULT_CONFIG,11);
 const swapped=simulateGame({...DEFAULT_CONFIG,a:DEFAULT_CONFIG.b,b:DEFAULT_CONFIG.a},12);
 const neutral=simulateGame({...DEFAULT_CONFIG,venue:'a'},13);
 assert.throws(()=>outcomeSummary([first,swapped],DEFAULT_CONFIG),/Mixed matchup/);
 assert.throws(()=>outcomeSummary([first,neutral],DEFAULT_CONFIG),/Mixed matchup/);
});
