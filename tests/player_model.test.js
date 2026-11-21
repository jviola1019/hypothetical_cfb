import test from 'node:test';
import assert from 'node:assert/strict';
import {installPlayerModelEvaluation,playerModelEvaluation} from '../src/playerModel.js';
import {installPlayerEvidence,observedPropRows} from '../src/playerEvidence.js';
const report={schemaVersion:1,modelVersion:'beta-binomial-event-game-v0.8',
 trainingSeason:2025,evaluationSeason:2026,priorStrength:6,sourceCutoff:'2026-11-21',
 classification:'retrospective-conditional-event-game-forward-test-not-general-props',
 evaluatedAthletes:2,
 model:{n:5,brier:.23,logLoss:.64},
 cohortPriorOnlyBaseline:{n:5,brier:.25,logLoss:.69},
 limitations:'Source contains event-game observations only. Not a full-game prop probability.'};

test('player-event research accepts bounded audit, refuses invented metrics',()=>{
  assert.equal(installPlayerModelEvaluation(report).model.n,5);
  assert.equal(playerModelEvaluation().model.brier,.23);
  assert.throws(()=>installPlayerModelEvaluation({...report,model:{n:5,brier:-.1,logLoss:.5}}),/metrics/);
  assert.throws(()=>installPlayerModelEvaluation({...report,sourceCutoff:'not a date'}),/header/);
});

test('observed athlete can carry explicitly conditional empirical frequency',()=>{
  const player={name:'Alex Sample',position:'QB',stat:'passingYards',label:'Pass yards',
   line:250.5,eventGames:5,n:5,hit:2,mean:213,median:215,p10:100,p90:301,
   eventModel:{probability:.43,approxInterval90:[.21,.64],eventGamesUsed:5,
    cohortTrainingEvents:800,classification:'experimental-conditional-next-recorded-event-game'}};
  const doc={schemaVersion:2,season:2026,team:'ole-miss',
    sourceUrl:'https://github.com/sportsdataverse/cfbfastR-data',sourceCutoff:'2026-11-21',
    lastRecordedGame:'2026-11-15',classification:'derived-player-aggregate-not-projection',players:[player]};
  assert.equal(installPlayerEvidence(doc),1);
  assert.equal(observedPropRows('ole-miss')[0].eventModel.probability,.43);
  const invalid=structuredClone(doc);invalid.players[0].eventModel.probability=1.4;
  assert.throws(()=>installPlayerEvidence(invalid),/row/);
});
