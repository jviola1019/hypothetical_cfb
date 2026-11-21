import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CONFIG,hash32,simulateGame,teamProfile} from '../src/engine.js';

test('unsupported 2026 teams do not acquire invented school-specific power rankings',()=>{
 for(const team of ['akron','alabama','ole-miss','georgia','indiana','texas']){
  const x=teamProfile(team,2026);
  assert.equal(x.coverage,'unranked-synthetic-fallback');
  assert.equal(x.offense,1);
  assert.equal(x.defense,1);
 }
});
test('historically stronger well-documented 2025 team not reversed by defensive sign error',()=>{
 const stronger=teamProfile('indiana',2025),weaker=teamProfile('alabama',2025);
 assert.ok(stronger.offense>weaker.offense);
 assert.ok(stronger.defense<weaker.defense);
 const n=400;let wins=0;
 for(let i=0;i<n;i++){
  const c={...DEFAULT_CONFIG,a:'indiana',b:'alabama',seasonA:2025,seasonB:2025,seed:hash32('historic:'+i)};
  wins+=Number(simulateGame(c).winner==='indiana');
 }
 assert.ok(wins/n>0.55,`Indiana 2025 should not be an invented underdog against Alabama 2025: ${(wins/n).toFixed(3)}`);
});
