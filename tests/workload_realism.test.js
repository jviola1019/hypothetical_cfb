import test from 'node:test';
import assert from 'node:assert/strict';
import {FBS_TEAMS} from '../src/catalog.js';
import {installRosterSnapshot,installSeasonSnapshot} from '../src/observed.js';
import {installPlayerEvidence} from '../src/playerEvidence.js';
import {installWeeklyLineup} from '../src/weeklyLineup.js';
import {DEFAULT_CONFIG,simulateBatch,simulateGame} from '../src/engine.js';
import {auditGeneratedGame} from '../src/gameAudit.js';

const teams={
 'ohio-state':[['Luke Fahey','QB'],['Julian Sayin','QB'],['Jeremiah Smith','WR'],['Chris Henry Jr.','WR'],['Nate Roberts','TE'],['Bo Jackson','RB']],
 'oregon-state':[['Braden Atkinson','QB'],['Jesse Legree','WR'],['Eric Olsen','WR'],['AJ Newberry','RB']],
 'tennessee':[['George MacIntyre','QB'],['DeSean Bishop','RB'],['Mike Matthews','WR'],['Braylon Staley','WR']]
};
function installFixtures(){
 installRosterSnapshot({schemaVersion:1,season:2026,sourceUrl:'https://example.org/rosters',published:'2026-11-21',schools:Object.fromEntries(Object.entries(teams).map(([k,v])=>[k,v.map(([name,position])=>({name,position}))]))});
 installSeasonSnapshot({schemaVersion:1,season:2026,sourceUrl:'https://example.org/schedule',lastCompletedGame:'2026-11-15',teams:FBS_TEAMS.map(t=>({id:t.id,school:t.name,games:10,wins:5,losses:5,pointsFor:({'ohio-state':34.9,'oregon-state':38.3,'tennessee':31.4}[t.id]||28),pointsAgainst:({'ohio-state':18.4,'oregon-state':28.8,'tennessee':14.3}[t.id]||25)}))});
 installWeeklyLineup({schemaVersion:1,season:2026,generatedOn:'2026-11-21',weekStart:'2026-11-16',weekEnd:'2026-11-22',teams:{'ohio-state':{roles:{QB:{name:'Luke Fahey',basis:'reported-replacement',observedOn:'2026-11-21',sourceUrl:'https://example.org/depth',note:'Reported QB1'},WR1:{name:'Jeremiah Smith',basis:'depth-chart-listed',observedOn:'2026-11-21',sourceUrl:'https://example.org/depth',note:'WR1'}},unavailable:[{name:'Julian Sayin',status:'out',observedOn:'2026-11-21',sourceUrl:'https://example.org/status'}]},'oregon-state':{roles:{WR1:{name:'Jesse Legree',basis:'usage-projected',observedOn:'2026-11-21',sourceUrl:'https://example.org/stats',note:'Observed usage'}},unavailable:[]},'tennessee':{roles:{RB:{name:'DeSean Bishop',basis:'depth-chart-listed',observedOn:'2026-11-21',sourceUrl:'https://example.org/team',note:'RB starter'}},unavailable:[]}}});
 for(const [id,rows] of Object.entries({'ohio-state':[['Jeremiah Smith','WR','receivingYards',132.7,10],['Chris Henry Jr.','WR','receivingYards',40.43,7]],'oregon-state':[['Jesse Legree','WR','receivingYards',135.3,10],['Eric Olsen','WR','receivingYards',48.8,10]],'tennessee':[['DeSean Bishop','RB','rushingYards',112,10],['Mike Matthews','WR','receivingYards',61.2,10]]})){
  const players=rows.map(([name,position,stat,mean,n])=>({name,position,stat,mean,n,eventGames:n,hit:5,median:mean,p10:mean*.7,p90:mean*1.3,line:75.5,label:stat}));
  installPlayerEvidence({schemaVersion:2,season:2026,team:id,classification:'derived-player-aggregate-not-projection',sourceCutoff:'2026-11-21',lastRecordedGame:'2026-11-14',sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',players});
 }
}

test('featured 2026 athletes have plausible aggregate workload under the synthetic allocation; rest is not falsely assigned',()=>{
 installFixtures();
 const osu=simulateBatch({...DEFAULT_CONFIG,a:'ohio-state',b:'oregon-state'},800,331);
 const smith=osu.props.find(p=>p.team==='ohio-state'&&p.role==='WR1'&&p.stat==='receivingYards');
 const legree=osu.props.find(p=>p.team==='oregon-state'&&p.role==='WR1'&&p.stat==='receivingYards');
 const fahey=osu.props.find(p=>p.team==='ohio-state'&&p.role==='QB'&&p.stat==='passingYards');
 assert.equal(fahey.fullName,'Luke Fahey');
 assert.equal(fahey.seasonObservedMean,null,'no player-level pregame evidence for new QB');
 assert.ok(smith.mean>90&&smith.mean<185,`Smith simulation mean ${smith.mean}`);
 assert.ok(legree.mean>90&&legree.mean<185,`Legree simulation mean ${legree.mean}`);
 assert.equal(smith.seasonObservedMean,132.7);
 assert.equal(legree.seasonObservedMean,135.3);
 const rec=osu.props.find(p=>p.team==='ohio-state'&&p.role==='WR1'&&p.stat==='receptions');
 assert.equal(rec.seasonObservedMean,null,'do not mislabel receiving-yards mean as observed receptions');
 const tn=simulateBatch({...DEFAULT_CONFIG,a:'tennessee',b:'ohio-state'},800,331);
 const bishop=tn.props.find(p=>p.team==='tennessee'&&p.role==='RB');
 assert.equal(bishop.fullName,'DeSean Bishop');assert.equal(bishop.seasonObservedMean,112);
 assert.ok(bishop.mean>70&&bishop.mean<165,`Bishop simulated rushing mean ${bishop.mean}`);
 for(const seed of [1,17,200,601]){
  const game=simulateGame({...DEFAULT_CONFIG,a:'ohio-state',b:'oregon-state'},seed);
  assert.equal(auditGeneratedGame(game),true);
  assert.equal(game.teams[0].players.QB.label,'Luke Fahey');
  assert.ok(game.teams.every(t=>t.players.OTHER.receivingYards>=0&&t.players.OTHER.rushYards>=0));
 }
});
