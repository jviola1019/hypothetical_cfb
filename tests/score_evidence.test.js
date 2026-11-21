import test from 'node:test';
import assert from 'node:assert/strict';
import {installScoreEvidence,scoreEvidence} from '../src/scoreEvidence.js';
const metric={crps:14.8,mae:15.5,interval80Coverage:.77,
 interval90Coverage:.89,interval80Offset:[-22,25],interval90Offset:[-29,32]};
const year={n:600,margin:metric,total:{...metric,mae:13},
 winnerBrierFromMarginResiduals:.21,winnerBrierHomePrior:.24};
const fixture={schemaVersion:1,modelVersion:'empirical-score-residual-v0.8',
 classification:'full-game-score-residual-distribution-not-a-possession-calibration',
 sourceCutoff:'2026-11-21',warmupSeason:2023,fitSeason:2024,fitGames:798,
 evaluations:{'2025':year,'2026':year},
 limitations:'Historical score residuals are not possession-level data; no observed drive model.'};

test('score research validates genuine interval metrics',()=>{
 assert.equal(installScoreEvidence(fixture).evaluations['2026'].n,600);
 assert.equal(scoreEvidence().evaluations['2025'].margin.mae,15.5);
 assert.throws(()=>installScoreEvidence({...fixture,evaluations:{...fixture.evaluations,
   '2026':{...year,margin:{...metric,interval90Coverage:1.5}}}}),/score distribution/);
});
