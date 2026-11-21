#!/usr/bin/env python3
"""Compile a *bounded*, provenance-rich weekly role sheet. No bulk depth chart scraping.

The weekday pipeline always reissues an inference snapshot from 2026 roster and
observed event summaries; curated starting evidence expires after its verified week.
"""
from __future__ import annotations
import argparse, datetime as dt, json, re
from pathlib import Path

ROLES={'QB':('QB', 'passingYards'),'RB':('RB','rushingYards'),'WR1':('WR','receivingYards'),'WR2':('WR','receivingYards'),'TE':('TE','receivingYards'),'K':('K','fieldGoalsMade')}
SOURCED_BASIS={'depth-chart-listed','reported-replacement','depth-chart-projected'}
def usage_score(p):
    """Shrink event-game means by sample size, not validated starter projections."""
    n=max(0,int(p.get('n',0)))
    return max(0,float(p.get('mean',0)))*n/(n+3)



def key(name: str) -> str:
    return re.sub(r'\s+',' ',name.lower().replace('’',"'")).strip()


def build(roster, summaries, curated, today):
    if roster.get('season')!=2026 or not isinstance(roster.get('schools'),dict): raise ValueError('Requires 2026 roster snapshot')
    begin=today-dt.timedelta(days=today.weekday());end=begin+dt.timedelta(days=6)
    begin_s,end_s=begin.isoformat(),end.isoformat(); cur={};stale={}
    for e in curated.get('entries',[]):
        if e.get('role') not in ROLES:continue
        if e.get('basis') not in SOURCED_BASIS and e.get('basis')!='usage-projected':raise ValueError('Unsupported weekly evidence basis')
        if not e.get('sourceUrl','').startswith('https://'):raise ValueError('Bad evidence link')
        if e.get('observedOn','')>=begin_s and e.get('observedOn','')<=today.isoformat():
            cur[(e['team'],e['role'])]=e
        elif e.get('basis')=='reported-replacement' and e.get('observedOn','')<begin_s and (today-dt.date.fromisoformat(e['observedOn'])).days<=21:
            # Carry forward the last documented replacement as a *candidate*,
            # never as current-week verified starter. This prevents blindly
            # restoring an earlier, injured season-volume QB.
            stale[(e['team'],e['role'])]=e
    blocked={}
    for e in curated.get('unavailable',[]):
        if e.get('observedOn','')>=begin_s and e.get('observedOn','')<=today.isoformat():blocked.setdefault(e['team'],[]).append(e)
    teams={}
    for team,people in roster['schools'].items():
        if len(people)<1:continue
        names={key(x['name']):x for x in people};events=summaries.get(team,{}).get('players',[])
        valid=[p for p in events if key(p.get('name','')) in names]
        bad={key(e['name']) for e in blocked.get(team,[]) if e['status'] in ('out','doubtful')}
        roles={};already=set()
        for role,(position,stat) in ROLES.items():
            e=cur.get((team,role)) or stale.get((team,role))
            if e:
                nm=key(e['name']);roster_row=names.get(nm)
                if roster_row is None or nm in already or roster_row['position'] not in ({'K','PK'} if position=='K' else ({'RB','HB','FB'} if position=='RB' else {position})) or nm in bad:
                    raise ValueError(f'Weekly source role failed roster/availability join: {team}/{role}/{e["name"]}')
                roles[role]={k:e[k] for k in ['name','basis','observedOn','sourceUrl','note']}
                if (team,role) in stale:
                    roles[role]['basis']='last-reported-replacement'
                    roles[role]['note']='Last documented 2026 role; NOT verified for the current week. Review a fresh depth chart before relying on this athlete.'
                already.add(nm);continue
            candidates=[p for p in valid if p.get('stat')==stat and key(p['name']) not in already and key(p['name']) not in bad and names[key(p['name'])]['position'] in ({'K','PK'} if position=='K' else ({'RB','HB','FB'} if position=='RB' else {position}))]
            candidates.sort(key=lambda p:(-usage_score(p),-p.get('n',0),p['name']))
            if candidates:
                p=candidates[0];roles[role]={"name":names[key(p['name'])]['name'],"basis":"usage-projected","observedOn":summaries[team].get('lastRecordedGame',today.isoformat()),"sourceUrl":summaries[team].get('sourceUrl','https://github.com/sportsdataverse/cfbfastR-data'),"note":"Inferred position from season-to-date recorded stat events; NOT a verified starter or participation forecast."};already.add(key(p['name']))
            else:
                r=next((x for x in people if x['position'] in ({'K','PK'} if position=='K' else ({'RB','HB','FB'} if position=='RB' else {position})) and key(x['name']) not in already and key(x['name']) not in bad),None)
                if r:
                    roles[role]={"name":r['name'],"basis":"roster-only","observedOn":today.isoformat(),"sourceUrl":roster['sourceUrl'],"note":"Roster-listed positional fallback. No source verifies starter, health or playing time."};already.add(key(r['name']))
        if roles:teams[team]={"roles":roles,"unavailable":[{k:v for k,v in e.items() if k in ('name','status','observedOn','sourceUrl')} for e in blocked.get(team,[])]}
    return {"schemaVersion":1,"season":2026,"weekStart":begin_s,"weekEnd":end_s,"generatedOn":today.isoformat(),"schools":len(teams),"teams":teams,"classification":"verified-roles-limited-plus-season-usage-projections"}


def main():
    p=argparse.ArgumentParser();p.add_argument('--roster',required=True);p.add_argument('--players',required=True);p.add_argument('--curated',required=True);p.add_argument('--out',required=True);p.add_argument('--date',default=dt.date.today().isoformat());args=p.parse_args()
    roster=json.loads(Path(args.roster).read_text());curated=json.loads(Path(args.curated).read_text());today=dt.date.fromisoformat(args.date)
    summaries={}
    for t in roster['schools']:
        path=Path(args.players)/f'{t}.json'
        if path.is_file():summaries[t]=json.loads(path.read_text())
    out=build(roster,summaries,curated,today)
    if out['schools']!=len(roster['schools']): raise ValueError('Weekly role coverage unexpectedly incomplete')
    file=Path(args.out);file.parent.mkdir(parents=True,exist_ok=True);file.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
    print(f"Weekly roles {out['weekStart']}—{out['weekEnd']}: {out['schools']} schools, {sum(len(x['roles']) for x in out['teams'].values())} roles, {sum(e['basis'] in ('depth-chart-listed','reported-replacement') for x in out['teams'].values() for e in x['roles'].values())} curated starters; missing verified roles remain marked projected")

if __name__=='__main__':main()
