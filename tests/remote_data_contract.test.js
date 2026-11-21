/** Runs in GitHub CI with the current public source snapshots; local source ZIPs omit these files. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {FBS_TEAMS} from '../src/catalog.js';
const root=new URL('../public/data/',import.meta.url);
const load=(name)=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
test('real-source 2026 rosters include every FBS school and remain season scoped',t=>{
 if(!existsSync(new URL('rosters-2026.json',root))){t.skip('Large remote roster artifacts are present on GitHub, not in the local source ZIP');return;}
 const ro=load('rosters-2026.json'),se=load('season-2026.json'),rating=load('research-2026.json');
 assert.equal(ro.season,2026);
 assert.equal(Object.keys(ro.schools).length,138);
 assert.equal(se.season,2026);
 assert.equal(se.teams.length,138);
 const names=new Set(FBS_TEAMS.map(x=>x.id));
 const knownIds=new Set(se.teams.map(x=>x.id));
 for(const team of FBS_TEAMS){
   assert.ok(knownIds.has(team.id),`Missing season record: ${team.id}`);
   assert.ok(Array.isArray(ro.schools[team.id])&&ro.schools[team.id].length>=20,`No roster for ${team.id}`);
   for(const person of ro.schools[team.id])assert.ok(typeof person.name==='string'&&!/[<>]/.test(person.name));
 }
 assert.equal(new Set(Object.keys(ro.schools)).size,138);
 assert.ok(Object.keys(rating.teamState).length>=138);
 assert.equal(rating.holdout.season,2026);
 assert.ok(!Object.keys(ro.schools).some(x=>!names.has(x)));
 console.log(`REMOTE DATA PASS: ${FBS_TEAMS.length} FBS rosters, ${Object.values(ro.schools).reduce((s,x)=>s+x.length,0)} 2026 player identities`);
});

// CI supplies all 138 real 2026 rosters, weekly assignments and recorded-event summaries.
test('all 138 schools pass current 2026 six-role source and positional audit',t=>{
 if(!existsSync(new URL('rosters-2026.json',root))||!existsSync(new URL('weekly-lineups-2026.json',root))){
   t.skip('Full-data integration runs on GitHub; data omitted in local source ZIP');return;
 }
 const ro=load('rosters-2026.json'),wk=load('weekly-lineups-2026.json');
 const positions={QB:['QB'],RB:['RB','HB','FB'],WR1:['WR'],WR2:['WR'],TE:['TE'],K:['K','PK']};
 const stats={QB:'passingYards',RB:'rushingYards',WR1:'receivingYards',WR2:'receivingYards',TE:'receivingYards',K:'fieldGoalsMade'};
 const key=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").trim().toLowerCase();
 assert.equal(Object.keys(wk.teams).length,138);
 let checks=0,sourced=0;
 for(const t of FBS_TEAMS){
   const candidates=ro.schools[t.id],roles=wk.teams[t.id]?.roles;
   assert.ok(Array.isArray(candidates)&&roles,t.id+' missing 2026 roster or lineup');
   const names=new Map(candidates.map(p=>[key(p.name),p]));const used=new Set();
   const events=load('players-2026/'+t.id+'.json');
   const evidence=new Map(events.players.map(p=>[key(p.name)+'|'+p.stat,p]));
   assert.deepEqual(Object.keys(roles).sort(),Object.keys(positions).sort(),t.id+' incomplete roles');
   const unavailable=new Set(wk.teams[t.id].unavailable.filter(p=>['out','doubtful'].includes(p.status)&&p.observedOn>=wk.weekStart).map(p=>key(p.name)));
   for(const [role,allowed] of Object.entries(positions)){
     const r=roles[role],nm=key(r.name),p=names.get(nm);
     assert.ok(p,t.id+'/'+role+' not on 2026 roster: '+r.name);
     assert.ok(allowed.includes(p.position),t.id+'/'+role+' wrong position '+p.position);
     assert.ok(!used.has(nm),t.id+'/'+role+' duplicate identity');
     assert.ok(!unavailable.has(nm),t.id+'/'+role+' reported unavailable');
     assert.ok(r.observedOn<=wk.generatedOn,t.id+'/'+role+' future-dated evidence');
     if(['depth-chart-listed','depth-chart-projected','reported-replacement'].includes(r.basis)){
       assert.ok(r.observedOn>=wk.weekStart,t.id+'/'+role+' stale sourced evidence');sourced++;
     }
     if(r.basis==='usage-projected'){
       const ev=evidence.get(nm+'|'+stats[role]);
       assert.ok(ev&&ev.n>=3,t.id+'/'+role+' lacks 2026 recorded-event support');
     }
     used.add(nm);checks++;
   }
 }
 assert.equal(checks,828);
 console.log('REAL 2026 ROLE AUDIT: 138 FBS schools, 828 checks, '+sourced+' dated source-referenced roles; remaining unverified');
});
