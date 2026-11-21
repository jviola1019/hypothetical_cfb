#!/usr/bin/env python3
"""Turn public CFB game results into *descriptive* school-season snapshots.

Upstream: SportsDataverse/cfbfastR-data schedules/csv (CFBD-derived).
Output deliberately excludes postgame win probabilities and power ratings.
There is no trained model here; PPG is not an opponent-adjusted forecast.
"""
import argparse
import csv
import json
import math
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

SOURCE = "https://github.com/sportsdataverse/cfbfastR-data"
MAX_BYTES = 2_000_000
MIN_FBS_TEAMS = 130
MAX_FBS_TEAMS = 155

ALIASES = {"Hawai'i": "hawaii", "Texas A&M": "texas-am", "Miami (OH)": "miami-oh", "San José State": "san-jose-state"}


def team_id(name):
    import re
    import unicodedata
    if name in ALIASES:
        return ALIASES[name]
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c)).lower().replace("&", "and")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name)).strip("-")


def parse_score(value):
    if str(value).strip() in ("", "NA", "null", "None"):
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return int(n) if math.isfinite(n) and n.is_integer() and 0 <= n <= 150 else None


def build(year, path, today=None):
    path = Path(path)
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError("Missing or oversized schedule")
    today = today or date.today()
    groups = {}
    seen_games = set()
    last = ""
    used = 0
    with path.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        required = {"game_id", "season", "start_date", "home_team", "away_team", "home_division", "away_division", "home_points", "away_points"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("Unexpected schedule schema")
        for row in reader:
            if row["season"] != str(year):
                continue
            for side in ("home", "away"):
                if str(row.get(side + "_division")).lower() != "fbs":
                    continue
                n = row[side + "_team"].strip()
                slug = team_id(n)
                if not slug or not n or len(n) > 100:
                    raise ValueError("Invalid team identity")
                if slug in groups and groups[slug]["school"] != n:
                    raise ValueError("Team identity collision")
                groups.setdefault(slug, {"id": slug, "school": n, "conference": row.get(side + "_conference") or "", "games": 0, "wins": 0, "losses": 0, "for": 0, "against": 0})
            game_id = row["game_id"]
            if game_id in seen_games:
                raise ValueError("Duplicate game ID")
            seen_games.add(game_id)
            when = str(row["start_date"])[:10]
            if not when or when > today.isoformat():
                continue
            a, b = parse_score(row.get("home_points")), parse_score(row.get("away_points"))
            if a is None or b is None or a == b:
                continue
            used += 1
            last = max(last, str(row["start_date"]))
            for side in ("home", "away"):
                if row[side + "_division"].lower() != "fbs":
                    continue
                s = groups[team_id(row[side + "_team"]) ]
                own, other = (a, b) if side == "home" else (b, a)
                s["games"] += 1
                s["wins"] += int(own > other)
                s["losses"] += int(own < other)
                s["for"] += own
                s["against"] += other
    if not MIN_FBS_TEAMS <= len(groups) <= MAX_FBS_TEAMS:
        raise ValueError(f"Unexpected FBS team count: {len(groups)}")
    out = []
    for s in sorted(groups.values(), key=lambda v: v["school"]):
        if not s["games"]:
            continue
        out.append({k:s[k] for k in ("id", "school", "conference", "games", "wins", "losses")} | {"pointsFor":round(s["for"]/s["games"],2), "pointsAgainst":round(s["against"]/s["games"],2)})
    return {"schemaVersion":1, "season":year, "classification":"FBS game result snapshot; descriptive only", "sourceUrl":f"{SOURCE}/blob/main/schedules/csv/cfb_schedules_{year}.csv", "published":datetime.now(timezone.utc).isoformat(timespec="seconds"), "lastCompletedGame":last, "allFbsSchoolsIdentified":len(groups), "withCompletedGames":len(out), "gamesWithScores":used, "teams":out, "notice":"Observed scores only, through the reported cutoff. In-season totals are not pregame-safe data for retrospectively forecasting those games."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season",type=int,required=True,choices=[2025,2026])
    parser.add_argument("--csv",required=True)
    parser.add_argument("--out",required=True)
    parser.add_argument("--cutoff",default=None)
    args=parser.parse_args()
    data=build(args.season,args.csv,date.fromisoformat(args.cutoff) if args.cutoff else None)
    dest=Path(args.out)
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"),sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({k:data[k] for k in ("season","allFbsSchoolsIdentified","withCompletedGames","gamesWithScores","lastCompletedGame")}))

if __name__ == "__main__":main()
