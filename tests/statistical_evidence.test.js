import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../public/data/'+p,import.meta.url),'utf8'));
test('2026 chronological reliability bins reconcile with evaluation population',()=>{
 const m=read('model-compare-2026.json'),e=m.evaluation['2026'];
 const n=m.reliability2026.reduce((sum,bin)=>sum+bin.n,0);
 assert.equal(n,e[m.modelSelectedOn2025].n);
 assert.equal(n,m.gamesBySeason['2026']);
 assert.equal(n,read('research-2026.json').holdout.evaluatedGames);
 assert.equal(n,read('score-evaluation-2026.json').evaluations['2026'].n);
 assert.ok(m.reliability2026.every(b=>b.n>=1&&b.meanPrediction>=0&&b.meanPrediction<=1&&b.observedFrequency>=0&&b.observedFrequency<=1));
 const ece=m.reliability2026.reduce((sum,b)=>sum+b.n*Math.abs(b.observedFrequency-b.meanPrediction),0)/n;
 assert.ok(Number.isFinite(ece)&&ece>=0&&ece<=1);
});
test('paired weekly bootstrap Brier difference reconciles with displayed 2026 model metrics',()=>{
 const m=read('model-compare-2026.json'),e=m.evaluation['2026'],selected=m.modelSelectedOn2025;
 const d=e.homeOnly.brier-e[selected].brier;
 assert.ok(Math.abs(d-m.weeklyBootstrap2026.brierImprovement)<.00001);
 assert.equal(m.weeklyBootstrap2026.selected,selected);
 assert.equal(m.weeklyBootstrap2026.comparison,'homeOnly');
 assert.ok(m.weeklyBootstrap2026.weeklyBlockPercentile95[0]<=m.weeklyBootstrap2026.weeklyBlockPercentile95[1]);
});
