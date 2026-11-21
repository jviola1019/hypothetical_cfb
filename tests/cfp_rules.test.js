import test from 'node:test';import assert from 'node:assert/strict';
import {CFP_RULES,roundSite,rulesOrder,FORMAT_MAP,createTournament,simulateTournament,finalizeRound,simulatePair,playablePairs} from '../src/tournament.js';
test('CFP season-specific rule metadata and sites stay accurate',()=>{
 assert.equal(CFP_RULES.fbs12.effective,'2026-27');assert.equal(CFP_RULES.fbs12.atLarge,7);
 assert.equal(CFP_RULES.fbs24.effective,'2027-28');assert.equal(CFP_RULES.fbs24.atLarge,19);
 assert.deepEqual(Array.from({length:4},(_,i)=>roundSite('fbs12',i)),['campus','CFP bowl','CFP bowl','championship host']);
 assert.deepEqual(Array.from({length:5},(_,i)=>roundSite('fbs24',i)),['campus','campus','CFP bowl','CFP bowl','championship host']);
 assert.equal(CFP_RULES.fbs12.reseeding,false);assert.equal(CFP_RULES.fbs24.reseeding,false);
});
test('every played CFP game has correct site category and venue home/neutral',()=>{
 for(const f of ['fbs12','fbs24']){
  const t=simulateTournament(createTournament(f));
  for(let i=0;i<t.rounds.length;i++){
   for(const m of t.rounds[i].matches){if(!m.game)continue;
    assert.equal(m.game.config.siteKind,roundSite(f,i));
    assert.equal(m.game.config.venue,roundSite(f,i)==='campus'?'a':'neutral');
   }
  }
 }
});
test('client-state tampering cannot advance forged score or winner',()=>{
 let t=createTournament('fbs12');const first=playablePairs(t)[0];t=simulatePair(t,first.index);
 assert.throws(()=>finalizeRound({...t,played:{...t.played,[first.index]:{...t.played[first.index],winner:'fake'}}}),/validation/);
 assert.throws(()=>finalizeRound({...t,played:{...t.played,[first.index]:{...t.played[first.index],final:[-1,8]}}}),/validation/);
});
