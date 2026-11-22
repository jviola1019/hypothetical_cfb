#!/usr/bin/env python3
"""Export frozen-at-kickoff score targets for auditing the *actual JS* drive generator.

2023 warms up team records. All 2024/2025/2026 predictions are computed
before updating state with each game outcome. No team full-season aggregates.
"""
from __future__ import annotations
import argparse, json
from datetime import datetime, timezone
from pathlib import Path
from evaluate_rolling_model import parse_games
from evaluate_score_distribution import make_chronological_predictions

def export(schedules,cutoff):
    source={y:parse_games(schedules[y],y,cutoff) for y in (2023,2024,2025,2026)}
    predictions=make_chronological_predictions(source)
    rows={}
    for y in (2024,2025,2026):
        pre=predictions[y]
        games=sorted(source[y],key=lambda g:(g["date"],g["gameId"]))
        if len(pre)!=len(games):
            raise ValueError("Chronological game/feature count mismatch")
        rows[str(y)]=[]
        for g,p in zip(games,pre):
            if p["gameId"]!=g["gameId"] or p["date"]!=g["date"]:
                raise ValueError("Pregame feature identity mismatch")
            expected_a=(p["predTotal"]+p["predMargin"])/2
            expected_b=(p["predTotal"]-p["predMargin"])/2
            if not (3<=expected_a<=80 and 3<=expected_b<=80):
                continue
            rows[str(y)].append({
                "id":g["gameId"],"date":g["date"],"a":g["home"],"b":g["away"],
                "venue":"neutral" if g["neutral"] else "a",
                "expectedA":round(expected_a,6),"expectedB":round(expected_b,6),
                "actualA":g["h"],"actualB":g["a"]
            })
    if min(len(rows[y]) for y in ("2024","2025","2026"))<300:
        raise ValueError("Insufficient chronology coverage")
    return {"schemaVersion":1,"classification":"pregame-only-sequential-FBS-scores",
            "warmup":2023,"fitSeason":2024,"validationSeason":2025,
            "checkedSeason":2026,"cutoff":cutoff,
            "source":"SportsDataverse cfbfastR-data schedule CSV; original game outcomes not serialized to the site",
            "seasons":rows}

def main():
    p=argparse.ArgumentParser()
    for year in (2023,2024,2025,2026):p.add_argument("--schedule-"+str(year),required=True)
    p.add_argument("--cutoff",default=datetime.now(timezone.utc).date().isoformat())
    p.add_argument("--out",required=True)
    a=p.parse_args()
    x=export({y:getattr(a,"schedule_"+str(y)) for y in (2023,2024,2025,2026)},a.cutoff)
    Path(a.out).write_text(json.dumps(x,separators=(",",":"),sort_keys=True)+"\n")
    print("Pregame fixture chronology:",{y:len(v) for y,v in x["seasons"].items()})
if __name__=="__main__":main()
