import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FBS_TEAMS,FCS_REFERENCE} from '../src/catalog.js';
import {FBS_KITS,FCS_KITS,teamKit,kitStyle,jerseyClash,teamKitCoverage} from '../src/teamKits.js';
import {athleteModel,helmetBadge} from '../src/playerArtwork.js';
import {teamAccent,teamAccentIsCurated} from '../src/branding.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const lum=h=>h.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('all 138 canonical FBS programs and 5 reference opponents have real independent palette entries',()=>{
 assert.equal(FBS_TEAMS.length,138);
 assert.deepEqual(teamKitCoverage(),{fbs:138,fcs:5});
 for(const t of [...FBS_TEAMS,...FCS_REFERENCE]){
  const u=teamKit(t.id);
  assert.equal(u.teamName,t.name,'Missing visual identity '+t.name);
  assert.equal(u.id,t.id);
  assert.equal(u.verified2026Uniform,false);
  assert.ok(teamAccentIsCurated(t.id),t.id);
  assert.equal(teamAccent(t.id),u.jersey);
  for(const key of ['jersey','accent','helmet','pants','number']){
   assert.match(u[key],/^#[a-fA-F0-9]{6}$/,'Malformed '+t.name+' '+key);
  }
  assert.ok(contrast(u.number,u.jersey)>=4.5,'Numerals lack contrast '+t.name);
  assert.ok(['triple','double','shoulder','single','none'].includes(u.stripe),t.name);
  assert.ok(kitStyle(t.id).includes('--school-main:'+u.jersey));
  const away=teamKit(t.id,'away');
  assert.equal(away.jersey,'#F7F6F2');
  assert.ok(contrast(away.number,away.jersey)>=4.5);
 }
 assert.equal(Object.keys(FBS_KITS).length,138);
 assert.equal(Object.keys(FCS_KITS).length,5);
});
test('major school identities preserve recognizable opposing jersey and helmet treatments',()=>{
 const cases=[
 ['ohio-state','#BB0000','#C0C3C7'],['georgia','#BA0C2F','#BA0C2F'],
 ['oregon','#154733','#FCE122'],['lsu','#461D7C','#FDD023'],
 ['michigan','#00274C','#00274C'],['ole-miss','#CE1126','#14213D'],
 ['tennessee','#FF8200','#FFFFFF'],['texas','#BF5700','#FFFFFF'],
 ['notre-dame','#0C2340','#C99700'],['penn-state','#041E42','#FFFFFF'],
 ['usc','#9D2235','#FFC72C'],['washington','#4B2E83','#B7A57A']
 ];
 for(const [id,jersey,helmet] of cases){
  assert.equal(teamKit(id).jersey,jersey,id+' jersey');
  assert.equal(teamKit(id).helmet,helmet,id+' helmet');
 }
 assert.equal(jerseyClash('ohio-state','georgia'),'away');
 assert.equal(jerseyClash('oregon','lsu'),'home');
});
test('original player and helmet illustrations are deterministic and change with team colors',()=>{
 const a=athleteModel('ohio-state',{instance:'testA',number:'26',role:'QB'});
 const b=athleteModel('georgia',{instance:'testB',number:'26',role:'RB',variant:'away',face:'left'});
 assert.match(a,/data-uniform-team="ohio-state"/);
 assert.match(b,/data-uniform-variant="away"/);
 assert.match(a,/#BB0000/);
 assert.match(b,/#BA0C2F/);
 assert.match(a,/Original|original|stylized/);
 assert.match(a,/<svg /);
 assert.match(a,/<linearGradient/);
 assert.match(a,/<pattern/);
 assert.match(b,/translate\(340 0\) scale\(-1 1\)/);
 const defender=athleteModel('indiana',{instance:'def-test',role:'DEF'});
 assert.match(defender,/data-player-role="DEF"/);
 assert.doesNotMatch(defender,/<ellipse rx="30" ry="20" fill="#714328"/,'Defender should not carry a football');
 assert.ok(defender.includes('fill="#1e242a"'),'Separate defensive-glove pose is missing');
 assert.ok(a!==b);
 assert.equal(a,athleteModel('ohio-state',{instance:'testA',number:'26',role:'QB'}));
 const h=helmetBadge('oregon','test-helmet');
 assert.match(h,/data-uniform-team="oregon"/);
 assert.match(h,/#FCE122/);
 for(const svg of [a,b,h])assert.doesNotMatch(svg,/<script|<foreignObject|<image |(?:href|src)="https?:|onload\s*=/i);
});
test('untrusted inputs cannot introduce SVG markup or CSS style values',()=>{
 const hostile=athleteModel('<script>alert(1)</script>',{instance:'"><script>',number:'<svg onload=alert(1)>'});
 assert.doesNotMatch(hostile,/<script[\s>]|onload\s*=|<foreignObject/i);
 assert.match(hostile,/Unknown Program/);
 assert.match(hostile,/data-uniform-team="&lt;script&gt;/);
 const k=teamKit('not-a-team');
 assert.equal(k.teamName,'Unknown Program');
 assert.match(kitStyle('not-a-team'),/--school-main:#[a-fA-F0-9]{6}/);
});
test('all visual source layers are separate from reproducible scoring and stats engines',()=>{
 const index=read('index.html'),css=read('src/teamUniformStage.css'),app=read('src/app.js'),pkg=read('package.json');
 assert.ok(index.indexOf('src/teamUniformStage.css')>index.indexOf('src/console-era.css'));
 assert.match(pkg,/node --check src\/teamKits\.js/);
 assert.match(app,/import \{teamKit,kitStyle,jerseyClash\} from '\.\/teamKits\.js'/);
 assert.match(app,/athleteModel\(c\.a/);
 assert.match(app,/athleteModel\(c\.b/);
 assert.match(app,/athleteModel\(p\.team/);
 assert.match(app,/helmetBadge\(id/);
 assert.match(app,/era-champion-athlete/);
 assert.match(css,/Barlow Condensed/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const path of ['src/engine.js','src/tournament.js','src/playerModel.js','src/usage.js','src/research.js'])assert.doesNotMatch(read(path),/teamKits|playerArtwork/,'Visual-only code imported into model '+path);
});
