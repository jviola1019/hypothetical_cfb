"""Pregame leakage and independent 2026 holdout regression fixtures."""
import sys
import unittest
from collections import defaultdict
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/'scripts'))
from evaluate_rolling_model import (chronological_games,new_team,optimize_scale,evaluate,parse_games)


def fake_games(season, count, start):
    result=[]
    for i in range(count):
        a=i%16;b=(i*7+3)%16
        if a==b:b=(b+1)%16
        result.append({'season':season,'gameId':f'{season}-{i}','date':f'{start}T{(i%24):02d}:00:00Z',
                       'week':str(i//10+1),'home':f'team{a}','away':f'team{b}',
                       'h':21+(i%8)*3,'a':17+((i*5)%9)*3,'neutral':bool(i%7==0)})
    return sorted(result,key=lambda g:(g['date'],g['gameId']))


class ModelAudit(unittest.TestCase):
    def test_future_result_cannot_change_past_features(self):
        games=fake_games(2025,30,'2025-10-12')
        pred=chronological_games(games,defaultdict(new_team))
        modified=[{**x} for x in games]
        modified[-1]['h']=150
        other=chronological_games(modified,defaultdict(new_team))
        self.assertEqual(pred[:-1],other[:-1]);self.assertEqual(pred[-1]['pElo'],other[-1]['pElo'])
        self.assertEqual(pred[-1]['expectedHome'],other[-1]['expectedHome'])

    def test_training_slope_does_not_use_2026_labels(self):
        train=fake_games(2025,80,'2025-10-01')
        holdout=fake_games(2026,50,'2026-10-01')
        a=evaluate(train,holdout)
        changed=[{**x,'h':x['a']+1 if x['h']>x['a'] else x['h']+15} for x in holdout]
        b=evaluate(train,changed)
        self.assertEqual(a['training'],b['training'])
        self.assertEqual(a['holdout']['evaluatedGames'],50)
        self.assertNotEqual(a['holdout']['calibratedElo']['brier'],b['holdout']['calibratedElo']['brier'])
        self.assertEqual(a['training']['season'],2025)

    def test_no_duplicate_or_post_cutoff_2026_observations(self):
        import csv,tempfile
        headers=['game_id','season','start_date','home_team','away_team','home_division','away_division','home_points','away_points','neutral_site','completed']
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'schedule.csv'
            with path.open('w',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=headers);writer.writeheader()
                row={'game_id':'one','season':'2026','start_date':'2026-10-21T20:00:00Z','home_team':'Alabama','away_team':'Georgia',
                      'home_division':'fbs','away_division':'fbs','home_points':'21','away_points':'14','neutral_site':'FALSE','completed':'TRUE'}
                writer.writerow(row)
                writer.writerow({**row,'game_id':'future','start_date':'2026-12-01T20:00:00Z','home_points':'99'})
            out=parse_games(path,2026,'2026-11-21');self.assertEqual(len(out),1);self.assertEqual(out[0]['h'],21)
            with path.open('a',newline='') as f:
                w=csv.DictWriter(f,fieldnames=headers);w.writerow(row)
            with self.assertRaisesRegex(ValueError,'Duplicate'):
                parse_games(path,2026,'2026-11-21')

    def test_ratings_symmetric_and_finite(self):
        train=fake_games(2025,90,'2025-10-01');ho=fake_games(2026,45,'2026-10-01')
        r=evaluate(train,ho)
        self.assertGreater(r['holdout']['calibratedElo']['n'],0)
        self.assertTrue(0<r['training']['calibratedSlope']<=2.5)
        self.assertGreaterEqual(r['holdout']['calibratedElo']['brier'],0)
        self.assertGreater(r['training']['games'],0)

if __name__=='__main__':unittest.main()
