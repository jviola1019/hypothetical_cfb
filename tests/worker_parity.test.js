import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {installRosterSnapshot} from '../src/observed.js';
import {installPlayerEvidence} from '../src/playerEvidence.js';
import {simulateBatch,DEFAULT_CONFIG} from '../src/engine.js';

test('actual worker isolate and main thread choose the same 2026 roster-matched prop athlete',async()=>{
 const rosters={schemaVersion:1,season:2026,published:'2026-11-21',sourceUrl:'https://example.com/fixture',schools:{
  'ole-miss':[{name:'A First QB',position:'QB'},{name:'Trinidad Chambliss',position:'QB'},{name:'Example WR',position:'WR'},{name:'Second WR',position:'WR'}],
  'georgia':[{name:'Gunner Stockton',position:'QB'},{name:'Georgia WR',position:'WR'}]}};
 const docs=[{schemaVersion:2,season:2026,team:'ole-miss',classification:'derived-player-aggregate-not-projection',
  sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/player_stats/csv/player_stats_2026.csv',
  sourceCutoff:'2026-11-21',lastRecordedGame:'2026-11-15',players:[
   {name:'Trinidad Chambliss',position:'QB',stat:'passingYards',label:'Pass yards',eventGames:11,n:11,hit:7,mean:286,median:275,p10:165,p90:402,line:250.5}
  ]}];
 installRosterSnapshot(rosters);installPlayerEvidence(docs[0]);
 const c={...DEFAULT_CONFIG,seed:20261121};
 const expected=simulateBatch(c,55);
 assert.equal(expected.props.find(x=>x.team==='ole-miss'&&x.role==='QB')?.fullName,'Trinidad Chambliss');
 const w=new Worker(new URL('./worker_bridge.mjs',import.meta.url),{type:'module'});
 try{
  const got=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Worker timeout')),8000);
   w.on('message',m=>{
    if(m.type==='ready')w.postMessage({task:4,type:'forecast',config:c,n:55,datasets:[{prefix:'rosters',payload:rosters}],playerDocs:docs});
    else if(m.type==='result'){clearTimeout(timeout);resolve(m.value)}
    else if(m.type==='error'){clearTimeout(timeout);reject(Error(m.message))}
   });w.on('error',e=>{clearTimeout(timeout);reject(e)});
  });
  const qb=got.props.find(x=>x.team==='ole-miss'&&x.role==='QB');
  assert.equal(qb.fullName,'Trinidad Chambliss');
  assert.deepEqual(got.props.map(x=>[x.id,x.fullName,x.mean,x.above]),expected.props.map(x=>[x.id,x.fullName,x.mean,x.above]));
  assert.deepEqual(got.margin,expected.margin);
 }finally{await w.terminate()}
});
