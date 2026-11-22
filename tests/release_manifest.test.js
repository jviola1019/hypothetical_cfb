import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('release version and cutoffs match checked-in source data',()=>{
 const m=read('public/data/manifest.json'),p=read('package.json');
 const s=read('public/data/season-2026.json'),e=read('public/data/research-2026.json'),r=read('public/data/rosters-2026.json');
 assert.equal(m.version,p.version);
 assert.equal(m.scoringSourceCutoffUtc,s.lastCompletedGame);
 assert.equal(m.researchSourceCutoffUtc,e.lastScoredGame);
 assert.equal(m.verifiedRoster2026Schools,r.schoolsCount);
 assert.equal(m.verifiedRoster2026Names,r.totalPlayers);
 assert.equal(m.verifiedRoster2026WeeklySchools,r.weeklySchoolsUsed);
 assert.equal(m.verifiedRoster2026PrimarySchools,r.schoolsCount-r.weeklySchoolsUsed);
});
