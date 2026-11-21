#!/usr/bin/env python3
"""Time-ordered 2025→2026 FBS-only football baseline, without paid APIs.

Purpose: transparent *experimental* research baseline; never claim calibrated
player props or replace the drive-based simulator with its outputs.

Default: optimize one global logistic scale on 2025 pregame Elo readings, then
score 2026 chronologically in a sealed holdout. Coefficients fixed before 2026
is examined. The 2026 data is used to update ratings *after* each game only.
"""
import argparse
import csv
import json
import math
import random
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from import_season_schedules import team_id, parse_score

PRIOR_RATING = 1500.0
PRIOR_POINTS = 27.0
PRIOR_GAMES = 4.0
K = 24.0
HOME_ELO = 55.0
HOME_POINTS = 2.4
YEAR_RETENTION = .65
LOG10 = math.log(10.0)
SOURCE = 'https://github.com/sportsdataverse/cfbfastR-data'


def sigmoid(x):
    if x >= 0:
        z=math.exp(-min(700,x))
        return 1.0/(1+z)
    z=math.exp(max(-700,x))
    return z/(1+z)


def parse_games(path,year,cutoff):
    file=Path(path)
    if not file.is_file() or file.stat().st_size>2_000_000:
        raise ValueError('Missing or oversized game schedule')
    games=[];ids=set()
    with file.open(encoding='utf-8-sig',newline='') as f:
        r=csv.DictReader(f)
        required={'game_id','season','start_date','home_team','away_team','home_division','away_division','home_points','away_points','neutral_site','completed'}
        if not required.issubset(r.fieldnames or []):raise ValueError('Unexpected schedule columns')
        for row in r:
            if row['season']!=str(year) or row['home_division'].lower()!='fbs' or row['away_division'].lower()!='fbs':continue
            game_id=row['game_id'].strip()
            if not game_id or game_id in ids:raise ValueError('Duplicate/blank FBS game ID')
            ids.add(game_id)
            date=row['start_date'].strip()
            if not date or date[:10]>cutoff or row['completed'].upper()!='TRUE':continue
            a,b=parse_score(row['home_points']),parse_score(row['away_points'])
            if a is None or b is None or a==b:continue
            hid,aid=team_id(row['home_team']),team_id(row['away_team'])
            if hid==aid:raise ValueError('Identity collision')
            games.append({'gameId':game_id,'date':date,'week':row.get('week') or 'unknown','home':hid,'away':aid,
                          'h':a,'a':b,'neutral':row['neutral_site'].upper()=='TRUE'})
    return sorted(games,key=lambda x:(x['date'],x['gameId']))


def new_team():return {'rating':PRIOR_RATING,'pf':0,'pa':0,'played':0}


def scoring_rate(t,for_points=True):
    return (PRIOR_GAMES*PRIOR_POINTS+t['pf' if for_points else 'pa'])/(PRIOR_GAMES+t['played'])


def elo_logit(home,away,neutral):
    return ((home['rating']-away['rating'])+(0 if neutral else HOME_ELO))*LOG10/400


def predict_points(home,away,neutral):
    advantage=0 if neutral else HOME_POINTS
    h=(scoring_rate(home)+scoring_rate(away,False))/2+advantage/2
    a=(scoring_rate(away)+scoring_rate(home,False))/2-advantage/2
    return max(3.0,h),max(3.0,a)


def chronological_games(games,teams):
    predictions=[]
    for game in games:
        h=teams[game['home']];a=teams[game['away']]
        z=elo_logit(h,a,game['neutral']);p=sigmoid(z)
        hs,as_=predict_points(h,a,game['neutral'])
        label=int(game['h']>game['a'])
        predictions.append({'gameId':game['gameId'],'date':game['date'],'week':game['week'],'season':game['season'],
             'z':z,'pElo':p,'y':label,'expectedHome':hs,'expectedAway':as_,
             'margin':game['h']-game['a'],'total':game['h']+game['a']})
        delta=K*(label-p)
        h['rating']+=delta;a['rating']-=delta
        for s,own,other in [(h,game['h'],game['a']),(a,game['a'],game['h'])]:
            s['played']+=1;s['pf']+=own;s['pa']+=other
    return predictions


def optimize_scale(rows):
    # 2025-only regularized logistic slope, no intercept: swapping sides gives complementary probabilities.
    s=1.0; lam=8.0
    for _ in range(80):
        gradient=lam*(s-1.0)
        hessian=lam
        for x in rows:
            p=sigmoid(s*x['z']);gradient+=(p-x['y'])*x['z'];hessian+=p*(1-p)*x['z']**2
        next_s=max(0.25,min(2.5,s-gradient/hessian))
        if abs(s-next_s)<1e-10:break
        s=next_s
    return s


def score(rows,key='pElo',baseline_total=None):
    n=len(rows)
    if not n:return {'n':0,'status':'unavailable'}
    probs=[r[key] for r in rows]
    brier=sum((p-r['y'])**2 for p,r in zip(probs,rows))/n
    loss=-sum(r['y']*math.log(max(1e-10,p))+(1-r['y'])*math.log(max(1e-10,1-p)) for p,r in zip(probs,rows))/n
    mae=lambda v:sum(abs(x) for x in v)/n
    rmse=lambda v:math.sqrt(sum(x*x for x in v)/n)
    margins=[(r['expectedHome']-r['expectedAway'])-r['margin'] for r in rows]
    totals=[(r['expectedHome']+r['expectedAway'])-r['total'] for r in rows]
    bins=[]
    for j in range(10):
        group=[r for r in rows if min(9,int(r[key]*10))==j]
        if not group:continue
        nn=len(group);wins=sum(x['y'] for x in group);pct=wins/nn
        z=1.96;d=1+z*z/nn
        mid=(pct+z*z/(2*nn))/d
        radius=z*math.sqrt(pct*(1-pct)/nn+z*z/(4*nn*nn))/d
        bins.append({'bin':j,'count':nn,'meanPredicted':round(sum(x[key] for x in group)/nn,5),
                    'observed':round(pct,5),'observedWilson95':[round(max(0,mid-radius),5),round(min(1,mid+radius),5)]})
    return {'n':n,'homeWinShare':round(sum(r['y'] for r in rows)/n,5),'brier':round(brier,6),
        'logLoss':round(loss,6),'marginMAE':round(mae(margins),4),'marginRMSE':round(rmse(margins),4),
        'totalMAE':round(mae(totals),4),'totalRMSE':round(rmse(totals),4),'calibrationBins':bins}


def paired_week_bootstrap(rows,iterations=1500,seed=20261121):
    # Cluster by week because same-week game outcomes may be dependent.
    weeks=defaultdict(list)
    for r in rows:weeks[r['week']].append((r['pCal']-r['y'])**2-(.5-r['y'])**2)
    if len(weeks)<3:return {'status':'unavailable'}
    rng=random.Random(seed);values=list(weeks.values());deltas=[]
    for _ in range(iterations):
        sample=[rng.choice(values) for _ in values];flat=[v for w in sample for v in w]
        deltas.append(sum(flat)/len(flat))
    deltas.sort()
    return {'unit':'2026-season weeks','groups':len(weeks),'bootstraps':iterations,
            'calibratedMinusCoinBrier95':[round(deltas[int(iterations*.025)],6),round(deltas[int(iterations*.975)],6)],
            'caveat':'Weeks are few and outcomes are dependent; exploratory interval, not significance proof.'}


def evaluate(train,holdout,asof='2026-11-21'):
    if not train or not holdout:raise ValueError('Both seasons require observed games')
    assert all(x['date']<holdout[0]['date'] for x in train), 'Training must end before holdout begins'
    train=[{**g,'season':2025} for g in train];holdout=[{**g,'season':2026} for g in holdout]
    teams=defaultdict(new_team)
    trainpred=chronological_games(train,teams)
    scale=optimize_scale(trainpred)
    # Fixed before touching a single 2026 score.
    for t in teams.values():
        t['rating']=PRIOR_RATING+(t['rating']-PRIOR_RATING)*YEAR_RETENTION
        t['pf']=0;t['pa']=0;t['played']=0
    testpred=chronological_games(holdout,teams)
    for x in testpred:x['pCal']=sigmoid(scale*x['z'])
    train_actual_mean=sum(x['h']+x['a'] for x in train)/len(train)
    coinrows=[{**r,'pFlat':.5,'expectedHome':train_actual_mean/2,'expectedAway':train_actual_mean/2} for r in testpred]
    primary=score(testpred,'pCal');raw=score(testpred,'pElo');flat=score(coinrows,'pFlat')
    result={
      'schemaVersion':1,'modelVersion':'chronological-elo-slope-0.1.0','classification':'experimental-2025-trained-2026-held-out',
      'retrievedAt':datetime.now(timezone.utc).isoformat(timespec='seconds'),
      'asOf':asof,'lastScoredGame':max(x['date'] for x in holdout),'dataSource':SOURCE,
      'training':{'season':2025,'games':len(trainpred),'lastGame':max(x['date'] for x in train),'calibratedSlope':round(scale,8),
                  'trainingBrier':round(sum((sigmoid(scale*r['z'])-r['y'])**2 for r in trainpred)/len(trainpred),6)},
      'holdout':{'season':2026,'evaluatedGames':len(testpred),'calibratedElo':primary,'rawElo':raw,'constantBaseline':flat,
                 'pairedWeekBootstrap':paired_week_bootstrap(testpred)},
      'fixedParameters':{'initialElo':PRIOR_RATING,'eloScale':400,'eloK':K,'homeElo':HOME_ELO,
                        'offseasonRetention':YEAR_RETENTION,'startingPointsPerTeam':PRIOR_POINTS,
                        'priorGames':PRIOR_GAMES,'homePointsMargin':HOME_POINTS,'2025ConstantTotal':round(train_actual_mean,4)},
      'teamState':{id:{'elo':round(t['rating'],4),'gamesCurrentSeason':t['played'],
                       'scoredToDate':t['pf'],'allowedToDate':t['pa']} for id,t in sorted(teams.items())},
      'limitations':'No player usage, injuries, recruiting, opponent-adjusted EPA, independent seasons beyond 2026; exploratory holdout, no sportsbook evaluation; game simulator independently synthetic.'
    }
    return result


def main():
    p=argparse.ArgumentParser();p.add_argument('--train-csv',required=True);p.add_argument('--holdout-csv',required=True)
    p.add_argument('--cutoff',default=None);p.add_argument('--out',required=True)
    args=p.parse_args()
    args.cutoff=args.cutoff or datetime.now(timezone.utc).date().isoformat()
    train=parse_games(args.train_csv,2025,args.cutoff)
    holdout=parse_games(args.holdout_csv,2026,args.cutoff)
    result=evaluate(train,holdout,args.cutoff)
    if result['training']['games']<400 or result['holdout']['evaluatedGames']<300:raise ValueError('Insufficient FBS–FBS game coverage for evaluation')
    dest=Path(args.out);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n',encoding='utf-8')
    brief={'training':result['training']['games'],'holdout':result['holdout']['evaluatedGames'],
           'brier2026':result['holdout']['calibratedElo']['brier'],
           'brierCoin':result['holdout']['constantBaseline']['brier'],
           'logLoss2026':result['holdout']['calibratedElo']['logLoss'],
           'status':'evaluated (not proven calibrated)'}
    print(json.dumps(brief))

if __name__=='__main__':main()
