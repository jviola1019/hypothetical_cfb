import test from 'node:test';
import assert from 'node:assert/strict';
import {TEAMS,DEFAULT_CONFIG,simulateGame,simulateBatch,hash32} from '../src/engine.js';
import {FORMATS,createTournament,simulateTournament,monteCarloTournament} from '../src/tournament.js';

test('cross-program scoring, clock, and player reconciliation property stress',()=>{
 for(let ix=0;ix<24;ix++){
  const cfg={...DEFAULT_CONFIG,a:TEAMS[ix*5].id,b:TEAMS[ix*5+1].id,venue:ix%3===0?'neutral':ix%3===1?'a':'b'};
  for(let seed=0;seed<100;seed++){
   const g=simulateGame(cfg,hash32('stress:'+ix+':'+seed));
   assert.equal(g.winner,g.final[0]>g.final[1]?cfg.a:cfg.b);
   assert.notEqual(g.final[0],g.final[1]);
   assert.ok(g.drives.every(d=>d.points>=0&&[0,2,3,6,7,8].includes(d.points)));
   for(const t of g.teams){
    const p=t.players;
    assert.equal(t.points,t.byQuarter.reduce((s,x)=>s+x,0)+t.overtimePoints);
    assert.equal(t.drives,g.drives.filter(d=>d.offense===t.team).length);
    assert.equal(t.plays,g.drives.filter(d=>d.offense===t.team).reduce((s,d)=>s+d.plays,0));
    assert.equal(t.completions,p.QB.completions);
    assert.equal(t.passYards,p.QB.passingYards);
    assert.equal(t.passYards,p.RB.receivingYards+p.WR1.receivingYards+p.WR2.receivingYards+p.TE.receivingYards);
    assert.ok(t.twoPointMade<=t.twoPointAttempts);
    assert.ok([p.RB,p.WR1,p.WR2,p.TE].every(x=>x.receptions<=x.targets));
   }
  }
 }
});

test('whole-bracket championship distributions sum to one for multiple fields',()=>{
 for(const fmt of ['fbs12','fbs24','custom32','custom68']){
  const t=createTournament(fmt);
  const r=monteCarloTournament(t,30,DEFAULT_CONFIG);
  const total=Object.values(r.probabilities).reduce((s,v)=>s+v,0);
  assert.ok(Math.abs(total-1)<1e-12,fmt);
  assert.equal(Object.values(r.counts).reduce((s,v)=>s+v,0),30);
  assert.deepEqual(r,monteCarloTournament(t,30,DEFAULT_CONFIG));
 }
});
