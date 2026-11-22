#!/usr/bin/env python3
"""Synchronize release metadata with checked-in sources; never fabricate freshness."""
from __future__ import annotations
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT/path).read_text(encoding="utf-8"))
def sync():
    m=read("public/data/manifest.json")
    v=read("package.json")
    s=read("public/data/season-2026.json")
    e=read("public/data/research-2026.json")
    r=read("public/data/rosters-2026.json")
    if s["season"]!=2026 or r["season"]!=2026 or r["schoolsCount"]!=138 or len(r["schools"])!=138:
        raise ValueError("Incomplete 2026 FBS roster/season coverage")
    if e["holdout"]["season"]!=2026 or not e["lastScoredGame"] or not s["lastCompletedGame"]:
        raise ValueError("Invalid 2026 research/score cutoffs")
    n,w=r["schoolsCount"],r["weeklySchoolsUsed"]
    m["version"]=v["version"]
    m["scoringSourceCutoffUtc"]=s["lastCompletedGame"]
    m["researchSourceCutoffUtc"]=e["lastScoredGame"]
    m["verifiedRoster2026Schools"]=n
    m["verifiedRoster2026Names"]=r["totalPlayers"]
    m["verifiedRoster2026WeeklySchools"]=w
    m["verifiedRoster2026PrimarySchools"]=n-w
    m["sourceRefreshStatus"]=(
        f"Checked-in 2026 source files: {n} FBS rosters, {r['totalPlayers']} roster-listed names "
        f"({w} supplemental school snapshots, {n-w} CFBD schools). "
        f"Season scores through {s['lastCompletedGame']}; research ratings through {e['lastScoredGame']}. "
        "These are not 138 confirmed game-day depth charts."
    )
    return m
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--check",action="store_true")
    args=p.parse_args()
    path=ROOT/"public/data/manifest.json"
    desired=json.dumps(sync(),ensure_ascii=False,indent=2)+"\n"
    if args.check:
        if path.read_text(encoding="utf-8")!=desired:
            raise SystemExit("Manifest is stale; run python3 scripts/sync_data_manifest.py")
        print("Release manifest version, dates, and roster counts verified")
    else:
        path.write_text(desired,encoding="utf-8")
        print("Release manifest synchronized")
if __name__=="__main__":
    main()
