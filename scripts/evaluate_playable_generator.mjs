#!/usr/bin/env node
/** Evaluate actual canonical drive engine on pregame-only historical score targets.
 * 2024 FITS one scaling denominator. 2025 gates release. 2026 is a
 * previously inspected forward diagnostic, never a model-selection period.
 * This is a GAME outcome/score audit, not player appearance or snap calibration.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {simulateGame,DEFAULT_CONFIG,TEAM_MAP,hash32} from '../src/engine.js';
const BASES=[23,25,27,29,31,33];
const round=(n,p=6)=>Math.round(n*10**p)/10**p;
const quant=(a,q)=>a[Math.min(a.length-1,Math.floor((a.length-1)*q))];
export function assess(fixtures,base,runs=16){
 if(!Number.isInteger(runs)||runs<6||runs>100)throw Error('Unsupported replay count');
 let count=0,unsupported=0,mae=0,flat=0,marginMAE=0,totalMAE=0,brier=0,loss=0,covMargin=0,covTotal=0;
 for(const f of fixtures){
  if(!TEAM_MAP[f.a]||!TEAM_MAP[f.b]||f.a===f.b){unsupported++;continue}
  const target={a:f.expectedA,b:f.expectedB,base};
  if(![target.a,target.b].every(n=>Number.isFinite(n)&&n>=3&&n<=80))throw Error('Invalid pregame target');
  const config={...DEFAULT_CONFIG,a:f.a,b:f.b,venue:f.venue,pregameScoring:target};
  let sumA=0,sumB=0,wins=0;const margins=[],totals=[];
  for(let i=0;i<runs;i++){
    const g=simulateGame(config,hash32(f.id+':'+i));
    sumA+=g.final[0];sumB+=g.final[1];wins+=+(g.final[0]>g.final[1]);
    margins.push(g.margin);totals.push(g.total);
  }
  margins.sort((a,b)=>a-b);totals.sort((a,b)=>a-b);
  const predA=sumA/runs,predB=sumB/runs,p=wins/runs,y=+(f.actualA>f.actualB);
  count++;
  mae+=(Math.abs(predA-f.actualA)+Math.abs(predB-f.actualB))/2;
  flat+=(Math.abs(27-f.actualA)+Math.abs(27-f.actualB))/2;
  marginMAE+=Math.abs(predA-predB-(f.actualA-f.actualB));
  totalMAE+=Math.abs(predA+predB-(f.actualA+f.actualB));
  brier+=(p-y)**2;
  const bounded=Math.max(.015,Math.min(.985,p));
  loss-=y*Math.log(bounded)+(1-y)*Math.log(1-bounded);
  covMargin+=+(f.actualA-f.actualB>=quant(margins,.1)&&f.actualA-f.actualB<=quant(margins,.9));
  covTotal+=+(f.actualA+f.actualB>=quant(totals,.1)&&f.actualA+f.actualB<=quant(totals,.9));
 }
 if(count<300)throw Error('Not enough supported games for temporal evaluation');
 return {n:count,unsupported,runs,scoreMAE:round(mae/count),flatScoreMAE:round(flat/count),
   marginMAE:round(marginMAE/count),totalMAE:round(totalMAE/count),
   brier:round(brier/count),logLoss:round(loss/count),
   coverage80Margin:round(covMargin/count),coverage80Total:round(covTotal/count)};
}
export function evaluate(document){
 if(document?.schemaVersion!==1||document.classification!=='pregame-only-sequential-FBS-scores'||
    !document.seasons?.['2024']||!document.seasons?.['2025']||!document.seasons?.['2026'])throw Error('Invalid temporal fixture export');
 const training=BASES.map(base=>({base,metrics:assess(document.seasons['2024'],base,12)}));
 training.sort((a,b)=>a.metrics.scoreMAE-b.metrics.scoreMAE||a.base-b.base);
 const selected=training[0];
 const validation2025=assess(document.seasons['2025'],selected.base,18);
 const evaluation2026=assess(document.seasons['2026'],selected.base,18);
 // Never gate on the previously examined 2026 season.
 const enabled=validation2025.scoreMAE<=validation2025.flatScoreMAE&&validation2025.brier<=.25;
 return {
  schemaVersion:1,modelVersion:'temporal-drive-intensity-v1',
  classification:'2024-fit-2025-gate-2026-previously-inspected-check',
  sourceCutoff:document.cutoff,base:selected.base,fitGames:selected.metrics.n,
  fitCriterion:'2024 mean predicted team-point absolute error; one grid denominator only',
  fitCandidates:training.map(q=>({base:q.base,scoreMAE:q.metrics.scoreMAE})).sort((a,b)=>a.base-b.base),
  validation2025,evaluation2026,enabled,
  activationRule:'enabled iff 2025 scoreMAE <= 27-point-per-team baseline MAE AND 2025 win Brier <= 0.25; 2026 never used for selection',
  limitations:'Replay engine is conditioned on time-safe pregame score centers but has toy drives, no independent play-by-play calibration or active starters. 2026 previously inspected. Monte Carlo calibration is not player-prop calibration.'
 };
}
if(process.argv[1]?.endsWith('/evaluate_playable_generator.mjs')){
 const [input,output]=process.argv.slice(2);
 if(!input||!output)throw Error('Usage: node scripts/evaluate_playable_generator.mjs fixtures.json artifact.json');
 const doc=evaluate(JSON.parse(readFileSync(input,'utf8')));
 writeFileSync(output,JSON.stringify(doc)+'\n');
 process.stdout.write(JSON.stringify({base:doc.base,fitGames:doc.fitGames,enabled:doc.enabled,validation2025:doc.validation2025,evaluation2026:doc.evaluation2026})+'\n');
}
