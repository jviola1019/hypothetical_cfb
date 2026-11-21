import datetime as dt, unittest
from scripts.refresh_weekly_lineups import build, usage_score

ROSTER={'season':2026,'sourceUrl':'https://example.com/roster','schools':{'ohio-state':[
 {'name':'Julian Sayin','position':'QB'},{'name':'Luke Fahey','position':'QB'},{'name':'Jeremiah Smith','position':'WR'},{'name':'Chris Henry Jr.','position':'WR'}],
 'tennessee':[{'name':'DeSean Bishop','position':'RB'},{'name':'Backup Person','position':'RB'}]}}
CURATED={'entries':[{'team':'ohio-state','role':'QB','name':'Luke Fahey','basis':'reported-replacement','observedOn':'2026-11-21','sourceUrl':'https://example.com/lineup','note':'current'}],
 'unavailable':[{'team':'ohio-state','name':'Julian Sayin','status':'out','observedOn':'2026-11-21','sourceUrl':'https://example.com/status'}]}
SUMMARIES={'ohio-state':{'lastRecordedGame':'2026-11-14','sourceUrl':'https://example.com/stats','players':[{'name':'Julian Sayin','stat':'passingYards','mean':300,'n':7},{'name':'Jeremiah Smith','stat':'receivingYards','mean':131,'n':10}]}}

class WeeklyTest(unittest.TestCase):
 def test_current_replacement_selected_over_prior_volume(self):
  result=build(ROSTER,SUMMARIES,CURATED,dt.date(2026,11,21));self.assertEqual(result['teams']['ohio-state']['roles']['QB']['name'],'Luke Fahey')
  self.assertEqual(result['teams']['ohio-state']['roles']['QB']['basis'],'reported-replacement')
  self.assertEqual(result['schools'],2)
 def test_weekly_reset_does_not_recertify_stale_starter_or_automatically_restore_old_qb(self):
  result=build(ROSTER,SUMMARIES,CURATED,dt.date(2026,11,30));self.assertEqual(result['teams']['ohio-state']['roles']['QB']['name'],'Luke Fahey')
  self.assertEqual(result['teams']['ohio-state']['roles']['QB']['basis'],'last-reported-replacement')
  self.assertEqual(result['teams']['ohio-state']['unavailable'],[])
 def test_curated_must_match_roster_2026_and_role(self):
  bad={**CURATED,'entries':[{**CURATED['entries'][0],'name':'Not Listed'}]}
  with self.assertRaisesRegex(ValueError,'roster'):
   build(ROSTER,SUMMARIES,bad,dt.date(2026,11,21))
 def test_usage_projection_not_automatically_called_verified_starter(self):
  result=build(ROSTER,SUMMARIES,{'entries':[],'unavailable':[]},dt.date(2026,11,21))
  self.assertEqual(result['teams']['ohio-state']['roles']['QB']['basis'],'usage-projected')
  self.assertEqual(result['teams']['ohio-state']['roles']['QB']['name'],'Julian Sayin')

 def test_production_priority_not_just_games_recorded(self):
  self.assertGreater(usage_score({'n':7,'mean':132}),usage_score({'n':10,'mean':34}))
 def test_stale_projection_expires_to_2026_usage(self):
  projected={'entries':[{**CURATED['entries'][0],'basis':'depth-chart-projected'}], 'unavailable':[]}
  result=build(ROSTER,SUMMARIES,projected,dt.date(2026,11,30))
  self.assertEqual(result['teams']['ohio-state']['roles']['QB']['basis'],'usage-projected')
if __name__=='__main__':unittest.main()
