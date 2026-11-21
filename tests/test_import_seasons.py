"""Pure offline guardrails for the two-season observed-data and roster importers."""
import csv
import io
import json
import sys
import tempfile
import unittest
import zipfile
from datetime import date
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from import_season_schedules import team_id,build as build_scores
from import_2026_rosters import cfbd_roster,newer_archive,build as build_roster

class PipelineTests(unittest.TestCase):
  def test_aliases_and_scores_validate(self):
    self.assertEqual(team_id('Texas A&M'),'texas-am')
    self.assertEqual(team_id("Hawai'i"),'hawaii')
    self.assertEqual(team_id('Miami (OH)'),'miami-oh')
    with tempfile.TemporaryDirectory() as d:
      csvfile=Path(d)/'games.csv'
      keys=['game_id','season','start_date','home_team','away_team','home_division','away_division','home_conference','away_conference','home_points','away_points']
      with csvfile.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=keys);w.writeheader()
        # Artificial schedule fixture: 138 schools, not a claim about real scores.
        for n in range(138):
          w.writerow(dict(game_id=n,season=2026,start_date='2026-09-01',home_team=f'School {n}',away_team=f'School {(n+1)%138}',home_division='fbs',away_division='fbs',home_conference='TEST',away_conference='TEST',home_points=21,away_points=7))
      o=build_scores(2026,csvfile,date(2026,11,21));self.assertEqual(o['allFbsSchoolsIdentified'],138);self.assertEqual(o['withCompletedGames'],138)
      s=csvfile.read_text();csvfile.write_text(s+s.splitlines()[-1]+'\n')
      with self.assertRaisesRegex(ValueError,'Duplicate game ID'):build_scores(2026,csvfile,date(2026,11,21))

  def test_current_roster_from_cfbd_csv(self):
    with tempfile.TemporaryDirectory() as d:
      p=Path(d)/'roster.csv'
      p.write_text('team,position,first_name,last_name\nOle Miss,QB,Example,Quarterback\nTexas A&M,WR,Example,Receiver\nOle Miss,WR,<script>,Bad\n')
      rows=cfbd_roster(p,{'ole-miss','texas-am'})
      self.assertEqual(rows['ole-miss'],[{'name':'Example Quarterback','position':'QB'}]);self.assertEqual(rows['texas-am'][0]['name'],'Example Receiver')

  def test_weekly_roster_archive_is_sandboxed(self):
    with tempfile.TemporaryDirectory() as d:
      p=Path(d)/'weekly.zip'
      with zipfile.ZipFile(p,'w') as z:
        z.writestr('ole-miss.json',json.dumps({'key':'ole-miss','school':'Ole Miss','subdivision':'FBS','sports':[{'sport':'football','season':'2026','players':[{'name':'Current Player','position':'QB'}]}]}))
        z.writestr('../not-a-school.json',json.dumps({'key':'unknown-school','subdivision':'FBS','sports':[]}))
      out,count=newer_archive(p,{'ole-miss'})
      self.assertEqual(out['ole-miss'],[{'name':'Current Player','position':'QB'}]);self.assertEqual(count,1)

if __name__=='__main__':unittest.main()
