/** Time-ordered score-conditioned drive intensity; neither game-day lineups nor props are calibrated. */
import {evaluatedMatchup} from './research.js';
const VERSION='temporal-drive-intensity-v2';
let current=null;
export function installPlayableCalibration(x){
 if(!x||x.schemaVersion!==1||x.modelVersion!==VERSION||
    x.classification!=='2024-fit-2025-gate-2026-previously-inspected-check'||
    !Number.isFinite(x.base)||x.base<20||x.base>40||
    !Number.isFinite(x.volatility)||x.volatility<0||x.volatility>.6||
    !Number.isFinite(x.marginVolatility)||x.marginVolatility<0||x.marginVolatility>.6||
    !Number.isInteger(x.fitGames)||x.fitGames<400||
    !Number.isInteger(x.validation2025?.n)||x.validation2025.n<400||
    !Number.isInteger(x.evaluation2026?.n)||x.evaluation2026.n<300||
    typeof x.enabled!=='boolean'||typeof x.sourceCutoff!=='string')throw Error('Invalid playable-calibration artifact');
 for(const y of [x.validation2025,x.evaluation2026]){
   if(![y.scoreMAE,y.flatScoreMAE,y.brier,y.totalMAE,y.marginMAE,y.coverage80Margin,y.coverage80Total,y.marginCRPS,y.totalCRPS]
     .every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0))throw Error('Invalid playable-calibration metrics');
   if(y.brier>1||y.coverage80Margin>1||y.coverage80Total>1)throw Error('Impossible evaluation metric');
 }
 if(x.enabled&&!(x.validation2025.scoreMAE<=x.validation2025.flatScoreMAE &&
      x.validation2025.brier<=.25&&
      x.validation2025.coverage80Margin>=.74&&x.validation2025.coverage80Total>=.74))throw Error('Unjustified calibration activation');
 current=structuredClone(x);
 return current;
}
export const playableCalibrationSnapshot=()=>current?structuredClone(current):null;
export function pregameScoringFor(config){
 if(!current?.enabled||Number(config?.seasonA)!==2026||Number(config?.seasonB)!==2026)return null;
 const e=evaluatedMatchup(config.a,config.b,config.venue);
 if(!e||![e.expectedA,e.expectedB].every(n=>Number.isFinite(n)&&n>=3&&n<=80))return null;
 return {a:e.expectedA,b:e.expectedB,base:current.base,volatility:current.volatility,marginVolatility:current.marginVolatility};
}
export async function loadPlayableCalibration(url='./public/data/playable-calibration-2026.json'){
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5500);
  try{
   const res=await fetch(url,{cache:'no-cache',signal:controller.signal});
   if(!res.ok||Number(res.headers.get('content-length')||0)>16000)return null;
   const raw=await res.text();
   if(raw.length>16000)return null;
   return installPlayableCalibration(JSON.parse(raw));
  }finally{clearTimeout(timer)}
 }catch{return null}
}
