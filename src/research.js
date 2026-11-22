import {FBS_TEAMS} from './catalog.js';
const IDs=new Set(FBS_TEAMS.map(x=>x.id));
const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
const round=(n,p=4)=>Math.round(n*10**p)/10**p;
const DEFAULT=27;
let report=null;

/** Install only an explicitly evaluated, season-scoped, bounded research artifact. */
export function installResearchSnapshot(x){
  if(!x||x.schemaVersion!==1||x.modelVersion!=='chronological-elo-slope-0.1.0'||
    x.classification!=='experimental-2025-trained-2026-held-out'||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(x.asOf)||!x.training||!x.holdout||!x.fixedParameters||
    !x.teamState||typeof x.teamState!=='object'||Array.isArray(x.teamState)||
    x.training.season!==2025||x.holdout.season!==2026||
    !Number.isInteger(x.training.games)||x.training.games<400||
    !Number.isInteger(x.holdout.evaluatedGames)||x.holdout.evaluatedGames<300||
    !Number.isFinite(x.training.calibratedSlope)||x.training.calibratedSlope<.25||x.training.calibratedSlope>2.5||
    !Number.isFinite(x.holdout.calibratedElo?.brier)||x.holdout.calibratedElo.brier<0||x.holdout.calibratedElo.brier>1)throw Error('Invalid empirical research artifact');
  if(Object.keys(x.teamState).length<130||Object.keys(x.teamState).length>155)throw Error('Incomplete baseline team coverage');
  const fixed=x.fixedParameters;
  if(fixed.eloScale!==400||fixed.initialElo!==1500||fixed.homeElo!==55||fixed.priorGames!==4||fixed.startingPointsPerTeam!==27||fixed.homePointsMargin!==2.4)throw Error('Unsupported baseline parameters');
  for(const [id,t] of Object.entries(x.teamState)){
    if(!IDs.has(id)||!t||!Number.isFinite(t.elo)||t.elo<700||t.elo>2300||
      !Number.isInteger(t.gamesCurrentSeason)||t.gamesCurrentSeason<0||t.gamesCurrentSeason>18||
      !Number.isFinite(t.scoredToDate)||t.scoredToDate<0||t.scoredToDate>2500||
      !Number.isFinite(t.allowedToDate)||t.allowedToDate<0||t.allowedToDate>2500)throw Error('Invalid research team');
  }
  report=structuredClone(x);
  return Object.keys(report.teamState).length;
}
/**
 * As-of 2026 opponent-adjusted Elo rankings for fantasy seeding only.
 * This is NOT the CFP Selection Committee order. Never use future game results
 * for a historical forecast: the terminal ratings only rank a new bracket.
 */
export function evaluatedFbsRankings() {
  if (!report) return null;
  const schools = Object.entries(report.teamState)
    .filter(([id, team]) => IDs.has(id) && Number.isFinite(team.elo))
    .map(([id, team]) => ({id, score:team.elo, games:team.gamesCurrentSeason}));
  if (schools.length < 130) return null;
  schools.sort((a,b)=>b.score-a.score || b.games-a.games || a.id.localeCompare(b.id));
  return {ids:schools.map(s=>s.id), scores:Object.fromEntries(schools.map(s=>[s.id,s.score])),
    source:'2026 Elo research rating (provisional, not committee)', asOf:report.lastScoredGame||report.asOf,
    model:report.modelVersion, covered:schools.length};
}

export const researchSnapshot=()=>report?structuredClone(report):null;
export const researchStatus=()=>report?{available:true,version:report.modelVersion,asOf:report.asOf,lastScoredGame:report.lastScoredGame,
  holdoutGames:report.holdout.evaluatedGames,trainingGames:report.training.games}: {available:false};
export function evaluatedMatchup(a,b,venue){
  if(!report||!IDs.has(a)||!IDs.has(b)||a===b||!['a','b','neutral'].includes(venue))return null;
  const A=report.teamState[a],B=report.teamState[b];if(!A||!B)return null;
  const f=report.fixedParameters, homeEdge=venue==='a'?f.homeElo:venue==='b'?-f.homeElo:0;
  const z=(A.elo-B.elo+homeEdge)*Math.LN10/f.eloScale;
  const p=sigmoid(z*report.training.calibratedSlope);
  const rate=(t,k)=>(f.priorGames*DEFAULT+t[k])/(f.priorGames+t.gamesCurrentSeason);
  const hPts=venue==='a'?f.homePointsMargin:venue==='b'?-f.homePointsMargin:0;
  const ptsA=Math.max(3,(rate(A,'scoredToDate')+rate(B,'allowedToDate'))/2+hPts/2);
  const ptsB=Math.max(3,(rate(B,'scoredToDate')+rate(A,'allowedToDate'))/2-hPts/2);
  return {pA:p,pB:1-p,expectedA:ptsA,expectedB:ptsB,expectedMargin:ptsA-ptsB,expectedTotal:ptsA+ptsB,
    ratingA:A.elo,ratingB:B.elo,gamesA:A.gamesCurrentSeason,gamesB:B.gamesCurrentSeason,
    asOf:report.asOf,lastScoredGame:report.lastScoredGame,trainingGames:report.training.games,
    validation:report.holdout,model:report.modelVersion,
    interpretation:'Experimental, observed-results-based pregame baseline; trained only on the 2025 season and evaluated sequentially on 2026 results. Not a calibrated player-prop model.'};
}

/** Optional immutable JSON artifact. Never fetch from an authenticated API in the browser. */
export async function loadResearchSnapshot(url='./public/data/research-2026.json'){
  try{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5500);
    let response;try{response=await fetch(url,{cache:'no-cache',signal:controller.signal})}finally{clearTimeout(timeout)}
    if(!response.ok||+(response.headers.get('Content-Length')||0)>240000)return false;
    const raw=await response.text();if(raw.length>240000)return false;
    installResearchSnapshot(JSON.parse(raw));return true;
  }catch{return false;}
}
