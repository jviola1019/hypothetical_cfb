import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CONFIG,hash32,simulateGame} from '../src/engine.js';
import {auditGeneratedGame} from '../src/gameAudit.js';

const matchups=[['ole-miss','georgia'],['indiana','alabama'],['utah','texas'],['ohio-state','michigan']];
test('hundreds of deterministic generated games satisfy game and player accounting contracts',()=>{
 for(let i=0;i<650;i++){
  const [a,b]=matchups[i%matchups.length];
  const config={...DEFAULT_CONFIG,a,b,venue:['a','b','neutral'][i%3],seed:hash32(`integrity-${i}`)};
  const game=simulateGame(config);
  assert.equal(auditGeneratedGame(game),true, `fixture ${i}`);
  if(i%97===0)assert.deepEqual(simulateGame(config),game);
 }
});

test('auditor detects drive/score and athlete-stat corruption',()=>{
 const g=simulateGame(DEFAULT_CONFIG);
 const broken=structuredClone(g);broken.teams[0].points++;
 assert.throws(()=>auditGeneratedGame(broken),/final score/);
 const invalid=structuredClone(g);invalid.teams[0].players.QB.completions++;
 assert.throws(()=>auditGeneratedGame(invalid),/quarterback passing totals/);
});
