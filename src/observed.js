/**
 * Historical reference cards, 2025 completed season only.
 * These are observed full-season statistics, not point-in-time forecast inputs.
 * Named players are linked to 2025 team snapshots; future-season membership is NOT inferred.
 * Each numerical entry below is a manually audited excerpt of the cited school's season data.
 * Scope deliberately limited until a licensed, machine-verifiable full data feed is integrated.
 */
export const OBSERVED_SEASON = 2025;
export const HISTORICAL = Object.freeze({
  'ole-miss': {
    school:'Ole Miss', games:15, record:'13–2', pointsFor:36.93, pointsAgainst:21.07,
    source:'https://olemisssports.com/sports/football/stats/2025',
    players:{
      QB:{name:'Trinidad Chambliss',position:'QB',stat:'passingYards',total:3937,games:15},
      RB:{name:'Kewan Lacy',position:'RB',stat:'rushYards',total:1567,games:15},
      WR1:{name:'Harrison Wallace III',position:'WR',stat:'receivingYards',total:934,games:15},
      WR2:{name:"De’Zhaun Stribling",position:'WR',stat:'receivingYards',total:811,games:15},
      TE:{name:'Dae’Quan Wright',position:'TE',stat:'receivingYards',total:635,games:15}
    }
  },
  'georgia': {
    school:'Georgia',games:14,record:'12–2',pointsFor:32.07,pointsAgainst:17.57,
    source:'https://georgiadogs.com/sports/football/stats/2025',
    players:{
      QB:{name:'Gunner Stockton',position:'QB',stat:'passingYards',total:2894,games:14},
      RB:{name:'Nate Frazier',position:'RB',stat:'rushYards',total:947,games:14},
      WR1:{name:'Zachariah Branch',position:'WR',stat:'receivingYards',total:811,games:14},
      WR2:{name:'Colbie Young',position:'WR',stat:'receivingYards',total:358,games:8}
    }
  },
  'alabama': {
    school:'Alabama',games:15,record:'11–4',pointsFor:29.53,pointsAgainst:19.20,
    source:'https://rolltide.com/sports/football/stats/2025',
    players:{
      QB:{name:'Ty Simpson',position:'QB',stat:'passingYards',total:3567,games:15},
      RB:{name:'Jamario Miller',position:'RB',stat:'rushYards',total:504,games:11},
      WR1:{name:'Germie Bernard',position:'WR',stat:'receivingYards',total:862,games:14},
      WR2:{name:'Ryan Williams',position:'WR',stat:'receivingYards',total:689,games:14}
    }
  },
  'indiana': {
    school:'Indiana',games:16,record:'16–0',pointsFor:41.62,pointsAgainst:11.69,
    source:'https://iuhoosiers.com/sports/football/stats/2025',
    players:{
      QB:{name:'Fernando Mendoza',position:'QB',stat:'passingYards',total:3535,games:16},
      RB:{name:'Roman Hemby',position:'RB',stat:'rushYards',total:1120,games:16},
      WR1:{name:'Elijah Sarratt',position:'WR',stat:'receivingYards',total:830,games:14},
      WR2:{name:'Omar Cooper Jr.',position:'WR',stat:'receivingYards',total:null,games:null}
    }
  }
});

export const VERIFIED_RESULTS = Object.freeze([
  {date:'2025-10-18',home:'georgia',away:'ole-miss',homePoints:43,awayPoints:35,source:'https://georgiadogs.com/sports/football/stats/2025'},
  {date:'2026-01-01',home:'georgia',away:'ole-miss',homePoints:34,awayPoints:39,site:'Neutral (Sugar Bowl)',source:'https://georgiadogs.com/sports/football/stats/2025'},
  {date:'2025-09-27',home:'georgia',away:'alabama',homePoints:21,awayPoints:24,source:'https://georgiadogs.com/sports/football/stats/2025'},
  {date:'2025-12-06',home:'georgia',away:'alabama',homePoints:28,awayPoints:7,site:'Neutral (SEC Championship)',source:'https://georgiadogs.com/sports/football/stats/2025'},
  {date:'2026-01-01',home:'indiana',away:'alabama',homePoints:38,awayPoints:3,site:'Neutral (Rose Bowl)',source:'https://rolltide.com/sports/football/stats/2025'}
]);

export const SOURCE_INDEX = [
 {name:'2025 Ole Miss official season statistics',url:HISTORICAL['ole-miss'].source},
 {name:'2025 Georgia official season statistics',url:HISTORICAL.georgia.source},
 {name:'2025 Alabama official season statistics',url:HISTORICAL.alabama.source},
 {name:'2025 Indiana official season statistics',url:HISTORICAL.indiana.source},
 {name:'NCAA 2025–26 roster collection (CC0; future ingestion candidate)',url:'https://github.com/Dharit13/NCAA_2025-26-Season-Dataset'},
 {name:'SportsDataverse cfbfastR (free historical loaders; validate source-specific rights)',url:'https://github.com/sportsdataverse/cfbfastR'},
 {name:'CollegeFootballData free-key API (optional server-side ingestion)',url:'https://collegefootballdata.com/'}
];
export function observed(id,season=2025){return Number(season)===OBSERVED_SEASON?HISTORICAL[id]||null:null;}
export function namedPlayer(id,role,season=2025){return observed(id,season)?.players?.[role]||null;}
export function headToHead(a,b){return VERIFIED_RESULTS.filter(x=>[x.home,x.away].includes(a)&&[x.home,x.away].includes(b));}
