import test from 'node:test';
import assert from 'node:assert/strict';
import {FBS_TEAMS} from '../src/catalog.js';
import {COMMITTEE_2026} from '../src/committee2026.js';
import {installResearchSnapshot} from '../src/research.js';
import {FORMATS,FORMAT_MAP,defaultParticipants,ranked2026Field,createTournament,swapTournamentSeeds,simulateRound,simulateTournament,monteCarloTournament} from '../src/tournament.js';
import {installRosterSnapshot,namedPlayer,rosterForTeam} from '../src/observed.js';
import {installPlayerEvidence} from '../src/playerEvidence.js';
import {simulateGame,DEFAULT_CONFIG} from '../src/engine.js';

const rankingFixture=()=>({schemaVersion:1,modelVersion:'chronological-elo-slope-0.1.0',classification:'experimental-2025-trained-2026-held-out',asOf:'2026-11-21',lastScoredGame:'2026-11-15T18:00:00.000Z',training:{season:2025,games:650,calibratedSlope:1.1},holdout:{season:2026,evaluatedGames:600,calibratedElo:{brier:.2}},fixedParameters:{eloScale:400,initialElo:1500,homeElo:55,priorGames:4,startingPointsPerTeam:27,homePointsMargin:2.4},teamState:Object.fromEntries(FBS_TEAMS.map((t,i)=>[t.id,{elo:1400+i*1.5,gamesCurrentSeason:10,scoredToDate:300,allowedToDate:220}]))});

test('research Elo remains separate; CFP preview follows dated committee top-25, fantasy field uses model Elo',()=>{
 installResearchSnapshot(rankingFixture());
 const rank=ranked2026Field();
 assert.equal(rank.covered,138);assert.equal(rank.ids.length,138);
 assert.equal(rank.ids[0],FBS_TEAMS.at(-1).id);
 assert.ok(rank.source.includes('2026 Elo'));
 for(const id of ['fbs12','fbs24','custom64','custom68','custom128','fullFbs138']){
  const f=FORMAT_MAP[id];const selected=defaultParticipants(id);
  assert.equal(selected.length,f.size);assert.equal(new Set(selected).size,selected.length);
  assert.deepEqual(selected, [...COMMITTEE_2026.ids,...rank.ids.filter(x=>!COMMITTEE_2026.ids.includes(x))].slice(0,f.size));
 }
});

test('all-FBS 138 field has exactly 10 play-in games, 118 first-stage byes, 137 games, one champion',()=>{
 assert.equal(FORMAT_MAP.fullFbs138.size,138);
 let t=createTournament('fullFbs138');assert.equal(t.participants.length,138);
 const seeded=new Set(t.participants);assert.equal(seeded.size,138);
 let n=0;for(let round=0;!t.champion;round++){
  t=simulateRound(t);
  const last=t.rounds.at(-1);
  const gameCount=last.matches.filter(m=>m.game).length;
  if(round===0){assert.equal(gameCount,10);assert.equal(last.matches.filter(m=>m.bye).length,118);assert.equal(t.slots.length,128);assert.match(last.name,/Play-in/);}
  n+=gameCount;
  assert.ok(t.slots.every(x=>seeded.has(x)));
  assert.equal(new Set(t.slots).size,t.slots.length);
 }
 assert.equal(n,137);assert.equal(t.rounds.at(-1).name,'Championship');
 assert.deepEqual(simulateTournament(createTournament('fullFbs138')),t);
});

test('seed trades are reversible, unique, locked after tournament begins, and do not alter source standings',()=>{
 const base=createTournament('custom68');const before=base.participants.slice();
 const swapped=swapTournamentSeeds(base,0,67);
 assert.equal(swapped.participants[0],before[67]);assert.equal(swapped.participants[67],before[0]);
 assert.deepEqual(base.participants,before);
 assert.deepEqual(swapTournamentSeeds(swapped,0,67).participants,before);
 assert.throws(()=>swapTournamentSeeds(base,-1,1),/Invalid/);
 assert.throws(()=>swapTournamentSeeds(base,1,68),/Invalid/);
 assert.throws(()=>swapTournamentSeeds(base,1,1.2),/Invalid/);
 assert.throws(()=>swapTournamentSeeds(simulateRound(base),0,1),/Reset/);
});

test('138-team whole-bracket Monte Carlo returns normalized champion shares and respects participant set',()=>{
 const t=createTournament('fullFbs138');const x=monteCarloTournament(t,24,{seasonA:2026,seasonB:2026});
 assert.equal(x.n,24);assert.equal(Object.values(x.counts).reduce((a,b)=>a+b,0),24);
 assert.ok(Math.abs(Object.values(x.probabilities).reduce((a,b)=>a+b,0)-1)<1e-10);
 assert.ok(Object.keys(x.counts).every(id=>t.participants.includes(id)));
});

test('2026 simulation names require 2026 roster membership; 2026 evidence may rank but may not invent identities',()=>{
 installRosterSnapshot({schemaVersion:1,season:2026,sourceUrl:'https://example.org/roster',published:'2026-11-16',schools:{'ole-miss':[
  {name:'Trinidad Chambliss',position:'QB'},{name:'Roster-only QB',position:'QB'},
  {name:'Example 2026 WR1',position:'WR'},{name:'Example 2026 WR2',position:'WR'}
 ],'georgia':[{name:'Verified 2026 QB',position:'QB'}]}});
 installPlayerEvidence({schemaVersion:2,season:2026,team:'ole-miss',school:'Ole Miss',sourceCutoff:'2026-11-21',lastRecordedGame:'2026-11-15',sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/player_stats/csv/player_stats_2026.csv',classification:'derived-player-aggregate-not-projection',players:[
  {name:'Roster-only QB',position:'QB',stat:'passingYards',label:'Pass yards',eventGames:8,n:8,hit:4,mean:210,median:208,p10:110,p90:350,line:250.5},
  {name:'Trinidad Chambliss',position:'QB',stat:'passingYards',label:'Pass yards',eventGames:12,n:12,hit:7,mean:258,median:246,p10:159,p90:389,line:250.5},
  {name:'Unlisted 2026 athlete',position:'WR',stat:'receivingYards',label:'Receive yards',eventGames:11,n:11,hit:4,mean:90,median:90,p10:40,p90:140,line:49.5}
 ]});
 const qb=namedPlayer('ole-miss','QB',2026);assert.equal(qb.name,'Trinidad Chambliss');
 assert.equal(qb.selectionBasis,'2026-roster-matched-recorded-events');
 assert.equal(qb.eventGames,12);
 const wr=namedPlayer('ole-miss','WR1',2026);assert.equal(wr.name,'Example 2026 WR1');
 assert.equal(wr.selectionBasis,'2026-roster-position-only');
 assert.ok(!rosterForTeam('ole-miss',2026).some(x=>x.name==='Unlisted 2026 athlete'));
 const g=simulateGame(DEFAULT_CONFIG,118);assert.equal(g.teams[0].players.QB.label,'Trinidad Chambliss');
 assert.equal(g.teams[0].players.QB.rosterSeason,2026);
 assert.equal(g.teams[0].players.QB.roleVerified,false);
 const previous=namedPlayer('ole-miss','QB',2025);assert.equal(previous.name,'Trinidad Chambliss');
 assert.notEqual(namedPlayer('georgia','QB',2026).name,'Gunner Stockton');
});
