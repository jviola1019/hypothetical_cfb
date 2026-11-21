/**
 * Joint top-down opportunity shares, anchored conservatively to recorded 2026
 * athlete event-game means. Never interpreted as calibrated next-game props.
 * Unrepresented receiving/rushing production remains on an anonymous
 * "Other contributors" aggregate — it cannot be credited to a star player.
 */
import {namedPlayer} from './observed.js';
import {getPlayerEvidence} from './playerEvidence.js';
import {personKey} from './weeklyLineup.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function receivingWeights(team,season=2026){
 const base=[.31,.20,.11,.08,.30]; // WR1, WR2, TE, RB, unmodeled receivers
 if(+season!==2026)return base;
 const doc=getPlayerEvidence(team,season);if(!doc)return base;
 const names=['WR1','WR2','TE','RB'].map(role=>namedPlayer(team,role,season)?.name);
 const evidence=new Map(doc.players.filter(p=>p.stat==='receivingYards'&&p.n>=4).map(p=>[personKey(p.name),p]));
 // ~330 game passing yards is an explicit *allocation reference*, not a fitted
 // opponent-specific forecast. Shrink event-game estimates back to base shares.
 const values=base.slice(0,4).map((fallback,i)=>{
  const row=evidence.get(personKey(names[i]));if(!row)return fallback;
  const strength=clamp(row.n/(row.n+3),0,.8);
  const empirical=clamp(row.mean/330,.025,.62);
  return clamp((1-strength)*fallback+strength*empirical,.025,.62);
 });
 const sum=values.reduce((a,b)=>a+b,0);
 if(sum>.91){const factor=.91/sum;for(let i=0;i<values.length;i++)values[i]*=factor;}
 values.push(1-values.reduce((a,b)=>a+b,0));
 return values;
}
export function primaryRusherShare(team,season=2026){
 if(+season!==2026)return .58;
 const doc=getPlayerEvidence(team,season),name=namedPlayer(team,'RB',season)?.name;
 const row=doc?.players?.find(p=>p.stat==='rushingYards'&&p.n>=4&&personKey(p.name)===personKey(name));
 if(!row)return .58;
 const strength=clamp(row.n/(row.n+3),0,.8);
 // Neutral ~210 team rushing yards is only a conservation reference.
 return clamp((1-strength)*.58+strength*clamp(row.mean/210,.2,.84),.25,.86);
}
