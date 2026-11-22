import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../research/weekly-lineups/2026-11-21.json',import.meta.url),'utf8'));
test('reported starters cannot be projected or expected rather than source-confirmed',()=>{
 for(const e of source.entries){
   if(e.basis!=='reported-replacement')continue;
   assert.doesNotMatch(e.note,/^(projected|expected)|not post-kickoff confirmed|projection, not/i,`${e.team}/${e.role} cannot be reported-confirmed`);
 }
 const fahey=source.entries.find(e=>e.team==='ohio-state'&&e.role==='QB');
 const schobel=source.entries.find(e=>e.team==='tcu'&&e.role==='QB');
 assert.equal(fahey.basis,'reported-replacement');
 assert.equal(schobel.basis,'depth-chart-projected');
});
test('third-party depth charts do not masquerade as confirmation of all 828 FBS offensive role slots',()=>{
 const reports=source.entries.filter(e=>['depth-chart-listed','reported-replacement'].includes(e.basis));
 assert.ok(reports.length<828,'cannot claim all game-day starting roles are independently verified');
 assert.ok(source.entries.every(e=>e.observedOn<=source.reviewedOn),'no future sourced claim');
});

test('injury and replacement evidence remains game-week dated and nonpermanent',()=>{
 const murphy=source.entries.find(x=>x.team==='oregon-state'&&x.role==='QB');
 const atkinson=source.unavailable.find(x=>x.team==='oregon-state'&&x.name==='Braden Atkinson');
 assert.equal(murphy.name,'Maalik Murphy');
 assert.equal(murphy.basis,'depth-chart-projected');
 assert.equal(atkinson.status,'out');
 assert.equal(atkinson.observedOn,'2026-11-21');
 assert.match(atkinson.note,/Expires after that week/);
 const fahey=source.entries.find(x=>x.team==='ohio-state'&&x.role==='QB');
 assert.ok(fahey.sourceUrl.includes('ohiostatebuckeyes.com'));
});
