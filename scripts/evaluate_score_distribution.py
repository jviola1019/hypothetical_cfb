#!/usr/bin/env python3
"""Empirical full-game score-residual diagnostics without possession-level claims.

Uses only 2024 pregame score residuals to create empirical predictive intervals.
Evaluates the frozen residual distribution on 2025 and then 2026 games.
No 2026 outcome is permitted to fit a parameter or select a model.

2025 has already been examined during earlier model selection; 2026 likewise
has been inspected. Neither should be described as a pristine holdout.
"""
import argparse
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from evaluate_rolling_model import parse_games, new_team, PRIOR_RATING, YEAR_RETENTION
from evaluate_multiyear import season_forward

VERSION = 'empirical-score-residual-v0.8'


def make_chronological_predictions(data):
    if not all(data.get(year) for year in (2023, 2024, 2025, 2026)):
        raise ValueError('Four complete source year sets are required')
    for year in (2023, 2024, 2025):
        if max(item['date'] for item in data[year]) >= min(item['date'] for item in data[year + 1]):
            raise ValueError('Seasons overlap; cannot establish chronological cutoffs')
    teams = defaultdict(new_team)
    out = {}
    for year in (2023, 2024, 2025, 2026):
        if year > 2023:
            for team in teams.values():
                team['rating'] = PRIOR_RATING + (team['rating'] - PRIOR_RATING) * YEAR_RETENTION
                team.update(pf=0,pa=0,played=0)
        out[year] = season_forward(data[year], teams, year)
    return out


def residuals(rows, key):
    predicted = 'pred' + key
    actual = 'actual' + key
    return [item[actual] - item[predicted] for item in rows]


def empirical_quantile(values, q):
    if not values or not 0 <= q <= 1:
        raise ValueError('Invalid empirical quantile')
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, math.ceil(q * len(ordered)) - 1)]


def absolute_pair_penalty(sorted_values):
    """0.5 E|X-X'| for an empirical marginal distribution in O(n)."""
    n = len(sorted_values)
    return sum((2 * index - n + 1) * value for index, value in enumerate(sorted_values)) / (n * n)


def crps_ensemble(observed, location, residual_draws, pair_penalty):
    return (sum(abs(location + draw - observed) for draw in residual_draws)
            / len(residual_draws) - pair_penalty)


def fit_training_residuals(rows):
    if len(rows) < 20:
        raise ValueError('Too few training games')
    fits = {}
    for key in ('Margin', 'Total'):
        raw = residuals(rows, key)
        fits[key] = {
            'draws': sorted(raw),
            'q05': empirical_quantile(raw, .05),
            'q10': empirical_quantile(raw, .10),
            'q90': empirical_quantile(raw, .90),
            'q95': empirical_quantile(raw, .95),
            'pairPenalty': absolute_pair_penalty(sorted(raw)),
            'count': len(raw)
        }
    nonneutral = [item for item in rows if item['home']]
    home_rate = ((sum(item['y'] for item in nonneutral) + 2) /
                 (len(nonneutral) + 4)) if nonneutral else .5
    return {'Margin': fits['Margin'], 'Total': fits['Total'], 'homeRate': home_rate}


def check_forecasts(rows, fitted):
    if not rows:
        raise ValueError('No evaluation games')
    output = {'n': len(rows)}
    win_brier = baseline_brier = 0.0
    for key in ('Margin', 'Total'):
        model = fitted[key]
        errors = residuals(rows, key)
        raw = model['draws']
        output[key.lower()] = {
            'crps': round(sum(crps_ensemble(row['actual'+key], row['pred'+key],
                         raw, model['pairPenalty']) for row in rows) / len(rows), 5),
            'mae': round(sum(abs(err) for err in errors)/len(errors), 5),
            'interval80Coverage': round(sum(model['q10'] <= err <= model['q90'] for err in errors)/len(errors), 5),
            'interval90Coverage': round(sum(model['q05'] <= err <= model['q95'] for err in errors)/len(errors), 5),
            'interval80Offset': [round(model['q10'], 3), round(model['q90'], 3)],
            'interval90Offset': [round(model['q05'], 3), round(model['q95'], 3)]
        }
    for row in rows:
        # A zero-margin simulated tie is split 50/50; predictive tie handling is
        # not an NCAA overtime simulation. Laplace smoothing avoids p=0 or 1.
        margin = row['predMargin']
        larger = sum(draw > -margin for draw in fitted['Margin']['draws'])
        tied = sum(draw == -margin for draw in fitted['Margin']['draws'])
        p = (larger + .5 * tied + .5) / (len(fitted['Margin']['draws']) + 1)
        p0 = fitted['homeRate'] if row['home'] else .5
        win_brier += (p-row['y'])**2
        baseline_brier += (p0-row['y'])**2
    output['winnerBrierFromMarginResiduals'] = round(win_brier/len(rows), 7)
    output['winnerBrierHomePrior'] = round(baseline_brier/len(rows), 7)
    return output


def evaluate(data, cutoff):
    predicted = make_chronological_predictions(data)
    trained = fit_training_residuals(predicted[2024])
    return {
        'schemaVersion': 1,
        'modelVersion': VERSION,
        'classification': 'full-game-score-residual-distribution-not-a-possession-calibration',
        'sourceCutoff': cutoff,
        'fitSeason': 2024,
        'fitGames': len(predicted[2024]),
        'warmupSeason': 2023,
        'evaluations': {
            str(year): check_forecasts(predicted[year], trained)
            for year in (2025, 2026)
        },
        'limitations': (
            'Score-level residual distribution only: historical schedules contain no '
            'possession-level transitions. Marginal distributions do not guarantee '
            'physically consistent joint game scores; the drive generator is separate. '
            '2025 and 2026 have both been examined during earlier development.'
        )
    }


def main():
    cli = argparse.ArgumentParser()
    for year in (2023, 2024, 2025, 2026):
        cli.add_argument('--schedule-' + str(year), required=True)
    cli.add_argument('--cutoff', default=datetime.now(timezone.utc).date().isoformat())
    cli.add_argument('--out', required=True)
    args = cli.parse_args()
    games = {
        year: parse_games(getattr(args, 'schedule_' + str(year)), year, args.cutoff)
        for year in (2023, 2024, 2025, 2026)
    }
    result = evaluate(games, args.cutoff)
    if result['fitGames'] < 400 or result['evaluations']['2026']['n'] < 300:
        raise ValueError('Insufficient score-distribution evaluation coverage')
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(',',':'))+'\n')
    print(json.dumps({'fitGames': result['fitGames'],
                      'check2025': result['evaluations']['2025'],
                      'check2026': result['evaluations']['2026']}))


if __name__ == '__main__':
    main()
