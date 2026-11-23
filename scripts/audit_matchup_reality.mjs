#!/usr/bin/env node
/** Reproducible 2026 matchup stress harness. Replays fictional drives, never asserts that those
 * outcomes are independently calibrated. Reads same committed observed data as browser.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {DEFAULT_CONFIG,simulateBatch,gameplayBalanceFor,teamProfile} from '../src/engine.js';
import {installResearchSnapshot,evaluatedMatchup} from '../src/research.js';
import {installRosterSnapshot,installSeasonSnapshot} from '../src/observed.js';
import {installWeeklyLineup} from '../src/weeklyLineup.js';
import {installPlayerEvidence} from '../src/playerEvidence.js';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const catalog=[
 ['georgia','ohio'],['georgia','kent-state'],['alabama','ball-state'],['ohio-state','akron'],
 ['ole-miss','ul-monroe'],['texas','north-texas'],['tennessee','middle-tennessee'],
 ['oregon','nevada'],['miami','florida-atlantic'],['notre-dame','toledo'],
 ['oklahoma','tulsa'],['penn-state','temple'],['clemson','east-carolina'],
 ['iowa','northern-illinois'],['georgia','boise-state'],['virginia-tech','memphis'],
 ['rutgers','navy']
];
for(const year of [2026]){installSeasonSnapshot(read('public/data/season-'+year+'.json'));installRosterSnapshot(read('public/data/rosters-'+year+'.json'));}
installWeeklyLineup(read('public/data/weekly-lineups-2026.json'));
installResearchSnapshot(read('public/data/research-2026.json'));
for(const id of new Set(catalog.flat())) {
 try{installPlayerEvidence(read('public/data/players-2026/'+id+'.json'))}catch(e){if(e.code!=='ENOENT')throw new Error('Invalid player evidence '+id,{cause:e})}
}
const n=Number(process.env.MATCHUP_RUNS||300);
if(!Number.isSafeInteger(n)||n<100||n>1000)throw Error('Unsupported sample count');
const rows=[];
for(const [a,b] of catalog)for(const venue of ['neutral','a','b']){
 const config={...DEFAULT_CONFIG,a,b,venue,seed:0x71fbde};
 const e=evaluatedMatchup(a,b,venue);
 if(!e)throw Error('No research rating for '+a+' vs '+b);
 const m=simulateBatch(config,n);
 const balance=gameplayBalanceFor(config,[teamProfile(a),teamProfile(b)]);
 const players=m.props.filter(p=>['QB','RB','WR1'].includes(p.role)).map(p=>({
  name:p.fullName,team:p.team,role:p.role,stat:p.stat,mean:+p.mean.toFixed(1),
  observedMean:p.seasonObservedMean,displayGap:p.seasonObservedMean!=null?
  +((p.mean-p.seasonObservedMean)/Math.max(1,p.seasonObservedMean)).toFixed(3):null
 }));
 rows.push({a,b,venue,n,contextGuardApplied:Boolean(balance?.committeeContextGuard),effectiveStrengthGap:balance?.effectiveEloGap??null,eloExpected:+e.pA.toFixed(4),simulatedWin:+m.pA.toFixed(4),
  absoluteProbabilityGap:+Math.abs(e.pA-m.pA).toFixed(4),
  simulatedMeanA:+m.meanA.toFixed(1),simulatedMeanB:+m.meanB.toFixed(1),
  scoredDiff:+m.marginMean.toFixed(1),expectedResearchPoints:[+e.expectedA.toFixed(1),+e.expectedB.toFixed(1)],
  playerExamples:venue==='neutral'?players:[]});
}
const sorted=rows.toSorted((a,b)=>b.absoluteProbabilityGap-a.absoluteProbabilityGap);
const doc={schemaVersion:1,classification:'retrospective-sim-vs-elo-diagnostic-not-independent-validation',
 observedThrough:read('public/data/season-2026.json').lastCompletedGame,
 n,nMatchups:catalog.length,nVenues:rows.length,
 meanAbsoluteGap:+(rows.reduce((sum,x)=>sum+x.absoluteProbabilityGap,0)/rows.length).toFixed(4),
 maxAbsoluteGap:sorted[0].absoluteProbabilityGap,guardedScenarios:rows.filter(x=>x.contextGuardApplied).length, worst:sorted.slice(0,12),rows};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(doc,null,2)+'\n');
console.log(JSON.stringify({classification:doc.classification,runsPerFixture:n,matchups:doc.nMatchups,
 simulatedScenarios:doc.nVenues,guardedScenarios:doc.guardedScenarios,meanAbsoluteGap:doc.meanAbsoluteGap,maxAbsoluteGap:doc.maxAbsoluteGap,
 worst:doc.worst.map(x=>({pair:x.a+'/'+x.b,venue:x.venue,pSim:x.simulatedWin,pElo:x.eloExpected,delta:x.absoluteProbabilityGap,margin:x.scoredDiff}))},null,2));
