import test from 'node:test';
import assert from 'node:assert/strict';
import {FBS_TEAMS} from '../src/catalog.js';
import {installResearchSnapshot,evaluatedMatchup,researchStatus} from '../src/research.js';
const mock=()=>({schemaVersion:1,modelVersion:'chronological-elo-slope-0.1.0',classification:'experimental-2025-trained-2026-held-out',
 asOf:'2026-11-21',lastScoredGame:'2026-11-15T20:00:00Z',
 training:{season:2025,games:650,calibratedSlope:1.11},holdout:{season:2026,evaluatedGames:500,calibratedElo:{brier:.18,logLoss:.51,marginMAE:11,totalMAE:16},constantBaseline:{brier:.25}},
 fixedParameters:{eloScale:400,initialElo:1500,homeElo:55,priorGames:4,startingPointsPerTeam:27,homePointsMargin:2.4},
 teamState:Object.fromEntries(FBS_TEAMS.map((t,i)=>[t.id,{elo:1400+i*.8,gamesCurrentSeason:7,scoredToDate:160+i*.3,allowedToDate:185-i*.3}]))});
test('experimental research model enforces schema and known IDs',()=>{
 const x=mock();assert.equal(installResearchSnapshot(x),138);assert.equal(researchStatus().available,true);
 const bad=mock();bad.teamState['fabricated-school']={elo:1400,gamesCurrentSeason:3,scoredToDate:75,allowedToDate:65};
 assert.throws(()=>installResearchSnapshot(bad));
 const fake=mock();fake.training.season=2026;assert.throws(()=>installResearchSnapshot(fake));
});
test('home-field changes research estimates; neutral reversal is symmetric',()=>{
 const a=evaluatedMatchup('ole-miss','georgia','neutral'),reverse=evaluatedMatchup('georgia','ole-miss','neutral');
 assert.ok(a&&reverse);assert.ok(Math.abs(a.pA+reverse.pA-1)<1e-12);
 assert.equal(a.expectedMargin,-reverse.expectedMargin);
 const h=evaluatedMatchup('ole-miss','georgia','a'),away=evaluatedMatchup('ole-miss','georgia','b');
 assert.ok(h.pA>a.pA&&a.pA>away.pA);
 assert.equal(evaluatedMatchup('ole-miss','ole-miss','neutral'),null);
});
