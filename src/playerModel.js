/**
 * Historical, event-conditioned player model evaluation.
 * This describes past recorded-stat-event games, never a full-game betting prop.
 */
export const PLAYER_EVENT_MODEL_VERSION = 'beta-binomial-event-game-v0.8';
let current = null;

export function installPlayerModelEvaluation(document) {
  const d = document;
  if (!d || d.schemaVersion !== 1 || d.modelVersion !== PLAYER_EVENT_MODEL_VERSION ||
      d.trainingSeason !== 2025 || d.evaluationSeason !== 2026 ||
      d.classification !== 'retrospective-conditional-event-game-forward-test-not-general-props' ||
      typeof d.limitations !== 'string' || d.limitations.length < 30 ||
      !/^2026-\d\d-\d\d$/.test(d.sourceCutoff) ||
      !Number.isInteger(d.evaluatedAthletes) || d.evaluatedAthletes < 0 ||
      d.priorStrength !== 6) {
    throw new Error('Invalid player-model evaluation header');
  }
  const validMetric = m => m && Number.isInteger(m.n) && m.n >= 0 &&
    (m.n === 0 ? m.brier === null && m.logLoss === null :
      Number.isFinite(m.brier) && m.brier >= 0 && m.brier <= 1 &&
      Number.isFinite(m.logLoss) && m.logLoss >= 0 && m.logLoss <= 30);
  if (!validMetric(d.model) || !validMetric(d.cohortPriorOnlyBaseline) ||
      d.model.n !== d.cohortPriorOnlyBaseline.n || d.model.n < d.evaluatedAthletes) {
    throw new Error('Invalid player-model evaluation metrics');
  }
  current = structuredClone(d);
  return current;
}

export const playerModelEvaluation = () => current;

export async function loadPlayerModelEvaluation(base = './public/data/') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${base}player-model-evaluation-2026.json`, {
      cache: 'no-cache', signal: controller.signal
    });
    if (!response.ok || Number(response.headers.get('content-length') || 0) > 16000) return null;
    const raw = await response.text();
    if (raw.length > 16000) return null;
    return installPlayerModelEvaluation(JSON.parse(raw));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
