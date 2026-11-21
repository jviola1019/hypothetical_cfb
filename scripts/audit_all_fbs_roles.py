#!/usr/bin/env python3
"""Integrity checks for six modeled 2026 roles across every FBS program.

A passing report verifies roster and derived-stat evidence, NOT 138 official starts.
"""
import argparse
import datetime as dt
import json
import unicodedata
from collections import Counter
from pathlib import Path

ROLES = {
    "QB": ({"QB"}, "passingYards"),
    "RB": ({"RB", "HB", "FB"}, "rushingYards"),
    "WR1": ({"WR"}, "receivingYards"),
    "WR2": ({"WR"}, "receivingYards"),
    "TE": ({"TE"}, "receivingYards"),
    "K": ({"K", "PK"}, "fieldGoalsMade"),
}
BASIS = {
    "reported-replacement", "depth-chart-listed", "depth-chart-projected",
    "last-reported-replacement", "usage-projected", "roster-only",
}
SOURCED = {"reported-replacement", "depth-chart-listed", "depth-chart-projected"}

def key(value):
    s = unicodedata.normalize("NFKD", str(value or "")).replace("’", "'").replace("‘", "'")
    return " ".join("".join(c for c in s if not unicodedata.combining(c)).casefold().split())

def date(value):
    try: return dt.date.fromisoformat(value)
    except (TypeError, ValueError): return None

def audit(roster, weekly, summaries, require_all=True):
    errors, teams, basis = [], {}, Counter()
    def bad(team, code, detail):
        errors.append({"team": team, "code": code, "detail": detail})
    if roster.get("season") != 2026 or weekly.get("season") != 2026:
        bad("*", "season", "Expected season 2026")
    schools, source = roster.get("schools"), weekly.get("teams")
    if not isinstance(schools, dict) or not isinstance(source, dict):
        return {"pass": False, "errors": [{"code": "schema", "detail": "Invalid source schema"}], "summary": {}}
    if require_all and (len(schools) != 138 or len(source) != 138):
        bad("*", "school_count", "Expected 138 FBS schools")
    if set(schools) != set(source):
        bad("*", "school_keys", "Roster and lineup team sets differ")
    begin, end, generated = [date(weekly.get(x)) for x in ("weekStart", "weekEnd", "generatedOn")]
    if not all([begin, end, generated]) or not begin <= generated <= end or (end-begin).days != 6:
        bad("*", "week", "Invalid weekly source window")
    for school, people in schools.items():
        player_index = {key(p.get("name")): p for p in people if isinstance(p, dict)}
        doc = source.get(school, {})
        roles = doc.get("roles") if isinstance(doc, dict) else None
        if not isinstance(roles, dict):
            bad(school, "no_roles", "Missing lineup roles")
            continue
        if set(roles) != set(ROLES):
            bad(school, "role_set", "Missing or unexpected simulated positions")
        records = summaries.get(school, {})
        if not records or records.get("team") != school or records.get("season") != 2026:
            bad(school, "observations", "Missing or wrong-team 2026 player summaries")
        evidence = {(key(p.get("name")), p.get("stat")): p
                    for p in records.get("players", []) if isinstance(p, dict)}
        unavailable = {key(x.get("name")): x for x in doc.get("unavailable", [])
                       if x.get("status") in ("out", "doubtful")
                       and begin and date(x.get("observedOn")) and date(x.get("observedOn")) >= begin}
        used = set()
        school_basis = Counter()
        for role, (positions, stat) in ROLES.items():
            p = roles.get(role)
            if not isinstance(p, dict):
                continue
            name, grade = p.get("name", ""), p.get("basis", "")
            norm = key(name)
            basis[grade] += 1
            school_basis[grade] += 1
            if grade not in BASIS: bad(school, "basis", role + ": unrecognized grade")
            if norm in used: bad(school, "duplicate_role", role + ": " + name)
            used.add(norm)
            r = player_index.get(norm)
            if not r: bad(school, "roster", role + ": " + name)
            elif r.get("position") not in positions: bad(school, "position", role + ": " + name)
            if norm in unavailable: bad(school, "availability", role + ": reported out/doubtful")
            observed = date(p.get("observedOn"))
            if not observed or not generated or observed > generated:
                bad(school, "date", role + ": future or invalid evidence date")
            url = p.get("sourceUrl", "")
            if not isinstance(url, str) or not url.startswith("https://") or any(c in url for c in "<>\\"):
                bad(school, "source_url", role + ": malformed provenance")
            if grade in SOURCED and begin and (not observed or observed < begin):
                bad(school, "stale", role + ": dated external evidence is older than current week")
            if grade == "usage-projected":
                event = evidence.get((norm, stat))
                if not event or not isinstance(event.get("n"), int) or event["n"] < 3:
                    bad(school, "unsupported_usage", role + ": no matching 2026 stat events")
                last = date(records.get("lastRecordedGame"))
                if last and observed and observed > last:
                    bad(school, "usage_date", role + ": reported later than latest event")
        teams[school] = {
            "testedRoles": len(roles),
            "sourceReferenced": sum(school_basis[b] for b in SOURCED),
            "usageEstimated": school_basis["usage-projected"],
            "rosterOnly": school_basis["roster-only"],
            "verifiedAllStartingPositions": False,
        }
    report = {
        "schemaVersion": 1, "season": 2026,
        "generatedOn": weekly.get("generatedOn"),
        "classification": "modeled-role-integrity-NOT-confirmed-138-team-depth-charts",
        "pass": not errors,
        "summary": {
            "schools": len(schools), "schoolChecks": len(teams),
            "checkedRoleSlots": sum(basis.values()),
            "reportedGameDayStarterRoles": basis["reported-replacement"],
            "depthChartListed": basis["depth-chart-listed"],
            "depthChartProjected": basis["depth-chart-projected"],
            "usageEstimated": basis["usage-projected"],
            "rosterOnly": basis["roster-only"],
            "allIndependentlyVerifiedStarters": False,
        },
        "errors": errors[:120], "teams": teams,
    }
    if require_all and (len(teams) != 138 or report["summary"]["checkedRoleSlots"] != 828):
        bad("*", "coverage", "Expected 138 teams and 828 modeled role slots")
        report["pass"] = False
        report["errors"] = errors[:120]
    return report

def main():
    parser = argparse.ArgumentParser()
    for name in ("roster", "weekly", "players", "out"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--strict", action="store_true")
    a = parser.parse_args()
    roster = json.loads(Path(a.roster).read_text())
    weekly = json.loads(Path(a.weekly).read_text())
    summaries = {}
    for team in roster.get("schools", {}):
        path = Path(a.players) / (team + ".json")
        if path.is_file(): summaries[team] = json.loads(path.read_text())
    report = audit(roster, weekly, summaries, a.strict)
    dest = Path(a.out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(report, ensure_ascii=False, separators=(",", ":")) + "\n")
    print("FBS modeled-role audit:", report["summary"])
    if report["errors"]:
        print("First errors:", report["errors"][:10])
    if a.strict and not report["pass"]:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
