#!/usr/bin/env python3
"""Bounded, streaming CFBD-derived play-level -> observed player/game ledger.

Inputs are upstream cfbfastR-data player_stats/csv/player_stats_YEAR.csv (per play),
completed school schedules and season-specific roster snapshots.

Outputs one small JSON per supported FBS school. An `appearance` here means a game
with a *recorded stat event*, NOT an official games-played/starting designation.
These are observed retrospective facts, not a forecast or a betting probability.
"""
import argparse
import csv
import hashlib
import json
import math
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from import_season_schedules import team_id
from player_event_model import (train_priors, validate_priors,
    next_event_probability, chronological_evaluation)

SOURCE='https://github.com/sportsdataverse/cfbfastR-data'
MAX_BYTES=145_000_000
FIELDS=('game_id','season','team','play_id','reception_player','completion_player','rush_player')
EVENTS={
    'receptions':('reception_player','reception_player_id',None,1),
    'receivingYards':('reception_player','reception_player_id','reception_yds',0),
    'completions':('completion_player','completion_player_id',None,1),
    'passingYards':('completion_player','completion_player_id','completion_yds',0),
    'rushAttempts':('rush_player','rush_player_id',None,1),
    'rushingYards':('rush_player','rush_player_id','rush_yds',0),
    'targets':('target_player','target_player_id',None,1),
    'touchdowns':('touchdown_player','touchdown_player_id',None,1),
    'interceptionsThrown':('interception_thrown_player','interception_thrown_player_id',None,1),
    'fieldGoalsMade':('field_goal_made_player','field_goal_made_player_id',None,1),
    'fieldGoalsAttempted':('field_goal_attempt_player','field_goal_attempt_player_id',None,1),
    'sacksTaken':('sack_taken_player','sack_taken_player_id',None,1)
}
COUNTS={'receptions','completions','rushAttempts','targets','touchdowns','interceptionsThrown','fieldGoalsMade','fieldGoalsAttempted','sacksTaken'}
NULL={'','NA','NULL','None','nan','NaN'}

def good_name(s):
    name=' '.join(str(s or '').split())
    return name if 3<=len(name)<=95 and not any(c in name for c in '<>\x00\r\n') and not name.startswith(('=','@','+','-')) else None

def norm(s):
    return re.sub(r'[^a-z0-9]','',str(s or '').casefold())

def parsed_value(s,default):
    if default==1:return 1
    if s in NULL:return 0
    try:
        x=float(s)
    except (ValueError,TypeError):raise ValueError('Invalid player yardage')
    if not math.isfinite(x) or not -120<=x<=120 or x!=int(x):raise ValueError('Implausible player yardage')
    return int(x)

def load_reference(schedule, roster, season, cutoff):
    o=json.loads(Path(schedule).read_text(encoding='utf-8'))
    p=json.loads(Path(roster).read_text(encoding='utf-8'))
    if o.get('season')!=season or p.get('season')!=season or p.get('schemaVersion')!=1:
        raise ValueError('Mismatched roster/schedule season')
    teams={x['id']:x['school'] for x in o.get('teams',[])}
    if len(teams)<120:raise ValueError('Insufficient teams')
    # Roster-only names are NOT used to assign a game event to an athlete.
    roster_names={id:{norm(x['name']):x['position'] for x in players if x.get('name')}
                  for id,players in p.get('schools',{}).items() if id in teams}
    return teams,roster_names

def read_completed(schedule_csv,season,cutoff,team_ids):
    games={}
    with Path(schedule_csv).open(encoding='utf-8-sig',newline='') as fh:
        rd=csv.DictReader(fh)
        needed={'game_id','season','home_team','away_team','completed','start_date','home_points','away_points'}
        if not needed.issubset(rd.fieldnames or []):raise ValueError('Missing schedule game columns')
        for row in rd:
            if row['season']!=str(season) or row['completed'].upper()!='TRUE' or row['start_date'][:10]>cutoff:continue
            if row['home_points'] in NULL or row['away_points'] in NULL:continue
            home=team_id(row['home_team']);away=team_id(row['away_team']);ids=[t for t in (home,away) if t in team_ids]
            if not ids:continue
            game_id=row['game_id']
            if game_id in games:raise ValueError('Duplicate completed schedule game')
            games[game_id]={'date':row['start_date'][:10],'teams':ids}
    if len(games)<400:raise ValueError('Insufficient completed game coverage')
    return games

def build(season, input_csv, schedule_csv, teams_json, roster_json, cutoff, out_dir,
          priors_in=None, priors_out=None, evaluation_out=None):
    if priors_in and season != 2026:
        raise ValueError('2025 prior training must precede 2026 evaluation')
    if priors_out and season != 2025:
        raise ValueError('Only the 2025 training set can produce model priors')
    if evaluation_out and (season != 2026 or not priors_in):
        raise ValueError('2026 conditional event evaluation requires 2025 priors')
    prior_doc = (validate_priors(json.loads(Path(priors_in).read_text(encoding='utf-8')))
                 if priors_in else None)
    path=Path(input_csv)
    if not path.is_file() or not (1<=path.stat().st_size<=MAX_BYTES):raise ValueError('Missing/oversized player file')
    teams,roster_names=load_reference(teams_json,roster_json,season,cutoff)
    games=read_completed(schedule_csv,season,cutoff,set(teams))
    grouped=defaultdict(lambda:{'name':'','team':'','athleteId':None,'rosterListed':False,'position':'','games':{}})
    seen=set();rows_read=0;events_count=0;game_ids=set();school_event_dates=defaultdict(set);invalid_teams=0
    with path.open(encoding='utf-8-sig',newline='') as f:
        r=csv.DictReader(f)
        if not set(FIELDS).issubset(r.fieldnames or []):raise ValueError('Unsupported play-level player stat schema')
        for row in r:
            rows_read+=1
            if rows_read>1_200_000:raise ValueError('Player row cap exceeded')
            if row.get('season')!=str(season):continue
            game_id=row.get('game_id','').strip()
            game=games.get(game_id)
            if not game:continue
            tid=team_id(row.get('team',''))
            if tid not in game['teams']:
                invalid_teams+=1;continue
            play_id=row.get('play_id','').strip()
            if not play_id or len(play_id)>120:continue
            for stat,(name_field,id_field,yard_field,default) in EVENTS.items():
                nm=good_name(row.get(name_field))
                if not nm:continue
                raw_id=(row.get(id_field) or '').strip()
                athlete_id=raw_id if raw_id not in NULL and len(raw_id)<40 and re.fullmatch(r'[A-Za-z0-9-]+',raw_id) else None
                # Same play may span several split source rows. Count event once.
                k=(game_id,play_id,stat,athlete_id or norm(nm))
                if k in seen:continue
                seen.add(k)
                val=parsed_value(row.get(yard_field) if yard_field else None,default)
                # Zero yards still constitutes a recorded reception/rush/completion.
                if yard_field is not None and val==0:continue
                person_key=(tid,athlete_id or 'name:'+norm(nm))
                person=grouped[person_key]
                if not person['name']:
                    person['name']=nm;person['team']=tid;person['athleteId']=athlete_id
                    person['position']=roster_names.get(tid,{}).get(norm(nm),'')
                    person['rosterListed']=bool(person['position'])
                line=person['games'].setdefault(game_id,{'gameId':game_id,'date':game['date']})
                line[stat]=line.get(stat,0)+val
                events_count+=1;game_ids.add(game_id);school_event_dates[tid].add(game['date'])
    if invalid_teams>max(200,rows_read//10):raise ValueError('Excessive player-team/schedule mismatches')
    if rows_read<50 or events_count<20:raise ValueError('Insufficient source-backed player events')
    target=Path(out_dir);target.mkdir(parents=True,exist_ok=True)
    # All per-game records are discarded after aggregation. Do not publish or
    # commit them: CFBD Terms restrict bulk raw-data redistribution.
    docs=defaultdict(list)
    thresholds={
       'QB':('passingYards',250.5,'Pass yards'),
       'RB':('rushingYards',75.5,'Rush yards'),
       'HB':('rushingYards',75.5,'Rush yards'),
       'WR':('receivingYards',60.5,'Receiving yards'),
       'TE':('receivingYards',30.5,'Receiving yards'),
       'K':('fieldGoalsMade',1.5,'Field goals made')
    }
    training_samples=[]
    for person in grouped.values():
        games_list=sorted(person.pop('games').values(),key=lambda x:(x['date'],x['gameId']))
        if len(games_list)<3:continue
        position=str(person.get('position') or '').upper().strip()
        candidate=thresholds.get(position)
        if not candidate:
            for stat,threshold,label in (thresholds['QB'],thresholds['WR'],thresholds['RB']):
                if sum(stat in g for g in games_list)>=3:
                    candidate=(stat,threshold,label);break
        if not candidate:continue
        stat,threshold,label=candidate
        # Zero-yard rushes, catches and completions contribute a zero in the
        # companion yardage metric rather than disappearing from the sample.
        counterpart={'passingYards':'completions','rushingYards':'rushAttempts',
                     'receivingYards':'receptions', 'fieldGoalsMade':'fieldGoalsAttempted'}.get(stat)
        values=[g.get(stat,0) for g in games_list if stat in g or (counterpart and counterpart in g)]
        if len(values)<3:continue
        training_samples.append({'position':position, 'stat':stat,
                                 'line':threshold, 'values':values[:]})
        values.sort();n=len(values)
        hit=sum(v>threshold for v in values)
        def quantile(q):return values[min(n-1,int(round((n-1)*q)))]
        row={'name':person['name'],'position':person.get('position') or '—',
          'stat':stat,'label':label,'line':threshold,'eventGames':len(games_list),'n':n,'hit':hit,
          'mean':round(sum(values)/n,2),'median':quantile(.5),'p10':quantile(.1),'p90':quantile(.9)}
        if prior_doc:
            event_hits=[int(value>threshold) for value in training_samples[-1]['values']]
            projection=next_event_probability(prior_doc,position,stat,event_hits)
            if projection:
                row['eventModel']={
                    'probability':round(projection['probability'],5),
                    'approxInterval90':[round(v,5) for v in projection['approxInterval90']],
                    'eventGamesUsed':projection['eventGamesUsed'],
                    'cohortTrainingEvents':projection['priorCohortEvents'],
                    'classification':projection['classification']}
        docs[person['team']].append(row)
    if priors_out:
        trained=train_priors(training_samples, season=2025)
        out=Path(priors_out);out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(json.dumps(trained,sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
    if evaluation_out:
        evaluated=chronological_evaluation(training_samples,prior_doc,season=2026)
        evaluated['sourceCutoff']=cutoff
        out=Path(evaluation_out);out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(json.dumps(evaluated,sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
    counts={};tally=0
    for tid,school in sorted(teams.items()):
        players=docs.get(tid,[])
        players.sort(key=lambda x:(-x['n'],-x['mean'],x['name']))
        players=players[:12] # limited, derived visual display; not a raw database mirror
        # The game-date summary uses observed matched sources, not the import date.
        last=max(school_event_dates.get(tid,set()),default=cutoff)
        doc={'schemaVersion':2,'season':season,'team':tid,'school':school,
          'classification':'derived-player-aggregate-not-projection',
          'sourceUrl':SOURCE+f'/blob/main/player_stats/csv/player_stats_{season}.csv',
          'sourceCutoff':cutoff,'lastRecordedGame':last,
          'updatedAt':datetime.now(timezone.utc).isoformat(timespec='seconds'),
          'playerCount':len(players),'players':players,
          'limitations':'Only 12 aggregate examples per school; statistic-recorded games are not all appearances; observations are not future forecasts; no raw game logs are distributed.'}
        (target/f'{tid}.json').write_text(json.dumps(doc,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        counts[tid]=len(players);tally+=len(players)
    manifest={'schemaVersion':2,'season':season,'sourceUrl':SOURCE+f'/blob/main/player_stats/csv/player_stats_{season}.csv',
      'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceCutoff':cutoff,'sourceRowsRead':rows_read,
      'matchedGameCount':len(game_ids),'completedGames':len(games),'derivedAthleteSummaries':tally,
      'athletesWithRecordedEvents':len(grouped),'schoolFiles':len(counts),
      'eventsAttributed':events_count,'schools':counts,
      'classification':'12-per-school limited derived player summaries. NO raw play/game logs published.'}
    (target/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    if len(counts)<120:raise ValueError('Not enough schools')
    return manifest


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--season',type=int,required=True,choices=[2025,2026])
    for opt in ['csv','schedule-csv','teams-json','rosters-json','out-dir']:
        p.add_argument('--'+opt,required=True)
    p.add_argument('--cutoff',default=datetime.now(timezone.utc).date().isoformat())
    p.add_argument('--priors-in',default=None)
    p.add_argument('--priors-out',default=None)
    p.add_argument('--evaluation-out',default=None)
    a=p.parse_args()
    r=build(a.season,a.csv,a.schedule_csv,a.teams_json,a.rosters_json,a.cutoff,a.out_dir,
            priors_in=a.priors_in,priors_out=a.priors_out,evaluation_out=a.evaluation_out)
    print(json.dumps({k:r[k] for k in ('season','sourceRowsRead','matchedGameCount','derivedAthleteSummaries','schoolFiles','eventsAttributed')}))
if __name__=='__main__':main()
