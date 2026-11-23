/**
 * 2026 Dynasty Showcase: deterministic page-independent simulation schedule.
 * All clocks are presentation time, not football time. No victory before 11.6 s.
 */
export const SHOWCASE={introMs:2600,firstRoundMs:3100,lastRoundMs:10900,championRevealMs:11600,awardRevealMs:13200,finishMs:15000};
export function ceremonyTimeline(roundsRemaining){
 if(!Number.isInteger(roundsRemaining)||roundsRemaining<1||roundsRemaining>12)throw Error('Invalid rounds');
 const rounds=Array.from({length:roundsRemaining},(_,i)=>{
  const fraction=roundsRemaining===1?1:i/(roundsRemaining-1);
  const at=Math.round(SHOWCASE.firstRoundMs+(SHOWCASE.lastRoundMs-SHOWCASE.firstRoundMs)*fraction);
  return {type:'round',index:i,at};
 });
 const phases=[
  {type:'kickoff',at:0},
  {type:'field',at:1250},
  {type:'tunnel',at:SHOWCASE.introMs},
  ...rounds,
  {type:'champion',at:SHOWCASE.championRevealMs},
  {type:'awards',at:SHOWCASE.awardRevealMs},
  {type:'finish',at:SHOWCASE.finishMs}
 ];
 if(phases.some((p,i)=>i&&p.at<phases[i-1].at))throw Error('Nonmonotonic ceremony');
 return phases;
}
export const minimumChampionWaitMs=()=>SHOWCASE.championRevealMs;
