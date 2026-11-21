import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectCFPField} from '../src/cfpSelection.js';
import {installScoreEvidence} from '../src/scoreEvidence.js';
import {installPlayerModelEvaluation} from '../src/playerModel.js';

const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/refresh-season-data.yml',import.meta.url),'utf8');

test('HTML stays script-self, credential-free and limits external font requests',()=>{
  const policy=page.match(/Content-Security-Policy" content="([^"]+)/)?.[1];
  assert.ok(policy,'explicit CSP required');
  for (const snippet of ["script-src 'self'", "worker-src 'self'", "object-src 'none'", "connect-src 'self'", "base-uri 'self'"])
    assert.ok(policy.includes(snippet),`Missing CSP: ${snippet}`);
  assert.ok(!policy.includes("'unsafe-eval'"));
  assert.ok(!policy.includes("script-src 'self' 'unsafe-inline'"));
  assert.ok(!page.includes('sk-proj-'));
  assert.ok(!page.includes('api_key='));
});

test('refresh workflow keeps raw player files out of versioned public datasets',()=>{
  assert.match(workflow,/\/tmp\/gridiron-ingest\/player-stats-/);
  assert.match(workflow,/--evaluation-out public\/data\/player-model-evaluation-2026.json/);
  assert.doesNotMatch(workflow,/git add[^\n]*\/tmp\/gridiron-ingest/);
  assert.ok(workflow.includes('curl --fail --location'));
});

test('score-model artifact rejects prototype injection and malformed research intervals',()=>{
  const doc={schemaVersion:1,modelVersion:'empirical-score-residual-v0.8',
    classification:'full-game-score-residual-distribution-not-a-possession-calibration',
    warmupSeason:2023,fitSeason:2024,fitGames:700,sourceCutoff:'2026-11-21',
    limitations:'Residual distribution does not calibrate drives or player props.',
    evaluations:{}};
  for (const year of ['2025','2026'])doc.evaluations[year]={n:600,margin:{crps:12,mae:15,interval80Coverage:.80,interval90Coverage:.92,interval80Offset:[-20,20],interval90Offset:[-30,30]},total:{crps:11,mae:13,interval80Coverage:.81,interval90Coverage:.89,interval80Offset:[-19,19],interval90Offset:[-29,29]},winnerBrierFromMarginResiduals:.20,winnerBrierHomePrior:.24};
  assert.equal(installScoreEvidence(doc).evaluations['2025'].n,600);
  let fake=structuredClone(doc);fake.evaluations['2026'].margin.interval80Offset=[Infinity,Infinity];
  assert.throws(()=>installScoreEvidence(fake),/Invalid score distribution/);
  fake=structuredClone(doc);fake.evaluations['2026'].winnerBrierFromMarginResiduals=-1;
  assert.throws(()=>installScoreEvidence(fake),/winner-probability/);
});

test('player-model metrics reject mismatched baselines, negative evaluation counts and claims of full-game odds',()=>{
  const d={schemaVersion:1,modelVersion:'beta-binomial-event-game-v0.8',trainingSeason:2025,
    evaluationSeason:2026,classification:'retrospective-conditional-event-game-forward-test-not-general-props',
    evaluatedAthletes:50,sourceCutoff:'2026-11-21',priorStrength:6,
    model:{n:500,brier:.21,logLoss:.6},cohortPriorOnlyBaseline:{n:500,brier:.22,logLoss:.64},
    limitations:'Conditional on a recorded statistic event, not game availability or prop pricing.'};
  assert.equal(installPlayerModelEvaluation(d).model.n,500);
  assert.throws(()=>installPlayerModelEvaluation({...d,cohortPriorOnlyBaseline:{n:501,brier:.22,logLoss:.64}}),/metrics/);
  assert.throws(()=>installPlayerModelEvaluation({...d,evaluatedAthletes:-1}),/header/);
  assert.throws(()=>installPlayerModelEvaluation({...d,classification:'calibrated-future-props'}),/header/);
});
