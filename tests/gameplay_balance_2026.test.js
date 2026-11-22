import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installResearchSnapshot,evaluatedMatchup} from '../src/research.js';
import {installSeasonSnapshot} from '../src/observed.js';
import {DEFAULT_CONFIG,simulateGame,simulateBatch,gameplayBalanceFor,teamProfile} from '../src/engine.js';
import {auditGeneratedGame} from '../src/gameAudit.js';
const read=p=>JSON.parse(readFileSync(new URL('../public/data/'+p,import.meta.url),'utf8'));
installResearchSnapshot(read('research-2026.json'));
installSeasonSnapshot(read('season-2026.json'));
const profiles=(a,b)=>[teamProfile(a),teamProfile(b)];
test('opponent-adjusted 2026 gameplay reverses Tulsa-Oklahoma raw-schedule-strength misranking',()=>{
 const b=gameplayBalanceFor({...DEFAULT_CONFIG,a:'oklahoma',b:'tulsa',venue:'neutral'},profiles('oklahoma','tulsa'));
 assert.ok(b&&b.a>b.b,'A better Elo team needs higher game intensity on a neutral field');
 assert.ok(b.eloReference>.5);
 assert.equal(b.classification,'opponent-adjusted-elo-guided-synthetic-play-not-forecast');
});
test('2026 current home advantage responds in both directions and is not a universal Power-4 bonus',()=>{
 const a='oklahoma',b='tulsa';
 const n=gameplayBalanceFor({...DEFAULT_CONFIG,a,b,venue:'neutral'},profiles(a,b));
 const home=gameplayBalanceFor({...DEFAULT_CONFIG,a,b,venue:'a'},profiles(a,b));
 const away=gameplayBalanceFor({...DEFAULT_CONFIG,a,b,venue:'b'},profiles(a,b));
 assert.ok(home.a/home.b>n.a/n.b);
 assert.ok(n.a/n.b>away.a/away.b);
 const strongG5=gameplayBalanceFor({...DEFAULT_CONFIG,a:'clemson',b:'east-carolina'},profiles('clemson','east-carolina'));
 assert.ok(strongG5.a< strongG5.b,'Do not blindly boost P4 Clemson over Elo-better ECU');
});
test('a new gameplay ratio cannot leak into time-split historical score evaluation',()=>{
 const c={...DEFAULT_CONFIG,a:'georgia',b:'kent-state',pregameScoring:{a:31,b:17,base:27,volatility:.15,marginVolatility:0}};
 assert.equal(gameplayBalanceFor(c,profiles(c.a,c.b)),null);
 assert.equal(gameplayBalanceFor({...DEFAULT_CONFIG,seasonA:2025,seasonB:2025},profiles('georgia','kent-state')),null);
 const g=simulateGame(c);
 assert.equal(g.scoringMode,'research-conditioned-drive-intensity-not-player-calibration');
 assert.equal(g.gameplayEvidence,null);
});
test('new opponent-adjusted play still yields a deterministic fully reconciled game',()=>{
 const config={...DEFAULT_CONFIG,a:'ohio-state',b:'akron',venue:'a'};
 const a=simulateGame(config,4512),b=simulateGame(config,4512);
 assert.deepEqual(a.final,b.final);
 assert.equal(a.scoringMode,'elo-guided-2026-synthetic-not-calibrated');
 assert.ok(a.gameplayEvidence?.asOf);
 assert.equal(auditGeneratedGame(a),true);
 assert.ok(a.teams.every(t=>t.passYards>=0&&t.rushYards>=0));
});
