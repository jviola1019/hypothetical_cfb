/** Simulated-game scorebox truth and fictional tournament awards.
 * Every numerator is calculated from canonical simulated game objects.
 * Defensive attribution is an exhibition convention, NOT verified game participation.
 */
import {auditGeneratedGame} from './gameAudit.js';
import {TEAM_MAP,hash32} from './engine.js';
import {rosterForTeam} from './observed.js';

const DEF_POS=new Set(['CB','DB','S','SS','FS','LB','MLB','OLB','ILB','DE','DL','DT','NT','EDGE']);
const safeLabel=s=>typeof s==='string'&&s.length>2&&!/unassigned|synthetic|contributor/i.test(s);
const sum=(items,fn)=>items.reduce((a,x)=>a+fn(x),0);
const round=(v,d=1)=>Number(v.toFixed(d));
const sortMetric=(a,b)=>b.impact-a.impact||b.games-a.games||a.team.localeCompare(b.team)||a.name.localeCompare(b.name);

export function scoreboxFor(game){
 const errors=[];
 try{auditGeneratedGame(game)}catch(e){errors.push(e.message)}
 if(game?.config && game.seed!==game.config.seed)errors.push('Game-level seed and configuration seed disagree');
 if(!game||!Array.isArray(game.teams)||game.teams.length!==2||!Array.isArray(game.final))
  return {ok:false,errors:['Missing canonical game structure'],checks:0};
 for(let i=0;i<2;i++){
  const team=game.teams[i];
  const q=Array.isArray(team.byQuarter)?team.byQuarter:[];
  const overtime=team.overtimePoints??0;
  const quarterTotal=sum(q,x=>x)+overtime;
  if(quarterTotal!==game.final[i])errors.push('Quarter/OT score disagreement '+team.team);
  if(team.passYards+team.rushYards<0)errors.push('Negative total offense '+team.team);
  const offenseDrives=game.drives.filter(d=>d.offense===team.team);
  const points=sum(offenseDrives,d=>d.points);
  if(points!==game.final[i])errors.push('Drive-score disagreement '+team.team);
  const turnovers=offenseDrives.filter(d=>d.outcome==='TO').length;
  if(turnovers!==team.turnovers)errors.push('Turnovers mismatch '+team.team);
 }
 if(game.winner!==(game.final[0]>game.final[1]?game.config.a:game.config.b))errors.push('Winner mismatch');
 return {ok:errors.length===0,errors,checks:13,score:[...game.final],total:game.total,margin:game.margin,
  rows:game.teams.map(t=>({team:t.team,quarters:[...t.byQuarter],overtime:t.overtimePoints,points:t.points,
    totalYards:t.passYards+t.rushYards,passing:t.passYards,rushing:t.rushYards,
    turnovers:t.turnovers,plays:t.plays}))};
}

function playerImpact(role,p){
 const pass=p.passingYards||0,rush=p.rushYards||0,receiving=p.receivingYards||0;
 const ptd=p.passingTD||0,rtd=p.rushingTD||0,ctd=p.receivingTD||0,interceptions=p.interceptions||0;
 const scoring=role==='QB'?pass*.035+rush*.095+ptd*7+rtd*8-interceptions*3:
   rush*.115+receiving*.125+(rtd+ctd)*8+(p.receptions||0)*.75;
 return {impact:round(Math.max(0,scoring),3),pass,rush,receiving,
  touchdowns:ptd+rtd+ctd,completions:p.completions||0,receptions:p.receptions||0};
}

/** The awards require a completed, internally reconciled, non-duplicated bracket.
 * All offensive statistics are aggregated from generated drives; no independent
 * forecast validity, true starting lineup, or player usage is implied.
 */
export function tournamentReport(t){
 if(!t||!Array.isArray(t.participants)||!Array.isArray(t.rounds))throw Error('Invalid tournament');
 const games=[],scores=[],ids=new Set(),defense=new Map(),offense=new Map(),teamTotals=new Map();
 const teams=(id)=>{if(!teamTotals.has(id))teamTotals.set(id,{id,wins:0,losses:0,pointsFor:0,pointsAgainst:0,forcedTurnovers:0,games:0});return teamTotals.get(id)};
 for(let ri=0;ri<t.rounds.length;ri++){
  const round=t.rounds[ri];
  if(!Array.isArray(round.matches))throw Error('Malformed bracket round');
  for(let mi=0;mi<round.matches.length;mi++){
   const m=round.matches[mi],g=m.game;
   if(!g)continue;
   if(ids.has(g.id))throw Error('Duplicate game identity');ids.add(g.id);
   if(g.config.a!==m.a||g.config.b!==m.b||g.winner!==m.winner)throw Error('Bracket winner/teams contradiction');
   const expectedSeed=hash32(`${t.seed}|round:${ri}|pair:${mi}`);
   if(g.seed!==expectedSeed||g.config.seed!==expectedSeed)throw Error('Tournament game seed provenance mismatch');
   const box=scoreboxFor(g);if(!box.ok)throw Error('Scorebox validation failed: '+box.errors.join('; '));
   scores.push({round:ri,index:mi,roundName:round.name,a:m.a,b:m.b,game:g,box});
   games.push(g);
   for(let i=0;i<2;i++){
    const own=g.teams[i],other=g.teams[1-i],team=teams(own.team);
    team.games++;team.wins+=+(g.winner===own.team);team.losses+=+(g.winner!==own.team);
    team.pointsFor+=own.points;team.pointsAgainst+=other.points;team.forcedTurnovers+=other.turnovers;
    for(const [role,p] of Object.entries(own.players)){
     if(!['QB','RB','WR1','WR2','TE'].includes(role)||!safeLabel(p.label)||!p.historical)continue;
     const key=own.team+'|'+p.label;
     let s=offense.get(key);
     if(!s){s={team:own.team,name:p.label,role,games:0,impact:0,pass:0,rush:0,receiving:0,touchdowns:0,completions:0,receptions:0,finalImpact:0,verifiedStarter:false};offense.set(key,s)}
     const x=playerImpact(role,p);
     s.games++;for(const k of ['impact','pass','rush','receiving','touchdowns','completions','receptions'])s[k]+=x[k];
     if(ri===t.rounds.length-1)s.finalImpact+=x.impact;
    }
   }
   g.drives.forEach((drive,index)=>{
    if(drive.outcome!=='TO')return;
    const team=drive.defense;
    const roster=rosterForTeam(team,g.config.seasonA===2026?2026:2025);
    const targetPositions=drive.turnoverType==='interception'?new Set(['CB','DB','S','SS','FS','LB','MLB','OLB','ILB']):DEF_POS;
    const candidates=roster.filter(p=>targetPositions.has(p.position));
    // The synthetic engine has NO defender-specific action evidence.
    // Selecting a roster-listed name is an explicitly invented event attribution.
    if(!candidates.length)return;
    const player=candidates[hash32(g.id+'|'+index+'|defense')%candidates.length];
    const key=team+'|'+player.name;
    if(!defense.has(key))defense.set(key,{team,name:player.name,role:player.position,impact:0,interceptions:0,fumbleRecoveries:0,games:0,method:'synthetic-roster-attribution-NOT-observed'});
    const row=defense.get(key);
    row.impact+=drive.turnoverType==='interception'?10:7;
    if(drive.turnoverType==='interception')row.interceptions++;else row.fumbleRecoveries++;
   });
  }
  if(ri<t.rounds.length-1){
   const advanced=round.matches.map(m=>m.game?.winner||m.a||m.b).filter(Boolean);
   const next=t.rounds[ri+1].matches.flatMap(m=>[m.a,m.b]).filter(Boolean);
   if(advanced.length!==next.length||advanced.some((x,i)=>x!==next[i]))throw Error('Bracket advancement mismatch');
  }
 }
 const completed=Boolean(t.champion);
 if(completed){
  if(games.length!==t.participants.length-1)throw Error('Incomplete title bracket');
  const title=t.rounds.at(-1)?.matches;
  if(!title||title.length!==1||title[0].game?.winner!==t.champion)throw Error('Champion not won on field');
 }
 const offensive=[...offense.values()].map(x=>({...x,impact:round(x.impact,2)})).sort(sortMetric);
 const winnerOffense=offensive.filter(x=>x.team===t.champion);
 const mvp=winnerOffense[0]||offensive[0]||null;
 const opoy=offensive[0]||null;
 const titleMvp=[...offensive].filter(x=>x.finalImpact>0).sort((a,b)=>b.finalImpact-a.finalImpact||sortMetric(a,b))[0]||null;
 const defenders=[...defense.values()].map(x=>({...x,games:teams(x.team).games})).sort(sortMetric);
 const d=defenders[0]||null;
 const bestUnit=[...teamTotals.values()].sort((a,b)=>b.forcedTurnovers-a.forcedTurnovers||a.pointsAgainst/a.games-b.pointsAgainst/b.games||b.wins-a.wins)[0]||null;
 const dpoy=d|| (bestUnit?{name:TEAM_MAP[bestUnit.id]?.name+' defensive unit',team:bestUnit.id,role:'DEF',impact:bestUnit.forcedTurnovers,interceptions:0,fumbleRecoveries:bestUnit.forcedTurnovers,games:bestUnit.games,method:'simulated-team-unit-no-individual-evidence'}:null);
 return {complete:completed,champion:t.champion,played:games.length,expected:t.participants.length-1,
  audited:games.length,failed:0,checks:games.length*13,scores,teamTotals:[...teamTotals.values()],
  awards:completed?{mvp,opoy,dpoy,titleMvp}:null,
  explanation:'Exhibition awards derived solely from invented game outputs. Defensive player credits are artificial allocations of modeled team takeaways to roster-listed candidates, NOT verified football statistics or participation.'};
}
