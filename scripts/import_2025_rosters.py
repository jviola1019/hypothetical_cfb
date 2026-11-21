#!/usr/bin/env python3
"""Refresh FBS-only *2025* names and positions from the matching-year CFBD roster.

The independent CC0 2025 NCAA dataset is useful as corroborating context,
not a fallback for a 2026 depth chart. No two years' athletes are merged.
"""
import argparse
import json
from datetime import datetime,timezone
from pathlib import Path
from import_2026_rosters import cfbd_roster

SOURCE='https://github.com/sportsdataverse/cfbfastR-data/blob/main/rosters/csv/cfb_rosters_2025.csv'

def build(schedule_path,csv_path):
    season=json.loads(Path(schedule_path).read_text(encoding='utf-8'))
    if season.get('season')!=2025 or season.get('schemaVersion')!=1 or not isinstance(season.get('teams'),list):
        raise ValueError('Invalid 2025 team schedule snapshot')
    ids={t['id'] for t in season['teams']}
    source=cfbd_roster(csv_path,ids)
    out={}
    for id in sorted(ids):
        seen=set();people=[]
        for p in source.get(id,[]):
            name=p['name'];key=name.casefold()
            if key in seen:continue
            seen.add(key);people.append(p)
            if len(people)>=240:break
        if people:out[id]=sorted(people,key=lambda x:(x['position'],x['name'].casefold()))
    if len(out)<100:raise ValueError('Insufficient source-verified 2025 FBS rosters: '+str(len(out)))
    return {'schemaVersion':1,'season':2025,'sourceUrl':SOURCE,
            'published':datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'kind':'source-reported-historical-2025-roster-names-and-positions-only',
            'schoolsCount':len(out),'totalPlayers':sum(len(v) for v in out.values()),
            'schools':out,'notice':'These athletes appeared in the 2025 roster archive; it says nothing about their 2026 team, status, injury, starting role, or playing time. Player props are synthetic.'}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--schedule',required=True)
    p.add_argument('--csv',required=True)
    p.add_argument('--out',required=True)
    a=p.parse_args()
    data=build(a.schedule,a.csv)
    dest=Path(a.out);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
    print(json.dumps({key:data[key] for key in ('season','schoolsCount','totalPlayers')}))
if __name__=='__main__':main()
