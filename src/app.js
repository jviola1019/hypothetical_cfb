/** GRIDIRON LAB / Pressbox Night Shift
 * A simple game surface on top of strictly separated observed evidence and
 * reproducible synthetic football. Everything mounted here is same-origin.
 */
import {TEAMS,TEAM_MAP,DEFAULT_CONFIG,ENGINE_VERSION,simulateGame,simulateBatch,hash32} from './engine.js';
import {FORMATS,FORMAT_MAP,createTournament,simulateRound,simulateTournament,monteCarloTournament,ranked2026Field,swapTournamentSeeds} from './tournament.js';
import {observed,loadPublicData,sourceStatus,rosterForTeam,rosterSourceForTeam,namedPlayer} from './observed.js';
import {lineupRole,weeklySummary,currentLineup} from './weeklyLineup.js';
import {evaluatedMatchup,loadResearchSnapshot,researchStatus,researchSnapshot} from './research.js';
import {loadPlayableCalibration,playableCalibrationSnapshot} from './playableCalibration.js';
import {getPlayerEvidence,loadPlayerEvidence,observedPropRows} from './playerEvidence.js';
import {modelComparison,loadModelComparison} from './modelCompare.js';
import {scoreEvidence,loadScoreEvidence} from './scoreEvidence.js';
import {playerModelEvaluation,loadPlayerModelEvaluation} from './playerModel.js';
import {histogram,atlas,scoreboardCurve,driveStrip,propBars} from './charts.js';
import {QUALIFICATION_RULES} from './cfpSelection.js';
import {teamAccent} from './branding.js';
import {tournamentReport,scoreboxFor} from './tournamentHonors.js';
import {SHOWCASE,ceremonyTimeline} from './dynastyCeremony.js';
import {COMMITTEE_2026,CFP_SCHEDULE_2026,committeeRank,provisionalEliteGap} from './committee2026.js';

const root=document.querySelector('#app');
const state={tournamentRuns:0,tab:'game',config:{...DEFAULT_CONFIG},game:null,forecast:null,runNumber:1,running:false,progress:0,
  worker:null,task:0,error:'',loading:true,datasets:[],selectedProp:null,format:'fbs12',
  tournament:createTournament('fbs12'),tournamentMC:null,selectedMatch:null,playoffBusy:false,mcBusy:false,
  sourcesReady:false,bracketViewRound:0,bracketViewPage:0,bracketQuadrant:'all',seedFrom:0,seedTo:1,finale:null,finaleTimer:null,bracketMode:'atlas',showcase:null,showcaseToken:0,showcaseTimers:[],showcaseTicker:null,report:null};
const fbs=TEAMS.filter(t=>t.division==='fbs');
const esc=x=>String(x??'').replace(/[&<>"']/g,y=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[y]));
const name=id=>TEAM_MAP[id]?.name||'Unknown team';
const short=id=>TEAM_MAP[id]?.short||'—';
const fmt=(x,d=1)=>Number.isFinite(+x)?Number(x).toFixed(d):'—';
const integer=x=>Number.isFinite(+x)?Math.round(x).toLocaleString('en-US'):'—';
const percent=x=>Number.isFinite(+x)?(100*x).toFixed(1)+'%':'—';
const ctl=(id,entries,current)=>`<select id="${esc(id)}" data-field="${esc(id)}">${entries.map(([v,l])=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
const button=(id,label,cls='')=>`<button type="button" class="action ${cls}" data-action="${esc(id)}">${label}</button>`;
const tag=(label,type='simulation')=>`<span class="evidence-label ${type}">${esc(label)}</span>`;
const tabNames={game:'Game',playoff:'Playoffs',research:'Model & validation'};
const locationName=c=>c.venue==='a'?`${name(c.a)} home`:c.venue==='b'?`${name(c.b)} home`:'Neutral site';
const subtitle=(n,title,note)=>`<div class="chapter-head"><div class="chapter-kicker"><span>${n}</span><span class="chapter-rule"></span></div><div class="chapter-heading"><h2>${title}</h2>${note?`<p>${note}</p>`:''}</div></div>`;
const safeLink=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;

function header(){return `<a class="skip-link" href="#main">Skip to main content</a><header class="topbar"><div class="topbar-inner"><a href="#main" class="brand" aria-label="GRIDIRON LAB — independent college football simulator"><span class="brand-mark" aria-hidden="true"><b>GL</b></span><span class="brand-copy"><strong>GRIDIRON<span class="brand-slash">/</span>LAB</strong><small>COLLEGE FOOTBALL SIMULATION STUDIO</small></span></a><nav class="navigation" aria-label="Primary">${Object.entries(tabNames).map(([id,text])=>`<button type="button" class="nav-item ${state.tab===id?'active':''}" data-action="tab-${id}" aria-current="${state.tab===id?'page':'false'}">${esc(text)}</button>`).join('')}</nav><div class="topbar-meta"><span class="season-marker">2026</span><span>FBS / 138 TEAMS</span></div></div></header>`;}
function topper(section,title,description){return `<section class="page-intro" aria-label="${esc(section)}"><div class="page-intro-small"><span><span class="intro-pip" aria-hidden="true"></span>2026 COLLEGE FOOTBALL / ${esc(section)}</span><span>INDEPENDENT SIMULATOR · NOT NCAA-AFFILIATED</span></div><div class="page-intro-body"><div class="intro-copy"><span class="hero-edition">GRIDIRON LAB <b>SEASON 26</b></span><h1>${title}</h1><p>${description}</p></div><div class="intro-symbol" aria-hidden="true"><span class="intro-grid">I<br>II<br>III</span><span class="intro-monogram">26</span></div></div><div class="intro-stripes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></section>`;}
function callout(message,cls=''){return `<div class="editor-note ${cls}" role="note"><span class="note-icon" aria-hidden="true">i</span><p>${message}</p></div>`;}
function errorBox(){return state.error?`<div class="error-strip" role="alert">${esc(state.error)}</div>`:'';}
function matchupPicker(){const c=state.config;return `<section class="play-console" aria-labelledby="match-heading"><div class="console-intro"><div><span class="eyebrow">PRE-GAME / 01</span><h2 id="match-heading">Set the matchup</h2></div><span class="console-season"><span class="console-dot" aria-hidden="true"></span>2026 · 138 FBS programs</span></div><div class="console-controls"><label class="team-control"><small><span class="team-selector-id">A</span> FIRST TEAM</small>${ctl('a',fbs.map(t=>[t.id,t.name]),c.a)}</label><span class="versus" aria-hidden="true">VS</span><label class="team-control"><small><span class="team-selector-id">B</span> SECOND TEAM</small>${ctl('b',fbs.map(t=>[t.id,t.name]),c.b)}</label><label class="venue-control"><small>GAME SITE</small>${ctl('venue',[['neutral','Neutral field'],['a',name(c.a)+' at home'],['b',name(c.b)+' at home']],c.venue)}</label></div><div class="console-footer"><span>Choose teams and home field. We handle the rest.</span>${button('new-game','SIMULATE GAME <span aria-hidden="true">→</span>','primary')}</div></section>`;}
function matchupForecast(){
 const e=evaluatedMatchup(state.config.a,state.config.b,state.config.venue),c=state.config;
 if(!e)return `<section class="research-snapshot unavailable"><div class="snapshot-head"><span class="eyebrow">PREGAME RESEARCH ESTIMATE</span>${tag('Empirical file unavailable','warning')}</div><h3>No independently fitted projection loaded.</h3><p>The game remains playable in synthetic mode, but we withhold unsupported research probabilities and spreads.</p></section>`;
 // A single score model must use the same two numbers for its displayed pair,
 // total and margin; never splice an Elo-derived spread into a different total.
 // Round displayed team points first, then derive the visible margin/total
 // from those rounded values to prevent contradictory score arithmetic.
 const aTenths=Math.round(e.expectedA*10),bTenths=Math.round(e.expectedB*10);
 const scoreA=aTenths/10,scoreB=bTenths/10;
 const displayedMargin=(aTenths-bTenths)/10,displayedTotal=(aTenths+bTenths)/10;
 const scoreLabel=`${fmt(scoreA)} <em>–</em> ${fmt(scoreB)}`;
 const line=`${displayedMargin>=0?'+':''}${fmt(displayedMargin)}`;
 const simulated=state.forecast?.n>=100?state.forecast:null;
 const winGap=simulated?Math.abs(simulated.pA-e.pA):null;
  const rawGap=e.ratingA-e.ratingB;
  const contextGuard=provisionalEliteGap(c.a,c.b,rawGap)!==rawGap;
  const mismatch=contextGuard?`<aside class="context-diagnostic" role="note"><b>MODEL DIVERGENCE · ELITE CONTEXT</b><p>The 2025-trained, win-only Elo model outputs ${percent(e.pA)} for ${esc(name(c.a))}. A source-dated top-three CFP ranking triggers a minimum 200-point strength separation in the fictional 2026 drive engine against an unranked team. This deliberate gameplay guard is NOT independently calibrated. The historical research estimate remains unchanged; do not interpret either as betting odds.</p></aside>`:'';
 const agreement=simulated?`<div class="forecast-agreement"><span>SIMULATED REPLAYS VS ELO REFERENCE</span><strong>${percent(simulated.pA)} <em>vs</em> ${percent(e.pA)}</strong><small>Difference ${percent(winGap)} · ${integer(simulated.n)} hypothetical replays · Agreement with Elo is not historical game calibration.</small></div>`:'';
 return `<section class="research-snapshot" aria-label="Historical-form model"><div class="snapshot-head"><span class="eyebrow">PREGAME RESEARCH ESTIMATE</span>${tag('Elo probability · independently evaluated','empirical')}</div><div class="snapshot-grid"><div class="snapshot-lead"><small>${esc(short(c.a))} WIN PROBABILITY</small><strong>${percent(e.pA)}</strong><p>Historical Elo model estimate. This is separate from the fictional replay results.</p><div class="probability-track" role="img" aria-label="${esc(name(c.a))} ${percent(e.pA)}, ${esc(name(c.b))} ${percent(e.pB)}"><span style="width:${(e.pA*100).toFixed(2)}%"></span></div><div class="probability-end"><b>${esc(short(c.a))} ${percent(e.pA)}</b><b>${esc(short(c.b))} ${percent(e.pB)}</b></div></div><div class="snapshot-figures"><div><small>SCORING-RATE POINT ESTIMATES</small><strong>${scoreLabel}</strong></div><div><small>SCORE-ESTIMATE MARGIN · ${esc(short(c.a))} MINUS ${esc(short(c.b))}</small><strong>${line}</strong></div><div><small>SCORE-ESTIMATE TOTAL · SUM OF BOTH TEAMS</small><strong>${fmt(displayedTotal)}</strong></div><div><small>ELO RATING DIFFERENCE</small><strong>${fmt(e.ratingA-e.ratingB,0)}</strong></div></div></div>${agreement}${mismatch}<div class="snapshot-foot">2026 records observed through ${esc(String(e.lastScoredGame||e.asOf).slice(0,10))} UTC. Win chance uses a chronologically evaluated Elo model; point estimates use a separate smoothed scoring-rate baseline. The visible team-point pair, total and margin are all rounded consistently to 0.1 point before display; the underlying model retains full precision. This view uses the 2025-trained Elo baseline, NOT the separately selected two-feature research comparator. These are NOT validated sportsbook spreads or player projections. ${safeLink('./docs/PROBABILITY_CONSISTENCY_AUDIT.md','See arithmetic and limitations')}</div></section>`;
}
/** Bespoke stadium game-screen illustration — no team logos or EA/NCAA assets. */
function gamedayHud(){
 const c=state.config,e=evaluatedMatchup(c.a,c.b,c.venue);
 const status=c.venue==='neutral'?'NEUTRAL SITE':c.venue==='a'?short(c.a)+' HOME FIELD':short(c.b)+' HOME FIELD';
 const ref=e?'ELO REFERENCE · '+percent(e.pA)+' / '+percent(e.pB):'SCOUTING REFERENCE PENDING';
 const team=(id,side)=>`<div class="hud-school hud-${side}"><div class="hud-monogram">${esc(short(id))}</div><div><small>PROGRAM ${side==='a'?'A':'B'}</small><strong>${esc(name(id))}</strong><span>ELO ${e?fmt(side==='a'?e.ratingA:e.ratingB,0):'—'}</span></div></div>`;
 return `<section class="gameday-hud" aria-label="Pregame 2026 opponent-adjusted scouting board" style="--hud-a:${teamAccent(c.a)};--hud-b:${teamAccent(c.b)}">
  <div class="hud-topline"><span>GRIDIRON LAB / GAMEDAY 26</span><span>${esc(status)}</span><span>ORIGINAL SIMULATION</span></div>
  <div class="hud-teams">${team(c.a,'a')}
   <div class="hud-playart"><svg viewBox="0 0 320 130" aria-label="Illustrated playbook football field, not actual tracking data" role="img">
    <defs><pattern id="play-field-grid" width="29" height="130" patternUnits="userSpaceOnUse"><path d="M28 0V130" stroke="#b3cbca" stroke-opacity=".22"/></pattern></defs>
    <rect x="1" y="1" width="318" height="128" fill="#0c2b2a" stroke="#678d8b"/><rect x="1" y="1" width="318" height="128" fill="url(#play-field-grid)"/>
    <path d="M8 65H312" stroke="#c5dcd9" opacity=".36" stroke-dasharray="5 8"/>
    <g class="hud-routes" fill="none" stroke="#ff906e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M44 94H80L124 46H170"/><path d="M84 112H140L191 67H264"/><path d="M157 38L170 46L157 55M252 59L264 67L252 75"/></g>
    <g stroke="#ebf3f2" fill="none" stroke-width="3"><circle cx="43" cy="94" r="10"/><circle cx="84" cy="112" r="10"/><path d="M208 101L229 120M229 101L208 120"/></g>
    <text x="160" y="18" fill="#c7ddda" font-size="10" letter-spacing="3" text-anchor="middle">PLAYBOOK / 26</text>
   </svg><span>STYLIZED ROUTE CONCEPT</span></div>
   ${team(c.b,'b')}
  </div><div class="hud-bottom"><span>SCOUTING REFERENCE</span><b>${esc(ref)}</b><span>${e?esc(String(e.lastScoredGame||e.asOf).slice(0,10))+' UTC cutoff':'No historical reference loaded'}</span></div>
 </section>`;
}
function gamedayNav(){return `<nav class="gameday-nav" aria-label="Game page quick navigation"><a href="#broadcast-result">01 / Broadcast</a><a href="#game-details">02 / Box score</a><a href="#game-player-props">03 / Player sheet</a><a href="#game-availability">04 / Availability</a><a href="#game-sim-outcomes">05 / Sim lab</a></nav>`;}
function injuryTicker(){
 const w=weeklySummary(),teams=[state.config.a,state.config.b];
 const items=teams.flatMap(id=>{const q=currentLineup(id);return q?.current?q.unavailable.map(x=>({...x,team:id})):[]});
 const rows=items.map(x=>`<div class="availability-entry"><b class="availability-status ${esc(x.status)}">${esc(x.status.toUpperCase())}</b><div><strong>${esc(x.name)}</strong><small>${esc(name(x.team))} · Reported ${esc(x.observedOn)} · Source-game week only</small></div>${safeLink(x.sourceUrl,'View report')}</div>`).join('');
 return `<section id="game-availability" class="availability-board" aria-label="Dated team injury and replacement evidence"><div class="availability-head"><div><span class="eyebrow">GAMEDAY INTELLIGENCE / 2026</span><h3>Availability desk</h3></div><span>${w?esc(w.weekStart+' — '+w.weekEnd):'No weekly bulletin'}</span></div>${rows||'<p>No dated unavailability report is installed for these teams in the current source week. This does NOT certify that the athletes are healthy.</p>'}<p class="availability-warning">Past-game availability expires with its reported week. Injuries, shared QB snaps, and future participation are not independently forecast or medically diagnosed by this simulator.</p></section>`;
}

function scoreboard(g,mode='game'){if(!g)return `<div class="scoreboard-empty" role="status">Preparing the simulation…</div>`;
 const a=g.config.a,b=g.config.b;return `<section class="fixture-score" style="--team-a:${teamAccent(a)};--team-b:${teamAccent(b)}" aria-label="Simulated game result"><div class="fixture-meta"><span class="fixture-stage"><span class="live-indicator" aria-hidden="true"></span>FINAL · ${mode==='game'?'SINGLE-GAME SIMULATION':'TOURNAMENT SIMULATION'}</span>${tag(g.scoringMode==='research-conditioned-drive-intensity-not-player-calibration'?'Historically conditioned · synthetic':g.scoringMode==='elo-guided-2026-synthetic-not-calibrated'?'Elo-guided balance · synthetic':'Hypothetical · uncalibrated')}</div><div class="fixture-center"><div class="fixture-team"><span class="team-abbr">TEAM A · ${esc(short(a))}</span><strong>${esc(name(a))}</strong><small>${esc(g.config.venue==='a'?'HOME':g.config.venue==='b'?'AWAY':'NEUTRAL')}</small></div><div class="fixture-score-number"><b>${integer(g.final[0])}</b><span>–</span><b>${integer(g.final[1])}</b></div><div class="fixture-team away"><span class="team-abbr">TEAM B · ${esc(short(b))}</span><strong>${esc(name(b))}</strong><small>${esc(g.config.venue==='b'?'HOME':g.config.venue==='a'?'AWAY':'NEUTRAL')}</small></div></div><div class="fixture-summary"><span><b>WINNER</b> ${esc(name(g.winner))}</span><span>${esc(locationName(g.config))} · ${g.ot?g.ot+' OT':'Regulation'} · Replay ${esc(g.seed)}</span></div><div class="field-ruler" aria-hidden="true"><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span></div></section>`;}
function quarterTable(g){if(!g)return '';const quarters=i=>g.teams[i].byQuarter.map(n=>`<td>${integer(n)}</td>`).join('');const ot=i=>g.teams[i].overtimePoints;return `<div class="table-scroll"><table class="score-table"><caption>Scoring by quarter — hypothetical</caption><thead><tr><th>TEAM</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th>${g.ot?'<th>OT</th>':''}<th>FINAL</th></tr></thead><tbody>${g.teams.map((t,i)=>`<tr><th>${esc(short(t.team))}</th>${quarters(i)}${g.ot?`<td>${integer(ot(i))}</td>`:''}<td><strong>${integer(g.final[i])}</strong></td></tr>`).join('')}</tbody></table></div>`;}
const stats=[['plays','Offensive plays'],['passAttempts','Pass attempts'],['completions','Completions'],['passYards','Passing yards'],['rushAttempts','Rush attempts'],['rushYards','Rushing yards'],['passingTD','Pass TD'],['rushingTD','Rush TD'],['turnovers','Turnovers'],['drives','Drives']];
function statsTable(g){return `<div class="table-scroll"><table class="stat-table"><caption>Generated team box score</caption><thead><tr><th>STATISTIC</th><th>${esc(short(g.config.a))}</th><th>${esc(short(g.config.b))}</th></tr></thead><tbody>${stats.map(([key,label])=>`<tr><th>${label}</th><td>${integer(g.teams[0][key])}</td><td>${integer(g.teams[1][key])}</td></tr>`).join('')}</tbody></table></div>`;}
function playerBoxes(g){const roles=['QB','RB','WR1','WR2','TE','K'];const rows=g.teams.flatMap(team=>roles.map(role=>({team:team.team,role,data:team.players[role]})).filter(x=>x.data?.historical));
 if(!rows.length)return `<div class="empty-panel">Roster-linked full names are not available for this matchup. The engine did not invent player identities.</div>`;
 const line=x=>{const p=x.data,r=x.role;if(r==='QB')return `${integer(p.passingYards)} passing yds · ${p.completions}/${p.passingAttempts} · ${p.passingTD} pass TD`;if(r==='RB')return `${integer(p.rushYards)} rushing yds · ${p.rushAttempts} carries · ${p.receptions} rec`;if(r==='K')return `${p.fieldGoalsMade}/${p.fieldGoalsAttempted} FG · ${p.extraPointsMade} XP`;return `${p.receptions} catches · ${integer(p.receivingYards)} yds`};
 return `<div class="table-scroll"><table class="stat-table athletes"><caption>Generated roster-linked player statistics</caption><thead><tr><th>PLAYER / TEAM</th><th>ROLE SLOT</th><th>SIMULATED LINE</th></tr></thead><tbody>${rows.map(x=>`<tr><th>${esc(x.data.label)}<small>${esc(name(x.team))} · ${x.data.rosterSeason===2026?'2026 roster':'unassigned'} · ${x.data.roleVerified?'dated current-week role evidence':x.data.eventGames?'recorded usage (not verified starter)':'roster role only'}</small></th><td>${esc(x.role.replace(/[12]/,''))}</td><td>${esc(line(x))}</td></tr>`).join('')}</tbody></table></div><p class="subcaption">Source-backed role reports are labeled above; other names use recent recorded events or roster position. Other contributors is an aggregate of unrepresented athletes, not a fabricated person's name. Team and player yardage reconcile. All game totals remain fictional and are not calibrated future-player props.</p>`;}
function positionField(g){
 // Coordinates are simulated starting positions, not observed EPA or a play chart.
 const marks=g.drives.map((d,i)=>{const y=36+(i%3)*17;const x=30+Math.max(0,Math.min(100,d.start))*5.6;const color=d.points?'#d5ef67':d.outcome==='TO'?'#f1ae71':'#8ba58d';return `<circle cx="${x}" cy="${y}" r="${d.points?5.2:3.8}" fill="${color}"><title>Drive ${i+1}: ${short(d.offense)} starts at ${d.start}, ${d.outcome} (${d.points} points)</title></circle>`;}).join('');
 return `<svg class="viz field-diagram" viewBox="0 0 625 130" role="img" aria-label="Generated starting field positions for ${g.drives.length} possessions"><title>Starting field positions from the simulated drive log</title><rect x="30" y="24" width="560" height="80" fill="#182a1d" stroke="#65795c"/>${Array.from({length:11},(_,i)=>`<line x1="${30+i*56}" x2="${30+i*56}" y1="24" y2="104" stroke="#547052" stroke-width="${i===5?1.8:1}" opacity=".65"/>`).join('')}<line x1="30" x2="590" y1="64" y2="64" stroke="#455f45" stroke-dasharray="6 8"/>${marks}<text x="30" y="118" fill="#9cac94" font-size="10" font-family="monospace">OWN END ZONE</text><text x="590" y="118" text-anchor="end" fill="#9cac94" font-size="10" font-family="monospace">OPPONENT END ZONE</text></svg>`;
}
function driveLog(g){return `<div class="table-scroll"><table class="stat-table drive-table"><caption>Generated possession summary</caption><thead><tr><th>#</th><th>OFFENSE</th><th>PERIOD</th><th>START YD</th><th>PLAYS</th><th>RESULT</th><th>POINTS</th></tr></thead><tbody>${g.drives.map((d,i)=>`<tr><td>${i+1}</td><td>${esc(short(d.offense))}</td><td>${esc(d.quarter)}</td><td>${d.start}</td><td>${d.plays}</td><td>${esc(d.outcome)}</td><td>${d.points}</td></tr>`).join('')}</tbody></table></div>`;}
function gameDetail(g,sectionID='game-details'){if(!g)return '';return `<section class="game-inside" id="${sectionID}">${subtitle('03','The box score','Roster-linked player and team statistics from one hypothetical game.')}<div class="ledger-grid"><article class="sheet"><h3>Team box score</h3>${statsTable(g)}</article><article class="sheet"><h3>Named players</h3>${playerBoxes(g)}</article></div><details class="disclosure game-tape"><summary>Explore the game tape <span>Possessions, drive charts & field map</span></summary><div class="two-viz"><article class="viz-sheet"><div class="viz-head"><span>PLAYBACK 01</span><h3>Score progression</h3></div>${scoreboardCurve(g)}<div class="viz-legend"><span><i class="dot warm"></i>${esc(short(g.config.a))}</span><span><i class="dot cool"></i>${esc(short(g.config.b))}</span></div></article><article class="viz-sheet"><div class="viz-head"><span>PLAYBACK 02</span><h3>Possession map</h3></div>${driveStrip(g)}<p class="micro">Bars represent generated drive gains and outcomes, not true play-by-play data.</p></article></div><div class="position-sheet"><div class="viz-head"><span>PLAYBACK 03 / FIELD GEOMETRY</span><h3>Where possessions began</h3><p>Color highlights generated scoring drives and turnovers; no observed field tracking is implied.</p></div>${positionField(g)}</div><details class="disclosure"><summary>Read every generated possession <span>${g.drives.length} entries</span></summary>${driveLog(g)}</details></details></section>`;}
function marketLedgerView(m){
 const v=m.markets;
 if(!v||v.n!==m.n||v.wins.a+v.wins.b!==m.n||v.cover.a+v.cover.b+v.cover.push!==m.n||
    v.points.over+v.points.under+v.points.push!==m.n)return `<p role="alert" class="micro">Cannot verify game-market sample. Counts are withheld.</p>`;
 const a=short(state.config.a),b=short(state.config.b),count=x=>`${integer(x)} / ${integer(v.n)}`;
 const pct=x=>percent(x/v.n),sign=x=>`${x>=0?'+':''}${fmt(x)}`;
 const cell=(value)=>`<strong>${count(value)}</strong><small>${pct(value)}</small>`;
 const row=(label,value)=>`<tr><th scope="row">${esc(label)}</th><td>${cell(value)}</td></tr>`;
 return `<section class="market-ledger" aria-label="Exact hypothetical win and spread counts">
 <div class="ledger-intro"><div><span class="eyebrow">SINGLE-SAMPLE AUDIT · ${integer(v.n)} GENERATED GAMES</span><h3>Wins aren't covers.</h3><p>Every count below uses the very same ${integer(v.n)} synthetic games as the histograms. The spreads and totals are sample-derived reference lines, <b>not</b> real sportsbook odds, market data, or calibrated forecasts. The separate Elo win probability above may disagree because the drive simulator is not fitted to the Elo probability.</p></div><div class="ledger-reference"><span>TEAM ${esc(a)} REFERENCE SPREAD</span><b>${sign(v.reference.spreadA)}</b><span>GENERATED TOTAL REFERENCE</span><b>${fmt(v.reference.totalLine)}</b></div></div>
 <div class="market-table-pair"><div class="ledger-scroll" role="region" tabindex="0" aria-label="Simulated wins and spread covers"><table><caption>Winner vs. point-spread cover</caption><thead><tr><th scope="col">OUTCOME</th><th scope="col">EXACT COUNT</th></tr></thead><tbody>${row(a+' wins',v.wins.a)}${row(b+' wins',v.wins.b)}${row(a+' covers '+sign(v.reference.spreadA),v.cover.a)}${row(b+' covers '+sign(v.reference.spreadB),v.cover.b)}${row('Spread pushes',v.cover.push)}</tbody></table></div><div class="ledger-scroll" role="region" tabindex="0" aria-label="Simulated total overs and unders"><table><caption>Total score vs. ${fmt(v.reference.totalLine)} points</caption><thead><tr><th scope="col">OUTCOME</th><th scope="col">EXACT COUNT</th></tr></thead><tbody>${row('Over '+fmt(v.reference.totalLine),v.points.over)}${row('Under '+fmt(v.reference.totalLine),v.points.under)}${row('Total pushes',v.points.push)}</tbody></table></div></div>
 <div class="ledger-cross"><b>Win and cover cross-check</b><span>${esc(a)} won but did not cover: <strong>${count(v.joint.winAndNoCover)}</strong></span><span>${esc(a)} lost but covered: <strong>${count(v.joint.lossAndCover)}</strong></span></div>
 <details class="disclosure ledger-method"><summary>How win and cover differ <span>Sample accounting</span></summary><p>${esc(a)} wins when its final score exceeds ${esc(b)}'s. It covers only when (${esc(a)} score − ${esc(b)} score) + (${sign(v.reference.spreadA)}) is positive. Cover counts do not have to equal win counts. Overs require the combined final score to exceed ${fmt(v.reference.totalLine)} points. A tie exactly on a line is counted as a push. Percentages use the same denominator ${integer(v.n)}; small rounding differences do not change counts.</p><p>These lines are drawn from the generated sample mean and rounded to half points. The sample is not a forecast, and the reference is not independent of the sample.${Math.abs(v.reference.spreadA)===.5?` Because the spread is only half a point, winning and covering are equivalent for these non-tied game scores.`:''}</p></details></section>`;
}
function syntheticDistribution(){const m=state.forecast;if(!m)return `<div class="loading-panel" aria-live="polite">${state.running?`Analyzing ${state.progress}%...`:'Preparing score distributions...'}</div>`;
 return `<section id="game-sim-outcomes" class="sample-outlook">${subtitle('02','What happens across replays','These are sampled fictional results, not real betting lines or a calibrated game forecast.')}<div class="sampling-line"><span>${tag('Generated games only')}</span><span>${integer(m.n)} replays · win-rate sampling error ${percent(m.mcse)}</span></div><div class="outcome-strip"><div><small>${esc(short(state.config.a))} WON</small><b>${percent(m.pA)}</b><span>Share of simulated games</span></div><div><small>AVERAGE GENERATED SCORE</small><b>${integer(m.meanA)} : ${integer(m.meanB)}</b><span>Not the same as research projection</span></div><div><small>GENERATED TOTAL</small><b>${fmt(m.totalMean)}</b><span>90% range ${m.totalInterval.join('–')}</span></div><div><small>OT RATE</small><b>${percent(m.ot)}</b><span>In the simulator only</span></div></div>${marketLedgerView(m)}<div class="two-viz"><article class="viz-sheet"><div class="viz-head"><span>OUTCOME STUDY A</span><h3>Winning margins</h3><p>Points for Team A minus points for Team B.</p></div>${histogram(m.margin,m.markets?.reference.marginThreshold??0,'margin')}</article><article class="viz-sheet"><div class="viz-head"><span>OUTCOME STUDY B</span><h3>Total scoring</h3><p>Combined points in the generated games.</p></div>${histogram(m.total,m.markets?.reference.totalLine??m.totalMean,'total')}</article></div><details class="disclosure outcome-explorer"><summary>Explore the full score map <span>7-point score cells</span></summary><div class="expanded-chart"><div class="viz-head"><span>JOINT-SCORE FREQUENCY</span><h3>Two-team outcome atlas</h3><p>Each cell shows the share of fictional results in a score range.</p></div>${atlas(m.scores,m.n)}</div></details></section>`;}
function propTable(){
 const m=state.forecast,props=m?.props||[],observedRows=[...observedPropRows(state.config.a),...observedPropRows(state.config.b)];
 const gap=p=>Number.isFinite(p.seasonObservedMean)&&p.seasonObservedMean>0?(p.mean-p.seasonObservedMean)/Math.max(1,p.seasonObservedMean):null;
 const alert=p=>{const d=gap(p);return d!==null&&Math.abs(d)>.5};
 const curated=[state.config.a,state.config.b].flatMap(team=>['QB','WR1'].map(role=>props.find(p=>p.team===team&&p.role===role&&p.stat===(role==='QB'?'passingYards':'receivingYards')))).filter(Boolean);
 const highlights=curated.length?`<div class="player-cards">${curated.map(p=>`<article class="player-card ${alert(p)?'player-card-caution':''}" style="--player-team:${teamAccent(p.team)}"><div class="player-card-top"><span>${esc(short(p.team))} / ${esc(p.role)}</span><span>${p.roleVerified?'WEEK-SOURCED ROLE':'PROVISIONAL ROLE'}</span></div><h3>${esc(p.fullName)}</h3><div class="player-card-value"><strong>${fmt(p.mean)}</strong><span>${esc(p.unit)}<small>average fictional game</small></span></div><p>${Number.isFinite(p.seasonObservedMean)?'2026 recorded-stat-game avg '+fmt(p.seasonObservedMean):'No reliable 2026 recorded-stat-game mean for this attribute'}${alert(p)?' · <b>Large model/source mismatch</b>':''}</p></article>`).join('')}</div>`:'';
 const synthetic=props.length?`<div class="table-scroll"><table class="stat-table prop-table"><caption>Source-labeled fictional player outcomes compared to recorded 2026 event games</caption><thead><tr><th>ATHLETE / MODEL SLOT</th><th>ATTRIBUTE</th><th>SIM AVG.</th><th>2026 RECORDED AVG.</th><th>GAP</th><th>REFERENCE LINE</th><th>SIM OVER SHARE</th><th></th></tr></thead><tbody>${props.map(p=>{
 const d=gap(p);
 return `<tr><th>${esc(p.fullName)}<small>${esc(name(p.team))} · ${esc(p.role)} · ${p.roleVerified?'current-week source referenced':'role unverified'}</small></th><td>${esc(p.unit)}</td><td>${fmt(p.mean)}</td><td>${Number.isFinite(p.seasonObservedMean)?fmt(p.seasonObservedMean):'—'}</td><td>${d===null?'—':`<span class="${alert(p)?'stat-mismatch':''}">${d>=0?'+':''}${percent(d)}</span>`}</td><td>${fmt(p.line)}<small>${p.lineBasis==='observed-2026-recorded-event-mean'?'2026 event-game anchor':'generic model threshold'}</small></td><td><strong>${percent(p.above)}</strong></td><td>${button('prop:'+p.id,'Inspect','subtle')}</td></tr>`;
 }).join('')}</tbody></table></div>`:`<div class="empty-panel">No roster-linked scenario rows are currently supported for the selected matchup. The model does not invent identities.</div>`;
 const picked=props.find(x=>x.id===state.selectedProp);
 const detail=picked?`<div class="expanded-chart" id="player-prop-inspector"><div class="viz-head"><span>SIMULATED DISTRIBUTION / ${esc(picked.fullName)}</span><h3>${esc(picked.unit)} above ${fmt(picked.line)}</h3></div>${propBars(picked.values,picked.line)}<p>${percent(picked.above)} of ${integer(picked.n)} <b>fictional</b> games exceeded the ${esc(picked.lineBasis==='observed-2026-recorded-event-mean'?'2026 recorded-stat event-game anchored':'generic illustrative')} threshold. This is not a sportsbook price or a validated unconditional player prediction. ${Number.isFinite(picked.seasonObservedMean)?'Recorded-event-game mean '+fmt(picked.seasonObservedMean)+'.':'No matched empirical mean is available.'}</p></div>`:'';
 const recorded=observedRows.length?`<details class="disclosure"><summary>Inspect source-recorded 2026 player form <span>${observedRows.length} entries</span></summary><div class="table-scroll"><table class="stat-table"><thead><tr><th>PLAYER</th><th>OBSERVED STAT</th><th>RECORDED EVENTS</th><th>AVG.</th><th>HISTORICAL HIT SHARE</th></tr></thead><tbody>${observedRows.slice(0,24).map(p=>`<tr><th>${esc(p.name)}<small>${esc(name(p.team))}</small></th><td>${esc(p.label)}</td><td>${p.n}</td><td>${fmt(p.mean)}</td><td>${percent(p.hitRate)}</td></tr>`).join('')}</tbody></table></div><p class="subcaption">Recorded-stat events are conditional on appearing in the event ledger. Missing games and nonparticipation are NOT zero-filled, so a season event-game mean may overstate ordinary weekly opportunity.</p></details>`:`<p class="micro">Observed athlete-event summaries not installed for these programs.</p>`;
 return `<section id="game-player-props" class="player-desk">${subtitle('04','Player scouting','Observed player form and generated stat lines appear side by side. Never confuse source performance with the simulated athlete.')}${highlights}<div class="prop-label">${tag('Fictional player scenarios')}<span>Generated means and observed 2026 recorded-event means are not interchangeable. A large gap flags model underperformance.</span></div>${synthetic}${detail}${recorded}</section>`;
}

function historyTable(){const c=state.config,a=observed(c.a,2026),b=observed(c.b,2026),a25=observed(c.a,2025),b25=observed(c.b,2025);
 const row=(title,x,y,kind='')=>`<tr><th>${title}</th><td>${x==null?'—':kind==='number'?fmt(x):esc(x)}</td><td>${y==null?'—':kind==='number'?fmt(y):esc(y)}</td></tr>`;
 return `<details class="disclosure team-history"><summary>Compare historical team results <span>2026 / 2025</span></summary><div class="table-scroll"><table class="stat-table"><thead><tr><th>HISTORICAL RESULT</th><th>${esc(name(c.a))}</th><th>${esc(name(c.b))}</th></tr></thead><tbody><tr class="band"><th colspan="3">2026 · OBSERVED SEASON-TO-DATE</th></tr>${row('W–L',a?.record,b?.record)}${row('Points per game',a?.pointsFor,b?.pointsFor,'number')}${row('Points allowed',a?.pointsAgainst,b?.pointsAgainst,'number')}<tr class="band"><th colspan="3">2025 · COMPLETED SEASON</th></tr>${row('W–L',a25?.record,b25?.record)}${row('Points per game',a25?.pointsFor,b25?.pointsFor,'number')}${row('Points allowed',a25?.pointsAgainst,b25?.pointsAgainst,'number')}</tbody></table></div><p class="subcaption">These are actual observations from published snapshots, not game-generator outputs.</p></details>`;}
function rosterCoverageCard(g){
  const ids=[state.config.a,state.config.b], names=ids.map(id=>rosterForTeam(id,2026).length);
  const active=sourceStatus.rosters[2026];
  const colored=names.every(n=>n>0)?'roster-good':'roster-missing';
  return `<div class="roster-coverage ${colored}" aria-live="polite"><span class="roster-coverage-mark">26</span><div><b>2026 roster edition</b><p>${ids.map((id,i)=>`${esc(name(id))}: ${names[i]} listed athletes`).join(' · ')} · Data issued ${esc(active?.asOf||'not downloaded')}</p><small>Weekly depth-chart decisions are shown below. An old roster or season-long volume alone never proves who starts today.</small></div></div>`;
}
function personnelDesk(){
 const week=weeklySummary(),teams=[state.config.a,state.config.b],roles=['QB','QB2','RB','WR1','WR2','TE'];
 const hasWeek=!!week;const today=new Date().toISOString().slice(0,10);
 const rows=teams.map(id=>{const picks=roles.map(role=>{
  const p=namedPlayer(id,role,2026);if(!p)return null;
  const e=lineupRole(id,role),grade=p.roleVerified?'SOURCE-REFERENCED':p.selectionBasis==='depth-chart-projected'?'DEPTH CHART / PROJECTED':p.selectionBasis==='historical-role-not-reverified'?'LAST KNOWN / NOT REVERIFIED':p.eventGames?'USAGE PROJECTED':'ROSTER ONLY';
  const note=role==='QB2'?'Secondary QB roster candidate only. No verified future shared snaps; the model does not fabricate backup passing volume.':p.roleVerified?'Current-week depth-chart or published starter evidence':p.selectionBasis==='depth-chart-projected'?'Third-party projected role, not a confirmed kickoff starter':p.selectionBasis==='historical-role-not-reverified'?'Last reported role retained, verification expired':p.eventGames?'Current 2026 recorded-stat workload, not a confirmed starter':'Roster-listed position, no verified usage';
  const link=p.sourceUrl?`<a href="${esc(p.sourceUrl)}" rel="noopener noreferrer" target="_blank">Source ↗</a>`:'';
  const avg=p.observedMean!==null&&p.observedMean!==undefined?`<span class="person-avg">${fmt(p.observedMean)} ${role==='QB'||role==='QB2'?'pass':role==='RB'?'rush':'receiving'} yds per recorded-stat game</span>`:'';
  const sourceNote=e?.note?`<small class="personnel-source-note">${esc(e.note)}</small>`:'';
  return `<div class="personnel-row"><div><small class="person-role">${esc(role)}</small><strong>${esc(p.name)}</strong>${avg}</div><div class="person-proof"><b class="${p.roleVerified?'verified':''}">${grade}</b><small>${esc(note)}</small>${sourceNote}${link}</div></div>`;
 }).filter(Boolean);
 return `<div class="personnel-team"><div class="personnel-team-title"><h3>${esc(name(id))}</h3><small>${picks.filter(x=>x.includes('SOURCE-REFERENCED')).length} roles source-referenced</small></div>${picks.join('')}</div>`;
 }).join('');
 const status=hasWeek?`${esc(week.weekStart)}–${esc(week.weekEnd)} · ${today>week.weekEnd?'Week expired: identities provisional until refreshed':'Week-scoped roster evidence'}`:'Weekly evidence not loaded: identities are provisional';
 return `<details id="game-personnel" class="personnel-desk" ${hasWeek?'':'open'}><summary><span><span class="eyebrow">WEEKLY PERSONNEL REPORT / 2026</span><b>Who is expected to play?</b><small>${status}</small></span><span class="personnel-expander">Role evidence ▾</span></summary><div class="personnel-sheet"><p class="personnel-disclosure">A depth-chart slot is not proof of kickoff availability. Injury and replacement reports can change right before the game; estimates expire at the end of the week. Source-backed identities and synthetic stat lines are different claims. Secondary QB candidates are tracked separately from synthetic QB1 stats; season-long event games do not prove a same-game passing split. External projected depth-chart directories (not official game-day certification): ${safeLink('https://www.thetwodeep.com/college/depth-charts','TWO·DEEP')} · ${safeLink('https://whosstarting.com/teams/','Who\'s Starting')}.</p><div class="personnel-columns">${rows}</div></div></details>`;
}
function gamePage(){const g=state.game;return `${topper('GAME SIMULATION','SATURDAY NIGHT.<br><em>YOUR MATCHUP.</em>','Choose two programs, set the stage, and play an original hypothetical matchup. Every result is inspectable.')}${matchupPicker()}${gamedayHud()}${gamedayNav()}${errorBox()}<div id="broadcast-result" class="game-canvas"><div class="lead-section"><span class="eyebrow">02 / THE GENERATED RESULT</span><div class="lead-actions"><span class="narrative-dot"></span><span>ONE POSSIBLE OUTCOME</span></div></div>${scoreboard(g)}${g?quarterTable(g):''}${g?gameScorebox(g):''}<div class="result-buttons">${button('new-game','Play it again <span aria-hidden="true">↗</span>','primary')}<a class="jump-link" href="#game-details">Jump to box score ↓</a></div></div>${matchupForecast()}${gameDetail(g)}${injuryTicker()}${propTable()}${rosterCoverageCard(g)}${personnelDesk()}${syntheticDistribution()}${historyTable()}`;}
function safeTournamentReport(t){
 try{return tournamentReport(t)}catch(e){return {error:e.message,complete:false,played:0,audited:0,failed:1,scores:[],awards:null}}
}
function gameScorebox(g){
 const v=scoreboxFor(g);
 return `<section class="scorebox-verification ${v.ok?'passed':'failed'}" aria-label="Simulated scorebox consistency check"><div class="scorebox-verification-head"><b>${v.ok?'SCOREBOX RECONCILED':'SCOREBOX CHECK FAILED'}</b><span>${v.ok?'QUARTERS + DRIVES + WINNER / PASS':'VALIDATION ERROR'}</span></div><p>${v.ok?'All 13 internal score, drive, quarter, possession and winner consistency assertions passed. This is not empirical prediction accuracy.':esc(v.errors.join('; '))}</p></section>`;
}
function tournamentOverview(){const t=state.tournament,rs=t.rounds,played=rs.reduce((s,r)=>s+r.matches.filter(m=>m.game).length,0),f=FORMAT_MAP[t.formatId];return `<div class="tournament-overview"><div><small>FIELD</small><b>${f.size} teams</b></div><div><small>COMPLETED</small><b>${played} / ${f.size-1}</b></div><div><small>CHAMPION</small><b>${t.champion?esc(name(t.champion)):'Not determined'}</b></div></div>`;}
/** No more than 16 rendered games per large-field page; accessible round selector. */
function bracketRounds(){
 const t=state.tournament,f=FORMAT_MAP[t.formatId];
 const rs=t.rounds.map((r,i)=>({name:r.name,stage:i,matches:r.matches}));
 if(!t.champion)rs.push({name:roundNameForView(t.formatId,t.stage),stage:t.stage,
   matches:Array.from({length:t.slots.length/2},(_,i)=>({a:t.slots[2*i],b:t.slots[2*i+1],game:t.played[i]||null,bye:!t.slots[2*i]||!t.slots[2*i+1]}))});
 const one=m=>{const game=m.game,winner=game?.winner||m.winner;
   return `<button type="button" class="fixture-bracket ${game?'is-final':''}" ${game?'':'disabled'} data-action="inspect:${m.stage}:${m.index}" aria-label="${game?'Inspect':'Pending'} ${esc(name(m.a))} versus ${esc(name(m.b))}"><span class="bracket-status">${game?'FINAL':m.bye?'ADVANCES / BYE':'TO BE PLAYED'}</span><span class="bracket-team ${winner===m.a&&game?'win':''}"><b>${m.a?esc(short(m.a)):'OPEN'}</b><span>${m.a?esc(name(m.a)):'OPEN'}</span><strong>${game?game.final[0]:'—'}</strong></span><span class="bracket-team ${winner===m.b&&game?'win':''}"><b>${m.b?esc(short(m.b)):'BYE'}</b><span>${m.b?esc(name(m.b)):'BYE'}</span><strong>${game?game.final[1]:'—'}</strong></span></button>`;};
 if(f.size<=24)return `<div class="bracket-shell"><div class="bracket-scroll" tabindex="0" role="region" aria-label="Horizontal playoff bracket">${rs.map((r,j)=>`<section class="bracket-column"><div class="bracket-col-head"><span>ROUND ${j+1}</span><h3>${esc(r.name)}</h3></div>${r.matches.map((m,i)=>one({...m,stage:r.stage,index:i})).join('')}</section>`).join('')}</div></div>`;
 const roundIndex=Math.max(0,Math.min(rs.length-1,state.bracketViewRound));
 const selected=rs[roundIndex];const n=selected.matches.length;
 const indexed=selected.matches.map((m,i)=>({...m,index:i,stage:selected.stage}));
 // Preliminary round: most spots are automatic advances. Hide empty pairing cards.
 const all=indexed.filter(x=>x.a&&x.b);
 const groups=['all','1','2','3','4'];
 const regionFiltered=state.bracketQuadrant==='all'?all:all.filter(m=>Math.floor(m.index/Math.ceil(n/4))===Number(state.bracketQuadrant)-1);
 const perPage=16,maxPage=Math.max(0,Math.ceil(regionFiltered.length/perPage)-1),pg=Math.min(state.bracketViewPage,maxPage);
 const visible=regionFiltered.slice(pg*perPage,(pg+1)*perPage);
 return `<section class="bracket-atlas" aria-label="Large-field tournament explorer"><div class="atlas-topline"><div><span class="eyebrow">ROUND ATLAS / ${f.size} TEAMS</span><h3>${esc(selected.name)}</h3></div><p>${all.length} matchups · ${selected.matches.filter(m=>m.bye).length} automatic advances · ${pg+1}/${maxPage+1} pages</p></div>
 <div class="round-switches" role="group" aria-label="Tournament round">${rs.map((r,i)=>button('round:'+i,esc(r.name),i===roundIndex?'selected':'subtle')).join('')}</div>
 <div class="atlas-filters"><label for="bracket-quadrant">Bracket quadrant</label>${ctl('bracket-quadrant',groups.map(x=>[x,x==='all'?'All four':`Quadrant ${x}`]),state.bracketQuadrant)}<span>Quadrants show bracket lanes, not geographic regions.</span></div>
 <div class="bracket-grid">${visible.length?visible.map(m=>one(m)).join(''):'<p class="empty-panel">No played matchups in this bracket lane yet.</p>'}</div>
 <div class="atlas-pager"><button class="action outline" type="button" data-action="page:${Math.max(0,pg-1)}" ${pg===0?'disabled':''}>Previous</button><span>Games ${regionFiltered.length?pg*perPage+1:0}–${Math.min((pg+1)*perPage,regionFiltered.length)} of ${regionFiltered.length}</span><button class="action outline" type="button" data-action="page:${Math.min(maxPage,pg+1)}" ${pg===maxPage?'disabled':''}>Next</button></div></section>`;
}
function roundNameForView(id,stage){const f=FORMAT_MAP[id];const rounds=Math.ceil(Math.log2(f.size)),remaining=rounds-stage;
 if(remaining===1)return 'Championship';if(remaining===2)return 'Semifinals';if(remaining===3)return 'Quarterfinals';
 if(f.size===138&&stage===0)return 'FBS Play-in · 138 to 128';
 if(f.size===68&&stage===0)return 'First Four · 68 to 64';
 const width=2**remaining;
 if(stage===0&&f.size!==width)return 'Qualifying round';
 return width===128?'Round of 128':width===64?'Round of 64':width===32?'Round of 32':width===16?'Round of 16':'First round';
}
function titleLeaderboard(){const r=state.tournamentMC;if(!r)return `<div class="empty-panel"><strong>Want to see the most common champion?</strong><p>Run a title study to compare many hypothetical brackets. Sample counts depend on available browser capabilities.</p></div>`;const ranking=Object.entries(r.probabilities).sort((a,b)=>b[1]-a[1]);return `<div class="table-scroll"><table class="stat-table odds-table"><thead><tr><th>SCHOOL</th><th>CHAMPIONSHIP SHARE</th><th>SIMULATION ERROR</th></tr></thead><tbody>${ranking.map(([id,p],i)=>`<tr><th><span class="ranking-num">${String(i+1).padStart(2,'0')}</span>${esc(name(id))}</th><td><div class="odds-bar"><span style="width:${(100*p).toFixed(2)}%"></span></div><b>${percent(p)}</b></td><td>±${percent(Math.sqrt(p*(1-p)/r.n))}</td></tr>`).join('')}</tbody></table></div><p class="subcaption">Entire brackets were simulated together. These are fictional championship frequencies, not empirically calibrated odds.</p>`;}
function playoffGameInspector(){const item=state.selectedMatch;if(!item)return '';const g=item.game;return `<section class="inspector-view" id="game-inspector" tabindex="-1">${subtitle('03','Inside the playoff game',`${esc(item.round)} · Every number below is generated from one game.`)}${button('close-inspector','Close report','subtle')}${scoreboard(g,'playoff')}${quarterTable(g)}${gameScorebox(g)}${gameDetail(g,'inspected-game-details')}<section class="player-desk">${subtitle('04','Player notes','Generated roster-linked statistics and historical evidence are not the same thing.')} ${playerBoxes(g)}</section></section>`;}
function seedEditor(){
 const t=state.tournament,f=FORMAT_MAP[t.formatId],source=ranked2026Field();
 const locked=!!(t.champion||t.stage||t.rounds.length||Object.keys(t.played).length),disabled=locked||!state.sourcesReady;
 const choices=t.participants.map((id,i)=>[String(i),`#${i+1} · ${name(id)}`]);
  const committeePreview=f.kind!=='fcs-inspired';
 const ranked=f.size>=68?'National bracket':'Field bracket';
 const defaultList=t.participants.slice(0,Math.min(16,f.size));
 return `<div class="bracket-seeding"><div class="seed-intro"><div><span class="eyebrow">${committeePreview?'CFP INTERIM TOP 25 / PREVIEW':'2026 PROVISIONAL MODEL FIELD'}</span><h3>${ranked} / ${f.size} entrants</h3><p>${esc(t.seedingSource||source.source)} · Data ${esc(source.asOf||'unavailable')}. ${committeePreview?'Published November 17 committee order; automatic qualifiers are unresolved. Not the final CFP bracket.':'Committee Top 25 followed by research Elo; fantasy field, not an official CFP bracket.'}</p></div><span class="seed-source-chip">${source.covered||0} rated schools</span></div>
 <div class="seed-leaders" aria-label="Highest seeds">${defaultList.map((id,i)=>`<div class="seed-row"><strong>${String(i+1).padStart(2,'0')}</strong><span>${esc(name(id))}</span><small>${committeePreview&&committeeRank(id)?'CFP #'+committeeRank(id)+' · 11/17':source.scores?.[id]?fmt(source.scores[id],0)+' ELO':'2026 FBS'}</small></div>`).join('')}</div>
 <details class="seed-expander"><summary>Open full ${f.size}-team seed list</summary><div class="seed-all-scroll" role="region" tabindex="0" aria-label="Complete ordered field"><table class="stat-table"><caption>Provisional seed list · seeded from current model, not committee rankings</caption><thead><tr><th>SEED</th><th>SCHOOL</th><th>RATING / EVIDENCE</th></tr></thead><tbody>${t.participants.map((id,i)=>`<tr><td>#${i+1}</td><th>${esc(name(id))}</th><td>${committeePreview&&committeeRank(id)?'CFP #'+committeeRank(id)+' · 11/17':source.scores?.[id]?fmt(source.scores[id],0)+' ELO':'Unranked / fallback'}</td></tr>`).join('')}</tbody></table></div></details><div class="restore-wrap">${button('restore-ranked','Restore model-ranked field','subtle')}</div>
 <div class="swap-desk"><div class="swap-label"><b>Make a seed trade</b><span>${locked?'Bracket already started. Reset to edit.':'Swap any two seeds before the first game. No team is added or dropped.'}</span></div><div class="swap-controls"><label>From seed ${ctl('swap-from',choices,String(state.seedFrom))}</label><label>With seed ${ctl('swap-to',choices,String(state.seedTo))}</label>${disabled?'<button class="action primary" type="button" disabled>Reset to edit</button>':button('swap-seeds','Swap positions ↔','primary')}</div></div></div>`;
}
function playoffTheater(){
 const f=FORMAT_MAP[state.format],t=state.tournament,n=t.rounds.length,done=Boolean(t.champion);
 const max=Math.ceil(Math.log2(f.size));
 const stage=done?'NATIONAL CHAMPION':n?t.rounds.at(-1).name.toUpperCase():'THE FIELD IS SET';
 const headline=done?name(t.champion):f.label;
 const subtitle=done?`${f.size-1} generated games · one title`:n?`${t.rounds.at(-1).matches.filter(x=>x.game).length} generated contests in the last round`:`Pick a round or play all ${f.size-1} games`;
 return `<section class="playoff-theater ${done?'theater-complete':''} ${state.finale?.kind==='full'?'theater-final-reveal':''}" aria-label="Championship arena" role="status" aria-live="polite">
  <div class="theater-top"><span>◆ SATURDAY//26 / CHAMPIONSHIP ENGINE</span><span>${done?'FINAL RESULT':n?'ROUND COMPLETED':'AWAITING KICKOFF'}</span></div>
  <div class="theater-main">
   <div class="theater-graphic" aria-hidden="true"><div class="arena-glow"></div><div class="trophy-hex"><svg viewBox="0 0 120 140" fill="none"><path d="M36 18h48v42c0 24-15 38-24 40C50 98 36 84 36 60V18Z" stroke="currentColor" stroke-width="4"/><path d="M36 28H14v14c0 15 12 24 29 25M84 28h22v14c0 15-12 24-29 25M60 100v18m-19 5h38" stroke="currentColor" stroke-width="4"/><path d="m60 39 5 11 12 2-9 9 2 13-10-6-11 6 3-13-9-9 12-2 5-11Z" fill="currentColor"/></svg></div><div class="arena-lines"></div></div>
   <div class="theater-copy"><span class="theater-index">STAGE ${String(n).padStart(2,'0')} / ${max}</span><h3>${esc(stage)}</h3><strong>${esc(headline)}</strong><p>${esc(subtitle)}</p><div class="theater-meter" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="${max}" aria-label="Rounds completed"><i style="width:${(100*n/max).toFixed(1)}%"></i></div><small>${n} of ${max} stages · seeded hypothetical outcomes</small></div>
  </div><div class="theater-bottom"><span>100% SIMULATED · NOT A LIVE GAME</span><span>${done?'TITLE DECIDED':'BRACKET CONTROL / ACTIVE'}</span></div>
 </section>`;
}
function awardsShowcase(awards,compact=false){
 if(!awards)return '';
 const rows=[['MVP',awards.mvp,'Tournament Most Valuable Player'],['OPOY',awards.opoy,'Offensive Player of the Year'],['DPOY',awards.dpoy,'Defensive Player of the Year'],['TITLE GAME MVP',awards.titleMvp,'National Championship standout']];
 return `<section class="awards-showcase ${compact?'awards-in-ceremony':''}" aria-label="Simulated tournament awards">
 <div class="awards-head"><span>THE DYNASTY HONORS</span><strong>2026 NATIONAL AWARDS</strong></div>
 <div class="awards-grid">${rows.map(([shortName,p,explain],i)=>`<article class="award-card"><span class="award-kicker">${String(i+1).padStart(2,'0')} / ${shortName}</span><div class="award-seal" aria-hidden="true"><span>★</span></div><h4>${esc(p?.name||'Unassigned')}</h4><b>${esc(p?.team?name(p.team):'Data unavailable')}</b><small>${esc(explain)}</small><span class="award-stat">${p?esc(p.role==='DEF'?'SIMULATED TEAM DEFENSE':p.interceptions!==undefined?`${p.interceptions} INT · ${p.fumbleRecoveries} FUMBLE REC`:`${Math.round(p.pass)} PASS / ${Math.round(p.rush)} RUSH / ${Math.round(p.receiving)} REC YDS`):'NO PARTICIPATION DATA'}</span></article>`).join('')}</div>
 <p class="award-disclosure">FICTIONAL TOURNAMENT AWARDS — calculated only from simulated box scores, not observed season totals. Defensive credited takeaways are explicitly synthetic allocations to roster-listed candidates, not verified starts or individual plays. Replays can change every winner.</p></section>`;
}
function fullBracketView(){
 const t=state.tournament,f=FORMAT_MAP[t.formatId];
 const max=Math.ceil(Math.log2(f.size));
 const rounds=[];
 for(let stage=0;stage<max;stage++){
  const completed=t.rounds[stage];
  if(completed){rounds.push({stage,name:completed.name,matches:completed.matches});continue;}
  if(stage===t.stage&&!t.champion){
   const m=Array.from({length:t.slots.length/2},(_,i)=>({a:t.slots[2*i],b:t.slots[2*i+1],game:t.played[i]||null}));
   rounds.push({stage,name:roundNameForView(t.formatId,stage),matches:m});continue;
  }
  // Future rounds remain empty until the actual contenders are known.
  const slots=Math.max(1,2**(max-stage-1));
  rounds.push({stage,name:roundNameForView(t.formatId,stage),matches:Array.from({length:slots},()=>({a:null,b:null,game:null}))});
 }
 return `<section class="full-bracket" aria-label="Complete tournament bracket tree"><div class="full-bracket-guide"><b>FULL BRACKET / ${f.size} SCHOOL TREE</b><span>Scroll sideways for later rounds and vertically for the complete field. No results are omitted.</span></div><div class="full-bracket-scroll" role="region" tabindex="0" aria-label="Complete bracket, all rounds and byes"><div class="full-bracket-columns">${rounds.map(r=>`<div class="full-bracket-column"><div class="full-round-top"><b>ROUND ${r.stage+1}</b><strong>${esc(r.name)}</strong><span>${r.matches.filter(m=>m.game).length} played / ${r.matches.length} slots</span></div>${r.matches.map((m,i)=>`<div class="full-match ${m.game?'played':m.a||m.b?'pending':'empty'}"><div class="full-match-index">#${String(i+1).padStart(3,'0')} · ${m.game?'FINAL':m.a&&m.b?'UPCOMING':m.a||m.b?'BYE':'TBD'}</div><div class="full-team ${m.game?.winner===m.a?'won':''}"><span>${esc(m.a?name(m.a):'TBD')}</span><b>${m.game?m.game.final[0]:'—'}</b></div><div class="full-team ${m.game?.winner===m.b?'won':''}"><span>${esc(m.b?name(m.b):m.a?'BYE':'TBD')}</span><b>${m.game?m.game.final[1]:'—'}</b></div>${m.game?`<button type="button" data-action="inspect:${r.stage}:${i}">VIEW SCOREBOX + STATS</button>`:''}</div>`).join('')}</div>`).join('')}</div></div></section>`;
}
function scoreboardAudit(){
 const report=state.report||safeTournamentReport(state.tournament);
 if(report.error)return `<section class="scorebox-audit failed" role="alert"><h3>SCOREBOX AUDIT FAILED</h3><p>${esc(report.error)}</p></section>`;
 return `<section class="scorebox-audit" aria-label="Tournament scorebox validation"><div class="scorebox-audit-title"><div><small>SCOREBOOK / RECONCILIATION ENGINE</small><h3>${report.failed?'REVIEW REQUIRED':'SCORES VERIFIED INTERNALLY'}</h3></div><strong>${report.audited} / ${report.played} PASS</strong></div><p>${report.checks} automated scorebox checks, ${report.failed} mismatches. Every displayed score can be traced to generated drives, quarters, player boxes and bracket advancement. Internal consistency does <b>not</b> establish forecasting calibration.</p>${report.scores.length?`<details class="scorebox-directory"><summary>OPEN ALL ${report.scores.length} MATCH REPORTS / SCOREBOX INDEX</summary><div class="scorebox-directory-scroll" role="region" tabindex="0" aria-label="Full simulated game scorebook"><table><thead><tr><th>ROUND</th><th>MATCH</th><th>BOX</th><th>FINAL SCORE</th><th>CHECK</th></tr></thead><tbody>${report.scores.map(x=>`<tr><td>${esc(x.roundName)}</td><td>${x.index+1}</td><td><button data-action="inspect:${x.round}:${x.index}">BOX #${x.index+1}</button></td><td>${esc(name(x.a))} ${x.game.final[0]} – ${x.game.final[1]} ${esc(name(x.b))}</td><td>${x.box.ok?'PASS':'FAIL'}</td></tr>`).join('')}</tbody></table></div></details>`:''}</section>`;
}
function showcaseOverlay(){
 const x=state.showcase;if(!x)return '';
 const t=state.tournament,f=FORMAT_MAP[t.formatId],count=t.rounds.reduce((n,r)=>n+r.matches.filter(m=>m.game).length,0);
 const reveal=['champion','awards','finish'].includes(x.phase);
 const awarding=['awards','finish'].includes(x.phase);
 const finished=x.phase==='finish';
 const just=x.latest;
 const title=x.phase==='kickoff'?'THE DYNASTY BEGINS':x.phase==='field'?'THE FIELD IS LOCKED':x.phase==='tunnel'?'TAKE THE FIELD':x.phase==='round'?x.label:reveal?'NATIONAL CHAMPIONS':'PREPARING THE BRACKET';
 const sub=x.phase==='round'?'Every result below comes from the actual seeded simulation round.':reveal?'The final scorebook has been reconciled.':'Welcome to the National Championship Showcase.';
 const progress=Math.round((count/Math.max(1,f.size-1))*100);
 return `<div id="dynasty-showcase" class="dynasty-showcase stage-${esc(x.phase)}" data-phase="${esc(x.phase)}" role="dialog" aria-modal="true" aria-label="National championship broadcast simulation" tabindex="-1">
  <div class="showcase-vignette" aria-hidden="true"></div><div class="showcase-crowd" aria-hidden="true"></div>
  <div class="showcase-inner"><div class="showcase-scorestrip"><span>DYNASTY MODE // 2026</span><b>NATIONAL CHAMPIONSHIP</b><span>LIVE SIMULATION · FICTIONAL</span></div>
  <div class="showcase-crawl"><span>COLLEGE GRIDIRON CLASSIC</span><span>${esc(f.label)}</span><span>ALL ${f.size} ENTRANTS</span></div>
  <div class="showcase-spotlight" aria-hidden="true"><span class="showcase-light left"></span><span class="showcase-light right"></span><span class="showcase-trophy">★</span></div>
  <div class="showcase-copy"><span class="showcase-kicker">ROUND ${Math.min(t.rounds.length,f.size)} · ${f.size} TEAM ELIMINATION</span><h2>${esc(title)}</h2>
   <h3>${reveal?esc(name(t.champion)):'THE ROAD TO GLORY'}</h3><p>${esc(sub)}</p></div>
  ${reveal?`<div class="showcase-winner"><span>★ ★ ★ ★ ★</span><strong>${esc(name(t.champion))}</strong><b>2026 NATIONAL CHAMPION · SIMULATED</b></div>`:
   just?`<div class="showcase-live-score" aria-label="Latest completed game"><span>JUST PLAYED · ${esc(x.label)}</span><strong>${esc(short(just.config.a))} ${just.final[0]} <i>:</i> ${just.final[1]} ${esc(short(just.config.b))}</strong><small>${scoreboxFor(just).ok?'BOX SCORE CHECKED':'CHECK FAILED'}</small></div>`:
   `<div class="showcase-live-score"><span>STADIUM TRANSMISSION</span><strong>${f.size} PROGRAMS // ONE TROPHY</strong><small>KICKOFF SEQUENCE ACTIVE</small></div>`}
  ${awarding?awardsShowcase(state.report?.awards,true):''}
  <div class="showcase-progress"><div class="showcase-progress-top"><b>${count} / ${f.size-1} GAMES RESOLVED</b><span id="showcase-timecode">BROADCAST ON AIR</span></div><div class="showcase-progress-track"><span id="showcase-timebar" style="width:${progress}%"></span></div><small>ACTUAL ROUND PROGRESSION · 11.6 SECOND MINIMUM TO CHAMPION REVEAL</small></div>
  <div class="showcase-controls"><button type="button" data-action="showcase-cancel" class="showcase-abort">${finished?'DISCARD REPLAY':'CANCEL SIMULATION'}</button>${finished?'<button type="button" class="showcase-open-results" data-action="showcase-dismiss">OPEN THE FULL BRACKET + TROPHY CASE →</button>':'<span class="showcase-tuning">BROADCAST IN PROGRESS</span>'}</div>
  </div><div class="showcase-confetti" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--x:${i*4}%;--delay:${(i*.035).toFixed(2)}s;--dur:${(2.1+i*.08).toFixed(2)}s;--turn:${i*31}deg"></i>`).join('')}</div>
 </div>`;
}
function playoffCalendar(){
 if(state.format!=='fbs12')return '';
 return `<section class="schedule-section" aria-label="Published 2026–27 CFP postseason dates"><div class="schedule-head"><span>2026–27 / ACTUAL CFP CALENDAR</span><a href="${esc(COMMITTEE_2026.url)}" target="_blank" rel="noopener noreferrer">Official source ↗</a></div><div class="schedule-tracks">${CFP_SCHEDULE_2026.map(item=>`<article class="schedule-event"><time datetime="${item.date}">${esc(item.display)}</time><b>${esc(item.stage)}</b><small>${esc(item.details)}</small></article>`).join('')}</div><p>These are published dates and bowl sites, not simulated matchups. The first four hosts, conference-champion bids and final committee bracket remain undecided.</p></section>`;
}
function playoffPage(){const f=FORMAT_MAP[state.format],n=f.size,pregame=!state.tournament.rounds.length;
 const explanation=f.kind==='official-fbs'?f.id==='fbs12'?'Official CFP bracket geometry; November 17 interim rankings with FIVE EXPLICITLY ASSUMED conference delegates (Georgia, UCLA, Utah, Miami, Boise State). Champions and automatic bids are NOT decided, so this is not the final field.':'The 24-team CFP takes effect in 2027–28. This is a 2026-ranked fantasy preview; no 2027 committee rankings exist.':f.kind==='hypothetical'?'An alternative national championship: fantasy structure, FBS rosters, and model seed order.':'FCS-inspired geometry with mixed teams; NOT an official FCS field.';
 return `${topper('PLAYOFF SIMULATION',n>=68?'EVERY TEAM.<br><em>ONE TITLE.</em>':'THE ROAD<br><em>TO THE TITLE.</em>',n>=68?(ranked2026Field().covered?'A true national open. Start with the strongest model-rated 2026 teams, trade seeds, then write a new history.':'A national open. Team rankings are currently unavailable, so the field is unranked until research data load.'):(ranked2026Field().covered?'Provisional 2026 model seeds. Swap the seeds. Every game has its own report.':'Unranked fallback: no rating artifact available. The game remains playable.'))}
 <section class="playoff-console"><div class="console-intro"><div><span class="eyebrow">01 / CHOOSE YOUR TOURNAMENT</span><h2>Build the field.</h2></div><span class="console-season">${esc(f.season)}</span></div><div class="playoff-picker"><label><small>TOURNAMENT FORMAT</small>${ctl('format',FORMATS.filter(x=>x.kind!=='fcs-inspired').map(x=>[x.id,x.label]),state.format)}</label><div class="playoff-action-row">${state.sourcesReady?button('playoff-run',state.playoffBusy?'Simulating…':'PLAY FULL TOURNAMENT ◆','primary'):`<button type="button" class="action primary" disabled>Loading 2026 ratings…</button>`}${state.sourcesReady?button('playoff-next',state.tournament.champion?'Play new first round':'Simulate next round →','outline'):'<button class="action outline" disabled>Next round</button>'}${state.sourcesReady?button('playoff-mc',state.mcBusy?'Calculating…':'Estimate title share','outline'):'<button class="action outline" disabled>Title study</button>'}${button('playoff-reset','Reset bracket','subtle')}</div></div><p class="rules-note">${esc(explanation)}</p></section>${playoffTheater()}${playoffCalendar()}${seedEditor()}${errorBox()}
 <section class="bracket-section">${subtitle('02','Your road to the final',n>=68?'Read one round at a time. Choose a quadrant to explore large fields. Select any played game for its complete report.':'Swipe across rounds and select any played game for its complete report.')}${tournamentOverview()}<div class="bracket-mode-switch" role="group" aria-label="Bracket viewing mode">${button("bracket-atlas","ROUND VIEW",state.bracketMode==="atlas"?"selected":"outline")}${button("bracket-full","FULL TREE · ALL ROUNDS",state.bracketMode==="full"?"selected":"outline")}</div>${state.bracketMode==="full"?fullBracketView():bracketRounds()}${scoreboardAudit()}</section>
 <section class="titles-section">${subtitle('03','Who takes the title?','Champion shares come from complete hypothetical tournament simulations, not sportsbook odds.')}
 <div class="champion-banner"><span>2026 FBS / NATIONAL CHAMPIONSHIP EXPERIMENT</span><h2>${state.tournament.champion?esc(name(state.tournament.champion)):'A champion awaits.'}</h2><p>${state.tournament.champion?'Winner of this one hypothetical bracket.':'Simulate the field to find a champion.'}</p></div>${state.report?.awards?awardsShowcase(state.report.awards):""}${titleLeaderboard()}</section>${playoffGameInspector()}`;
}
function actualData(){const rec=sourceStatus.seasons[2026],roster=sourceStatus.rosters[2026];return `<div class="data-grid"><article><span>2026 FBS PROGRAM INDEX</span><strong>${fbs.length}</strong><p>Included as selectable schools. Historical data coverage varies by artifact.</p></article><article><span>2026 REPORTED GAME SCORES</span><strong>${rec?.gamesWithScores!=null?integer(rec.gamesWithScores):'—'}</strong><p>${rec?'Reported completed FBS-involving games as of '+esc(String(rec.asOf||'').slice(0,10))+' UTC':'Season snapshot not installed'}.</p></article><article><span>2026 ROSTER NAMES</span><strong>${roster?integer(roster.players):'—'}</strong><p>${roster?'Season-scoped identities, not active starters':'Optional roster snapshot not installed'}.</p></article></div>`;}
function seedingAudit(){const rank=ranked2026Field();
 if(!rank.covered)return `<p class="empty-panel">The 2026 rating artifact did not load, so no strength-ordered seed ranking is reported.</p>`;
 return `<details class="disclosure"><summary>2026 Elo seeding input <span>Top 20 · provisional</span></summary><div class="table-scroll"><table class="stat-table"><caption>2026 Elo research rating used for hypothetical bracket seeds</caption><thead><tr><th>RANK</th><th>TEAM</th><th>2026 ELO</th></tr></thead><tbody>${rank.ids.slice(0,20).map((id,i)=>`<tr><td>${i+1}</td><th>${esc(name(id))}</th><td>${fmt(rank.scores?.[id])}</td></tr>`).join('')}</tbody></table></div><p class="subcaption">As of ${esc(rank.asOf)}. Rating-based seeds are for fun tournament design, not the official College Football Playoff ranking. Actual simulated score outcomes use a separate, uncalibrated possession engine.</p></details>`;
}
function calibrationGraphic(){const doc=modelComparison();if(!doc)return `<div class="empty-panel">The independently evaluated benchmark artifact is not currently available. Results are not filled with fake numbers.</div>`;const labels={coin:'Coin flip',homeOnly:'Home-site baseline',elo:'Elo rating',margin:'Scoring-margin baseline',fixedBlend:'Fixed blend',logisticPair:'Two-feature logistic'},entry=doc.evaluation['2026'];return `<div class="table-scroll"><table class="stat-table model-table"><thead><tr><th>HISTORICAL MODEL</th><th>2025 VALIDATION BRIER</th><th>2026 FORWARD BRIER</th><th>2026 VISUAL COMPARISON</th></tr></thead><tbody>${Object.entries(labels).map(([id,label])=>`<tr ${doc.modelSelectedOn2025===id?'class="chosen-model"':''}><th>${label}${doc.modelSelectedOn2025===id?'<small>Picked using 2025 only</small>':''}</th><td>${fmt(doc.evaluation['2025'][id].brier,4)}</td><td>${fmt(entry[id].brier,4)}</td><td><div class="audit-meter" role="img" aria-label="Brier loss ${fmt(entry[id].brier,4)}"><span style="width:${(entry[id].brier/.35*100).toFixed(1)}%"></span></div></td></tr>`).join('')}</tbody></table></div><p class="subcaption">Lower Brier score is better. The 2026 set was inspected in previous iterations; do not treat it as untouched testing.</p>`;}
function reliabilityPlot(){const bins=modelComparison()?.reliability2026||[];if(!bins.length)return '<p>Calibration bins unavailable.</p>';const W=620,H=285,L=52,R=25,T=18,B=42,xx=p=>L+p*(W-L-R),yy=p=>T+(1-p)*(H-T-B);const pts=bins.map(v=>`<line x1="${xx(v.meanPrediction)}" x2="${xx(v.meanPrediction)}" y1="${yy(v.wilson95[1])}" y2="${yy(v.wilson95[0])}" stroke="#dd6242" stroke-width="2"/><circle cx="${xx(v.meanPrediction)}" cy="${yy(v.observedFrequency)}" r="5" fill="#dd6242"><title>${percent(v.meanPrediction)} predicted; ${percent(v.observedFrequency)} observed · n=${v.n}</title></circle>`).join('');return `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="Model calibration plot with observed frequency against predicted probability"><title>Predicted win probability compared with actual win share</title>${[0,.25,.5,.75,1].map(v=>`<line x1="${L}" y1="${yy(v)}" x2="${W-R}" y2="${yy(v)}" stroke="#a6b0ba"/><text x="${L-8}" y="${yy(v)+3}" text-anchor="end" fill="#526272" font-size="12">${percent(v)}</text><text x="${xx(v)}" y="${H-17}" text-anchor="middle" fill="#526272" font-size="12">${percent(v)}</text>`).join('')}<line x1="${L}" y1="${yy(0)}" x2="${xx(1)}" y2="${yy(1)}" stroke="#8c9aa8" stroke-width="1.5" stroke-dasharray="6 7"/>${pts}<text x="${W/2}" y="${H-2}" text-anchor="middle" fill="#526272" font-size="11">MEAN PREDICTED WIN CHANCE</text></svg>`;}
function scoreEvaluation(){const doc=scoreEvidence(),e=doc?.evaluations?.['2026'];if(!e)return `<div class="empty-panel">Score-distribution evaluation artifact unavailable.</div>`;return `<div class="coverage-bars"><div class="coverage-intro"><div><small>2026 EVALUATION</small><strong>${integer(e.n)}</strong><p>Completed historical FBS games evaluated.</p></div><div><small>MARGIN CRPS</small><strong>${fmt(e.margin.crps,2)}</strong><p>Lower is better; entire distribution matters.</p></div><div><small>TOTAL CRPS</small><strong>${fmt(e.total.crps,2)}</strong><p>Lower is better.</p></div></div>${[['Margin · 80%','margin',.8,'interval80Coverage'],['Margin · 90%','margin',.9,'interval90Coverage'],['Total · 80%','total',.8,'interval80Coverage'],['Total · 90%','total',.9,'interval90Coverage']].map(([label,type,target,k])=>`<div class="coverage-row"><span>${label}</span><div class="coverage-track"><i style="left:${(target*100).toFixed(1)}%"></i><b style="width:${(100*e[type][k]).toFixed(1)}%"></b></div><strong>${percent(e[type][k])}</strong></div>`).join('')}<p class="subcaption">Colored bar: observed interval coverage. Tick mark: target. These validate the historical residual distribution, not the possession simulator.</p></div>`;}
function replayEvaluation(){
 const x=playableCalibrationSnapshot();
 if(!x)return '<div class="empty-panel">Playable simulator temporal backtest not installed. Historical research forecasts and fictional game outcomes remain separate.</div>';
 const data=[['2025 · previously inspected check',x.validation2025],['2026 · examined forward check',x.evaluation2026]];
 const row=(title,e)=>`<tr><th scope="row">${esc(title)}</th><td>${integer(e.n)}</td><td>${fmt(e.scoreMAE,2)}</td><td>${fmt(e.brier,4)}</td><td>${fmt(e.marginCRPS,2)}</td><td>${fmt(e.totalCRPS,2)}</td><td>${percent(e.coverage80Margin)}</td><td>${percent(e.coverage80Total)}</td></tr>`;
 return `<section class="viz-sheet" aria-label="Playable game generator temporal backtest"><div class="viz-head"><span>ACTUAL REPLAY ENGINE · 2024 FIT / 2025 GATE / 2026 CHECK</span><h3>Historical validation of playable scores</h3><p>${x.enabled?'Historical 2025 acceptance gate passed.':'Historical 2025 acceptance gate failed: research conditioning disabled.'} Parameters fitted on 2024 only; both 2025 and 2026 have been consulted during development and are NOT pristine holdouts. This does NOT validate individual players, starters or drive physics.</p></div><div class="table-scroll"><table class="stat-table"><caption>Pregame chronological simulation evaluation</caption><thead><tr><th>PERIOD</th><th>GAMES</th><th>TEAM SCORE MAE</th><th>WIN BRIER</th><th>MARGIN CRPS</th><th>TOTAL CRPS</th><th>MARGIN 80% COVER</th><th>TOTAL 80% COVER</th></tr></thead><tbody>${data.map(([label,e])=>row(label,e)).join('')}</tbody></table></div><p class="subcaption">Training: ${integer(x.fitGames)} games in 2024; fitted scoring baseline ${fmt(x.base,0)} points, per-team game volatility ${fmt(x.volatility,2)} and differential margin volatility ${fmt(x.marginVolatility,2)}. An 80% interval ideally covers 80% of real scores. Source cutoff: ${esc(x.sourceCutoff)}. Only the 2025 validation criteria determine whether the game mode is activated.</p></section>`;
}
function playerEvaluation(){const x=playerModelEvaluation();if(!x)return `<div class="empty-panel">Conditional player-event model artifact not available.</div>`;return `<div class="evaluation-bar"><div><span>RECORDED PLAYER-STAT EVENTS</span><strong>${integer(x.model.n)}</strong></div><div><span>MODEL BRIER</span><strong>${fmt(x.model.brier,4)}</strong></div><div><span>COHORT PRIOR BRIER</span><strong>${fmt(x.cohortPriorOnlyBaseline.brier,4)}</strong></div></div><p class="subcaption">Population: recorded statistic-event games, not all scheduled games. This cannot establish unconditional player props without injury, availability and participation coverage.</p>`;}
function dataSources(){return `<details class="disclosure"><summary>Sources, model card & current limitations <span>read more</span></summary><div class="sources-grid"><div><h3>Observed game results</h3><p>2025/2026 SportsDataverse source snapshots and 2026 season-to-date metadata. Published results can lag.</p>${safeLink('https://github.com/sportsdataverse/cfbfastR-data','SportsDataverse')}</div><div><h3>Rosters and event summaries</h3><p>Names are historically roster-listed. Derived player events omit some non-appearances; no source claims an athlete is healthy or starting.</p>${safeLink('https://github.com/fakhar-ud-din/ncaapyscraper','School roster source')}</div><div><h3>Reproducibility and audit</h3><p>Seeded games, trained winner baseline, chronological evaluation and documented limitations.</p>${safeLink('./docs/VALIDATION_V08.md','Validation methodology')} · ${safeLink('./docs/MODEL_CARD.md','Model card')} · ${safeLink('./docs/STATUS.md','Status')}</div></div></details>`;}
function researchPage(){const status=researchStatus();return `${topper('MODEL & VALIDATION','THE MODEL.<br><em>EXPLAINED.</em>','A separate research desk. This is where every number is challenged before it earns a place in the game.')}${callout('<strong>Read this first:</strong> Historical win predictions have empirical evaluation. The drive-by-drive engine and named-player game props remain synthetic. Monte Carlo error is not model accuracy.','important')}${subtitle('01','Evidence before precision','Real observations, fitted research and simulated outcomes are different layers.')}${actualData()}${seedingAudit()}<section class="audit-section">${subtitle('02','Which model held up?','Chronological baselines trained on older seasons; no postgame features in pregame research.')}${calibrationGraphic()}<div class="two-viz"><article class="viz-sheet"><div class="viz-head"><span>RELIABILITY STUDY</span><h3>Predicted versus observed</h3><p>Dashed diagonal = ideal calibration. Vertical lines = uncertainty.</p></div>${reliabilityPlot()}</article><article class="viz-sheet audit-explainer"><h3>How to read this chart</h3><p>If games assigned a 60% chance actually win only 45% of the time, the model is too confident in that group.</p><p><b>Brier score</b> penalizes inaccurate probability forecasts. Lower is better; 0.25 represents always predicting 50/50 in two-outcome games.</p><p><b>2026 is not pristine holdout data.</b> Earlier iterations already examined it.</p></article></div></section><section class="audit-section">${subtitle('03','How wide is the uncertainty?','Historical score-distribution validation, not drive or player calibration.')}${scoreEvaluation()}${replayEvaluation()}</section><section class="audit-section">${subtitle('04','What do player stats prove?','A recorded stat-event probability cannot be sold as a full-game player prop.')}${playerEvaluation()}</section><section class="audit-section">${subtitle('05','Methods, sources & caveats','The project remains inspectable and reproducible.')}${dataSources()}</section><div class="research-stamp">MODEL VERSION ${esc(status.version||'unavailable')} · LAST RECORDED GAME ${esc(String(status.lastScoredGame||'not installed').slice(0,10))} · ${esc(ENGINE_VERSION)}</div>`;}
function footer(){return `<footer class="footer"><div><b>GRIDIRON<span>/</span>LAB <small>26</small></b><p>An independent college-football simulation studio. Fictional games and illustrative player lines; not official NCAA data, odds or endorsements.</p></div><div class="footer-links">${safeLink('https://github.com/jviola1019/hypothetical_cfb','SOURCE & METHODOLOGY')}<span>2026 / SATURDAY NIGHT EDITION</span></div></footer>`;}
function render(){
 const previousOverlay=root.querySelector('#dynasty-showcase');
 const previousOverlayTop=previousOverlay?.scrollTop||0;
 const previousOverlayPhase=previousOverlay?.dataset?.phase||null;
 const current=document.activeElement;
 const field=root.contains(current)?current?.dataset?.field:null;
 const action=root.contains(current)?current?.dataset?.action:null;
 const keepFocus=!!(field||action);
 root.innerHTML=`${header()}<main id="main" class="site-main" tabindex="-1"><div class="site-width">${state.tab==='game'?gamePage():state.tab==='playoff'?playoffPage():researchPage()}</div></main>${footer()}${showcaseOverlay()}`;
 for(const el of [root.querySelector('main'),root.querySelector('.topbar'),root.querySelector('footer')])if(el)el.inert=Boolean(state.showcase);
 document.body.style.overflow=state.showcase?'hidden':'';
 document.title=`${tabNames[state.tab]} | GRIDIRON LAB`;
 for(const table of root.querySelectorAll('.table-scroll')){
  table.tabIndex=0;
  const caption=table.querySelector('caption')?.textContent?.trim();
  table.setAttribute('role','region');
  table.setAttribute('aria-label',caption?`${caption} (scroll horizontally if needed)`:'Scrollable statistics table');
 }
 if(state.showcase){
  const overlay=root.querySelector('#dynasty-showcase');
  if(overlay){
   overlay.scrollTop=previousOverlayTop;
   overlay.focus({preventScroll:true});
   // Mobile trophy ceremonies must bring the newly revealed awards on-screen.
   // Preserve this position through the final state re-render.
   if(state.showcase.phase==='awards'&&previousOverlayPhase!=='awards'&&
      window.matchMedia?.('(max-width: 680px)').matches){
    const honors=overlay.querySelector('.awards-showcase');
    if(honors){
     const y=honors.getBoundingClientRect().top-overlay.getBoundingClientRect().top+overlay.scrollTop-16;
     overlay.scrollTo({top:Math.max(0,y),behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
   }
  }
 }
 else if(keepFocus){
  const controls=root.querySelectorAll(field?'[data-field]':'[data-action]');
  const next=[...controls].find(el=>field?el.dataset.field===field:el.dataset.action===action);
  next?.focus({preventScroll:true});
 }
}
function stopTask(){state.task++;if(state.worker){state.worker.terminate();state.worker=null;}state.running=false;state.mcBusy=false;}
function refreshForecast(){stopTask();const task=state.task;state.forecast=null;state.running=true;state.progress=0;render();
 if(typeof Worker!=='undefined')try{const w=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});state.worker=w;w.onmessage=e=>{if(task!==state.task)return;const d=e.data;if(d.type==='progress'){state.progress=Math.round(100*d.current/d.total);const el=root.querySelector('.loading-panel');if(el)el.textContent=`Analyzing ${state.progress}%...`;return;}w.terminate();state.worker=null;state.running=false;if(d.type==='result')state.forecast=d.value;else state.error=d.message||'Cannot simulate this matchup';render();};w.onerror=()=>{if(task!==state.task)return;w.terminate();state.worker=null;fallbackForecast(task);};w.postMessage({task,type:'forecast',config:state.config,n:850,datasets:state.datasets,
  playerDocs:[getPlayerEvidence(state.config.a),getPlayerEvidence(state.config.b)].filter(Boolean)});return;}catch{}
 fallbackForecast(task);
}
function fallbackForecast(task){try{const value=simulateBatch(state.config,450);if(task!==state.task)return;state.forecast=value;state.running=false;render();}catch(e){state.running=false;state.error=e.message;render();}}
function newGame(){state.runNumber++;state.config.seed=hash32(`replay:${state.runNumber}:${state.config.a}:${state.config.b}:${state.config.venue}`);state.game=simulateGame(state.config,state.config.seed);refreshForecast();}
function changeField(field,value){try{state.error='';if(field==='a'||field==='b'){if(!TEAM_MAP[value]||TEAM_MAP[value].division!=='fbs')throw Error('Select a supported FBS team');const other=field==='a'?'b':'a';if(state.config[other]===value)state.config[other]=state.config[field];state.config[field]=value;state.runNumber=1;state.config.seed=hash32(`${state.config.a}|${state.config.b}|${state.config.venue}`);state.game=simulateGame(state.config,state.config.seed);refreshForecast();const selected=[state.config.a,state.config.b];Promise.allSettled(selected.map(id=>loadPlayerEvidence(id))).then(()=>{if(state.config.a===selected[0]&&state.config.b===selected[1]){state.game=simulateGame(state.config,state.config.seed);refreshForecast();}});}
 else if(field==='venue'){if(!['a','b','neutral'].includes(value))throw Error('Invalid venue');state.config.venue=value;state.runNumber=1;state.config.seed=hash32(`${state.config.a}|${state.config.b}|${value}`);state.game=simulateGame(state.config,state.config.seed);refreshForecast();}
 else if(field==='format'){if(!FORMAT_MAP[value])throw Error('Unknown bracket format');stopTask();state.format=value;state.bracketMode='atlas';state.report=null;state.finale=null;if(state.finaleTimer)clearTimeout(state.finaleTimer);state.tournament=createTournament(value);state.bracketViewRound=0;state.bracketViewPage=0;state.bracketQuadrant='all';state.seedFrom=0;state.seedTo=1;state.selectedMatch=null;state.tournamentMC=null;render();}
 else if(field==='swap-from'||field==='swap-to'){const i=Number(value);if(!Number.isInteger(i)||i<0||i>=state.tournament.participants.length)throw Error('Invalid swap position');state[field==='swap-from'?'seedFrom':'seedTo']=i;}
 else if(field==='bracket-quadrant'){if(!['all','1','2','3','4'].includes(value))throw Error('Unknown bracket quadrant');state.bracketQuadrant=value;state.bracketViewPage=0;render();}
 }catch(e){state.error=e.message;render();}}
function openMatch(round,idx){const rr=state.tournament.rounds[round],m=rr?.matches[idx];if(!m?.game)return;state.selectedMatch={game:m.game,round:rr.name};render();root.querySelector('#game-inspector')?.focus({preventScroll:true});root.querySelector('#game-inspector')?.scrollIntoView({block:'start',behavior:'smooth'});}
function showTournamentResult(kind){
 if(state.finaleTimer)clearTimeout(state.finaleTimer);
 state.finale={kind,champion:state.tournament.champion};
 state.finaleTimer=setTimeout(()=>{state.finale=null;state.finaleTimer=null;render();},kind==='full'?3600:1500);
}
function stopShowcase(restore=false){
 const x=state.showcase;
 ++state.showcaseToken;
 for(const timer of state.showcaseTimers)clearTimeout(timer);
 state.showcaseTimers=[];
 if(state.showcaseTicker)clearInterval(state.showcaseTicker);
 state.showcaseTicker=null;
 if(restore&&x?.original){state.tournament=x.original;state.report=safeTournamentReport(x.original);}
 state.showcase=null;state.playoffBusy=false;
}
function beginFullShowcase(){
 if(state.playoffBusy||state.showcase)return;
 state.error='';
 if(state.finaleTimer)clearTimeout(state.finaleTimer);
 state.finale=null;
 const original=state.tournament;
 const starting=original.champion?createTournament(state.format,original.participants,hash32('bracket:'+state.tournamentRuns++)):original;
 const roundsLeft=Math.ceil(Math.log2(FORMAT_MAP[state.format].size))-starting.rounds.length;
 const timeline=ceremonyTimeline(roundsLeft);
 const token=++state.showcaseToken;
 state.tournament=starting;state.report=safeTournamentReport(starting);state.selectedMatch=null;state.tournamentMC=null;
 state.showcase={original,startedAt:performance.now(),phase:'kickoff',label:'FIELD INTRO',latest:null};
 state.playoffBusy=true;render();
 const tick=()=>{if(token!==state.showcaseToken||!state.showcase)return;
  const elapsed=Math.max(0,performance.now()-state.showcase.startedAt);
  const v=root.querySelector('#showcase-timecode');
  if(v)v.textContent=(elapsed/1000).toFixed(1)+'s / '+(SHOWCASE.finishMs/1000).toFixed(1)+'s';
 };
 state.showcaseTicker=setInterval(tick,100);
 for(const item of timeline.slice(1)){
  const timer=setTimeout(()=>{
   if(token!==state.showcaseToken||!state.showcase)return;
   try{
    if(item.type==='round'){
     const next=simulateRound(state.tournament,{seasonA:2026,seasonB:2026});
     const report=tournamentReport(next); // throws on scorebox or bracket mismatch
     state.tournament=next;state.report=report;
     state.showcase.phase='round';state.showcase.label=next.rounds.at(-1).name;
     state.showcase.latest=next.rounds.at(-1).matches.find(m=>m.game)?.game||null;
     state.bracketViewRound=next.rounds.length-1;
     state.bracketViewPage=0;
    }else if(item.type==='champion'){
     if(!state.tournament.champion||!state.report?.complete)throw Error('The championship result failed to reconcile');
     if(performance.now()-state.showcase.startedAt<SHOWCASE.championRevealMs-15)throw Error('Premature champion reveal');
     state.showcase.phase='champion';
    }else if(item.type==='awards'){
     if(!state.report?.awards)throw Error('Tournament awards unavailable: boxscore validation failed');
     state.showcase.phase='awards';
    }else if(item.type==='finish'){
     state.showcase.phase='finish';state.playoffBusy=false;
    }else{
     state.showcase.phase=item.type;
    }
    render();tick();
   }catch(e){stopShowcase(true);state.error='Tournament halted: '+e.message;render();}
  },item.at);
  state.showcaseTimers.push(timer);
 }
}
function runTournament(roundOnly=false){
 if(!roundOnly){beginFullShowcase();return}
 if(state.showcase||state.playoffBusy)return;
 try{
  state.error='';state.playoffBusy=true;
  const current=state.tournament;
  const starting=current.champion?createTournament(state.format,current.participants,hash32('bracket:'+state.tournamentRuns++)):current;
  const next=simulateRound(starting,{seasonA:2026,seasonB:2026});
  const report=tournamentReport(next);
  state.tournament=next;state.report=report;state.selectedMatch=null;state.tournamentMC=null;
  state.bracketViewRound=state.tournament.rounds.length-1;state.bracketViewPage=0;state.bracketQuadrant='all';
  state.playoffBusy=false;showTournamentResult('round');render();
 }catch(e){state.playoffBusy=false;state.error='Round failed validation: '+e.message;render()}
}
function titleMC(){if(state.mcBusy)return;state.mcBusy=true;state.error='';const task=++state.task;const base={seasonA:2026,seasonB:2026};const t=createTournament(state.format,state.tournament.participants,hash32('title:'+state.tournament.seed));render();
 if(typeof Worker!=='undefined')try{const w=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});state.worker=w;w.onmessage=e=>{if(task!==state.task)return;const d=e.data;if(d.type==='progress'){const btn=root.querySelector('[data-action="playoff-mc"]');if(btn)btn.textContent=`Simulating ${Math.round(d.current/d.total*100)}%`;return;}w.terminate();state.worker=null;state.mcBusy=false;if(d.type==='result')state.tournamentMC=d.value;else state.error=d.message;render();};w.onerror=()=>{if(task!==state.task)return;w.terminate();state.worker=null;titleMCFallback(task,t,base);};w.postMessage({task,type:'tournament',n:400,tournament:t,config:base,datasets:state.datasets});return;}catch{}
 setTimeout(()=>titleMCFallback(task,t,base),0);
}
function titleMCFallback(task,t,base){
 // Worker-free fallback yields between independent batches to avoid a long
 // synchronous 128-team tournament study on mobile browsers.
 const count=120,batch=12,combined={n:0,counts:{},gamesPlayed:{}};
 const finals=new Map();let completed=0;
 const pump=()=>{
  if(task!==state.task)return;
  try{
   const take=Math.min(batch,count-completed);
   const run=createTournament(t.formatId,t.participants,hash32(`mc-fallback:${t.seed}:${completed}`));
   const part=monteCarloTournament(run,take,base);
   combined.n+=take;
   for(const [id,c] of Object.entries(part.counts))combined.counts[id]=(combined.counts[id]||0)+c;
   for(const [id,avg] of Object.entries(part.gamesPlayed))combined.gamesPlayed[id]=(combined.gamesPlayed[id]||0)+avg*take;
   for(const [key,c] of part.finalMatchups)finals.set(key,(finals.get(key)||0)+c);
   completed+=take;
   const control=root.querySelector('[data-action="playoff-mc"]');
   if(control)control.textContent=`Simulating ${Math.round(100*completed/count)}%`;
   if(completed<count){setTimeout(pump,0);return;}
   combined.probabilities=Object.fromEntries(Object.entries(combined.counts).map(([id,c])=>[id,c/count]));
   combined.gamesPlayed=Object.fromEntries(Object.entries(combined.gamesPlayed).map(([id,total])=>[id,total/count]));
   combined.finalMatchups=[...finals].sort((a,b)=>b[1]-a[1]).slice(0,10);
   state.tournamentMC=combined;
  }catch(e){state.error=e.message;}
  state.mcBusy=false;render();
 };
 setTimeout(pump,0);
}
function action(a){if(a==='showcase-cancel'){stopShowcase(true);render();return;}if(a==='showcase-dismiss'){if(state.showcase?.phase!=='finish')return;stopShowcase(false);state.bracketMode='full';render();const honors=root.querySelector('.awards-showcase');if(honors){honors.tabIndex=-1;honors.focus({preventScroll:true});honors.scrollIntoView({block:'start',behavior:'smooth'});}return;}if(state.showcase)return;if(a.startsWith('tab-')){const next=a.slice(4);if(!tabNames[next])return;state.tab=next;render();window.scrollTo?.(0,0);return;}if(a==='new-game'){newGame();return;}if(a==='playoff-run'||a==='playoff-next'){if(!state.sourcesReady){state.error='2026 data is still loading';render();return;}runTournament(a==='playoff-next');return;}if(a==='playoff-mc'){titleMC();return;}if(a==='playoff-reset'){state.report=null;state.finale=null;if(state.finaleTimer)clearTimeout(state.finaleTimer);state.tournament=createTournament(state.format,state.tournament.participants);state.bracketViewRound=0;state.bracketViewPage=0;state.bracketQuadrant='all';state.tournamentMC=null;state.selectedMatch=null;render();return;}
 if(a==='restore-ranked'){state.report=null;state.finale=null;if(state.finaleTimer)clearTimeout(state.finaleTimer);state.tournament=createTournament(state.format);state.bracketViewRound=0;state.bracketViewPage=0;state.bracketQuadrant='all';state.tournamentMC=null;state.selectedMatch=null;render();return;}
 if(a==='swap-seeds'){try{state.tournament=swapTournamentSeeds(state.tournament,state.seedFrom,state.seedTo);state.report=null;state.tournamentMC=null;state.selectedMatch=null;state.error='';}catch(e){state.error=e.message;}render();return;}
 if(a==='bracket-full'||a==='bracket-atlas'){state.bracketMode=a==='bracket-full'?'full':'atlas';render();return;}if(a.startsWith('round:')){const n=Number(a.slice(6));if(Number.isInteger(n)&&n>=0&&n<=state.tournament.rounds.length){state.bracketViewRound=n;state.bracketViewPage=0;state.bracketQuadrant='all';render();}return;}
 if(a.startsWith('page:')){const n=Number(a.slice(5));if(Number.isInteger(n)&&n>=0&&n<=30){state.bracketViewPage=n;render();}return;}if(a==='close-inspector'){state.selectedMatch=null;render();return;}if(a.startsWith('inspect:')){const [_,r,i]=a.split(':');openMatch(Number(r),Number(i));return;}if(a.startsWith('prop:')){state.selectedProp=a.slice(5);render();root.querySelector('.expanded-chart')?.scrollIntoView({block:'nearest',behavior:'smooth'});}}
root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){e.preventDefault();action(b.dataset.action);}});
root.addEventListener('change',e=>{const b=e.target.closest('[data-field]');if(b)changeField(b.dataset.field,b.value);});
// Immediately render an independently seeded hypothetical game even if the source
// artifacts have not downloaded. Loading metadata never blocks the core game.
state.game=simulateGame(state.config,state.config.seed);
render();
Promise.allSettled([loadPublicData(),loadResearchSnapshot(),loadModelComparison(),loadScoreEvidence(),loadPlayerModelEvaluation(),loadPlayableCalibration()]).then(results=>{
 const data=results[0].status==='fulfilled'?results[0].value:null;state.datasets=data?.payloads||[];const empirical=researchSnapshot(),cal=playableCalibrationSnapshot();if(empirical)state.datasets.push({prefix:'research',payload:empirical});if(cal)state.datasets.push({prefix:'playable-calibration',payload:cal});
 state.loading=false;state.sourcesReady=true;state.tournament=createTournament(state.format);state.report=null;state.bracketViewRound=0;
 Promise.allSettled([loadPlayerEvidence(state.config.a),loadPlayerEvidence(state.config.b)]).then(()=>{state.game=simulateGame(state.config,state.config.seed);refreshForecast();});
 render();
});
