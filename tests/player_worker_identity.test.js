import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../src/worker.js',import.meta.url),'utf8');
test('worker received the same 2026 player-event snapshots used by game and generated props',()=>{
 assert.match(app,/playerDocs:\[getPlayerEvidence\(state\.config\.a\),getPlayerEvidence\(state\.config\.b\)\]/);
 assert.match(worker,/installPlayerEvidence\(doc\)/);
 assert.match(worker,/namedPropSummaries\(games,config\)/);
 assert.match(worker,/installRosterSnapshot\(d\.payload\)/);
});
