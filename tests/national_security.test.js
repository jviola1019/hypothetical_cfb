import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATS,validateParticipants,createTournament,swapTournamentSeeds,monteCarloTournament} from '../src/tournament.js';
import {installRosterSnapshot} from '../src/observed.js';
import {installPlayerEvidence} from '../src/playerEvidence.js';
test('no arbitrary school IDs, duplicates or oversized simulation counts for full national field',()=>{
 const t=createTournament('fullFbs138');const bad=t.participants.slice();bad[2]='<img src=x onerror=alert(1)>';
 assert.throws(()=>validateParticipants(bad,'fullFbs138'));
 assert.throws(()=>validateParticipants(t.participants.slice(1),'fullFbs138'));
 assert.throws(()=>createTournament('fullFbs138',t.participants,2**40));
 assert.throws(()=>swapTournamentSeeds(t,'0',1));
 assert.throws(()=>monteCarloTournament(t,5001));
});
test('2026 roster rejects unknown IDs and never displays injected HTML as full player identity',()=>{
 assert.throws(()=>installRosterSnapshot({schemaVersion:1,season:2026,sourceUrl:'https://example.org',schools:{'<svg onload=x>':[{name:'Bad',position:'QB'}]}}));
 const n=installRosterSnapshot({schemaVersion:1,season:2026,sourceUrl:'https://example.org',schools:{'alabama':[
  {name:'<script>alert(1)</script>',position:'QB'},{name:'Legitimate Athlete 2026',position:'QB'}]}});
 assert.equal(n,1);
});
test('derived player evidence is never allowed to smuggle raw event logs or HTML',()=>{
 const sample={schemaVersion:2,season:2026,team:'ole-miss',classification:'derived-player-aggregate-not-projection',sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',sourceCutoff:'2026-11-21',lastRecordedGame:'2026-11-15',players:[
 {name:'Injected<img>',position:'QB',stat:'passingYards',label:'Passing yards',eventGames:8,n:8,hit:4,mean:250,median:240,p10:110,p90:390,line:250.5}]};
 assert.throws(()=>installPlayerEvidence(sample));
 sample.players[0].name='Test Evidence QB';sample.players[0].gameLines=[12,34];
 assert.throws(()=>installPlayerEvidence(sample));
});
