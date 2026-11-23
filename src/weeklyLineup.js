/** Week-scoped, auditable 2026 role selections. A roster entry is NOT a starter verification. */
import {FBS_TEAMS} from './catalog.js';
const ids=new Set(FBS_TEAMS.map(x=>x.id));
const allowedRoles=new Set(['QB','QB2','RB','WR1','WR2','TE','K']);
const allowedBasis=new Set(['depth-chart-listed','depth-chart-projected','reported-replacement','usage-projected','last-reported-replacement','roster-only']);
let weekly=null;
const dateOk=s=>{
 if(typeof s!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(s))return false;
 const [y,m,d]=s.split('-').map(Number);
 return new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===s;
};
export const personKey=n=>String(n||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
const goodName=n=>typeof n==='string'&&n.length>=3&&n.length<=100&&!/[<>\x00-\x1f]/.test(n);
const goodUrl=url=>typeof url==='string'&&url.length<=450&&/^https:\/\/[^/?#\s]+\//.test(url)&&!/[<>\\]/.test(url);
export function installWeeklyLineup(doc){
 if(!doc||doc.schemaVersion!==1||doc.season!==2026||!dateOk(doc.weekStart)||!dateOk(doc.weekEnd)||doc.weekEnd<doc.weekStart||!dateOk(doc.generatedOn)||!doc.teams||Array.isArray(doc.teams)||typeof doc.teams!=='object')throw Error('Invalid weekly lineup header');
 if(Object.keys(doc.teams).length>138)throw Error('Too many lineup schools');
 const out={};
 for(const [id,team] of Object.entries(doc.teams)){
  if(!ids.has(id)||!team||typeof team!=='object'||!team.roles||Array.isArray(team.roles)||!Array.isArray(team.unavailable)||team.unavailable.length>70)throw Error('Invalid weekly lineup school');
  const seen=new Set(),roles={};
  for(const [role,e] of Object.entries(team.roles)){
   if(!allowedRoles.has(role)||!e||!goodName(e.name)||!allowedBasis.has(e.basis)||!dateOk(e.observedOn)||!goodUrl(e.sourceUrl)||e.observedOn>doc.generatedOn||typeof e.note!=='string'||e.note.length>260)throw Error('Invalid weekly player evidence');
   if(['depth-chart-listed','reported-replacement'].includes(e.basis)&&e.observedOn<doc.weekStart)throw Error('Source-verified label uses stale evidence');
   if(seen.has(personKey(e.name)))throw Error('Duplicate player across roles');
   seen.add(personKey(e.name));roles[role]={name:e.name,basis:e.basis,observedOn:e.observedOn,sourceUrl:e.sourceUrl,note:e.note};
  }
  const unavailable=new Set();
  for(const p of team.unavailable){
   if(!p||!goodName(p.name)||!dateOk(p.observedOn)||!goodUrl(p.sourceUrl)||!['out','doubtful','questionable'].includes(p.status))throw Error('Invalid reported availability');
   if(p.observedOn>doc.generatedOn)throw Error('Availability is from the future');
   if(unavailable.has(personKey(p.name)))throw Error('Repeated unavailable player');
   unavailable.add(personKey(p.name));
  }
  out[id]={roles,unavailable:team.unavailable.map(x=>({...x}))};
 }
 weekly={schemaVersion:1,season:2026,weekStart:doc.weekStart,weekEnd:doc.weekEnd,generatedOn:doc.generatedOn,teams:out,schools:Object.keys(out).length};
 return weekly.schools;
}
export function currentLineup(team,day=new Date().toISOString().slice(0,10)){
 if(!weekly||!ids.has(team))return null;
 const source=weekly.teams[team];if(!source)return null;
 const current=day>=weekly.weekStart&&day<=weekly.weekEnd;
 return {weekStart:weekly.weekStart,weekEnd:weekly.weekEnd,generatedOn:weekly.generatedOn,current,roles:source.roles,unavailable:source.unavailable};
}
/** Always treat an expired observed starter as an identity PRIOR, not a verified starter today. */
export function lineupRole(team,role,day=new Date().toISOString().slice(0,10)){
 const q=currentLineup(team,day),e=q?.roles?.[role];if(!e||e.observedOn>day)return null;
 const verified=q.current&&['depth-chart-listed','reported-replacement'].includes(e.basis);
 const projected=q.current&&e.basis==='depth-chart-projected';
 return {...e,verifiedCurrent:verified,displayBasis:verified?e.basis:projected?'depth-chart-projected':(e.basis==='usage-projected'?'usage-projected':'historical-role-not-reverified'),weekStart:q.weekStart,weekEnd:q.weekEnd};
}
export function lastReportedUnavailable(team,name,day=new Date().toISOString().slice(0,10)){
 const q=currentLineup(team,day);if(!q)return null;
 const e=q.unavailable.find(x=>personKey(x.name)===personKey(name));
 return e?{...e,current:q.current&&e.observedOn>=q.weekStart&&e.observedOn<=day}:null;
}
export function weeklySummary(){return weekly?{schools:weekly.schools,weekStart:weekly.weekStart,weekEnd:weekly.weekEnd,generatedOn:weekly.generatedOn}:null;}
