#!/usr/bin/env python3
"""Multi-year, pregame-only college football benchmark; intentionally not a prop model.

2023 rating warm-up -> 2024 probability fit -> 2025 candidate selection ->
2026 forward check. 2026 is *not* an untouched test: earlier iterations of this
project inspected 2026 outcomes. No model selection happens on 2026.
"""
import argparse
import json
import math
import random
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from evaluate_rolling_model import parse_games,new_team,scoring_rate,sigmoid,elo_logit,HOME_POINTS,PRIOR_RATING,YEAR_RETENTION,K,LOG10

SOURCE='https://github.com/sportsdataverse/cfbfastR-data'


def season_forward(games,teams,season):
    out=[]
    for game in sorted(games,key=lambda g:(g['date'],g['gameId'])):
        home,away=teams[game['home']],teams[game['away']]
        z=elo_logit(home,away,game['neutral'])
        host=0 if game['neutral'] else HOME_POINTS
        expected_home=max(3,(scoring_rate(home)+scoring_rate(away,False))/2+host/2)
        expected_away=max(3,(scoring_rate(away)+scoring_rate(home,False))/2-host/2)
        margin=(expected_home-expected_away)
        label=int(game['h']>game['a'])
        out.append({'year':season,'gameId':game['gameId'],'week':game['week'],'date':game['date'],
            'z':z,'m':margin,'home':0 if game['neutral'] else 1,'y':label,
            'predMargin':margin,'predTotal':expected_home+expected_away,
            'actualMargin':game['h']-game['a'],'actualTotal':game['h']+game['a']})
        delta=K*(label-sigmoid(z));home['rating']+=delta;away['rating']-=delta
        for team,points,against in ((home,game['h'],game['a']),(away,game['a'],game['h'])):
            team['played']+=1;team['pf']+=points;team['pa']+=against
    return out


def fit_scalar(rows,feature,prior=1,lam=8):
    weight=prior
    for _ in range(50):
        grad=lam*(weight-prior);h=lam
        for r in rows:
            x=r[feature];p=sigmoid(weight*x)
            grad+=(p-r['y'])*x;h+=p*(1-p)*x*x
        nxt=max(0.001,min(4,weight-grad/h))
        if abs(weight-nxt)<1e-10:break
        weight=nxt
    return weight


def fit_home(rows):
    nonneutral=[r for r in rows if r['home']]
    w=sum(r['y'] for r in nonneutral);n=len(nonneutral)
    return (w+8)/(n+16) if n else .5


def fit_logistic_pair(rows,lam=18):
    # Two-variable penalized logistic fit, no intercept: neutral A/B inversion is symmetric.
    b=[1.,.015]
    for _ in range(40):
        g=[lam*(b[0]-1),lam*(b[1]-.015)]
        h=[[lam,0.],[0.,lam]]
        for r in rows:
            x=[r['z'],r['m']];p=sigmoid(sum(x[i]*b[i] for i in range(2)))
            e=p-r['y'];v=p*(1-p)
            for i in range(2):
                g[i]+=x[i]*e
                for j in range(2):h[i][j]+=x[i]*x[j]*v
        det=h[0][0]*h[1][1]-h[0][1]*h[1][0]
        if det<=1e-10:raise ValueError('Singular logistic fit')
        step=[(h[1][1]*g[0]-h[0][1]*g[1])/det,(h[0][0]*g[1]-h[1][0]*g[0])/det]
        new=[b[i]-step[i] for i in range(2)]
        if sum(abs(new[i]-b[i]) for i in range(2))<1e-9:break
        b=new
    return [round(x,9) for x in b]


def predict(r,params):
    p1=sigmoid(params['eloScale']*r['z']);p2=sigmoid(params['marginScale']*r['m'])
    return {'coin':.5,'homeOnly':params['homeRate'] if r['home'] else .5,
        'elo':p1,'margin':p2,'fixedBlend':.5*p1+.5*p2,
        'logisticPair':sigmoid(params['pair'][0]*r['z']+params['pair'][1]*r['m'])}


def report(rows,model,params,quantiles=None,flat_total=54):
    n=len(rows)
    if not n:raise ValueError('No evaluated games')
    errors=[];margin_errors=[];total_errors=[];brier=0;logloss=0
    for r in rows:
        p=predict(r,params)[model];y=r['y'];p=max(1e-8,min(1-1e-8,p))
        errors.append((p-y)**2);brier+=(p-y)**2
        logloss-=y*math.log(p)+(1-y)*math.log(1-p)
        margin_errors.append(r['predMargin']-r['actualMargin'])
        total_errors.append(r['predTotal']-r['actualTotal'])
    def rmse(arr):return math.sqrt(sum(x*x for x in arr)/len(arr))
    out={'n':n,'brier':round(brier/n,6),'logLoss':round(logloss/n,6),
      'marginMAE':round(sum(map(abs,margin_errors))/n,4),'marginRMSE':round(rmse(margin_errors),4),
      'totalMAE':round(sum(map(abs,total_errors))/n,4),'totalRMSE':round(rmse(total_errors),4),
      'flatTotalMAE':round(sum(abs(flat_total-r['actualTotal']) for r in rows)/n,4)}
    if quantiles:
        for coverage,limit in quantiles.items():
            out['marginInterval'+coverage+'Coverage']=round(sum(abs(e)<=limit for e in margin_errors)/n,4)
    return out


def calibration_bins(rows,model,params):
    # Fixed-width reliability bins on outcomes that were never used to tune
    # the selected model. Wilson intervals describe binomial uncertainty only.
    groups=[[] for _ in range(10)]
    for r in rows:
        pr=predict(r,params)[model]
        groups[min(9,int(pr*10))].append((pr,r['y']))
    output=[]
    for i,g in enumerate(groups):
        n=len(g)
        if not n:continue
        successes=sum(outcome for _,outcome in g)
        phat=successes/n
        z=1.95996398454005
        denom=1+z*z/n
        center=(phat+z*z/(2*n))/denom
        half=z*math.sqrt((phat*(1-phat)+z*z/(4*n))/n)/denom
        output.append({'bin':i,'n':n,'meanPrediction':round(sum(x for x,_ in g)/n,6),
          'observedFrequency':round(phat,6),
          'wilson95':[round(max(0,center-half),6),round(min(1,center+half),6)]})
    return output


def paired_week_bootstrap(rows,model,baseline,params,reps=1200):
    # Weeks are sampled as blocks to respect within-week dependence. Teams
    # appear across weeks, so these are descriptive intervals, NOT an IID CI
    # nor a formal significance test.
    week_groups={}
    for r in rows:
        week_groups.setdefault(str(r['week']),[]).append(r)
    weeks=sorted(week_groups)
    rng=random.Random(64261)
    gaps=[]
    for _ in range(reps):
        drawn=[row for __ in weeks for row in week_groups[rng.choice(weeks)]]
        gap=sum((predict(r,params)[baseline]-r['y'])**2-(predict(r,params)[model]-r['y'])**2 for r in drawn)/len(drawn)
        gaps.append(gap)
    gaps.sort()
    return {'comparison':baseline,'selected':model,
      'brierImprovement':round(report(rows,baseline,params)['brier']-report(rows,model,params)['brier'],6),
      'weeklyBlockPercentile95':[round(gaps[int(.025*(reps-1))],6),round(gaps[int(.975*(reps-1))],6)],
      'replicates':reps,'qualification':'Exploratory week-block bootstrap; same teams recur across weeks; no significance claim'}


def select_model(train,validate,params):
    scores={model:report(validate,model,params)['brier'] for model in predict(validate[0],params)}
    # Primary metric Brier; fixed tie-break to simpler model.
    priority=['homeOnly','elo','margin','fixedBlend','logisticPair','coin']
    selected=min(priority,key=lambda m:(scores[m],priority.index(m)))
    return selected,scores


def evaluate(data,cutoff):
    if set(data)!={2023,2024,2025,2026} or any(not data[y] for y in data):raise ValueError('All 2023–26 seasons needed')
    for year in (2023,2024,2025):
        if max(g['date'] for g in data[year])>=min(g['date'] for g in data[year+1]):
            raise ValueError('Non-chronological season split')
    teams=defaultdict(new_team);pred={}
    for year in (2023,2024,2025,2026):
        if year>2023:
            for t in teams.values():
                t['rating']=PRIOR_RATING+(t['rating']-PRIOR_RATING)*YEAR_RETENTION
                t.update(pf=0,pa=0,played=0)
        pred[year]=season_forward(data[year],teams,year)
    fit=pred[2024]
    params={'eloScale':round(fit_scalar(fit,'z'),8),
            'marginScale':round(fit_scalar(fit,'m',prior=.08,lam=300),8),
            'pair':fit_logistic_pair(fit),
            'homeRate':round(fit_home(fit),8)}
    selected,scores=select_model(fit,pred[2025],params)
    margin_abs=sorted(abs(r['predMargin']-r['actualMargin']) for r in fit)
    q80=margin_abs[min(len(margin_abs)-1,math.ceil(.8*len(margin_abs))-1)]
    q90=margin_abs[min(len(margin_abs)-1,math.ceil(.9*len(margin_abs))-1)]
    flat_total=sum(r['actualTotal'] for r in fit)/len(fit)
    metrics={str(y):{m:report(pred[y],m,params,{'80':q80,'90':q90},flat_total) for m in ['coin','homeOnly','elo','margin','fixedBlend','logisticPair']} for y in (2024,2025,2026)}
    return {'schemaVersion':1,'modelVersion':'multiyear-temporal-0.7.0','asOf':cutoff,
     'classification':'2023-warmup-2024-fit-2025-select-2026-previously-inspected-forward-check',
     'sourceUrl':SOURCE,'modelSelectedOn2025':selected,'modelCoefficientsFitted2024':params,
     'gamesBySeason':{str(k):len(v) for k,v in pred.items()},
     'evaluation':metrics,'validationBrierModelSelection':scores,
     'reliability2026':calibration_bins(pred[2026],selected,params),
     'weeklyBootstrap2026':paired_week_bootstrap(pred[2026],selected,'homeOnly',params),
     'marginAbsoluteResidualQuantilesFitted2024':{'80':round(q80,3),'90':round(q90,3)},
     'fixedTotalMean2024':round(flat_total,3),
     'importantLimitations':'2026 is previously inspected, not a pristine untouched test; no injury or player features, no player prop probabilities or sportsbook comparisons; fit data 2024, model selection 2025.'}


def main():
    p=argparse.ArgumentParser()
    for y in (2023,2024,2025,2026):p.add_argument('--schedule-'+str(y),required=True)
    p.add_argument('--cutoff',default=datetime.now(timezone.utc).date().isoformat())
    p.add_argument('--out',required=True)
    a=p.parse_args();data={y:parse_games(getattr(a,'schedule_'+str(y)),y,a.cutoff) for y in (2023,2024,2025,2026)}
    out=evaluate(data,a.cutoff)
    if min(out['gamesBySeason'].values())<300:raise ValueError('Insufficient complete-season/partial-season games')
    file=Path(a.out);file.parent.mkdir(exist_ok=True,parents=True)
    file.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n')
    print(json.dumps({'games':out['gamesBySeason'],'selectedOn2025':out['modelSelectedOn2025'],
       'brier2025':out['evaluation']['2025'][out['modelSelectedOn2025']]['brier'],
       'brier2026Forward':out['evaluation']['2026'][out['modelSelectedOn2025']]['brier']}))
if __name__=='__main__':main()
