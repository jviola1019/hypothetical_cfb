import csv, json, tempfile, unittest
from pathlib import Path
from scripts.verify_official_score_fixtures import verify

ROOT=Path(__file__).resolve().parents[1]
FIX=json.loads((ROOT/'research/official_score_fixtures_2026.json').read_text())
HEAD=['game_id','season','start_date','completed','home_team','away_team','home_points','away_points']

class OfficialScoreVerification(unittest.TestCase):
 def csv(self,fixtures):
  temp=tempfile.TemporaryDirectory()
  dest=Path(temp.name)/'games.csv'
  with dest.open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=HEAD)
   w.writeheader()
   for g in fixtures['fixtures']:
    w.writerow({'game_id':g['gameId'],'season':'2026','start_date':g['date']+'T17:00:00.000Z',
      'completed':'TRUE','home_team':g['home'],'away_team':g['away'],
      'home_points':g['homePoints'],'away_points':g['awayPoints']})
  return temp,dest
 def test_three_independently_sourced_university_box_scores_match(self):
  temp,path=self.csv(FIX)
  with temp:self.assertEqual(verify(path,FIX),3)
 def test_score_mismatch_fails_closed(self):
  temp,path=self.csv(FIX)
  with temp:
   bad=json.loads(json.dumps(FIX))
   bad['fixtures'][0]['awayPoints']+=1
   with self.assertRaisesRegex(ValueError,'official away_points'):
    verify(path,bad)
 def test_source_identity_and_completed_marker_are_required(self):
  temp,path=self.csv(FIX)
  with temp:
   bad=json.loads(json.dumps(FIX))
   bad['fixtures'][1]['home']='Not Tennessee'
   with self.assertRaisesRegex(ValueError,'home_team'):
    verify(path,bad)
 def test_official_fixture_duplicate_and_bad_source_url_rejected(self):
  temp,path=self.csv(FIX)
  with temp:
   bad=json.loads(json.dumps(FIX))
   bad['fixtures'][1]['gameId']=bad['fixtures'][0]['gameId']
   with self.assertRaisesRegex(ValueError,'Duplicate'):verify(path,bad)
   bad=json.loads(json.dumps(FIX))
   bad['fixtures'][0]['officialBoxscore']='file:///tmp/nonofficial'
   with self.assertRaisesRegex(ValueError,'source URL'):verify(path,bad)
if __name__=='__main__':unittest.main()
