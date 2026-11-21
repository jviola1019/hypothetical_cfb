import {observed,namedPlayer} from './observed.js';
import {FBS_TEAMS,FCS_REFERENCE} from './catalog.js';
/* GRIDIRON LAB 0.4 — reproducible, synthetic, drive-level football lab.
   THESE PARAMETERS ARE NOT FITTED TO HISTORICAL RESULTS. */
export const ENGINE_VERSION='1.0-roster-matched-hypothetical';
export const TEAMS = [...FBS_TEAMS,...FCS_REFERENCE];
export const TEAM_MAP=Object.fromEntries(TEAMS.map(t=>[t.id,t]));
export function hash32(x){let h=2166136261;for(const c of String(x)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function rng(seed){let a=(Number(seed)>>>0)||0x9e3779b9;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const randint=(r,min,max)=>min+Math.floor(r()*(max-min+1));
const normal=(r)=>Math.sqrt(-2*Math.log(Math.max(1e-12,r())))*Math.cos(2*Math.PI*r());
const choose=(r,weights)=>{let q=r()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){q-=weights[i];if(q<=0)return i}return weights.length-1};
export function teamProfile(id,season=2026){
  if(!TEAM_MAP[id])throw Error('Unknown team');
  const historical=observed(id,season);
  if(historical){
    // Deliberately simple *retrospective* proxy: full-season PPG is not pregame-safe.
    return {id,season,offense:clamp(0.55+0.45*historical.pointsFor/28,0.5,1.6),defense:clamp(0.55+0.45*historical.pointsAgainst/28,0.5,1.6),tempo:1,coverage:`${season}-snapshot-descriptive`};
  }
  // No observed school-season data: assign a neutral, UNRANKED baseline.
  // The previous team-ID seeded random power ranking gave unsupported schools
  // invented favorite status and was not defensible as realism.
  return {id,season,offense:1,defense:1,tempo:1,coverage:'unranked-synthetic-fallback'};
}
export function validateConfig(c){if(!c||!TEAM_MAP[c.a]||!TEAM_MAP[c.b]||c.a===c.b)throw Error('Select two different supported teams');for(const v of ['seasonA','seasonB'])if(!Number.isInteger(+c[v])||+c[v]<2010||+c[v]>2026)throw Error('Invalid demo season');if(!['neutral','a','b'].includes(c.venue))throw Error('Invalid venue');if(!Number.isFinite(+c.seed)||+c.seed<0||+c.seed>4294967295)throw Error('Invalid seed');if(!Number.isFinite(+c.pace)||+c.pace<0.7||+c.pace>1.35)throw Error('Invalid pace');if(!Number.isFinite(+c.shift)||Math.abs(+c.shift)>0.5)throw Error('Invalid strength adjustment');return true;}
export const DEFAULT_CONFIG={a:'ole-miss',b:'georgia',seasonA:2026,seasonB:2026,venue:'neutral',pace:1,shift:0,seed:20261121};
function newPlayers(team,season){const p={QB:{id:team+'-QB',label:'QB1 · synthetic',passingAttempts:0,completions:0,passingYards:0,passingTD:0,interceptions:0,rushAttempts:0,rushYards:0,rushingTD:0},RB:{id:team+'-RB',label:'RB1 · synthetic',rushAttempts:0,rushYards:0,rushingTD:0,targets:0,receptions:0,receivingYards:0,receivingTD:0},WR1:{id:team+'-WR1',label:'WR1 · synthetic',targets:0,receptions:0,receivingYards:0,receivingTD:0},WR2:{id:team+'-WR2',label:'WR2 · synthetic',targets:0,receptions:0,receivingYards:0,receivingTD:0},TE:{id:team+'-TE',label:'TE1 · synthetic',targets:0,receptions:0,receivingYards:0,receivingTD:0},K:{id:team+'-K',label:'K1 · synthetic',fieldGoalsAttempted:0,fieldGoalsMade:0,extraPointsAttempted:0,extraPointsMade:0}};for(const [role,player] of Object.entries(p)){const named=namedPlayer(team,role,season);player.label=named?.name||('Unassigned '+role+' · model-only');player.historical=Boolean(named);player.rosterSeason=named?.season||null;player.selectionBasis=named?.selectionBasis||'unassigned';player.roleVerified=false;}return p;}
function initStats(team,season){return {team,points:0,passYards:0,rushYards:0,passAttempts:0,completions:0,rushAttempts:0,passingTD:0,rushingTD:0,turnovers:0,fumblesLost:0,drives:0,plays:0,fieldGoals:0,twoPointAttempts:0,twoPointMade:0,overtimePoints:0,byQuarter:[0,0,0,0],players:newPlayers(team,season)};}
function distribute(r,n,weights){const a=weights.map(()=>0);for(let j=0;j<n;j++)a[choose(r,weights)]++;return a}
function drive(r,s,opponent,p,opp,opts){const start=opts.ot?75:(Number.isInteger(opts.start)?clamp(opts.start,5,95):randint(r,18,37));const pace=opts.pace;const offense=clamp(p.offense+(opts.shift||0),0.45,1.7);// defense is proportional to POINTS ALLOWED: >1 means weaker defense,
  // so offense should increase (not decrease) against it.
  const matchup=clamp(offense*opp.defense,0.50,1.65);const fieldBonus=opts.ot?0.20:0;const tdChance=clamp(0.2475*matchup+fieldBonus+(opts.home?0.012:0),0.10,0.72);const fgChance=clamp(0.1485*matchup+(opts.ot?0.05:0),0.05,0.29);const turnoverChance=clamp(0.105/matchup,0.03,0.20);let z=r(),outcome=z<tdChance?'TD':z<tdChance+fgChance?'FG':z<tdChance+fgChance+turnoverChance?'TO':'PUNT';const yardToGoal=100-start;const gain=outcome==='TD'?yardToGoal:outcome==='FG'?Math.max(0,yardToGoal-randint(r,15,33)):randint(r,0,Math.max(1,Math.min(yardToGoal-1,57)));
const plays=outcome==='TD'?clamp(Math.round(gain/15)+randint(r,1,2),3,11):clamp(Math.round(gain/13)+randint(r,1,3),3,10);
const passAttempts=clamp(Math.round(plays*(0.51+(r()-.5)*.24)),1,plays-1);const rushAttempts=plays-passAttempts;
let completions=0;for(let i=0;i<passAttempts;i++)if(r()<clamp(.60+0.07*(matchup-1),.48,.72))completions++;
let passYards=completions?Math.round(gain*clamp(.52+r()*.23,0,1)):0;let rushYards=gain-passYards;
const qb=s.players.QB,rb=s.players.RB,k=s.players.K;
qb.passingAttempts+=passAttempts;qb.completions+=completions;qb.passingYards+=passYards;s.passAttempts+=passAttempts;s.completions+=completions;s.passYards+=passYards;
const qbRush=Math.min(rushAttempts>1?randint(r,0,Math.min(2,rushAttempts-1)):0,rushAttempts);qb.rushAttempts+=qbRush;rb.rushAttempts+=rushAttempts-qbRush;const qbYds=qbRush?Math.round(rushYards*0.15):0;qb.rushYards+=qbYds;rb.rushYards+=rushYards-qbYds;s.rushAttempts+=rushAttempts;s.rushYards+=rushYards;
const receivers=[s.players.WR1,s.players.WR2,s.players.TE,rb];const targets=distribute(r,passAttempts,[.36,.28,.19,.17]);for(let i=0;i<receivers.length;i++)receivers[i].targets+=targets[i];
// Allocate completions without exceeding target capacities.
let catchSlots=targets.slice(), catches=[0,0,0,0];for(let j=0;j<completions;j++){let i=choose(r,catchSlots);if(!catchSlots[i])i=catchSlots.findIndex(x=>x>0);catchSlots[i]--;catches[i]++}
for(let i=0;i<receivers.length;i++)receivers[i].receptions+=catches[i];const yardWeights=catches.map(x=>x?x*(0.8+r()*.5):0);const yardSplit=passYards?distribute(r,passYards,yardWeights):[0,0,0,0];for(let i=0;i<receivers.length;i++)receivers[i].receivingYards+=yardSplit[i];
s.plays+=plays;s.drives++;
let points=0,conversion='NONE',turnoverKind=null;if(outcome==='TD'){const passTD=completions>0&&r()<clamp(.55+.1*(matchup-1),.42,.7);if(passTD){qb.passingTD++;s.passingTD++;let z=choose(r,catches);if(!catches[z])z=catches.findIndex(x=>x>0);receivers[z].receivingTD++;}else{(qbRush&&r()<.08?qb:rb).rushingTD++;s.rushingTD++;}points=6;if(opts.ot&&opts.q===5){conversion='2PT';s.twoPointAttempts++;if(r()<.46){s.twoPointMade++;points+=2}}else{conversion='XP';k.extraPointsAttempted++;if(r()<.94){k.extraPointsMade++;points++}}}
else if(outcome==='FG'){k.fieldGoalsAttempted++;if(r()<.89){k.fieldGoalsMade++;points=3;s.fieldGoals++}else outcome='MISSED FG'}else if(outcome==='TO'){s.turnovers++;if(r()<.62){qb.interceptions++;turnoverKind='interception';}else{s.fumblesLost++;turnoverKind='fumble';}}
const turnoverType=turnoverKind;
s.points+=points;if(opts.q>=0&&opts.q<=3)s.byQuarter[opts.q]+=points;else s.overtimePoints+=points;return {turnoverType,conversion,offense:s.team,defense:opponent.team,start,gain,plays,outcome,points,passYards,rushYards,passAttempts,completions,quarter:opts.q<4?opts.q+1:`OT${opts.q-3}`,clock:opts.clock,elapsed:opts.elapsed,scoreA:0,scoreB:0};}
export function simulateGame(config,seed=config.seed){validateConfig(config);const r=rng(hash32(String(seed)+'|'+config.a+'|'+config.b));const profiles=[teamProfile(config.a,config.seasonA),teamProfile(config.b,config.seasonB)];const stats=[initStats(config.a,config.seasonA),initStats(config.b,config.seasonB)];const drives=[];let secs=3600,poss=r()<.5?0:1,nextStart=randint(r,20,35);
while(secs>0){let dsec=clamp(Math.round((100+Math.abs(normal(r))*50)/config.pace),45,320);dsec=Math.min(secs,dsec);let q=Math.min(3,Math.floor((3600-(secs-dsec)-1)/900));const d=drive(r,stats[poss],stats[1-poss],profiles[poss],profiles[1-poss],{pace:config.pace,shift:poss===0?+config.shift:-config.shift,home:config.venue===(poss===0?'a':'b'),start:nextStart,q,clock:secs,elapsed:dsec});secs-=dsec;d.scoreA=stats[0].points;d.scoreB=stats[1].points;drives.push(d);
 // Field position transfers through the previous drive. Kickoff position is a
 // documented approximation, not an observed special-teams or fourth-down model.
 if(d.outcome==='TO'||d.outcome==='MISSED FG'){
   nextStart=clamp(100-(d.start+d.gain),5,95);
 }else if(d.outcome==='PUNT'){
   const puntDistance=randint(r,33,53);
   nextStart=clamp(100-Math.min(99,d.start+d.gain+puntDistance),5,90);
 }else nextStart=randint(r,20,35);
 poss=1-poss}
// Model overtime as paired untimed drives, with two-point shootout from third OT.
let ot=0;while(stats[0].points===stats[1].points&&ot<128){ot++;if(ot<=2){const order=r()<.5?[0,1]:[1,0];for(let ix of order){const d=drive(r,stats[ix],stats[1-ix],profiles[ix],profiles[1-ix],{pace:1,shift:ix===0?+config.shift:-config.shift,ot:true,home:false,q:3+ot,clock:0,elapsed:0});d.scoreA=stats[0].points;d.scoreB=stats[1].points;drives.push(d)}}else{for(let ix=0;ix<2;ix++){const success=r()<.46;const pts=success?2:0;stats[ix].points+=pts;stats[ix].overtimePoints+=pts;stats[ix].twoPointAttempts++;stats[ix].twoPointMade+=+success;stats[ix].drives++;stats[ix].plays++;const d={offense:stats[ix].team,defense:stats[1-ix].team,start:97,gain:pts?3:0,plays:1,outcome:success?'2PT GOOD':'2PT FAIL',conversion:'2PT',points:pts,passYards:0,rushYards:0,passAttempts:0,completions:0,quarter:'OT'+ot,clock:0,elapsed:0,scoreA:stats[0].points,scoreB:stats[1].points};drives.push(d)}}}
if(stats[0].points===stats[1].points)throw Error('Overtime simulation safety limit reached');
return {id:`g-${hash32(seed+'|'+config.a+'|'+config.b).toString(16)}`,seed,config:{...config},teams:stats,drives,final:[stats[0].points,stats[1].points],margin:stats[0].points-stats[1].points,total:stats[0].points+stats[1].points,winner:stats[0].points>stats[1].points?config.a:config.b,ot};}
export function outcomeSummary(games,config){if(!games.length)throw Error('No games');let aw=0,over=0,cover=0,ots=0,sumA=0,sumB=0;let margin=[],total=[],scores=new Map(),running=[];for(let i=0;i<games.length;i++){const g=games[i];sumA+=g.final[0];sumB+=g.final[1];aw+=g.winner===config.a?1:0;ots+=g.ot>0?1:0;const key=g.final.join('-');scores.set(key,(scores.get(key)||0)+1);margin.push(g.margin);total.push(g.total);if((i+1)%Math.max(1,Math.floor(games.length/65))===0)running.push({n:i+1,p:aw/(i+1)});}margin.sort((a,b)=>a-b);total.sort((a,b)=>a-b);const quant=(xs,p)=>xs[Math.min(xs.length-1,Math.floor((xs.length-1)*p))];const prob=aw/games.length;return {n:games.length,meanA:sumA/games.length,meanB:sumB/games.length,pA:prob,pB:1-prob,ot:ots/games.length,marginMean:(sumA-sumB)/games.length,totalMean:(sumA+sumB)/games.length,margin,total,scores:[...scores.entries()].map(([score,count])=>({score,count})),running,marginInterval:[quant(margin,.05),quant(margin,.95)],totalInterval:[quant(total,.05),quant(total,.95)],mcse:Math.sqrt(prob*(1-prob)/games.length),model:ENGINE_VERSION};}
export function namedPropSummaries(games,config){
  const choices=[['QB','passingYards',250.5,'Pass yards'],['RB','rushYards',75.5,'Rush yards'],['WR1','receptions',4.5,'Receptions'],['WR2','receivingYards',49.5,'Receive yards'],['TE','receptions',3.5,'Receptions']];
  const out=[];
  for(let teamIndex=0;teamIndex<2;teamIndex++){
    const id=teamIndex===0?config.a:config.b;
    const season=teamIndex===0?config.seasonA:config.seasonB;
    for(const [role,stat,line,unit] of choices){
      const player=namedPlayer(id,role,season);if(!player)continue;
      const values=games.map(g=>g.teams[teamIndex].players[role][stat]||0).sort((a,b)=>a-b);
      const n=values.length;if(!n)continue;
      out.push({id:id+'-'+role,team:id,role,fullName:player.name,stat,unit,line,
       mean:values.reduce((a,b)=>a+b,0)/n,median:values[Math.floor(n/2)],p10:values[Math.floor((n-1)*.1)],p90:values[Math.floor((n-1)*.9)],
       above:values.filter(v=>v>line).length/n,n,values,seasonObservedMean:player.total===null?null:player.total/player.games,
       observedStat:player.stat});
    }
  }
  return out;
}
export function simulateBatch(config,n=400,seed=config.seed){validateConfig(config);if(!Number.isSafeInteger(n)||n<1||n>10000)throw Error('Invalid game count');const games=[];for(let i=0;i<n;i++)games.push(simulateGame(config,hash32(seed+':'+i)));return {...outcomeSummary(games,config),props:namedPropSummaries(games,config)}}
export function propDistribution(config,stat,role,threshold,n=400){validateConfig(config);if(!Number.isSafeInteger(n)||n<1||n>10000)throw Error('Invalid prop simulation count');if(!Number.isFinite(Number(threshold))||Math.abs(Number(threshold))>100000)throw Error('Invalid prop threshold');if(!['QB','RB','WR1','WR2','TE','K'].includes(role)||!['passingYards','passingAttempts','completions','interceptions','rushAttempts','rushYards','rushingTD','targets','receptions','receivingYards','receivingTD','fieldGoalsMade'].includes(stat))throw Error('Unsupported player statistic');const values=[];for(let i=0;i<n;i++){const g=simulateGame(config,hash32(config.seed+':prop:'+i));values.push(g.teams[0].players[role]?.[stat]??0)}values.sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/n,above:values.filter(v=>v>threshold).length/n,median:values[Math.floor(n/2)],p05:values[Math.floor(n*.05)],p95:values[Math.floor(n*.95)],values,n};}
