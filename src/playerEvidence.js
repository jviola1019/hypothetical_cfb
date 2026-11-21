/* Historical, *derived* player summaries. No raw game ledgers are published,
   and observed hit shares are never presented as future prop probabilities. */
import {FBS_TEAMS} from './catalog.js';
const validTeams=new Set(FBS_TEAMS.map(t=>t.id));
const memory=new Map(),pending=new Map();
const acceptable=new Set(['passingYards','rushingYards','receivingYards','fieldGoalsMade']);
const key=(season,team)=>`${season}:${team}`;
function checkPlayer(p){
 if(!p||'gameLines' in p||'games' in p||typeof p.name!=='string'||p.name.length<3||p.name.length>95||/[<>\u0000-\u001f]/.test(p.name)||
 typeof p.position!=='string'||p.position.length>16||!acceptable.has(p.stat)||
 typeof p.label!=='string'||p.label.length>40||
 !Number.isInteger(p.eventGames)||p.eventGames<3||p.eventGames>18||
 !Number.isInteger(p.n)||p.n<3||p.n>p.eventGames||
 !Number.isInteger(p.hit)||p.hit<0||p.hit>p.n||
 ![p.mean,p.median,p.p10,p.p90,p.line].every(x=>Number.isFinite(x)&&x>=0&&x<=1200)||
 p.p10>p.median||p.median>p.p90||p.mean>p.p90+200)return false;
 return true;
}
export function installPlayerEvidence(doc){
 if(!doc||doc.schemaVersion!==2||![2025,2026].includes(doc.season)||!validTeams.has(doc.team)||
 doc.classification!=='derived-player-aggregate-not-projection'||
 !/^\d{4}-\d{2}-\d{2}$/.test(doc.sourceCutoff)||
 !/^\d{4}-\d{2}-\d{2}$/.test(doc.lastRecordedGame)||doc.lastRecordedGame>doc.sourceCutoff||
 typeof doc.sourceUrl!=='string'||!doc.sourceUrl.startsWith('https://github.com/sportsdataverse/')||
 !Array.isArray(doc.players)||doc.players.length>16)throw Error('Invalid derived player snapshot');
 const seen=new Set();
 for(const p of doc.players){
  if(!checkPlayer(p))throw Error('Invalid derived player row');
  const id=p.name.toLocaleLowerCase();if(seen.has(id))throw Error('Duplicate athlete');seen.add(id);
 }
 const stored=structuredClone(doc);memory.set(key(doc.season,doc.team),stored);return stored.players.length;
}
export const getPlayerEvidence=(team,year=2026)=>memory.get(key(year,team))||null;
export async function loadPlayerEvidence(team,year=2026,base='./public/data/'){
 if(!validTeams.has(team)||![2025,2026].includes(year))throw Error('Unknown school/season');
 const id=key(year,team);if(memory.has(id))return memory.get(id);
 if(pending.has(id))return pending.get(id);
 const promise=(async()=>{
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4500);
  try{
   const res=await fetch(`${base}players-${year}/${team}.json`,{signal:ctrl.signal,cache:'no-cache'});
   if(!res.ok||Number(res.headers.get('content-length')||0)>80000)return null;
   const raw=await res.text();if(raw.length>80000)return null;
   const doc=JSON.parse(raw);if(doc.team!==team||doc.season!==year)return null;
   installPlayerEvidence(doc);return memory.get(id);
  }catch(_){return null}finally{clearTimeout(timer);pending.delete(id)}
 })();pending.set(id,promise);return promise;
}
/** Descriptive shares conditional on a recorded-stat game, never future odds. */
export function observedPropRows(team,year=2026,limit=12){
 const doc=getPlayerEvidence(team,year);if(!doc)return [];
 return doc.players.map(p=>({...p,team,hitRate:p.hit/p.n,sourceDate:doc.lastRecordedGame,
  description:'Historical stat-recorded game share; not a predictive probability'}))
 .sort((x,y)=>y.n-x.n||y.mean-x.mean||x.name.localeCompare(y.name)).slice(0,limit);
}
