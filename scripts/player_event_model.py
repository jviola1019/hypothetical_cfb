"""Chronological, event-conditioned athlete threshold research.

This is NOT a general athlete prop estimator. An observation is included only
when the source recorded participation in that statistic family on that date.
No-start and no-event games are not known and cannot be treated as genuine zeros.

Priors are fitted to 2025 player-event games; 2026 is evaluated in order, with
predictions for each observed event-game using *earlier* event-games only.
"""
from collections import defaultdict
from math import log, sqrt

VERSION = 'beta-binomial-event-game-v0.8'
PRIOR_STRENGTH = 6.0  # Fixed before seeing 2026 outcomes, not a tuned hyperparameter.
MIN_TRAINING_EVENTS = 30
MIN_PLAYER_HISTORY = 3


def group_for(position, stat):
    group = str(position or '').upper().strip()
    if group in ('RB', 'HB', 'FB'):
        return 'RB'
    if group in ('WR', 'TE', 'QB', 'K', 'PK'):
        return 'K' if group == 'PK' else group
    if stat == 'passingYards':
        return 'QB'
    if stat == 'rushingYards':
        return 'RB'
    if stat == 'receivingYards':
        return 'WR'
    return 'K'


def cohort_key(position, stat):
    return f'{group_for(position,stat)}:{stat}'


def train_priors(person_samples, season=2025):
    """Each item: dict(position, stat, line, values=[chronological recorded game totals])."""
    if season != 2025:
        raise ValueError('The designated prior training season is 2025')
    counts = defaultdict(lambda: [0, 0])
    for record in person_samples:
        key = cohort_key(record['position'], record['stat'])
        for value in record['values']:
            if not isinstance(value, (int, float)):
                raise ValueError('Non-numeric player stat')
            counts[key][0] += 1
            counts[key][1] += int(value > record['line'])
    cohorts = {
        key: {'n': n, 'hits': hits, 'rate': round((hits + 2) / (n + 4), 9)}
        for key, (n, hits) in sorted(counts.items()) if n >= MIN_TRAINING_EVENTS
    }
    return {
        'schemaVersion': 1,
        'version': VERSION,
        'trainingSeason': season,
        'priorStrength': PRIOR_STRENGTH,
        'conditioning': 'recorded-stat-event-games-only',
        'cohorts': cohorts,
        'limitations': 'Cohort selection excludes inactive/no-event games and is not a full-game athlete prop model.'
    }


def validate_priors(doc):
    if (not isinstance(doc, dict) or doc.get('schemaVersion') != 1 or
            doc.get('version') != VERSION or doc.get('trainingSeason') != 2025 or
            doc.get('priorStrength') != PRIOR_STRENGTH or
            not isinstance(doc.get('cohorts'), dict)):
        raise ValueError('Invalid 2025 player-event prior artifact')
    for key, row in doc['cohorts'].items():
        if (not isinstance(key, str) or ':' not in key or
                not isinstance(row, dict) or
                not isinstance(row.get('n'), int) or row['n'] < MIN_TRAINING_EVENTS or
                not isinstance(row.get('hits'), int) or not 0 <= row['hits'] <= row['n'] or
                not isinstance(row.get('rate'), (int, float)) or
                not 0 < row['rate'] < 1):
            raise ValueError('Invalid athlete cohort')
    return doc


def next_event_probability(priors, position, stat, prior_events):
    """Return posterior mean and approximate 90% interval, without future data."""
    validate_priors(priors)
    prior = priors['cohorts'].get(cohort_key(position, stat))
    if not prior or len(prior_events) < MIN_PLAYER_HISTORY:
        return None
    p0 = prior['rate']
    alpha = p0 * PRIOR_STRENGTH + sum(prior_events)
    beta = (1 - p0) * PRIOR_STRENGTH + len(prior_events) - sum(prior_events)
    if alpha <= 0 or beta <= 0:
        raise ValueError('Invalid posterior parameters')
    mean = alpha / (alpha + beta)
    sd = sqrt(alpha * beta / ((alpha + beta)**2 * (alpha + beta + 1)))
    return {
        'probability': mean,
        'approxInterval90': [max(0, mean - 1.645*sd), min(1, mean + 1.645*sd)],
        'eventGamesUsed': len(prior_events),
        'trainingPrior': p0,
        'priorCohortEvents': prior['n'],
        'classification': 'experimental-conditional-next-recorded-event-game'
    }


def _quality(rows):
    if not rows:
        return {'n': 0, 'brier': None, 'logLoss': None}
    n = len(rows)
    return {
        'n': n,
        'brier': round(sum((p-y)**2 for p, y in rows)/n, 7),
        'logLoss': round(-sum(y*log(max(p,1e-9)) + (1-y)*log(max(1-p,1e-9)) for p, y in rows)/n, 7)
    }


def chronological_evaluation(person_samples, priors, season=2026):
    """Evaluate on each post-warmup recorded event-game, never later observations."""
    validate_priors(priors)
    if season != 2026:
        raise ValueError('Only 2026 is the designated forward research season')
    model = []
    baseline = []
    athletes = 0
    for person in person_samples:
        outcomes = [int(v > person['line']) for v in person['values']]
        if len(outcomes) <= MIN_PLAYER_HISTORY:
            continue
        used = False
        for index in range(MIN_PLAYER_HISTORY, len(outcomes)):
            info = next_event_probability(priors, person['position'], person['stat'], outcomes[:index])
            if info is None:
                continue
            model.append((info['probability'], outcomes[index]))
            baseline.append((info['trainingPrior'], outcomes[index]))
            used = True
        athletes += int(used)
    summary = {
        'schemaVersion': 1,
        'modelVersion': VERSION,
        'trainingSeason': 2025,
        'evaluationSeason': 2026,
        'classification': 'retrospective-conditional-event-game-forward-test-not-general-props',
        'evaluatedAthletes': athletes,
        'model': _quality(model),
        'cohortPriorOnlyBaseline': _quality(baseline),
        'priorStrength': PRIOR_STRENGTH,
        'limitations': (
            'Event-game conditional sample only; no-event or inactive appearances cannot be identified. '
            'Games may be dependent. 2026 was previously inspected in project development; '
            'not an untouched future holdout. No calibrated full-game player odds.'
        )
    }
    return summary
