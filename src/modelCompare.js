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
