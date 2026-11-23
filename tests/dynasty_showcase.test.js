import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHOWCASE,ceremonyTimeline,minimumChampionWaitMs} from '../src/dynastyCeremony.js';
import {tournamentReport,scoreboxFor} from '../src/tournamentHonors.js';
import {createTournament,simulateRound,simulateTournament,defaultParticipants} from '../src/tournament.js';
import {simulateGame,DEFAULT_CONFIG} from '../src/engine.js';
import {installRosterSnapshot} from '../src/observed.js';
const data=JSON.parse(readFileSync(new URL('../public/data/rosters-2026.json',import.meta.url),'utf8'));
installRosterSnapshot(data);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('the real full-tournament broadcast timeline forbids early champion/award reveals',()=>{
 assert.ok(minimumChampionWaitMs()>=10000);
 assert.ok(SHOWCASE.finishMs>=SHOWCASE.awardRevealMs&&SHOWCASE.awardRevealMs>SHOWCASE.championRevealMs);
 for(let rounds=1;rounds<=8;rounds++){
  const t=ceremonyTimeline(rounds);
  assert.equal(t.filter(x=>x.type==='round').length,rounds);
  assert.equal(t[0].at,0);
  assert.ok(t.every((x,i)=>i===0||x.at>=t[i-1].at));
  assert.equal(t.find(x=>x.type==='champion').at,11600);
  assert.ok(t.filter(x=>x.type==='round').at(-1).at<t.find(x=>x.type==='champion').at);
  assert.ok(t.find(x=>x.type==='awards').at>t.find(x=>x.type==='champion').at);
  assert.equal(t.at(-1).type,'finish');
 }
 assert.throws(()=>ceremonyTimeline(0));
 assert.throws(()=>ceremonyTimeline(15));
});
test('every completed fictional bracket has N−1 individually reconciled scoreboxes and one official game winner',()=>{
 for(const id of ['custom2','custom4','fbs12','fbs24','custom68','fullFbs138']){
  const t=simulateTournament(createTournament(id,defaultParticipants(id),753951),{seasonA:2026,seasonB:2026});
  const report=tournamentReport(t);
  assert.equal(report.complete,true);
  assert.equal(report.played,t.participants.length-1);
  assert.equal(report.expected,t.participants.length-1);
  assert.equal(report.audited,report.played);
  assert.equal(report.failed,0);
  assert.equal(report.checks,report.played*13);
  assert.equal(report.scores.length,report.played);
  assert.equal(report.scores.at(-1).game.winner,t.champion);
  assert.ok(Object.values(report.awards).every(x=>x&&x.name));
  assert.equal(report.awards.mvp.team,t.champion);
  assert.ok(report.awards.dpoy.method||report.awards.dpoy.role);
 }
});
test('complete staged and one-click tournaments have identical award ledgers and scoreboxes for same seed',()=>{
 for(const id of ['fbs12','custom68','fullFbs138']){
  const origin=createTournament(id,defaultParticipants(id),12009);
  const completed=simulateTournament(origin,{seasonA:2026,seasonB:2026});
  let progressive=origin;
  while(!progressive.champion)progressive=simulateRound(progressive,{seasonA:2026,seasonB:2026});
  const a=tournamentReport(completed),b=tournamentReport(progressive);
  assert.deepEqual(a.awards,b.awards);
  assert.deepEqual(a.scores.map(x=>[x.round,x.index,x.game.final]),b.scores.map(x=>[x.round,x.index,x.game.final]));
 }
});
test('scorebox pass is truthful and catches tampered quarters, drive scores, turnovers, bracket winner and advancement',()=>{
 const g=simulateGame(DEFAULT_CONFIG,12551);
 assert.equal(scoreboxFor(g).ok,true);
 const tampered=structuredClone(g);tampered.teams[0].byQuarter[0]+=3;
 assert.equal(scoreboxFor(tampered).ok,false);
 const badDrive=structuredClone(g);badDrive.drives[0].points+=1;
 assert.equal(scoreboxFor(badDrive).ok,false);
 const badTurnover=structuredClone(g);badTurnover.teams[1].turnovers+=1;
 assert.equal(scoreboxFor(badTurnover).ok,false);
 const t=simulateTournament(createTournament('custom8',defaultParticipants('custom8'),67));
 const rogue=structuredClone(t);
 rogue.rounds[0].matches.find(m=>m.game).winner='unknown';
 assert.throws(()=>tournamentReport(rogue),/winner\/teams contradiction/);
 const rogue2=structuredClone(t);rogue2.rounds[1].matches[0].a='georgia';
 assert.throws(()=>tournamentReport(rogue2),/Bracket advancement mismatch|winner\/teams contradiction/);
});
test('offensive awards are exact aggregates of simulated player box totals; individual defense attribution stays labeled fictional',()=>{
 const t=simulateTournament(createTournament('fbs12',defaultParticipants('fbs12'),34521));
 const r=tournamentReport(t);
 for(const role of ['mvp','opoy','titleMvp']){
  const p=r.awards[role];
  assert.ok(p&&p.team&&p.name);
  const boxes=r.scores.flatMap(x=>x.game.teams.filter(y=>y.team===p.team).flatMap(y=>Object.values(y.players).filter(z=>z.label===p.name)));
  assert.equal(boxes.reduce((n,x)=>n+(x.passingYards||0),0),p.pass);
  assert.equal(boxes.reduce((n,x)=>n+(x.receivingYards||0),0),p.receiving);
  assert.equal(boxes.reduce((n,x)=>n+(x.rushYards||0),0),p.rush);
 }
 assert.match(r.explanation,/fictional|exhibition|synthetic/i);
 assert.match(r.awards.dpoy.method,/synthetic|simulated/);
});
test('all three tabs use the final vintage theme, true seeded ceremony, complete bracket and source-graded scorebox UX',()=>{
 const html=read('index.html'),app=read('src/app.js'),css=read('src/heritage-dynasty.css');
 assert.match(html,/heritage-dynasty\.css/);
 assert.match(app,/function showcaseOverlay\(/);
 assert.match(app,/function fullBracketView\(/);
 assert.match(app,/function scoreboardAudit\(/);
 assert.match(app,/function awardsShowcase\(/);
 assert.match(app,/ceremonyTimeline\(roundsLeft\)/);
 assert.match(app,/SHOWCASE\.championRevealMs/);
 assert.match(app,/scoreboxFor\(g\)/);
 assert.match(app,/showcase-dismiss/);
 assert.match(css,/Graduate/);
 assert.match(css,/heritage-stadium\.svg/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/max-width:760px/);
 assert.match(css,/max-width:410px/);
 assert.doesNotMatch(css,/official NCAA game|© EA Sports/i);
});
