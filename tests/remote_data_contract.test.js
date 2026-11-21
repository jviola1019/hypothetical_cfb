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
