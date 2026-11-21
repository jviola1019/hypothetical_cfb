import test from 'node:test';import assert from 'node:assert/strict';
import {installModelComparison,modelComparison} from '../src/modelCompare.js';
const names=['coin','homeOnly','elo','margin','fixedBlend','logisticPair'];
function doc(){let e={};for(const y of ['2025','2026'])e[y]=Object.fromEntries(names.map(n=>[n,{n:600,brier:.20,logLoss:.60}]));return {schemaVersion:1,modelVersion:'multiyear-temporal-0.7.0',classification:'2023-warmup-2024-fit-2025-select-2026-previously-inspected-forward-check',gamesBySeason:{2023:700,2024:700,2025:750,2026:640},evaluation:e,modelCoefficientsFitted2024:{eloScale:1},modelSelectedOn2025:'elo'};}
test('research comparison gated on season metadata',()=>{assert.equal(installModelComparison(doc()).modelSelectedOn2025,'elo');const bad=doc();bad.evaluation['2026'].elo.brier=-1;assert.throws(()=>installModelComparison(bad));assert.equal(modelComparison().modelSelectedOn2025,'elo');});
