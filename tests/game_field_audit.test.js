import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_CONFIG,simulateGame} from '../src/engine.js';
test('coarse drive placement and turnovers remain physically coherent',()=>{
 let changes=0,turns=0;
 for(let seed=1;seed<=400;seed++){
  const g=simulateGame(DEFAULT_CONFIG,seed);
  for(let i=0;i<g.drives.length;i++){
   const d=g.drives[i];assert.ok(Number.isInteger(d.start)&&d.start>=1&&d.start<=99);
   if(typeof d.quarter==='number'){
    assert.ok(d.start+d.gain<=100);
    if(i>0&&typeof g.drives[i-1].quarter==='number'&&g.drives[i-1].outcome==='TO'){
     assert.ok(d.start>=5&&d.start<=95);changes++;
    }
   }
   if(d.outcome==='TO'){turns++;assert.ok(['interception','fumble'].includes(d.turnoverType));}
  }
  for(const t of g.teams){
   assert.equal(t.turnovers,t.players.QB.interceptions+t.fumblesLost);
  }
 }
 assert.ok(changes>10);assert.ok(turns>50);
});
