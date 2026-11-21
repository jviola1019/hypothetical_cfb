import test from 'node:test';
import assert from 'node:assert/strict';
import {FBS_TEAMS,slugName} from '../src/catalog.js';
import {TEAMS,TEAM_MAP,teamProfile,simulateGame,simulateBatch,DEFAULT_CONFIG} from '../src/engine.js';
import {installSeasonSnapshot,installRosterSnapshot,observed,rosterForTeam,namedPlayer,sourceStatus} from '../src/observed.js';

const snapshot = (season=2026) => ({
  schemaVersion:1,season,sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',
  lastCompletedGame:season===2026?'2026-11-15T18:00:00.000Z':'2026-01-20T00:30:00.000Z',
  teams:FBS_TEAMS.map((team,i)=>({id:team.id,school:team.name,conference:'fixture',games:10,wins:i%11,losses:10-i%11,pointsFor:20+i/10,pointsAgainst:30-i/20}))
});

test('all 138 FBS schools in 2026 catalog, unique canonical IDs with key aliases',()=>{
  assert.equal(FBS_TEAMS.length,138);
  assert.equal(new Set(FBS_TEAMS.map(t=>t.id)).size,138);
  assert.equal(slugName('Texas A&M'),'texas-am');
  for(const n of ['North Dakota State','Sacramento State','Ole Miss','Hawai\'i','Miami (OH)','Texas A&M'])
    assert.ok(FBS_TEAMS.some(t=>t.name===n),n);
  assert.ok(TEAMS.length>=138);
  assert.equal(TEAM_MAP['texas-am'].name,'Texas A&M');
});

test('installation of complete 2026 observed team-season snapshot is descriptive and validated',()=>{
 const fixture=snapshot(2026);
 assert.equal(installSeasonSnapshot(fixture),138);
 assert.equal(sourceStatus.seasons[2026].schools,138);
 assert.equal(observed('alabama',2026).record,'2–8');
 assert.equal(observed('wyoming',2026).asOf,'2026-11-15T18:00:00.000Z');
 assert.notEqual(teamProfile('alabama',2026).coverage,'synthetic');
 const original=observed('alabama',2026).pointsFor;
 const bad=snapshot(2026);bad.teams[1].id=bad.teams[0].id;
 assert.throws(()=>installSeasonSnapshot(bad),/Invalid team record/);
 assert.equal(observed('alabama',2026).pointsFor,original);
});

test('2026 roster identities are full names, never starter-certified or historical season names',()=>{
 const payload={schemaVersion:1,season:2026,sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',published:'2026-11-16',schools:{
   'ole-miss':[{name:'Current Quarterback',position:'QB'},{name:'Active Receiver',position:'WR'},{name:'Second Receiver',position:'WR'},{name:'Current Runner',position:'RB'}, {name:'<script>danger</script>',position:'QB'}],
   'alabama':[{name:'Roster Athlete',position:'QB'}]
 }};
 assert.equal(installRosterSnapshot(payload),2);
 assert.equal(sourceStatus.rosters[2026].players,5);
 assert.equal(namedPlayer('ole-miss','QB',2026).name,'Current Quarterback');
 assert.equal(namedPlayer('ole-miss','WR2',2026).name,'Second Receiver');
 assert.equal(namedPlayer('ole-miss','QB',2026).rosterOnly,true);
 assert.equal(namedPlayer('ole-miss','QB',2025).name,'Trinidad Chambliss');
 assert.equal(rosterForTeam('ole-miss',2026).length,4);
 assert.equal(rosterForTeam('tennessee',2026).length,0);
 assert.throws(()=>installRosterSnapshot({...payload,schools:{'bad!':[]}}),/Invalid roster team/);
});

test('same 2026 roster identity is used for real-labeled but strictly simulated props',()=>{
 const config={...DEFAULT_CONFIG,a:'ole-miss',b:'alabama',seasonA:2026,seasonB:2026};
 const a=simulateGame(config,1337);assert.equal(a.teams[0].players.QB.label,'Current Quarterback');
 const b=simulateBatch(config,24,191);
 assert.ok(b.props.some(p=>p.fullName==='Current Quarterback'));
 assert.ok(b.props.every(p=>p.values.length===24));
 assert.deepEqual(simulateGame(config,1337),a);
});
