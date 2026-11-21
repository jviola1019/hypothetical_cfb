import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CONFIG,simulateGame,hash32} from '../src/engine.js';

// Targets are aggregate 2025 research benchmarks, not individual-game calibration.
// This regression would fail under the old 40-point / 247-play model.
test('2025 anchored generator avoids implausible unconditional scoring and snap-count scales',()=>{
  const n=350;let points=0,plays=0,possessions=0;
  for(let i=0;i<n;i++){
    const g=simulateGame({...DEFAULT_CONFIG,seed:hash32('audit:'+i)});
    points+=g.total;
    plays+=g.teams[0].plays+g.teams[1].plays;
    possessions+=g.drives.length;
  }
  const mPoints=points/n,mPlays=plays/n,mPoss=possessions/n;
  assert.ok(mPoints>48&&mPoints<62,`Mean ${mPoints} point total out of 2025 realistic scoring scale`);
  assert.ok(mPlays>122&&mPlays<149,`Mean ${mPlays} total plays out of 2025 realistic snap scale`);
  assert.ok(mPoss>22&&mPoss<31,`Mean ${mPoss} drives out of plausible possession count`);
});
