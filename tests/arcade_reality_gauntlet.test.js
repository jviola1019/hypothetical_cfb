import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FBS_TEAMS} from '../src/catalog.js';
import {COMMITTEE_2026,CFP_SCHEDULE_2026,CFP_PREVIEW_ASSUMPTIONS_2026,provisional12Field,committeeRank,committeeOrderedField,provisionalEliteGap} from '../src/committee2026.js';
import {installResearchSnapshot,evaluatedMatchup} from '../src/research.js';
import {installSeasonSnapshot,installRosterSnapshot,namedPlayer} from '../src/observed.js';
import {DEFAULT_CONFIG,gameplayBalanceFor,teamProfile,simulateBatch} from '../src/engine.js';
import {rulesOrder,FORMAT_MAP,createTournament,defaultParticipants,playablePairs,simulateRound,simulateTournament} from '../src/tournament.js';
const data=name=>JSON.parse(readFileSync(new URL('../public/data/'+name,import.meta.url),'utf8'));
const ids=new Set(FBS_TEAMS.map(x=>x.id));
test('published Nov 17 2026 interim CFP top 25 is complete, correctly identified, and never confused with Ohio Bobcats',()=>{
 assert.equal(COMMITTEE_2026.date,'2026-11-17');
 assert.equal(COMMITTEE_2026.through,'2026-11-15');
 assert.equal(COMMITTEE_2026.ids.length,25);
 assert.equal(new Set(COMMITTEE_2026.ids).size,25);
 assert.ok(COMMITTEE_2026.ids.every(id=>ids.has(id)));
 assert.equal(committeeRank('georgia'),1);
 assert.equal(committeeRank('ohio-state'),14);
 assert.equal(committeeRank('ohio'),null);
 assert.equal(COMMITTEE_2026.ids[24],'ole-miss');
 assert.match(COMMITTEE_2026.classification,/not-final/);
});
test('published committee preview takes precedence for the 2026 CFP showcase but not fantasy 68',()=>{
 const ranked=committeeOrderedField(FBS_TEAMS.map(t=>t.id));
 assert.deepEqual(ranked.slice(0,25),COMMITTEE_2026.ids);
 assert.equal(new Set(ranked).size,FBS_TEAMS.length);
 assert.deepEqual(defaultParticipants('fbs12'),provisional12Field());
 assert.equal(provisional12Field().length,12);
 assert.equal(new Set(provisional12Field()).size,12);
 assert.ok(provisional12Field().includes('boise-state'));
 assert.ok(!provisional12Field().includes('texas-tech'));
 assert.equal(CFP_PREVIEW_ASSUMPTIONS_2026.length,5);
 assert.deepEqual(defaultParticipants('fbs24'),COMMITTEE_2026.ids.slice(0,24));
 assert.equal(defaultParticipants('custom68')[0],'georgia');
 const t=createTournament('fbs12');
 assert.match(t.seedingSource,/NOT final qualifiers/);
});
test('elite source-ranked vs unranked gap guard is symmetric and never a blanket P4 adjustment',()=>{
 assert.equal(provisionalEliteGap('ohio','georgia',-64.3815),-200);
 assert.equal(provisionalEliteGap('georgia','ohio',64.3815),200);
 assert.equal(provisionalEliteGap('georgia','ohio',270),270);
 assert.equal(provisionalEliteGap('clemson','east-carolina',-65),-65);
 assert.equal(provisionalEliteGap('georgia','alabama',-30),-30);
 assert.equal(provisionalEliteGap('georgia','ohio-state',80),80);
});
test('Georgia-Ohio gameplay correction is separate from historical Elo odds and time split evaluation',()=>{
 installResearchSnapshot(data('research-2026.json'));
 installSeasonSnapshot(data('season-2026.json'));
 const c={...DEFAULT_CONFIG,a:'ohio',b:'georgia',venue:'neutral'};
 const e=evaluatedMatchup(c.a,c.b,c.venue);
 assert.ok(e.pA>.25&&e.pA<.4,'control demonstrates compressed win-only Elo reference');
 const balance=gameplayBalanceFor(c,[teamProfile('ohio'),teamProfile('georgia')]);
 assert.equal(balance.committeeContextGuard,true);
 assert.equal(balance.effectiveEloGap,-200);
 assert.equal(balance.eloGap,e.ratingA-e.ratingB);
 assert.equal(balance.eloReference,e.pA);
 assert.equal(gameplayBalanceFor({...c,pregameScoring:{a:24,b:35,base:27}},[teamProfile('ohio'),teamProfile('georgia')]),null);
 const sample=simulateBatch(c,300,20261123);
 assert.ok(sample.pA<.27,'check synthetic gameplay remains meaningfully tougher for Ohio than original 33% Elo');
});
test('68-team First Four uses two 11-line and two 16-line regional play-ins, not a random low-eight cluster',()=>{
 const f=FORMAT_MAP.custom68,order=rulesOrder(f),t=createTournament('custom68');
 assert.equal(order.length,128);
 assert.equal(new Set(order.filter(n=>n<=68)).size,68);
 assert.equal(playablePairs(t).length,4);
 const matches=playablePairs(t).map(x=>[t.participants.indexOf(x.a)+1,t.participants.indexOf(x.b)+1].sort((a,b)=>a-b));
 assert.deepEqual(matches.sort((a,b)=>a[0]-b[0]),[[42,65],[43,66],[63,67],[64,68]]);
 assert.equal(new Set(t.participants).size,68);
});
test('playing one round at a time reaches exactly the same bracket as full one-shot simulation',()=>{
 for(const format of ['fbs12','fbs24','custom68','fullFbs138']){
  const t=createTournament(format,defaultParticipants(format),55101);
  const whole=simulateTournament(t,{seasonA:2026,seasonB:2026});
  let stepping=t;let safety=0;
  while(!stepping.champion&&safety++<10)stepping=simulateRound(stepping,{seasonA:2026,seasonB:2026});
  assert.equal(stepping.champion,whole.champion);
  assert.deepEqual(stepping.rounds,whole.rounds);
  assert.equal(stepping.rounds.flatMap(r=>r.matches.filter(x=>x.game)).length,t.participants.length-1);
  assert.ok(stepping.rounds.every(round=>round.matches.every(m=>m.bye||m.game)));
 }
});
test('official 2026 postseason calendar has real source dates; fantasy fields never invent participants',()=>{
 assert.deepEqual(CFP_SCHEDULE_2026.map(x=>x.date),['2026-12-18','2026-12-19','2026-12-30','2027-01-01','2027-01-14','2027-01-15','2027-01-25']);
 assert.ok(CFP_SCHEDULE_2026.every(x=>!x.teamA&&!x.teamB));
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/function playoffCalendar\(/);
 assert.match(app,/actual CFP calendar/i);
});
test('2026 secondary quarterback scouting never duplicates the QB1 identity or fabricates QB2 props',()=>{
 installRosterSnapshot(data('rosters-2026.json'));
 const qb1=namedPlayer('tennessee','QB',2026);
 const qb2=namedPlayer('tennessee','QB2',2026);
 assert.ok(qb1&&qb2,'Tennessee must have at least two roster-listed 2026 quarterbacks');
 assert.notEqual(qb1.name,qb2.name);
 assert.equal(qb2.roleVerified,false,'no verified QB2 report in the dated source');
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/Secondary QB roster candidate only/);
 assert.match(app,/season-long event games do not prove a same-game passing split/i);
});
test('arcade UI includes tournament theater, round control and reduced-motion fallbacks',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/cartridge.css',import.meta.url),'utf8');
 assert.match(html,/src\/cartridge\.css/);
 assert.match(app,/function playoffTheater\(/);
 assert.match(app,/runTournament\(a==='playoff-next'\)/);
 assert.match(app,/role="progressbar"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/@keyframes arena-trophy/);
 assert.match(css,/Azeret Mono/);
 assert.doesNotMatch(css,/ncaa\.png|ea-sports\.svg/i);
});
