import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateGame,DEFAULT_CONFIG} from '../src/engine.js';
import {auditGeneratedGame} from '../src/gameAudit.js';
import {assess} from '../scripts/evaluate_playable_generator.mjs';
import {installPlayableCalibration,pregameScoringFor} from '../src/playableCalibration.js';

test('fixed pregame scoring inputs remain seed-repeatable and preserve real drive ledgers',()=>{
 const c={...DEFAULT_CONFIG,pregameScoring:{a:37,b:19,base:27,volatility:.3}};
 const a=simulateGame(c,19),b=simulateGame(c,19);
 assert.deepEqual(a,b);
 assert.equal(auditGeneratedGame(a),true);
 assert.equal(a.scoringMode,'research-conditioned-drive-intensity-not-player-calibration');
});
test('time-safe higher target points increase a teams synthetic scoring intensity',()=>{
 const before={...DEFAULT_CONFIG,pregameScoring:{a:13,b:26,base:27}};
 const after={...DEFAULT_CONFIG,pregameScoring:{a:44,b:26,base:27}};
 let low=0,high=0;
 for(let seed=1;seed<=120;seed++){
  const a=simulateGame(before,seed),b=simulateGame(after,seed);
  low+=a.final[0];high+=b.final[0];
  assert.equal(auditGeneratedGame(a),true);assert.equal(auditGeneratedGame(b),true);
 }
 assert.ok(high-low>900,`higher score target increased mean by only ${(high-low)/120}`);
});
test('malformed, oversized or missing point references cannot bypass configuration checks',()=>{
 for(const target of [{a:10,b:90,base:27},{a:NaN,b:22,base:27},{a:30,b:30,base:1},{a:20,b:20,base:Infinity},{a:20,base:27},{a:20,b:20,base:27,volatility:.9},null]){
   assert.throws(()=>simulateGame({...DEFAULT_CONFIG,pregameScoring:target},3),/Invalid temporal scoring inputs/);
 }
});
test('actual engine evaluator reports finite count-conserving pregame error metrics',()=>{
 const fixtures=Array.from({length:306},(_,i)=>({
  id:'test-'+i,a:'ole-miss',b:'georgia',venue:i%2?'a':'neutral',
  expectedA:27,expectedB:24,actualA:i%3===0?24:34,actualB:i%4===0?21:27
 }));
 const x=assess(fixtures,27,6);
 assert.equal(x.n,306);assert.equal(x.unsupported,0);
 for(const k of ['scoreMAE','flatScoreMAE','marginMAE','totalMAE','brier','coverage80Margin','coverage80Total','marginCRPS','totalCRPS'])
   assert.ok(Number.isFinite(x[k]),k);
 assert.ok(x.brier>=0&&x.brier<=1);
 assert.ok(x.coverage80Margin>=0&&x.coverage80Margin<=1);
});
test('calibration artifact cannot activate without historically evaluated validation improvement',()=>{
 const metrics={n:808,scoreMAE:10,flatScoreMAE:14,marginMAE:15,totalMAE:12,brier:.20,coverage80Margin:.76,coverage80Total:.77,marginCRPS:10,totalCRPS:9};
 const doc={schemaVersion:1,modelVersion:'temporal-drive-intensity-v2',
  classification:'2024-fit-2025-gate-2026-previously-inspected-check',base:27,volatility:.3,fitGames:798,
  validation2025:metrics,evaluation2026:{...metrics,n:676},enabled:true,sourceCutoff:'2026-11-22'};
 assert.equal(installPlayableCalibration(doc).base,27);
 assert.equal(installPlayableCalibration(doc).volatility,.3);
 assert.equal(pregameScoringFor(DEFAULT_CONFIG),null,'no current research data means no fabricated conditioning');
 assert.throws(()=>installPlayableCalibration({...doc,validation2025:{...metrics,brier:.32}}),/Unjustified/);
 assert.throws(()=>installPlayableCalibration({...doc,validation2025:{...metrics,coverage80Margin:.67}}),/Unjustified/);
});
