#!/usr/bin/env python3
"""Cross-check selected SportsDataverse final scores against manually inspected
official 2026 university athletic department box scores.

Three independent source spot checks DO NOT certify all FBS games or the
truth of 828 current starter assignments. No network crawling or raw copying.
"""
import argparse
import csv
import json
from pathlib import Path

FIELDS={"game_id","season","start_date","completed","home_team","away_team","home_points","away_points"}

def verify(schedule_path, fixtures):
    if fixtures.get("schemaVersion")!=1 or fixtures.get("season")!=2026:
        raise ValueError("Wrong official verification fixture version")
    evidence=fixtures.get("fixtures")
    if not isinstance(evidence,list) or len(evidence)<3:
        raise ValueError("Independent official fixture sample too small")
    ids=set()
    for fixture in evidence:
        gid=fixture.get("gameId")
        if not isinstance(gid,str) or not gid.isdigit() or gid in ids:
            raise ValueError("Duplicate or invalid official fixture ID")
        ids.add(gid)
        url=fixture.get("officialBoxscore","")
        if not isinstance(url,str) or not url.startswith("https://"):
            raise ValueError("Official fixture lacks published source URL")
    rows={}
    with Path(schedule_path).open(encoding="utf-8-sig",newline="") as fh:
        reader=csv.DictReader(fh)
        if not FIELDS.issubset(reader.fieldnames or []):
            raise ValueError("Upstream schedule schema changed")
        for row in reader:
            gid=row.get("game_id","")
            if gid in ids:
                if gid in rows:
                    raise ValueError("Duplicate selected game in upstream CSV")
                rows[gid]=row
    for item in evidence:
        gid=item["gameId"]
        row=rows.get(gid)
        if row is None:
            raise ValueError("Officially sourced game missing from upstream CSV: "+gid)
        expected={"season":"2026","home_team":item["home"],"away_team":item["away"],
            "home_points":str(item["homePoints"]),"away_points":str(item["awayPoints"])}
        for field,want in expected.items():
            if row.get(field)!=want:
                raise ValueError(f"Game {gid}: official {field} {want!r} != feed {row.get(field)!r}")
        if row["completed"].upper()!="TRUE" or row["start_date"][:10]!=item["date"]:
            raise ValueError(f"Game {gid}: kickoff/finished status contradicts official report")
    return len(rows)

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--schedule",required=True)
    a.add_argument("--fixtures",required=True)
    c=a.parse_args()
    fixtures=json.loads(Path(c.fixtures).read_text(encoding="utf-8"))
    count=verify(c.schedule,fixtures)
    print(json.dumps({"officialIndependentlyVerifiedScores":count,
                      "scope":"spot-check only, not full-source or starting-roster certification",
                      "season":2026}))
if __name__=="__main__":
    main()
