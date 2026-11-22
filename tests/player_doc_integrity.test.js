import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {installPlayerEvidence} from '../src/playerEvidence.js';
import {FBS_TEAMS} from '../src/catalog.js';
const root=new URL('../public/data/players-2026/',import.meta.url);
test('all 138 published 2026 athlete-event summaries pass the actual browser validator',()=>{
 const files=readdirSync(root).filter(name=>name.endsWith('.json')&&name!=='manifest.json');
 const ids=new Set(FBS_TEAMS.map(t=>t.id));
 assert.equal(files.length,138);
 for(const file of files){
   const id=file.slice(0,-5);assert.ok(ids.has(id),'Unexpected team '+id);
   const doc=JSON.parse(readFileSync(new URL(file,root),'utf8'));
   assert.equal(doc.team,id);
   assert.doesNotThrow(()=>installPlayerEvidence(doc),id+' evidence should not be silently dropped by browser');
 }
});
