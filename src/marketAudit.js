/** Auditable, fictional game-market ledger.
 * All shares derive from one identical set of games; no sportsbook odds are used.
 * Team A spread convention: Team A covers iff (A points - B points) + spreadA > 0.
 * Half-point reference lines intentionally avoid push ambiguity with integer scores.
 */
const validLine=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1000;
const nonnegativeInt=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000;
const num=x=>Math.round(x*10000000000)/10000000000;
export function simulatedMarketLedger(games, options={}) {
  if(!Array.isArray(games)||games.length===0||games.length>10000) throw Error('Invalid synthetic game sample');
  let a=0,b=0,sumMargin=0,sumTotal=0;
  for(const g of games){
    if(!g||!Array.isArray(g.final)||g.final.length!==2||!g.final.every(nonnegativeInt)||
       !Number.isFinite(g.margin)||!Number.isFinite(g.total)||g.final[0]-g.final[1]!==g.margin||
       g.final[0]+g.final[1]!==g.total||g.margin===0||
       !g.config||g.config.a===g.config.b||
       g.winner!==(g.margin>0?g.config.a:g.config.b)) throw Error('Inconsistent generated score or winner');
    a+=+(g.margin>0); b+=+(g.margin<0);
    sumMargin+=g.margin;sumTotal+=g.total;
  }
  const n=games.length,meanMargin=sumMargin/n,meanTotal=sumTotal/n;
  // Approximate *in-sample* half-point reference, not an independently fitted market line.
  const spreadA=options.spreadA===undefined? -Math.floor(meanMargin)-0.5:options.spreadA;
  const totalLine=options.totalLine===undefined? Math.floor(meanTotal)+0.5:options.totalLine;
  if(!validLine(spreadA)||!validLine(totalLine)||totalLine<0)throw Error('Invalid reference spread or total');
  const cover={a:0,b:0,push:0},points={over:0,under:0,push:0};
  const joint={winAndCover:0,winAndNoCover:0,winAndPush:0,lossAndCover:0,lossAndNoCover:0,lossAndPush:0};
  for(const g of games){
    const s=g.margin+spreadA, win=g.margin>0;
    const covered=s>1e-9,failed=s< -1e-9;
    if(covered)cover.a++;else if(failed)cover.b++;else cover.push++;
    if(g.total>totalLine+1e-9)points.over++;else if(g.total<totalLine-1e-9)points.under++;else points.push++;
    const key=win?(covered?'winAndCover':failed?'winAndNoCover':'winAndPush'):
       (covered?'lossAndCover':failed?'lossAndNoCover':'lossAndPush');joint[key]++;
  }
  if(a+b!==n||cover.a+cover.b+cover.push!==n||points.over+points.under+points.push!==n||
     Object.values(joint).reduce((s,v)=>s+v,0)!==n||
     joint.winAndCover+joint.winAndNoCover+joint.winAndPush!==a||
     joint.lossAndCover+joint.lossAndNoCover+joint.lossAndPush!==b||
     joint.winAndCover+joint.lossAndCover!==cover.a)throw Error('Synthetic market reconciliation failed');
  return {
    n, source:'single-identical-synthetic-game-sample',
    reference:{spreadA,spreadB:-spreadA,totalLine,marginThreshold:-spreadA,method:'in-sample half-point reference from generated mean; NOT a bookmaker or fitted prediction'},
    wins:{a,b},cover,points,joint,
    rates:{winA:num(a/n),winB:num(b/n),coverA:num(cover.a/n),coverB:num(cover.b/n),over:num(points.over/n),under:num(points.under/n)},
    meanMargin:num(meanMargin),meanTotal:num(meanTotal)
  };
}

/** Convert a fitted win probability to an illustration of the same directional
 * margin, using the 2024 *historical score-residual* 10th and 90th offsets.
 * Logistic quantile distance: q90-q10 = 2*log(9)*scale.
 * It is NOT an independently validated spread forecast.
 */
export function illustrativeMarginFromProbability(p, interval80Offset){
  if(typeof p!=='number'||!Number.isFinite(p)||p<=0||p>=1||
     !Array.isArray(interval80Offset)||interval80Offset.length!==2||
     !interval80Offset.every(Number.isFinite)||
     interval80Offset[1]-interval80Offset[0]<2||interval80Offset[1]-interval80Offset[0]>150) return null;
  const scale=(interval80Offset[1]-interval80Offset[0])/(2*Math.log(9));
  const margin=scale*Math.log(p/(1-p));
  return Number.isFinite(margin)?{margin,spreadA:-margin,scale,classification:'illustrative-logistic-translation-not-fitted-spread'}:null;
}
