/** Historical score-distribution evaluation; not derived from generated drives. */
export const SCORE_AUDIT_VERSION = 'empirical-score-residual-v0.8';
let current = null;

export function installScoreEvidence(document) {
  const x = document;
  if (!x || x.schemaVersion !== 1 || x.modelVersion !== SCORE_AUDIT_VERSION ||
      x.classification !== 'full-game-score-residual-distribution-not-a-possession-calibration' ||
      x.warmupSeason !== 2023 || x.fitSeason !== 2024 ||
      !Number.isInteger(x.fitGames) || x.fitGames < 20 ||
      !/^2026-\d\d-\d\d$/.test(x.sourceCutoff) ||
      typeof x.limitations !== 'string' || x.limitations.length < 40) {
    throw new Error('Invalid score-research artifact');
  }
  for (const year of ['2025', '2026']) {
    const row = x.evaluations?.[year];
    if (!row || !Number.isInteger(row.n) || row.n < 1) throw new Error('Invalid evaluation sample');
    for (const metric of ['margin', 'total']) {
      const stat = row[metric];
      if (!stat || ![stat.crps, stat.mae, stat.interval80Coverage, stat.interval90Coverage]
        .every(value => Number.isFinite(value) && value >= 0) ||
        stat.interval80Coverage > 1 || stat.interval90Coverage > 1 ||
        ![stat.interval80Offset, stat.interval90Offset].every(interval =>
          Array.isArray(interval) && interval.length === 2 &&
          interval.every(Number.isFinite) && interval[0] <= interval[1])) {
        throw new Error('Invalid score distribution evaluation');
      }
    }
    if (![row.winnerBrierFromMarginResiduals, row.winnerBrierHomePrior]
      .every(value => Number.isFinite(value) && value >= 0 && value <= 1)) {
      throw new Error('Invalid winner-probability benchmark');
    }
  }
  current = structuredClone(x);
  return current;
}

export const scoreEvidence = () => current;

export async function loadScoreEvidence(base = './public/data/') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${base}score-evaluation-2026.json`, {
      cache: 'no-cache', signal: controller.signal
    });
    if (!response.ok || Number(response.headers.get('content-length') || 0) > 24000) return null;
    const raw = await response.text();
    if (raw.length > 24000) return null;
    return installScoreEvidence(JSON.parse(raw));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
