#!/usr/bin/env node
/** Fail-closed source/display audit for checked-in public 2026 datasets.
 * This does not independently authenticate upstream reports or starters.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FBS_TEAMS} from '../src/catalog.js';
import {installResearchSnapshot,evaluatedMatchup} from '../src/research.js';
const get=p=>JSON.parse(readFileSync(new URL('../public/data/'+p,import.meta.url),'utf8'));
const manifest=get('manifest.json'),season=get('season-2026.json'),
  rosters=get('rosters-2026.json'),research=get('research-2026.json'),
  compare=get('model-compare-2026.json'),replay=get('playable-calibration-2026.json'),
  weekly=get('weekly-lineups-2026.json'),personnel=get('personnel-audit-2026.json'),
  player=get('player-model-evaluation-2026.json');
const ids=FBS_TEAMS.map(t=>t.id);
const keyset=arr=>arr.slice().sort().join('|');
assert.equal(ids.length,138,'FBS catalog must have 138 programs and no duplicate IDs');
assert.equal(new Set(ids).size,138);
assert.equal(keyset(ids),keyset(Object.keys(rosters.schools)),'Each catalog program requires a 2026 roster');
assert.equal(keyset(ids),keyset(season.teams.map(t=>t.id)),'Each catalog program requires an observed season row');
assert.equal(keyset(ids),keyset(Object.keys(research.teamState)),'Elo team state coverage');
assert.equal(keyset(ids),keyset(Object.keys(weekly.teams)),'Weekly role team coverage');
assert.equal(rosters.totalPlayers,Object.values(rosters.schools).reduce((n,players)=>n+players.length,0));
assert.equal(rosters.schoolsCount,138);
assert.equal(manifest.verifiedRoster2026Schools,138);
assert.equal(manifest.verifiedRoster2026Names,rosters.totalPlayers);
assert.equal(manifest.verifiedRoster2026WeeklySchools,rosters.weeklySchoolsUsed);
assert.equal(manifest.verifiedRoster2026PrimarySchools,138-rosters.weeklySchoolsUsed);
assert.equal(season.withCompletedGames,season.teams.filter(t=>t.games>0).length);
assert.ok(Number.isInteger(season.gamesWithScores)&&season.gamesWithScores>=600&&season.gamesWithScores<2000);
assert.equal(manifest.scoringSourceCutoffUtc,season.lastCompletedGame);
assert.equal(manifest.researchSourceCutoffUtc,research.lastScoredGame);
assert.equal(research.lastScoredGame,season.lastCompletedGame,'Different research and season cutoffs misleading');
for(const t of season.teams){
 assert.equal(t.games,t.wins+t.losses,t.school);
 assert.ok(t.games>=1&&t.games<=18&&t.pointsFor>=0&&t.pointsFor<=100&&t.pointsAgainst>=0&&t.pointsAgainst<=100,t.school);
 const e=research.teamState[t.id];
 assert.ok(e.gamesCurrentSeason<=t.games,t.id+': research FBS-vs-FBS subset cannot exceed all-team games');
}
const totalSchoolAppearances=season.teams.reduce((n,t)=>n+t.games,0);
assert.ok(totalSchoolAppearances>=season.gamesWithScores&&totalSchoolAppearances<=season.gamesWithScores*2,'FBS/FCS games count only one FBS participant');
assert.equal(research.holdout.evaluatedGames,compare.gamesBySeason['2026']);
assert.equal(replay.evaluation2026.n,compare.gamesBySeason['2026']);
assert.equal(compare.evaluation['2026'][compare.modelSelectedOn2025].n,compare.gamesBySeason['2026']);
assert.equal(compare.reliability2026.reduce((n,x)=>n+x.n,0),compare.gamesBySeason['2026']);
assert.ok(Number.isInteger(player.model.n)&&player.model.n>0);
assert.equal(player.model.n,player.cohortPriorOnlyBaseline.n);
assert.equal(weekly.schools,138);
assert.equal(personnel.summary.schools,138);
assert.equal(personnel.summary.checkedRoleSlots,828);
assert.equal(personnel.pass,true);
assert.equal(personnel.summary.allIndependentlyVerifiedStarters,false);
assert.equal(weekly.generatedOn,personnel.generatedOn);
let basis={},roleSlots=0;
for(const id of ids){
 const chart=weekly.teams[id];
 assert.ok(chart&&Object.keys(chart.roles).length===6,'Every school's six *model role slots* must be populated: '+id);
 const names=new Set(rosters.schools[id].map(p=>p.name.normalize('NFKD').toLowerCase()));
 const used=new Set();
 for(const r of Object.values(chart.roles)){
  const n=r.name.normalize('NFKD').toLowerCase();
  assert.ok(names.has(n),id+': weekly athlete not in 2026 season roster: '+r.name);
  assert.ok(!used.has(n),id+': duplicated player assigned to multiple roles');
  used.add(n);roleSlots++;
  basis[r.basis]=(basis[r.basis]||0)+1;
  assert.ok(r.observedOn<=weekly.generatedOn&&r.sourceUrl.startsWith('https://'),'Invalid future/URL evidence');
 }
}
assert.equal(roleSlots,828);
const gradeMap={'reported-replacement':'reportedGameDayStarterRoles','depth-chart-listed':'depthChartListed',
 'depth-chart-projected':'depthChartProjected','usage-projected':'usageEstimated','roster-only':'rosterOnly'};
for(const [basisName,key] of Object.entries(gradeMap))assert.equal(basis[basisName]||0,personnel.summary[key],basisName);
assert.equal(Object.values(basis).reduce((a,b)=>a+b,0),828);
assert.equal(replay.enabled,replay.validation2025.scoreMAE<=replay.validation2025.flatScoreMAE&&
 replay.validation2025.brier<=.25&&replay.validation2025.coverage80Margin>=.74&&replay.validation2025.coverage80Total>=.74);
assert.equal(replay.modelVersion,'temporal-drive-intensity-v2');
assert.equal(replay.fitGames,compare.gamesBySeason['2024'],'Actual replay fit must use all qualifying 2024 games');
installResearchSnapshot(research);
for(let i=0;i<ids.length;i+=7){
 const a=ids[i],b=ids[(i+1)%ids.length],q=evaluatedMatchup(a,b,i%2?'a':'neutral');
 assert.ok(q,'Every catalog team must have a supported research matchup');
 assert.ok(q.pA>=0&&q.pA<=1&&Math.abs(q.pA+q.pB-1)<1e-12);
 assert.ok(Math.abs(q.expectedA+q.expectedB-q.expectedTotal)<1e-9,'Displayed forecast total cannot disagree with score pair');
 assert.ok(Math.abs(q.expectedA-q.expectedB-q.expectedMargin)<1e-9,'Displayed forecast margin cannot disagree with score pair');
}
console.log(JSON.stringify({
 type:'2026-published-display-data-audit',pass:true,programs:138,
 observedFbsInvolvingGames:season.gamesWithScores,
 evaluatedFbsVsFbsGames:replay.evaluation2026.n,rosterNames:rosters.totalPlayers,
 sourceCutoff:season.lastCompletedGame,mode:replay.enabled?'enabled':'withheld',
 currentRoles:roleSlots,gradeSummary:personnel.summary
},null,2));
