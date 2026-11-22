#!/usr/bin/env node
/** Evaluate actual canonical drive engine on pregame-only historical score targets.
 * 2024 FITS two scoring parameters: mean intensity and extra-game dispersion. 2025 gates release. 2026 is a
 * previously inspected forward diagnostic, never a model-selection period.
 * This is a GAME outcome/score audit, not player appearance or snap calibration.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {simulateGame,DEFAULT_CONFIG,TEAM_MAP,hash32} from '../src/engine.js';
const BASES=[23,25,27,29,31,33],VOLATILITY=[0,.15,.3,.45];
const round=(n,p=6)=>Math.round(n*10**p)/10**p;
const quant=(a,q)=>a[Math.min(a.length-1,Math.floor((a.length-1)*q))];
const crps=(a,y)=>{const n=a.length;let d=a.reduce((s,x)=>s+Math.abs(x-y),0)/n;let pairs=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs+=Math.abs(a[i]-a[j]);return d-pairs/(n*(n-1));};
export function assess(fixtures,base,runs=16,volatility=0){
 if(!Number.isInteger(runs)||runs<6||runs>100)throw Error('Unsupported replay count');
 let count=0,unsupported=0,mae=0,flat=0,marginMAE=0,totalMAE=0,brier=0,loss=0,covMargin=0,covTotal=0,margCRPS=0,totCRPS=0;
 for(const f of fixtures){
  if(!TEAM_MAP[f.a]||!TEAM_MAP[f.b]||f.a===f.b){unsupported++;continue}
  const target={a:f.expectedA,b:f.expectedB,base,volatility};
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
  margCRPS+=crps(margins,f.actualA-f.actualB);
  totCRPS+=crps(totals,f.actualA+f.actualB);
  covMargin+=+(f.actualA-f.actualB>=quant(margins,.1)&&f.actualA-f.actualB<=quant(margins,.9));
  covTotal+=+(f.actualA+f.actualB>=quant(totals,.1)&&f.actualA+f.actualB<=quant(totals,.9));
 }
 if(count<300)throw Error('Not enough supported games for temporal evaluation');
 return {n:count,unsupported,runs,scoreMAE:round(mae/count),flatScoreMAE:round(flat/count),
   marginMAE:round(marginMAE/count),totalMAE:round(totalMAE/count),
   brier:round(brier/count),logLoss:round(loss/count),
   coverage80Margin:round(covMargin/count),coverage80Total:round(covTotal/count),
   marginCRPS:round(margCRPS/count),totalCRPS:round(totCRPS/count)};
}
export function evaluate(document){
 if(document?.schemaVersion!==1||document.classification!=='pregame-only-sequential-FBS-scores'||
    !document.seasons?.['2024']||!document.seasons?.['2025']||!document.seasons?.['2026'])throw Error('Invalid temporal fixture export');
 const training=BASES.flatMap(base=>VOLATILITY.map(volatility=>({base,volatility,metrics:assess(document.seasons['2024'],base,12,volatility)})));
 const metric=x=>x.metrics.marginCRPS+x.metrics.totalCRPS;
 training.sort((a,b)=>metric(a)-metric(b)||a.base-b.base||a.volatility-b.volatility);
 const selected=training[0];
 const validation2025=assess(document.seasons['2025'],selected.base,48,selected.volatility);
 const evaluation2026=assess(document.seasons['2026'],selected.base,48,selected.volatility);
 // Never gate on the previously examined 2026 season.
 const enabled=validation2025.scoreMAE<=validation2025.flatScoreMAE&&validation2025.brier<=.25&&validation2025.coverage80Margin>=.74&&validation2025.coverage80Total>=.74;
 return {
  schemaVersion:1,modelVersion:'temporal-drive-intensity-v2',
  classification:'2024-fit-2025-gate-2026-previously-inspected-check',
  sourceCutoff:document.cutoff,base:selected.base,volatility:selected.volatility,fitGames:selected.metrics.n,
  fitCriterion:'2024 proper CRPS (margin plus total), grid-search scoring baseline and game-level lognormal dispersion; neither coefficient fit on 2025 or 2026',
  fitCandidates:training.map(q=>({base:q.base,volatility:q.volatility,scoreMAE:q.metrics.scoreMAE,marginCRPS:q.metrics.marginCRPS,totalCRPS:q.metrics.totalCRPS})).sort((a,b)=>a.base-b.base||a.volatility-b.volatility),
  validation2025,evaluation2026,enabled,
  activationRule:'enabled iff 2025 score MAE <= flat 27-point baseline, 2025 win Brier <= 0.25, both 2025 nominal-80% margin and total interval coverage >= 74%; 2026 never used for selection',
  limitations:'Replay engine is conditioned on time-safe pregame score centers but has toy drives, no independent play-by-play calibration or active starters. 2026 previously inspected. Monte Carlo calibration is not player-prop calibration.'
 };
}
if(process.argv[1]?.endsWith('/evaluate_playable_generator.mjs')){
 const [input,output]=process.argv.slice(2);
 if(!input||!output)throw Error('Usage: node scripts/evaluate_playable_generator.mjs fixtures.json artifact.json');
 const doc=evaluate(JSON.parse(readFileSync(input,'utf8')));
 writeFileSync(output,JSON.stringify(doc)+'\n');
 process.stdout.write(JSON.stringify({base:doc.base,volatility:doc.volatility,fitGames:doc.fitGames,enabled:doc.enabled,validation2025:doc.validation2025,evaluation2026:doc.evaluation2026})+'\n');
}
