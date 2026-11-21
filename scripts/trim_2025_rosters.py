#!/usr/bin/env python3
"""Produce compact FBS-only CC0 2025 roster identities from a validated NCAA roster export."""
import argparse
import json
from pathlib import Path
from import_season_schedules import team_id
from import_2026_rosters import clean_name,position,with_school_mapping


def build(raw,season):
    schedule=json.loads(Path(season).read_text())
    schools={t['id'] for t in schedule['teams']}
    source=json.loads(Path(raw).read_text())
    output={}
    for label,people in source.get('schools',{}).items():
        id=with_school_mapping(label,schools)
        if not id:continue
        cleaned=[];seen=set()
        for p in people:
            name=clean_name(p.get('name'))
            pos=position(p.get('position'))
            if name and pos and name.casefold() not in seen:
                cleaned.append({'name':name,'position':pos});seen.add(name.casefold())
        if cleaned:output[id]=sorted(cleaned,key=lambda x:(x['position'],x['name']))[:200]
    return {'schemaVersion':1,'season':2025,'sourceUrl':'https://github.com/Dharit13/NCAA_2025-26-Season-Dataset','published':'2026-08-14','schoolCount':len(output),'schools':output,'notice':'2025–26 CC0 roster snapshot (historical); 2025 is not the active roster for 2026. No NIL rights.'}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--raw',required=True);p.add_argument('--schedule',required=True);p.add_argument('--out',required=True);a=p.parse_args()
 data=build(a.raw,a.schedule)
 Path(a.out).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n')
 print('Imported 2025 FBS roster schools:',data['schoolCount'])
