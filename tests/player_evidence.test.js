import test from 'node:test';import assert from 'node:assert/strict';
import {installPlayerEvidence,observedPropRows,getPlayerEvidence} from '../src/playerEvidence.js';
function fixture(){return {schemaVersion:2,season:2026,team:'ole-miss',school:'Ole Miss',sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/player_stats/csv/player_stats_2026.csv',sourceCutoff:'2026-11-21',lastRecordedGame:'2026-11-15',classification:'derived-player-aggregate-not-projection',players:[{name:'Alex Observer',position:'QB',stat:'passingYards',label:'Pass yards',line:250.5,eventGames:4,n:4,hit:2,mean:231.75,median:252,p10:190,p90:275}]};}
test('historical prop shares use derived observed aggregates, never forecast events',()=>{const x=fixture();assert.equal(installPlayerEvidence(x),1);const row=observedPropRows('ole-miss')[0];assert.equal(row.name,'Alex Observer');assert.equal(row.n,4);assert.equal(row.hit,2);assert.equal(row.hitRate,.5);assert.equal(row.line,250.5);assert.equal(row.p10,190);assert.equal(row.p90,275);assert.equal('gameLines' in row,false);});
test('future cutoff, forged team, duplicate athlete and raw logs are rejected',()=>{const x=fixture();x.lastRecordedGame='2026-12-01';assert.throws(()=>installPlayerEvidence(x));const y=fixture();y.team='bogus';assert.throws(()=>installPlayerEvidence(y));const z=fixture();z.players.push(structuredClone(z.players[0]));assert.throws(()=>installPlayerEvidence(z),/Duplicate/);const r=fixture();r.players[0].gameLines=[{gameId:'X'}];assert.throws(()=>installPlayerEvidence(r),/Invalid derived player row|Invalid derived player snapshot/);});
test('invalid player document cannot overwrite prior valid observation',()=>{const before=getPlayerEvidence('ole-miss');const x=fixture();x.players[0].name='<script>bad</script>';assert.throws(()=>installPlayerEvidence(x));assert.deepEqual(getPlayerEvidence('ole-miss'),before);});

test('realistic negative rushing-event quantiles are valid, but passing and receiving negative values are not',()=>{
 const x=fixture();x.players[0]={name:'Net rushing example',position:'RB',stat:'rushingYards',label:'Rushing yards',line:75.5,eventGames:5,n:5,hit:1,mean:20,median:11,p10:-4,p90:48};
 assert.equal(installPlayerEvidence(x),1);
 for(const bad of [{stat:'passingYards',position:'QB'},{stat:'receivingYards',position:'WR'}]){
   const y=structuredClone(x);Object.assign(y.players[0],bad);assert.throws(()=>installPlayerEvidence(y),/Invalid derived player row/);
 }
 const corrupt=structuredClone(x);corrupt.players[0].p10=-200;assert.throws(()=>installPlayerEvidence(corrupt),/Invalid derived player row/);
});
