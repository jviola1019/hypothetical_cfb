import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATS,createTournament,simulateTournament,swapTournamentSeeds,seedOrder} from '../src/tournament.js';
import {FBS_TEAMS} from '../src/catalog.js';

const publicFormats=FORMATS.filter(x=>x.kind!=='fcs-inspired');
test('every public format completes with one champion, unique participants and exactly N-1 played games',()=>{
  for(const fmt of publicFormats){
    const initial=createTournament(fmt.id);
    const final=simulateTournament(initial);
    const games=final.rounds.flatMap(r=>r.matches.filter(m=>m.game));
    assert.equal(initial.participants.length,fmt.size,fmt.id);
    assert.equal(new Set(initial.participants).size,fmt.size,fmt.id);
    assert.equal(games.length,fmt.size-1,fmt.id);
    assert.ok(initial.participants.includes(final.champion),fmt.id);
    assert.ok(games.every(x=>initial.participants.includes(x.a)&&initial.participants.includes(x.b)),fmt.id);
    assert.ok(games.every(x=>x.winner===x.game.winner),fmt.id);
    assert.ok(final.rounds.at(-1).name==='Championship',fmt.id);
  }
});
test('maximum FBS roster census fits 2026 catalog without duplicate teams',()=>{
  const all=createTournament('fullFbs138');
  assert.equal(FBS_TEAMS.length,138);
  assert.deepEqual(new Set(all.participants),new Set(FBS_TEAMS.map(x=>x.id)));
});
test('large-format seed swaps preserve entire field and replay a new deterministic bracket',()=>{
  const t=createTournament('fullFbs138');
  const a=swapTournamentSeeds(t,0,137);
  const b=swapTournamentSeeds(a,0,137);
  assert.deepEqual(t.participants,b.participants);
  assert.notDeepEqual(t.slots,a.slots);
  const f=simulateTournament(a);
  assert.ok(f.champion);
  assert.equal(f.rounds.flatMap(r=>r.matches.filter(x=>x.game)).length,137);
  assert.deepEqual(simulateTournament(a),f);
});
