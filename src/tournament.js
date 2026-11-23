import {TEAM_MAP,TEAMS,DEFAULT_CONFIG,ENGINE_VERSION,hash32,rng,validateConfig,simulateGame} from './engine.js';
import {selectCFPField} from './cfpSelection.js';
import {evaluatedFbsRankings} from './research.js';
import {observed,sourceStatus} from './observed.js';
import {COMMITTEE_2026,committeeOrderedField} from './committee2026.js';
export const FORMATS=[
{id:'fbs12',label:'CFP 12 · 2026–27',size:12,kind:'official-fbs',byes:4,season:'2026–27'},
{id:'fbs24',label:'CFP 24 · 2027–28',size:24,kind:'official-fbs',byes:8,season:'2027–28'},
{id:'fcs24',label:'FCS-inspired 24 · mixed-field demo',size:24,kind:'fcs-inspired',byes:8,season:'hypothetical'},
{id:'fullFbs138',label:'ALL 138 FBS · National open',size:138,kind:'hypothetical',byes:118,season:'2026 — all FBS'},
...([2,4,8,16,32,48,64,68,96,128].map(n=>({id:'custom'+n,label:n===68?'MARCH MAYHEM · 68 teams':n===64?'NATIONAL 64 · four regions':n===128?'THE FIELD · 128 teams':`${n} teams · hypothetical`,size:n,kind:'hypothetical',byes:null,season:'custom'})))
];
export const FORMAT_MAP=Object.fromEntries(FORMATS.map(x=>[x.id,x]));
// Official field-qualification policy is not inferred from model ranking: users
// supply hypothetical participants in committee-style bracket lanes.
export const CFP_RULES=Object.freeze({
 fbs12:Object.freeze({effective:'2026-27',type:'CFP bracket geometry only',automaticBids:5,atLarge:7,
  conferenceChampionBids:4,highestRankedOtherConferenceChampion:1,notreDameTop12Exception:true,
  byes:4,openingHosts:'seeds 5-8',siteRounds:['campus','CFP bowl','CFP bowl','championship host'],reseeding:false,
  url:'https://collegefootballplayoff.com/sports/2024/5/29/12-team-format'}),
 fbs24:Object.freeze({effective:'2027-28',type:'CFP bracket geometry only',automaticBids:5,atLarge:19,
  conferenceChampionBids:4,highestRankedOtherConferenceChampion:1,
  byes:8,openingHosts:'seeds 9-16',secondRoundHosts:'seeds 1-8',
  siteRounds:['campus','campus','CFP bowl','CFP bowl','championship host'],reseeding:false,
  url:'https://collegefootballplayoff.com/sports/2026/11/9/24-team-format'})
});
export const roundSite=(formatId,stage)=>CFP_RULES[formatId]?.siteRounds[stage]||'hypothetical neutral site';
function validSimulatedWinner(game,a,b){return !!game&&game.config?.a===a&&game.config?.b===b&&
 Array.isArray(game.final)&&game.final.length===2&&game.final.every(n=>Number.isSafeInteger(n)&&n>=0&&n<200)&&
 game.final[0]!==game.final[1]&&game.winner===(game.final[0]>game.final[1]?a:b)&&
 game.total===game.final[0]+game.final[1]&&game.margin===game.final[0]-game.final[1];}

export function seedOrder(n){if(n<2||(n&(n-1))!==0)throw Error('Power-of-two bracket required');let a=[1,2];for(let m=4;m<=n;m*=2)a=a.flatMap(v=>[v,m+1-v]);return a;}
export function rulesOrder(format){let n=1;while(n<format.size)n*=2;let order=seedOrder(n);
 // March Mayhem models 4 regional 16-team ladders after a four-game First Four.
 // Instead of placing all four play-in games among the bottom eight national seeds,
 // place two at the global 11-seed line (approx. ranks 41-44) and two at
 // the 16-seed line (ranks 61-64). Four extra qualifiers #65-68 enter
 // those lanes; survivors retain their lane through the main 64-team field.
 // This is an NCAA-style HYPOTHETICAL seeding model, not NCAA basketball rules.
 if(format.id==='custom68'){
   const opponents={42:65,43:66,63:67,64:68};
   order=seedOrder(64).flatMap(rank=>[rank,opponents[rank]||128]);
 }
 if(format.id==='fbs24')order=[1,32,16,17,8,25,9,24,5,28,12,21,4,29,13,20,6,27,11,22,3,30,14,19,7,26,10,23,2,31,15,18];if(format.id==='fbs12')order=[1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11];return order;}
export function validateParticipants(ids,formatId){const f=FORMAT_MAP[formatId];if(!f)throw Error('Unsupported bracket format');if(!Array.isArray(ids)||ids.length!==f.size)throw Error(`Expected ${f.size} participants`);if(new Set(ids).size!==ids.length)throw Error('Duplicate participant');if(ids.some(x=>!TEAM_MAP[x]))throw Error('Unknown team');return true;}
/** Order is a 2026 *research seeding*, not a claim about CFP rankings. */
export function ranked2026Field() {
 const research=evaluatedFbsRankings();
 if(research){
   const ids=research.ids.concat(TEAMS.filter(x=>x.division==='fbs'&&!research.ids.includes(x.id)).map(x=>x.id));
   return {...research,ids,source:'2026 Elo research rating · provisional',fallback:false};
 }
 const rows=TEAMS.filter(x=>x.division==='fbs').map(team=>({id:team.id,record:observed(team.id,2026)}));
 const known=rows.filter(x=>x.record&&Number.isFinite(x.record.pointsFor)&&Number.isFinite(x.record.pointsAgainst));
 if(known.length>=130){
   // Explicitly provisional: win rate and scoring margin are not opponent-adjusted.
   const score=x=>x.record ? (30*(x.record.wins/x.record.games-.5)+.5*(x.record.pointsFor-x.record.pointsAgainst)) : -Infinity;
   rows.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
   return {ids:rows.map(x=>x.id),source:'2026 observed win rate + scoring margin · unadjusted',
    asOf:sourceStatus.seasons[2026]?.asOf||'2026 snapshot',covered:known.length,fallback:true};
 }
 return {ids:rows.map(x=>x.id),source:'UNRANKED fallback — no research dataset',asOf:'unavailable',covered:0,fallback:true};
}
export function defaultParticipants(formatId){
 const f=FORMAT_MAP[formatId];if(!f)throw Error('Unknown format');
 const researchIds=ranked2026Field().ids;
 // Official interim top 25 leads the 2026 CFP *preview* field, but we do not
 // invent Selection Day conference champions or infer 2027 committee rankings.
 const ids=f.id==='fbs12'||f.id==='fbs24'?committeeOrderedField(researchIds):researchIds;
 if(f.kind==='fcs-inspired')return TEAMS.filter(x=>x.division==='fcs').map(x=>x.id).concat(ids).slice(0,f.size);
 if(f.size>ids.length)throw Error('Not enough FBS teams for this field');
 return ids.slice(0,f.size);
}
/** Atomic, roster-preserving swap; allowed only before the first played round. */
export function swapTournamentSeeds(t,from,to){
 if(!t || t.champion || t.stage!==0 || t.rounds.length || Object.keys(t.played).length)throw Error('Reset the tournament before swapping seeds');
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=t.participants.length||to>=t.participants.length)throw Error('Invalid seed number');
 if(from===to)return t;
 const ids=t.participants.slice();[ids[from],ids[to]]=[ids[to],ids[from]];
 const next=createTournament(t.formatId,ids,t.seed);
 return {...next,seedingSource:t.seedingSource};
}

export function createTournament(formatId='fbs12',participants=defaultParticipants(formatId),seed=20261120){validateParticipants(participants,formatId);if(!Number.isSafeInteger(+seed)||+seed<0||+seed>4294967295)throw Error('Invalid seed');const f=FORMAT_MAP[formatId];const order=rulesOrder(f);const slots=order.map(i=>i<=f.size?participants[i-1]:null);return {formatId,participants:participants.slice(),seed:+seed,slots,stage:0,rounds:[],played:{},champion:null,version:ENGINE_VERSION,
  seedingSource:formatId==='fbs12'?`2026 CFP interim top 25 (Nov 17), then provisional Elo; NOT final qualifiers`:formatId==='fbs24'?`2026 CFP interim top 25 preview for 2027 format; not 2027 rankings`:ranked2026Field().source};}
/** Builds an official-geometry bracket only after explicit qualification inputs pass.
 * The returned bracket is still hypothetical until committee rankings/champions
 * have been independently verified against an official Selection Day release.
 */
export function createCommitteeInputTournament(input, seed=20261121) {
 const selection=selectCFPField(input);
 const tournament=createTournament(input.formatId,selection.participantIds,seed);
 return {...tournament,selection};
}
export const roundName=(f,stage)=>{
  const rounds=Math.ceil(Math.log2(f.size));
  const remaining=rounds-stage;
  if(remaining===1)return 'Championship';
  if(remaining===2)return 'Semifinals';
  if(remaining===3)return 'Quarterfinals';
  if(f.size===138&&stage===0)return 'FBS Play-in · 138 to 128';
  if(f.size===68&&stage===0)return 'First Four · 68 to 64';
  if(f.size===138&&stage===1)return 'Round of 128';
  if(f.size===68&&stage===1)return 'Round of 64';
  if(f.size===68&&stage===2)return 'Round of 32';
  if(f.size>32&&stage===0&&(f.size & (f.size-1))!==0)return 'Qualifying round';
  if(stage===0)return 'First round';
  if(f.id==='fbs24'&&stage===1)return 'Second round';
  const fieldSize=Math.pow(2,remaining);
  return fieldSize===128?'Round of 128':fieldSize===64?'Round of 64':fieldSize===32?'Round of 32':fieldSize===16?'Round of 16':`Round ${stage+1}`;
};
function gameConfig(a,b,base,stage,seed,formatId){const sa=Number(base?.seasonA??2026),sb=Number(base?.seasonB??2026);return {...DEFAULT_CONFIG,a,b,seasonA:sa,seasonB:sb,venue:formatId==='fbs12'&&stage===0?'a':formatId==='fbs24'&&stage<=1?'a':'neutral',pace:Number(base?.pace??1),shift:0,seed,siteKind:roundSite(formatId,stage)};}
function readSlots(t){return t.slots.length/2}
export function playablePairs(t){if(t.champion)return [];const result=[];for(let j=0;j<readSlots(t);j++){const a=t.slots[2*j],b=t.slots[2*j+1];if(a&&b)result.push({index:j,a,b,game:t.played[j]||null});}return result;}
export function simulatePair(t,index,base){if(t.champion)throw Error('Tournament complete');if(!Number.isInteger(index)||index<0||index>=readSlots(t))throw Error('Invalid match index');const a=t.slots[index*2],b=t.slots[index*2+1];if(!a||!b)throw Error('Bye cannot be played');if(t.played[index])return t;const seed=hash32(`${t.seed}|round:${t.stage}|pair:${index}`),config=gameConfig(a,b,base,t.stage,seed,t.formatId);const game=simulateGame(config,seed);return {...t,played:{...t.played,[index]:game}};}
export function finalizeRound(t){if(t.champion)return t;const next=[],matches=[];for(let i=0;i<readSlots(t);i++){const a=t.slots[2*i],b=t.slots[2*i+1],game=t.played[i]||null;if(a&&b&&!game)throw Error('Unplayed matchup');if(game&&!validSimulatedWinner(game,a,b))throw Error('Tournament game result failed validation');const adv=game?.winner||a||b||null;matches.push({id:`r${t.stage}-m${i}`,a,b,game,winner:adv,bye:Boolean((a&&!b)||(!a&&b))});next.push(adv)}const rounds=[...t.rounds,{name:roundName(FORMAT_MAP[t.formatId],t.stage),matches}];return {...t,slots:next,stage:t.stage+1,played:{},rounds,champion:next.length===1?next[0]:null};}
export function simulateRound(t,base){let n=t;for(const p of playablePairs(n))if(!p.game)n=simulatePair(n,p.index,base);return finalizeRound(n);}
export function simulateTournament(t,base){let n=t;while(!n.champion)n=simulateRound(n,base);return n;}
export function monteCarloTournament(t,n,base,progress){if(!Number.isInteger(n)||n<1||n>5000)throw Error('Invalid tournament count');const counts=Object.fromEntries(t.participants.map(id=>[id,0]));const reached=Object.fromEntries(t.participants.map(id=>[id,[]]));const finalMatchups=new Map(),gamesPlayed=Object.fromEntries(t.participants.map(id=>[id,0]));for(let i=0;i<n;i++){let s=createTournament(t.formatId,t.participants,hash32(String(t.seed)+':MC:'+i));s=simulateTournament(s,base);counts[s.champion]++;for(const rr of s.rounds){for(const m of rr.matches){if(m.game){gamesPlayed[m.a]++;gamesPlayed[m.b]++;reached[m.winner][Number(m.id.match(/^r(\d+)/)[1])]=(reached[m.winner][Number(m.id.match(/^r(\d+)/)[1])]||0)+1;}}}const final=s.rounds.at(-1).matches[0];const key=[final.a,final.b].sort().join('|');finalMatchups.set(key,(finalMatchups.get(key)||0)+1);if(progress&&((i+1)%50===0||i===n-1))progress(i+1,n)}return {n,counts,probabilities:Object.fromEntries(t.participants.map(id=>[id,counts[id]/n])),gamesPlayed:Object.fromEntries(t.participants.map(id=>[id,gamesPlayed[id]/n])),reached,finalMatchups:[...finalMatchups].sort((a,b)=>b[1]-a[1]).slice(0,10),model:ENGINE_VERSION};}
