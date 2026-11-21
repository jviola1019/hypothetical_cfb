import test from 'node:test';
import assert from 'node:assert/strict';
import {installRosterSnapshot,namedPlayer} from '../src/observed.js';
import {installWeeklyLineup,lineupRole,currentLineup,lastReportedUnavailable} from '../src/weeklyLineup.js';
import {receivingWeights} from '../src/usage.js';
import {installPlayerEvidence} from '../src/playerEvidence.js';

const now='2026-11-21';
const roster={schemaVersion:1,season:2026,sourceUrl:'https://example.com/roster',published:now,schools:{'ohio-state':[
{name:'Julian Sayin',position:'QB'},{name:'Luke Fahey',position:'QB'},{name:'Jeremiah Smith',position:'WR'},{name:'Chris Henry Jr.',position:'WR'},{name:'Nate Roberts',position:'TE'},{name:'Bo Jackson',position:'RB'},{name:'Connor Hawkins',position:'K'}
]}};
const doc={schemaVersion:1,season:2026,weekStart:'2026-11-16',weekEnd:'2026-11-22',generatedOn:now,teams:{'ohio-state':{
roles:{QB:{name:'Luke Fahey',basis:'depth-chart-listed',observedOn:now,sourceUrl:'https://example.com/depth',note:'Contemporaneous listing'},WR1:{name:'Jeremiah Smith',basis:'depth-chart-listed',observedOn:now,sourceUrl:'https://example.com/depth',note:'Top WR slot'}},
unavailable:[{name:'Julian Sayin',status:'out',observedOn:now,sourceUrl:'https://example.com/availability'}]
}}};

test('replaced starting QB wins over older season volume; injured QB is not used',()=>{
 installRosterSnapshot(roster);installWeeklyLineup(doc);
 const p=namedPlayer('ohio-state','QB',2026,'2026-11-21');
 assert.equal(p.name,'Luke Fahey');assert.equal(p.roleVerified,true);
 assert.equal(p.selectionBasis,'depth-chart-listed');
 assert.ok(p.sourceUrl.includes('/depth'));
 assert.equal(namedPlayer('ohio-state','WR1',2026,'2026-11-21').name,'Jeremiah Smith');
});

test('weekly verified designation expires, identity priority remains a dated candidate',()=>{
 assert.equal(lineupRole('ohio-state','QB','2026-11-21').verifiedCurrent,true);
 const stale=lineupRole('ohio-state','QB','2026-12-02');
 assert.equal(stale.verifiedCurrent,false);
 assert.equal(stale.displayBasis,'historical-role-not-reverified');
 assert.equal(currentLineup('ohio-state','2026-12-02').current,false);
 assert.equal(lastReportedUnavailable('ohio-state','Julian Sayin','2026-12-02').current,false,'old injury report must expire');
});

test('malicious or duplicated depth-chart rows are rejected before roster assignment',()=>{
 assert.throws(()=>installWeeklyLineup({...doc,teams:{'ohio-state':{...doc.teams['ohio-state'],roles:{...doc.teams['ohio-state'].roles,WR2:{name:'Luke Fahey',basis:'usage-projected',observedOn:now,sourceUrl:'https://example.com/stats',note:'Duplicate'}}}}}),/Duplicate player/);
 assert.throws(()=>installWeeklyLineup({...doc,teams:{'bad team':doc.teams['ohio-state']}}),/Invalid weekly lineup school/);
 assert.throws(()=>installWeeklyLineup({...doc,teams:{'ohio-state':{...doc.teams['ohio-state'],roles:{QB:{name:'<script>x</script>',basis:'depth-chart-listed',observedOn:now,sourceUrl:'https://example.com/depth',note:'X'}}}}}),/Invalid weekly player/);
 assert.throws(()=>installWeeklyLineup({...doc,teams:{'ohio-state':{...doc.teams['ohio-state'],roles:{QB:{name:'Luke Fahey',basis:'depth-chart-listed',observedOn:'2026-09-10',sourceUrl:'https://example.com/depth',note:'Stale'}}}}}),/stale/);
 installWeeklyLineup(doc);
});

test('high-volume featured 2026 receiver receives more opportunity without breaking probability sum',()=>{
 installRosterSnapshot(roster);installWeeklyLineup(doc);
 const players=[
 {name:'Jeremiah Smith',position:'WR',stat:'receivingYards',mean:132.7,n:10},
 {name:'Chris Henry Jr.',position:'WR',stat:'receivingYards',mean:40.4,n:7},
 {name:'Nate Roberts',position:'TE',stat:'receivingYards',mean:23.2,n:9}
 ].map(p=>({ ...p,label:'Receive yards',eventGames:p.n,hit:5,median:p.mean,p10:p.mean*0.6,p90:p.mean*1.4,line:49.5}));
 installPlayerEvidence({schemaVersion:2,season:2026,team:'ohio-state',classification:'derived-player-aggregate-not-projection',sourceCutoff:'2026-11-21',lastRecordedGame:'2026-11-14',sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/player_stats/csv/player_stats_2026.csv',players});
 const weights=receivingWeights('ohio-state',2026);
 assert.equal(weights.length,5);assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-12);
 assert.ok(weights[0]>.36&&weights[0]<.48,`WR1 expected to be featured, got ${weights[0]}`);
 assert.ok(weights.every(x=>x>0&&x<1));
});
