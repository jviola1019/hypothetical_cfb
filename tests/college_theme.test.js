import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const text=path=>readFileSync(new URL(path,root),'utf8');
const app=text('src/app.js'),theme=text('src/college-theme.css'),html=text('index.html'),charts=text('src/charts.js');
const palette={navy:'#071a32',paper:'#f1f5fa',electric:'#0079d7',ink:'#142d4c',gold:'#f2b544'};
const rgb=hex=>hex.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
const lum=hex=>rgb(hex).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('original college-football identity is independent and branded as GRIDIRON LAB',()=>{
 assert.match(app,/independent college football simulator/);
 assert.match(app,/NOT NCAA-AFFILIATED/);
 assert.match(app,/brand-mark.*?<b>GL<\/b>/);
 assert.doesNotMatch(html,/ncaa\.org\/.*?\.svg|ncaa\.png|ncaa-logo/i);
 assert.match(html,/src\/college-theme\.css/);
});
test('sports theme has deliberate palette, readable body contrast and respects motion preferences',()=>{
 assert.match(theme,/--paper:#f1f5fa/);
 assert.match(theme, /--display:'Roboto Condensed'/);
 assert.ok(contrast('#071a32','#ffffff')>=7);
 assert.ok(contrast('#142d4c','#f1f5fa')>=7);
 assert.ok(contrast('#4d647e','#ffffff')>=4.5);
 assert.ok(contrast('#ffffff','#076bb5')>=4.5);
 assert.match(theme, /prefers-reduced-motion:reduce/);
 assert.match(theme, /\.brand-mark\{grid-template-columns:minmax\(0,1fr\)/);
});
test('the college theme preserves a three-control game and read-only quantified market ledger',()=>{
 const builder=app.slice(app.indexOf('function matchupPicker(){'),app.indexOf('function matchupForecast(){'));
 const controls=[...builder.matchAll(/ctl\('(a|b|venue)'/g)].map(x=>x[1]).sort();
 assert.deepEqual(controls,['a','b','venue']);
 assert.match(app,/function marketLedgerView\(m\)/);
 assert.match(app,/Generated games only/);
 assert.match(app,/Official CFP bracket geometry/);
 assert.match(charts,/mint:'#a95d0c'/);
});
