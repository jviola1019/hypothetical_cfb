import {FBS_TEAMS} from './catalog.js';
import {getPlayerEvidence} from './playerEvidence.js';
import {installWeeklyLineup,lineupRole,lastReportedUnavailable,personKey,weeklySummary} from './weeklyLineup.js';
/**
 * Historical reference cards, 2025 completed season only.
 * These are observed full-season statistics, not point-in-time forecast inputs.
 * Named players are linked to 2025 team snapshots; future-season membership is NOT inferred.
 * Each numerical entry below is a manually audited excerpt of the cited school's season data.
 * Scope deliberately limited until a licensed, machine-verifiable full data feed is integrated.
 */
export const OBSERVED_SEASON = 2025;
const VALID_FBS_IDS = new Map(FBS_TEAMS.map(t=>[t.id,t.name]));
const seasonSnapshots = new Map();
const seasonRosters = new Map();
const seasonRosterOrigins = new Map();
export const sourceStatus = {seasons:{},rosters:{}};
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
 {name:'SportsDataverse 2026 FBS schedule/results (138 programs, last scored 2026-11-15)',url:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2026.csv'},
 {name:'SportsDataverse 2025 FBS schedule/results (136 programs)',url:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2025.csv'},
 {name:'SportsDataverse 2026 rosters (CFBD-derived public player identity data)',url:'https://github.com/sportsdataverse/cfbfastR-data/blob/main/rosters/csv/cfb_rosters_2026.csv'},
 {name:'Optional weekly school roster release, 2026-11-16',url:'https://github.com/fakhar-ud-din/ncaapyscraper/releases/latest'},
 {name:'CollegeFootballData free-key API (optional server-side ingestion)',url:'https://collegefootballdata.com/'}
];
/** Install only fully schema-checked, season-scoped public snapshot data. */
export function installSeasonSnapshot(payload) {
  if(!payload || ![2025,2026].includes(payload.season) || payload.schemaVersion!==1 ||
      !Array.isArray(payload.teams) || payload.teams.length<100 || payload.teams.length>170 ||
      typeof payload.sourceUrl!=='string' || !payload.sourceUrl.startsWith('https://')) throw Error('Invalid season snapshot');
  const out = {};
  for(const row of payload.teams){
    if(!row || !/^[a-z0-9-]{2,60}$/.test(row.id) || Object.hasOwn(out,row.id) ||
       !Number.isInteger(row.games) || row.games<1 || row.games>18 ||
       !Number.isInteger(row.wins) || !Number.isInteger(row.losses) || row.wins<0 || row.losses<0 || row.wins+row.losses!==row.games ||
       !VALID_FBS_IDS.has(row.id) || row.school!==VALID_FBS_IDS.get(row.id) ||
       !Number.isFinite(row.pointsFor) || row.pointsFor<0 || row.pointsFor>100 ||
       !Number.isFinite(row.pointsAgainst) || row.pointsAgainst<0 || row.pointsAgainst>100) throw Error('Invalid team record');
    out[row.id]={school:row.school||row.id, season:payload.season, games:row.games, wins:row.wins, losses:row.losses,
      record:`${row.wins}–${row.losses}`,pointsFor:row.pointsFor,pointsAgainst:row.pointsAgainst,
      conference:row.conference||'',source:payload.sourceUrl,asOf:payload.lastCompletedGame,
      coverage:'season-to-date-retrospective'};
  }
  seasonSnapshots.set(payload.season,Object.freeze(out));
  sourceStatus.seasons[payload.season]={schools:Object.keys(out).length,asOf:payload.lastCompletedGame,source:payload.sourceUrl};
  return Object.keys(out).length;
}
export function installRosterSnapshot(payload){
  if(!payload || payload.schemaVersion!==1 || ![2025,2026].includes(payload.season) ||
    !payload.schools || typeof payload.schools!=='object' || Array.isArray(payload.schools) ||
    typeof payload.sourceUrl!=='string' || !payload.sourceUrl.startsWith('https://'))throw Error('Invalid roster snapshot');
  let schools=0,players=0;const teams={},origins={};
  for(const [id,people] of Object.entries(payload.schools)){
    if(!/^[a-z0-9-]{2,60}$/.test(id) || !VALID_FBS_IDS.has(id) || !Array.isArray(people)||people.length>260)throw Error('Invalid roster team');
    const seen=new Set(),out=[];
    for(const person of people){
      if(typeof person.name!=='string'||person.name.length<3||person.name.length>100|| !/^[a-zA-Z0-9-]{1,6}$/.test(person.position||''))continue;
      if(/[<>\x00-\x1f]/.test(person.name)||seen.has(person.name))continue;
      seen.add(person.name);
      out.push(Object.freeze({name:person.name,position:person.position,source:payload.sourceUrl,
        season:payload.season,verifiedRoster:true,roleIsVerified:false,year:payload.season}));
    }
    if(out.length){
      teams[id]=out;schools++;players+=out.length;
      const origin=payload.schoolSources?.[id] || 'not-recorded';
      origins[id]=['cfbd','weekly','weekly-partial','not-recorded'].includes(origin)?origin:'not-recorded';
    }
  }
  seasonRosters.set(payload.season,Object.freeze(teams));
  seasonRosterOrigins.set(payload.season,Object.freeze(origins));
  sourceStatus.rosters[payload.season]={schools,players,asOf:payload.published||'unknown',source:payload.sourceUrl};
  return schools;
}
export function observed(id,season=2026){
  const n=Number(season);
  return seasonSnapshots.get(n)?.[id] || (n===2025?HISTORICAL[id]||null:null);
}
const ROLE_PREFERENCE = {
 QB:['QB'], RB:['RB','HB','FB'],WR1:['WR'],WR2:['WR'],TE:['TE'],K:['K','PK']
};
export function namedPlayer(id,role,season=2026,day=new Date().toISOString().slice(0,10)){
 const n=Number(season),people=seasonRosters.get(n)?.[id];
 if(people){
   const pref=ROLE_PREFERENCE[role]||[];
   // An official/report-backed weekly assignment takes precedence over old
   // season-volume rankings. An expired record remains an identity prior ONLY.
   const direct=n===2026?lineupRole(id,role,day):null;
   const blocked=(player)=>{
     const report=n===2026?lastReportedUnavailable(id,player.name,day):null;
     // Safety-first: continue excluding a previously reported OUT QB until a
     // fresher lineup explicitly reassigns that name. No claim of current injury.
     return report?.status==='out' || report?.status==='doubtful';
   };
   const candidates=people.filter(x=>pref.includes(x.position)&&!blocked(x));
   const eventDoc=n===2026?getPlayerEvidence(id,2026):null;
   const stat=role==='QB'?'passingYards':role==='RB'?'rushingYards':role==='K'?'fieldGoalsMade':'receivingYards';
   const evidence=new Map((eventDoc?.players||[]).filter(x=>x.stat===stat).map(x=>[personKey(x.name),x]));
   const otherFirst=n===2026&&role==='WR2'?lineupRole(id,'WR1',day)?.name:null;
   const available=candidates.filter(x=>!otherFirst||personKey(x.name)!==personKey(otherFirst));
   available.sort((a,b)=>{
     const x=evidence.get(personKey(a.name)),y=evidence.get(personKey(b.name));
     return (y?.n||0)-(x?.n||0)||(y?.mean||0)-(x?.mean||0)||a.name.localeCompare(b.name);
   });
   const selected=available.find(x=>direct&&personKey(x.name)===personKey(direct.name))||available[role==='WR2'&&!otherFirst?1:0];
   if(selected){
     const e=evidence.get(personKey(selected.name));
     return {...selected,stat:e?.stat??null,total:null,games:null,rosterOnly:true,
       selectionBasis:direct&&personKey(selected.name)===personKey(direct.name)?direct.displayBasis:
         e?'2026-roster-matched-recorded-events':'2026-roster-position-only',
       eventGames:e?.n||0, observedMean:e?.mean??null,
       roleVerified:Boolean(direct?.verifiedCurrent&&personKey(selected.name)===personKey(direct.name)),
       sourceUrl:direct&&personKey(selected.name)===personKey(direct.name)?direct.sourceUrl:e?eventDoc.sourceUrl:selected.source,
       verifiedOn:direct&&personKey(selected.name)===personKey(direct.name)?direct.observedOn:null};
   }
 }
 return n===2025?HISTORICAL[id]?.players?.[role]||null:null;
}
export function rosterForTeam(id,season=2026){return seasonRosters.get(Number(season))?.[id]||[];}
/** The importer records whether this school came from its weekly report or CFBD's CSV. */
export function rosterSourceForTeam(id,season=2026){return seasonRosterOrigins.get(Number(season))?.[id]||'not-loaded';}
export function headToHead(a,b){return VERIFIED_RESULTS.filter(x=>[x.home,x.away].includes(a)&&[x.home,x.away].includes(b));}
export async function loadPublicData(base='./public/data/'){
  const loaded=[];const payloads=[];
  for(const year of [2026,2025]){
    for(const [prefix,install] of [['season',installSeasonSnapshot],['rosters',installRosterSnapshot]]){
      try{
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),6500);
        let response;
        try{response=await fetch(`${base}${prefix}-${year}.json`,{cache:'no-cache',signal:controller.signal})}
        finally{clearTimeout(timeout)}
        if(!response.ok)continue;
        const length=+(response.headers.get('Content-Length')||0);
        if(length>3_500_000)continue;
        const value=await response.text();
        if(value.length>3_500_000)continue;
        const parsed=JSON.parse(value);const count=install(parsed);loaded.push({year,prefix,count});payloads.push({year,prefix,payload:parsed});
      }catch(e){/* absent optional dataset never prevents offline simulation */}
    }
  }
  // Optional weekly lineup is installed AFTER the roster; worker receives the exact
  // same serialized evidence. No fetch failure can fabricate starter verification.
  try{
    const res=await fetch(`${base}weekly-lineups-2026.json`,{cache:'no-cache'});
    if(res.ok&&Number(res.headers.get('content-length')||0)<400_000){
      const raw=await res.text();if(raw.length<400_000){
        const payload=JSON.parse(raw);const count=installWeeklyLineup(payload);
        loaded.push({year:2026,prefix:'weekly-lineups',count});
        payloads.push({year:2026,prefix:'weekly-lineups',payload});
      }
    }
  }catch(_){/* empty or stale lineup never blocks historical data */}
  sourceStatus.weekly=weeklySummary();
  return {loaded,payloads};
}
