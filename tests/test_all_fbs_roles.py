"""Adversarial cross-team, position and provenance tests; real-data test runs on CI."""
import copy
import datetime as dt
import json
import unittest
from pathlib import Path

from scripts.audit_all_fbs_roles import audit, ROLES
from scripts.refresh_weekly_lineups import build

BASE = Path(__file__).resolve().parents[1] / "public/data"

def fixture():
    roster = {"season": 2026, "schools": {}}
    records = {}
    for i in range(138):
        school = f"team-{i:03}"
        roles = [{"name": f"{school}-{r}", "position": "WR" if r.startswith("WR") else r} for r in ROLES]
        roster["schools"][school] = roles
        records[school] = {"team": school, "season": 2026, "lastRecordedGame": "2026-11-15", "players": [
            {"name": f"{school}-{r}", "stat": stat, "n": 10, "mean": 100}
            for r, (_, stat) in ROLES.items()
        ]}
    return roster, records

class AllFbsRoleAudit(unittest.TestCase):
    def setUp(self):
        self.roster, self.records = fixture()
        self.weekly = build(self.roster, self.records, {"entries": [], "unavailable": []}, dt.date(2026, 11, 21))

    def check(self, weekly=None):
        return audit(self.roster, weekly or self.weekly, self.records, True)

    def test_138_schools_with_828_valid_positions_but_no_starter_certification(self):
        result = self.check()
        self.assertTrue(result["pass"], result["errors"][:5])
        self.assertEqual(result["summary"]["checkedRoleSlots"], 828)
        self.assertFalse(result["summary"]["allIndependentlyVerifiedStarters"])

    def test_wrong_2026_school_is_rejected(self):
        v = copy.deepcopy(self.weekly)
        v["teams"]["team-001"]["roles"]["QB"]["name"] = "team-002-QB"
        self.assertIn("roster", [e["code"] for e in self.check(v)["errors"]])

    def test_duplicate_player_roles_rejected(self):
        v = copy.deepcopy(self.weekly)
        v["teams"]["team-001"]["roles"]["WR2"]["name"] = "team-001-WR1"
        self.assertIn("duplicate_role", [e["code"] for e in self.check(v)["errors"]])

    def test_reported_unavailability_rejected(self):
        v = copy.deepcopy(self.weekly)
        v["teams"]["team-001"]["unavailable"] = [
            {"name": "team-001-QB", "status": "out", "observedOn": "2026-11-21"}
        ]
        self.assertIn("availability", [e["code"] for e in self.check(v)["errors"]])

    def test_future_source_rejected(self):
        v = copy.deepcopy(self.weekly)
        v["teams"]["team-001"]["roles"]["QB"]["observedOn"] = "2026-12-31"
        self.assertIn("date", [e["code"] for e in self.check(v)["errors"]])

    def test_false_usage_rejected(self):
        v = copy.deepcopy(self.weekly)
        v["teams"]["team-001"]["roles"]["QB"]["name"] = "nonexistent"
        self.assertIn("unsupported_usage", [e["code"] for e in self.check(v)["errors"]])

    def test_sourced_projection_not_a_verified_actual_start(self):
        v = copy.deepcopy(self.weekly)
        v["teams"]["team-001"]["roles"]["QB"]["basis"] = "depth-chart-projected"
        v["teams"]["team-001"]["roles"]["QB"]["observedOn"] = "2026-11-21"
        self.assertTrue(self.check(v)["pass"])
        self.assertFalse(self.check(v)["summary"]["allIndependentlyVerifiedStarters"])

@unittest.skipUnless((BASE / "weekly-lineups-2026.json").is_file(), "Big data only in GitHub checkout")
class ActualFullFbsData(unittest.TestCase):
    def test_actual_138_team_snapshot(self):
        roster = json.loads((BASE / "rosters-2026.json").read_text())
        week = json.loads((BASE / "weekly-lineups-2026.json").read_text())
        summaries = {}
        for team in roster["schools"]:
            f = BASE / "players-2026" / (team + ".json")
            if f.exists(): summaries[team] = json.loads(f.read_text())
        result = audit(roster, week, summaries, True)
        self.assertTrue(result["pass"], result["errors"][:8])
        self.assertEqual(result["summary"]["schoolChecks"], 138)
        self.assertEqual(result["summary"]["checkedRoleSlots"], 828)
