import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('src/app.js'),css=read('src/stadium-edition.css'),
  svg=read('public/assets/night-stadium.svg'),charts=read('src/charts.js');
const luminance=hex=>hex.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('original college football identity does not copy NCAA or EA publisher marks',()=>{
 assert.match(app,/independent college football simulator/);
 assert.match(app,/NOT NCAA-AFFILIATED/);
 assert.match(app,/brand-mark.*?<b>GL<\/b>/);
 assert.doesNotMatch(html,/ncaa\.org\/.*?\.svg|ncaa\.png|ncaa-logo/i);
 assert.match(html,/src\/stadium-edition\.css/);
 assert.match(svg,/<svg /);
 assert.doesNotMatch(svg,/https?:\/\/|<script|foreignObject|<image/i);
});
test('new stadium edition replaces four contradictory old skins',()=>{
 assert.doesNotMatch(html,/src\/(?:college-theme|refinements|console-refresh)\.css/);
 assert.match(css,/--night:#090c10/);
 assert.match(css,/--display:'Barlow Condensed'/);
 assert.match(css,/night-stadium\.svg/);
 assert.ok(contrast('#ffffff','#141a22')>=12);
 assert.ok(contrast('#64707c','#ffffff')>=4.5);
 assert.ok(contrast('#ffffff','#1d2630')>=12);
 assert.ok(contrast('#141920','#eb5b35')>=4.5);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
});
test('three game selectors, gameplay evidence separation and chart palette remain',()=>{
 const builder=app.slice(app.indexOf('function matchupPicker(){'),app.indexOf('function matchupForecast(){'));
 assert.deepEqual([...builder.matchAll(/ctl\('(a|b|venue)'/g)].map(x=>x[1]).sort(),['a','b','venue']);
 assert.match(app,/Generated games only/);
 assert.match(app,/Official CFP bracket geometry/);
 assert.match(charts,/mint:'#b8452b'/);
});
