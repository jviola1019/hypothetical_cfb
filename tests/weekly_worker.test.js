import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {installRosterSnapshot} from '../src/observed.js';
import {installWeeklyLineup} from '../src/weeklyLineup.js';
import {simulateBatch,DEFAULT_CONFIG} from '../src/engine.js';

const rows={schemaVersion:1,season:2026,sourceUrl:'https://example.com/roster',published:'2026-11-21',schools:{
'ohio-state':[{name:'Julian Sayin',position:'QB'},{name:'Luke Fahey',position:'QB'},{name:'Jeremiah Smith',position:'WR'},{name:'Chris Henry Jr.',position:'WR'},{name:'Bo Jackson',position:'RB'}],
'georgia':[{name:'Gunner Stockton',position:'QB'},{name:'Georgia WR',position:'WR'}]
}};
const lineup={schemaVersion:1,season:2026,weekStart:'2026-11-16',weekEnd:'2026-11-22',generatedOn:'2026-11-21',teams:{'ohio-state':{
roles:{QB:{name:'Luke Fahey',basis:'depth-chart-listed',observedOn:'2026-11-21',sourceUrl:'https://example.com/depth',note:'Verified week-specific replacement'},WR1:{name:'Jeremiah Smith',basis:'depth-chart-listed',observedOn:'2026-11-21',sourceUrl:'https://example.com/depth',note:'Top receiver'}},
unavailable:[{name:'Julian Sayin',status:'out',observedOn:'2026-11-21',sourceUrl:'https://example.com/availability'}]
}}};

test('main thread and worker have identical current-week QB/replacement and receiving-role prop IDs',async()=>{
 installRosterSnapshot(rows);installWeeklyLineup(lineup);
 const config={...DEFAULT_CONFIG,a:'ohio-state',b:'georgia',seed:424242};
 const expected=simulateBatch(config,50);
 assert.equal(expected.props.find(p=>p.team==='ohio-state'&&p.role==='QB')?.fullName,'Luke Fahey');
 assert.equal(expected.props.find(p=>p.team==='ohio-state'&&p.role==='WR1')?.fullName,'Jeremiah Smith');
 const w=new Worker(new URL('./worker_bridge.mjs',import.meta.url),{type:'module'});
 try{
  const result=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Worker timed out')),8000);
   w.on('message',m=>{
    if(m.type==='ready')w.postMessage({task:9,type:'forecast',config,n:50,datasets:[{prefix:'rosters',payload:rows},{prefix:'weekly-lineups',payload:lineup}]});
    else if(m.type==='result'){clearTimeout(timeout);resolve(m.value)}
    else if(m.type==='error'){clearTimeout(timeout);reject(Error(m.message))}
   });w.on('error',e=>{clearTimeout(timeout);reject(e)});
  });
  assert.deepEqual(result.props.map(p=>[p.id,p.fullName,p.mean,p.above]),expected.props.map(p=>[p.id,p.fullName,p.mean,p.above]));
  assert.deepEqual(result.margin,expected.margin);
 }finally{await w.terminate()}
});
