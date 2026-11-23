import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshSimulationSeed} from '../src/runSeeds.js';
import {DEFAULT_CONFIG,hash32,simulateGame} from '../src/engine.js';
import {createTournament,defaultParticipants,simulateRound,simulateTournament,monteCarloTournament} from '../src/tournament.js';
import {scoreboxFor,tournamentReport} from '../src/tournamentHonors.js';
import {installRosterSnapshot} from '../src/observed.js';

const roster=JSON.parse(readFileSync(new URL('../public/data/rosters-2026.json',import.meta.url),'utf8'));
installRosterSnapshot(roster);
const base={seasonA:2026,seasonB:2026};

test('fresh run seed: every adjacent gameplay request must change its 32-bit seed, including entropy collisions and wraparound',()=>{
 const previous=[null,0,1,0xFFFFFFFF,16777216];
 for(const before of previous){
  for(const raw of [0,1,0xFFFFFFFF,0x9E3779B9]){
   const next=freshSimulationSeed(before,()=>raw);
   assert.ok(Number.isInteger(next)&&next>=0&&next<=0xFFFFFFFF);
   assert.notEqual(next,before);
  }
 }
 let seed=20261121,history=new Set([seed]);
 for(let n=1;n<=100;n++){
  // A forced repeated candidate is corrected deterministically, not by changing the simulated score.
  seed=freshSimulationSeed(seed,()=>((n*2654435761)>>>0));
  assert.ok(!history.has(seed),`Replay seed collided in 100-case deterministic test: ${seed}`);
  history.add(seed);
 }
 for(const invalid of [-1,NaN,2**32,Infinity,1.5,'123'])assert.throws(()=>freshSimulationSeed(invalid,()=>1));
 for(const invalid of [-1,NaN,2**32,Infinity,1.5,'123'])assert.throws(()=>freshSimulationSeed(null,()=>invalid));
});

test('64 seeded game replays reproduce exactly when reused and yield diverse legitimate scores, team totals and player stat lines',()=>{
 const scorelines=new Set(),teamBoxes=new Set(),playerBoxes=new Set(),winners=new Set(),identities=new Set();
 for(let seed=1;seed<=64;seed++){
  const c={...DEFAULT_CONFIG,seed,a:'ole-miss',b:'georgia',venue:'neutral'};
  const g=simulateGame(c,seed);
  assert.equal(scoreboxFor(g).ok,true);
  assert.deepEqual(simulateGame(c,seed),g,'Same scenario + seed must be replayable without changing any stats');
  assert.equal(g.seed,seed);
  identities.add(g.id);
  scorelines.add(g.final.join('-'));
  teamBoxes.add(g.teams.map(t=>[t.passYards,t.rushYards,t.turnovers,t.plays,t.passingTD,t.rushingTD].join(':')).join('|'));
  playerBoxes.add(g.teams.map(t=>[t.players.QB.passingYards,t.players.QB.passingTD,t.players.RB.rushYards,t.players.WR1.receivingYards].join(':')).join('|'));
  winners.add(g.winner);
 }
 assert.equal(identities.size,64);
 assert.ok(scorelines.size>=20,`Missing realistic score variation: ${scorelines.size}/64`);
 assert.ok(teamBoxes.size>=60,`Team stat lines repeated unexpectedly: ${teamBoxes.size}/64`);
 assert.ok(playerBoxes.size>=60,`Player stats repeated unexpectedly: ${playerBoxes.size}/64`);
 assert.ok(winners.size>1,'The matchup must be able to swing across seeds');
 console.log(`[DIVERSITY GAME] trials=64 distinctSeeds=64 uniqueFinals=${scorelines.size} uniqueTeamBoxes=${teamBoxes.size} uniquePlayerLines=${playerBoxes.size} uniqueWinners=${winners.size}`);
});

test('every match in the 138-school bracket derives its own independent seed from tournament seed, stage and pairing',()=>{
 const t=simulateTournament(createTournament('fullFbs138',defaultParticipants('fullFbs138'),12005673),base);
 const r=tournamentReport(t);
 const seeds=new Set();
 for(const [stage,round] of t.rounds.entries())for(const [index,m] of round.matches.entries()){
  if(!m.game)continue;
  assert.equal(m.game.seed,hash32(`${t.seed}|round:${stage}|pair:${index}`));
  assert.equal(m.game.config.seed,m.game.seed);
  assert.ok(!seeds.has(m.game.seed),'Two bracket matches unexpectedly share their game seed');
  seeds.add(m.game.seed);
  assert.equal(scoreboxFor(m.game).ok,true);
 }
 assert.equal(seeds.size,137);
 console.log(`[DIVERSITY FBS138] tournamentSeed=${t.seed} uniqueGameSeeds=${seeds.size} reconciledScoreboxes=${r.audited}`);
 assert.equal(r.audited,137);
 assert.equal(r.awards.mvp.team,t.champion);
});

test('16 fresh 12-team tournament seeds yield different scorebooks, player aggregates, award outputs and occasionally different champions',()=>{
 const scorebooks=new Set(),playerLedgers=new Set(),awardLedgers=new Set(),champions=new Set();
 for(let n=0;n<16;n++){
  const seed=1733100+n*97;
  const original=createTournament('fbs12',defaultParticipants('fbs12'),seed);
  const t=simulateTournament(original,base),r=tournamentReport(t);
  assert.deepEqual(simulateTournament(original,base),t,'Same tournament seed must reproduce entire bracket');
  assert.equal(r.audited,11);
  assert.equal(r.failed,0);
  assert.ok(r.awards.mvp);
  assert.equal(r.awards.mvp.team,t.champion);
  const totals=r.scores.map(x=>`${x.game.final.join('-')}:${x.game.teams.map(y=>y.passYards+','+y.rushYards).join('~')}`).join('|');
  scorebooks.add(r.scores.map(x=>x.game.final.join('-')).join('|'));
  playerLedgers.add(totals);
  awardLedgers.add(JSON.stringify(r.awards));
  champions.add(t.champion);
  for(const role of ['mvp','opoy','titleMvp']){
   const award=r.awards[role];
   assert.ok(award.name&&award.team,'Award must name a roster-linked generated contributor');
   const boxes=r.scores.flatMap(x=>x.game.teams.filter(y=>y.team===award.team).flatMap(y=>Object.values(y.players).filter(p=>p.label===award.name)));
   assert.equal(award.pass,boxes.reduce((sum,x)=>sum+(x.passingYards||0),0));
   assert.equal(award.rush,boxes.reduce((sum,x)=>sum+(x.rushYards||0),0));
   assert.equal(award.receiving,boxes.reduce((sum,x)=>sum+(x.receivingYards||0),0));
  }
  const d=r.awards.dpoy;
  assert.ok(d&&d.team);
  assert.match(d.method,/synthetic|simulated/i,'Defensive stats must never claim observed source evidence');
  const team=r.teamTotals.find(x=>x.id===d.team);
  assert.ok((d.interceptions||0)+(d.fumbleRecoveries||0)<=team.forcedTurnovers);
 }
 assert.equal(scorebooks.size,16,'Complete brackets should produce distinct 11-game scorebook sequences');
 assert.equal(playerLedgers.size,16);
 assert.ok(awardLedgers.size>=8,`Award statistics unexpectedly static across seeds: ${awardLedgers.size}`);
 assert.ok(champions.size>=2,`All 16 titles went to the identical school; inspect model calibration and seed use`);
 console.log(`[DIVERSITY CFP12] trials=16 scorebooks=${scorebooks.size} playerLedgers=${playerLedgers.size} awardLedgers=${awardLedgers.size} distinctChampions=${champions.size}`);
});

test('a previous tournament game or award ledger cannot pass as a new-seed replay, and staged rounds preserve original seed',()=>{
 const a=createTournament('fbs12',defaultParticipants('fbs12'),7462);
 const done=simulateTournament(a,base),report=tournamentReport(done);
 const seeded=structuredClone(done);
 seeded.seed=freshSimulationSeed(done.seed,()=>done.seed);
 assert.throws(()=>tournamentReport(seeded),/seed provenance/i);
 const stale=structuredClone(done);stale.rounds[0].matches.find(m=>m.game).game.config.seed++;
 assert.throws(()=>tournamentReport(stale),/seed provenance/i);
 let staged=a;
 while(!staged.champion){
  const next=simulateRound(staged,base);
  assert.equal(next.seed,a.seed);
  staged=next;
 }
 assert.deepEqual(tournamentReport(staged).awards,report.awards);
});

test('all six tournament sizes regenerate distinct seeded score/player ledgers and rerun-specific award statistics',()=>{
 const formats=['custom2','custom4','fbs12','fbs24','custom68','fullFbs138'];
 for(const [formatIndex,id] of formats.entries()){
  const scorebooks=new Set(),statLedgers=new Set(),honors=new Set();
  for(let iteration=0;iteration<6;iteration++){
   const seed=1000000+formatIndex*250000+iteration*311;
   const t=simulateTournament(createTournament(id,defaultParticipants(id),seed),base);
   const r=tournamentReport(t);
   assert.equal(r.complete,true);
   assert.equal(r.audited,t.participants.length-1);
   assert.equal(r.awards.mvp.team,t.champion);
   scorebooks.add(r.scores.map(x=>x.game.final.join('-')).join('|'));
   statLedgers.add(r.scores.map(x=>x.game.teams.map(y=>
    [y.passYards,y.rushYards,y.players.QB.passingYards,y.players.RB.rushYards,y.turnovers].join(':')).join('/')).join('|'));
   honors.add(JSON.stringify(r.awards));
  }
  assert.equal(statLedgers.size,6,`${id}: six different tournament seeds should not have identical game/stat ledgers`);
  assert.ok(scorebooks.size>=4,`${id}: six distinct seeds show insufficient score variation (${scorebooks.size})`);
  assert.ok(honors.size>=5,`${id}: awards failed to react to the newly simulated player stats (${honors.size})`);
  console.log(`[DIVERSITY FORMAT] ${id} trials=6 scorebooks=${scorebooks.size} teamPlayerLedgers=${statLedgers.size} awardLedgers=${honors.size}`);
 }
});

test('title-share Monte Carlo studies are independently seeded while fixed study seeds reproduce the same samples',()=>{
 const participants=defaultParticipants('fbs12');
 const mk=seed=>monteCarloTournament(createTournament('fbs12',participants,seed),80,base);
 const first=mk(384817),repeat=mk(384817),second=mk(384818);
 assert.deepEqual(first,repeat,'A title study with fixed seed must be repeatable');
 assert.notDeepEqual(first.counts,second.counts,'Fresh title-study seed did not change simulated title frequencies');
 assert.equal(Object.values(first.counts).reduce((a,b)=>a+b,0),80);
 assert.equal(Object.values(second.counts).reduce((a,b)=>a+b,0),80);
 console.log('[DIVERSITY STUDY] trialsPerSeed=80 uniqueSamples=2 seed1=384817 seed2=384818');
});
