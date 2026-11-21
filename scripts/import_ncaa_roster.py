#!/usr/bin/env python3
"""Create a compact, validated 2025 roster reference from the CC0 NCAA roster release.

This is historical descriptive data, not a pregame prediction dataset. A name or
season statistic never authorizes a forward-looking, player-specific prop model.
No authenticated endpoints or client-side secrets are involved.
"""
import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path

SOURCE = "https://github.com/Dharit13/NCAA_2025-26-Season-Dataset"
DATA_LICENSE = "CC0-1.0 (data); no NIL or publicity rights granted"
REQUIRED_ROSTER = {"athlete_id", "first_name", "last_name", "school", "position_group"}
REQUIRED_STATS = {"athlete_id", "gp", "pass_yds", "rush_yds", "rec_yds"}
ID_PATTERN = re.compile(r"^fb_[0-9a-f]{12}$")
COLUMN_KEYS = {
    "gp": "games", "pass_cmp": "completions", "pass_att": "passAttempts",
    "pass_yds": "passYards", "pass_td": "passTD", "pass_int": "interceptions",
    "rush_att": "rushAttempts", "rush_yds": "rushYards", "rush_td": "rushTD",
    "rec": "receptions", "rec_yds": "receivingYards", "rec_td": "receivingTD",
    "tackles_tot": "tackles", "sacks": "sacks", "def_int": "defInterceptions",
    "fgm": "fieldGoalsMade", "fga": "fieldGoalsAttempted",
}
MAX_ROSTER_ROWS = 100000
MAX_STATS_ROWS = 60000
MAX_NAME = 120
MAX_SOURCE_BYTES = 35 * 1024 * 1024


def read_csv(path, required, maximum):
    path = Path(path)
    if not path.is_file() or path.stat().st_size > MAX_SOURCE_BYTES:
        raise ValueError(f"Missing or oversized CSV: {path}")
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError(f"Unexpected CSV columns; missing {required - set(reader.fieldnames or [])}")
        rows = []
        for index, row in enumerate(reader):
            if index >= maximum:
                raise ValueError("CSV exceeds safe row limit")
            rows.append(row)
        return rows


def good_name(value):
    value = " ".join(str(value or "").strip().split())
    return bool(value) and len(value) <= MAX_NAME and all(ord(c) >= 32 for c in value) and not value.startswith(("=", "+", "-", "@"))


def number(value, key):
    if value is None or str(value).strip() == "":
        return None
    try:
        val = float(value)
    except ValueError:
        return None
    if not (-500 <= val <= 100000) or not (val == val):
        return None
    if key not in ("rush_yds", "rec_yds", "pass_yds") and val < 0:
        return None
    return int(val) if val.is_integer() else round(val, 2)


def compile_roster(roster_rows, stat_rows, *, published=None):
    by_id = {}
    rejected = defaultdict(int)
    for row in roster_rows:
        athlete_id = str(row.get("athlete_id") or "")
        first = row.get("first_name")
        last = row.get("last_name")
        school = row.get("school")
        if not ID_PATTERN.fullmatch(athlete_id) or not all(good_name(x) for x in (first, last, school)):
            rejected["malformed_roster"] += 1
            continue
        if athlete_id in by_id:
            rejected["duplicate_roster_id"] += 1
            continue
        by_id[athlete_id] = {
            "id": athlete_id, "name": f"{first.strip()} {last.strip()}",
            "school": school.strip(),
            "position": str(row.get("position_group") or "Unknown")[:32],
        }
    stats_by_id = {}
    for row in stat_rows:
        athlete_id = str(row.get("athlete_id") or "")
        if not ID_PATTERN.fullmatch(athlete_id) or athlete_id not in by_id:
            rejected["unmatched_stat"] += 1
            continue
        if athlete_id in stats_by_id:
            rejected["duplicate_stat_id"] += 1
            continue
        stats_by_id[athlete_id] = {out: number(row.get(key), key) for key, out in COLUMN_KEYS.items()}
    grouped = defaultdict(list)
    for athlete_id, athlete in by_id.items():
        grouped[athlete["school"]].append({**athlete, "stats": stats_by_id.get(athlete_id, {})})
    schools = {k: sorted(v, key=lambda a: (a["name"].casefold(), a["id"])) for k, v in sorted(grouped.items())}
    return {
        "schemaVersion": 1,
        "season": 2025,
        "kind": "observed-season-roster-reference",
        "dataLicense": DATA_LICENSE,
        "sourceUrl": SOURCE,
        "published": published or str(date.today()),
        "athletes": len(by_id),
        "athletesWithStats": len(stats_by_id),
        "schoolsCount": len(schools),
        "warnings": dict(rejected),
        "schools": schools,
        "notice": "Descriptive 2025 roster and seasonal totals; not athlete availability or calibrated prop forecasts. No NIL, photo or endorsement rights conveyed.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--roster", required=True)
    parser.add_argument("--stats", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--published", default=None)
    args = parser.parse_args()
    payload = compile_roster(read_csv(args.roster, REQUIRED_ROSTER, MAX_ROSTER_ROWS), read_csv(args.stats, REQUIRED_STATS, MAX_STATS_ROWS), published=args.published)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({k: payload[k] for k in ("athletes", "athletesWithStats", "schoolsCount", "warnings")}))


if __name__ == "__main__":
    main()
