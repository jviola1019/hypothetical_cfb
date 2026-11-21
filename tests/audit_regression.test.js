import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateGame,DEFAULT_CONFIG,propDistribution} from '../src/engine.js';
import {installSeasonSnapshot,installRosterSnapshot,observed} from '../src/observed.js';
import {FBS_TEAMS} from '../src/catalog.js';

// Detect the formerly uncounted OT3+ offensive attempts and untracked OT totals.
test('overtime possession and point ledgers reconcile, including shootouts',()=>{
  let otGames=0,shootouts=0;
  for(let seed=0;seed<4500;seed++){
    const g=simulateGame(DEFAULT_CONFIG,seed);
    if(!g.ot) continue;
    otGames++;if(g.ot>=3)shootouts++;
    for(const t of g.teams){
      const drives=g.drives.filter(d=>d.offense===t.team);
      assert.equal(t.drives,drives.length,'Every overtime try is a simulated possession');
      assert.equal(t.plays,drives.reduce((a,d)=>a+d.plays,0),'Every overtime snap counted');
      const postReg=drives.filter(d=>typeof d.quarter==='string').reduce((s,d)=>s+d.points,0);
      assert.equal(t.overtimePoints,postReg,'OT points tracked separately');
      assert.equal(t.points,t.byQuarter.reduce((s,x)=>s+x,0)+postReg,'Final scoreboard equals quarter+OT ledger');
    }
    if(shootouts>=3&&otGames>=5)break;
  }
  assert.ok(otGames>=5,'Fixture scan found overtime games');
  assert.ok(shootouts>=3,'Fixture scan found third-overtime shootouts');
});

test('overtime second-period touchdowns cannot have ordinary extra-point kicks',()=>{
  let cases=0;
  for(let seed=0;seed<7000;seed++){
    const g=simulateGame(DEFAULT_CONFIG,seed);
    for(const d of g.drives){
      if(d.quarter==='OT2'&&d.outcome==='TD'){
        cases++;
        assert.equal(d.conversion,'2PT','Second OT touchdown must be followed by a 2-point try');
        assert.ok([6,8].includes(d.points),'No 7-point TD in NCAA second overtime');
      }
    }
    if(cases>=4)break;
  }
  assert.ok(cases>=4);
});

test('unbounded prop requests fail instead of locking a mobile browser',()=>{
  for(const n of [0,-1,100001,NaN,2.5])
    assert.throws(()=>propDistribution(DEFAULT_CONFIG,'receptions','WR1',5.5,n));
});

test('season snapshot rejects unknown school and impossible win/loss accounting atomically',()=>{
  const snapshot={schemaVersion:1,season:2026,sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',lastCompletedGame:'2026-11-15',teams:FBS_TEAMS.map(t=>({id:t.id,school:t.name,conference:'verified test',games:8,wins:4,losses:4,pointsFor:30,pointsAgainst:21}))};
  const current=observed('alabama',2026);
  assert.equal(installSeasonSnapshot(snapshot),138);
  const forged=structuredClone(snapshot);forged.teams[0].id='fictional-university';
  assert.throws(()=>installSeasonSnapshot(forged),/Invalid/);
  const invalid=structuredClone(snapshot);invalid.teams[1].losses=0;
  assert.throws(()=>installSeasonSnapshot(invalid),/Invalid/);
  assert.equal(observed('alabama',2026).games,8);
  if(current) assert.equal(current.school,'Alabama');
});

test('roster snapshot rejects a nonexistent FBS school rather than rendering invented entries',()=>{
  assert.throws(()=>installRosterSnapshot({schemaVersion:1,season:2026,sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',schools:{'nonexistent-school':[{name:'Imagined Athlete',position:'QB'}]}}),/Invalid/);
});

test('official CFP round names align with actual bracket stages',async()=>{
 const {FORMAT_MAP,roundName,createTournament,simulateTournament}=await import('../src/tournament.js');
 assert.deepEqual(Array.from({length:4},(_,i)=>roundName(FORMAT_MAP.fbs12,i)),['First round','Quarterfinals','Semifinals','Championship']);
 assert.deepEqual(Array.from({length:5},(_,i)=>roundName(FORMAT_MAP.fbs24,i)),['First round','Second round','Quarterfinals','Semifinals','Championship']);
 const x=simulateTournament(createTournament('fbs12'));
 assert.deepEqual(x.rounds.map(r=>r.name),['First round','Quarterfinals','Semifinals','Championship']);
});

test('points by quarter use time at drive completion, not its starting quarter',()=>{
 for(let seed=0;seed<150;seed++){
  const g=simulateGame(DEFAULT_CONFIG,seed);
  for(const d of g.drives){
   if(typeof d.quarter!=='number')continue;
   const expected=Math.min(4,Math.floor((3600-(d.clock-d.elapsed)-1)/900)+1);
   assert.equal(d.quarter,expected,`drive ending at ${d.clock-d.elapsed} seconds must belong to scoring quarter`);
  }
 }
});
