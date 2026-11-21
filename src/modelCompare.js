/* Research benchmark display; never substitutes its probabilities for the game engine. */
let artifact=null;
export function installModelComparison(x){
 if(!x||x.schemaVersion!==1||x.modelVersion!=='multiyear-temporal-0.7.0'||
  !String(x.classification).includes('previously-inspected-forward-check')||
  !x.gamesBySeason||!x.evaluation||!x.modelCoefficientsFitted2024||
  !['2023','2024','2025','2026'].every(k=>Number.isInteger(x.gamesBySeason[k])&&x.gamesBySeason[k]>0)||
  !['2025','2026'].every(k=>x.evaluation[k]&&['coin','homeOnly','elo','margin','fixedBlend','logisticPair'].every(m=>{
    const v=x.evaluation[k][m];return v&&Number.isInteger(v.n)&&v.n>0&&Number.isFinite(v.brier)&&v.brier>=0&&v.brier<=1;
  }))||typeof x.modelSelectedOn2025!=='string'||!x.evaluation['2025'][x.modelSelectedOn2025])throw Error('Invalid multi-year evaluation');
 if(x.reliability2026&&(!Array.isArray(x.reliability2026)||x.reliability2026.length>10||
 x.reliability2026.some(b=>!Number.isInteger(b.bin)||b.bin<0||b.bin>9||!Number.isInteger(b.n)||b.n<1||
 !Array.isArray(b.wilson95)||b.wilson95.length!==2||
 ![b.meanPrediction,b.observedFrequency,...b.wilson95].every(v=>Number.isFinite(v)&&v>=0&&v<=1)||
 b.wilson95[0]>b.observedFrequency||b.wilson95[1]<b.observedFrequency)))throw Error('Invalid reliability bins');
 artifact=structuredClone(x);return artifact;
}
export const modelComparison=()=>artifact;
export async function loadModelComparison(base='./public/data/'){
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),5000);
 try{const r=await fetch(base+'model-compare-2026.json',{signal:ctl.signal,cache:'no-cache'});
  if(!r.ok||Number(r.headers.get('content-length')||0)>75000)return null;
  const content=await r.text();if(content.length>75000)return null;
  return installModelComparison(JSON.parse(content));
 }catch(e){return null}finally{clearTimeout(timeout)}
}
