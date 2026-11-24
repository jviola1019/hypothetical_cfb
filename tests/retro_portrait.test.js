import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {tintPixel,repairJerseyMask} from '../src/retroPortraits.js';
import {teamKit} from '../src/teamKits.js';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('real rendered portrait sources and masks ship locally with bounded sizes',()=>{
 for(const name of ['qb-hero.webp','runner-hero.webp','qb-mask.webp','runner-mask.webp','retro-night-stadium.webp']){
  const path='public/assets/'+name;
  const b=readFileSync(new URL(path,root));
  assert.equal(b.toString('utf8',0,4),'RIFF',name+' should be WebP RIFF data');
  assert.ok(statSync(new URL(path,root)).size<130000,name+' excessively large');
 }
});
test('tinting changes actual pigment without changing transparent or non-uniform regions',()=>{
 const ohio=teamKit('ohio-state'),oregon=teamKit('oregon');
 const original=[22,120,23];
 assert.deepEqual(tintPixel(...original,0,0,0,ohio),original);
 const a=tintPixel(...original,255,0,0,ohio),b=tintPixel(...original,255,0,0,oregon);
 assert.notDeepEqual(a,b,'Distinct school kits must alter colored jerseys');
 assert.ok(a[0]>a[1], 'Ohio State red jersey should preserve red dominance');
 assert.ok(b[1]>b[0], 'Oregon green jersey should preserve green dominance');
 const shell=tintPixel(15,23,140,0,255,0,teamKit('lsu'));
 assert.ok(shell[0]>shell[2]*.8,'LSU gold helmet should not remain the neutral blue helmet');
});
test('stage is photo-first and source data stays real, using semantic menu controls',()=>{
 const html=read('index.html'),app=read('src/app.js'),css=read('src/retroAuthentic.css');
 assert.ok(html.indexOf('src/retroAuthentic.css')>html.indexOf('src/teamUniformStage.css'));
 assert.match(app,/mountRetroPortraits\(root\)/);
 assert.match(app,/data-retro-player=\"qb\"/);
 assert.match(app,/data-retro-player=\"runner\"/);
 assert.match(app,/data-team=\"\$\{esc\(c\.a\)\}\"/);
 assert.match(css,/retro-stadium-hero/);
 assert.match(css,/\.era-score-card/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(app,/https:\/\/(?:ea|ncaa)\./i);
});

test('jersey matte repair recolors green source gaps without affecting skin or helmet',()=>{
 assert.equal(repairJerseyMask(30,160,45,0,0,0),255);
 assert.equal(repairJerseyMask(150,90,70,0,0,0),0);
 assert.equal(repairJerseyMask(10,60,150,0,200,0),0);
 assert.equal(repairJerseyMask(30,160,45,120,0,0),255);
 const o=teamKit('ole-miss');
 const v=tintPixel(30,160,45,repairJerseyMask(30,160,45,0,0,0),0,0,o);
 assert.ok(v[0]>v[1], 'uncovered green source jersey must render in Ole Miss red');
});

test('photo stadium and visible full portrait heads rather than clipped award shoulders',()=>{
 const css=read('src/retroAuthentic.css');
 assert.ok(css.includes('retro-night-stadium.webp'));
 assert.ok(css.includes('left:-35%!important'));
 assert.ok(css.includes('jersey matte repair')===false); // correction lives in JS, not CSS filtering
});
