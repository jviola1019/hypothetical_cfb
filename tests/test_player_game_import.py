import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_player_games import build

class TestObservedPlayerGameImport(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.root=Path(self.temp.name)
  self.schedule=self.root/'games.csv';self.teams=self.root/'teams.json';self.rosters=self.root/'rosters.json';self.play=self.root/'play.csv'
  names=[f'University {i}' for i in range(138)]
  ids=[f'university-{i}' for i in range(138)]
  self.teams.write_text(json.dumps({'schemaVersion':1,'season':2026,'teams':[{'id':id,'school':name} for id,name in zip(ids,names)]}))
  self.rosters.write_text(json.dumps({'schemaVersion':1,'season':2026,'schools':{'university-0':[{'name':'Alex Smith','position':'QB'},{'name':'Riley Jordan','position':'WR'}]}}))
  fields=['game_id','season','home_team','away_team','home_points','away_points','completed','start_date']
  with self.schedule.open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
   for n in range(401):w.writerow({'game_id':str(n+1),'season':2026,'home_team':'University 0','away_team':'University 1','home_points':14,'away_points':7,'completed':'TRUE','start_date':'2026-09-01'})
  self.fields=['game_id','season','team','play_id','reception_player','reception_player_id','reception_yds','completion_player','completion_player_id','completion_yds','rush_player','rush_player_id','rush_yds','target_player','target_player_id','touchdown_player','touchdown_player_id']
  rows=[]
  for i in range(60):
   rows.append({'game_id':'1','season':'2026','team':'University 0','play_id':str(i+100),
     'reception_player':'Riley Jordan','reception_player_id':'REC2','reception_yds':'7',
     'completion_player':'Alex Smith','completion_player_id':'QB1','completion_yds':'7',
     'target_player':'Riley Jordan','target_player_id':'REC2'})
  with self.play.open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=self.fields);w.writeheader();w.writerows(rows)
 def run_import(self):return build(2026,self.play,self.schedule,self.teams,self.rosters,'2026-11-21',self.root/'out')
 def test_derived_summary_counts_and_no_raw_game_mirror(self):
  report=self.run_import();self.assertEqual(report['matchedGameCount'],1)
  # Only one fixture game was recorded. Minimum three distinct event-games
  # prevents misleading population-wide player hit rates.
  p=json.loads((self.root/'out'/'university-0.json').read_text())
  self.assertEqual(p['schemaVersion'],2)
  self.assertEqual(p['classification'],'derived-player-aggregate-not-projection')
  self.assertEqual(p['players'],[])
  self.assertEqual(report['derivedAthleteSummaries'],0)
 def test_duplicate_identical_play_rows_are_idempotent(self):
  with self.play.open('a',newline='') as f:
   w=csv.DictWriter(f,fieldnames=self.fields)
   w.writerow({'game_id':1,'season':2026,'team':'University 0','play_id':'100','reception_player':'Riley Jordan','reception_player_id':'REC2','reception_yds':'7'})
  report=self.run_import();self.assertEqual(report['eventsAttributed'],300)
 def test_future_and_forged_team_rows_not_used(self):
  with self.play.open('a',newline='') as f:
   w=csv.DictWriter(f,fieldnames=self.fields)
   w.writerow({'game_id':10000,'season':2026,'team':'University 0','play_id':'9999','reception_player':'Fake Person','reception_yds':'50'})
   w.writerow({'game_id':2,'season':2026,'team':'Unknown Club','play_id':'9998','reception_player':'Fake Person','reception_yds':'50'})
  report=self.run_import();self.assertEqual(report['matchedGameCount'],1)
 def test_observed_three_game_summary(self):
  with self.play.open('a',newline='') as f:
   w=csv.DictWriter(f,fieldnames=self.fields)
   for j in (2,3):
    for i in range(3):
     w.writerow({'game_id':j,'season':2026,'team':'University 0','play_id':str(100+i),
       'completion_player':'Alex Smith','completion_player_id':'QB1','completion_yds':'6',
       'reception_player':'Riley Jordan','reception_player_id':'REC2','reception_yds':'6'})
  self.run_import()
  p=json.loads((self.root/'out'/'university-0.json').read_text())
  self.assertEqual(p['playerCount'],2)
  qb=next(x for x in p['players'] if x['name']=='Alex Smith')
  self.assertEqual(qb['eventGames'],3);self.assertEqual(qb['n'],3)
  self.assertEqual(qb['mean'],152.0)
  self.assertEqual(qb['hit'],1)
  self.assertNotIn('gameLines',p['players'][0])
 def test_rejects_missing_schema(self):
  self.play.write_text('game_id,season\n1,2026\n');
  with self.assertRaisesRegex(ValueError,'schema'):self.run_import()

if __name__=='__main__':unittest.main()
