import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('original championship broadcast polish loads after existing theme and remains accessible',()=>{
 const html=read('index.html'),css=read('src/console-refresh.css'),app=read('src/app.js');
 assert.ok(html.indexOf('src/console-refresh.css')>html.indexOf('src/refinements.css'));
 for(const s of ['.fixture-score{','.play-console,','.page-intro{','@media(max-width:480px)','prefers-reduced-motion:reduce'])assert.ok(css.includes(s),s);
 assert.match(app,/NOT NCAA-AFFILIATED/);
 assert.ok(css.includes('.game-tape .position-sheet .viz-head h3'));
 assert.ok(!css.includes('.game-tape .viz-head h3{color:#f7fbff}'),'white analytical chart cards must retain dark chart headings');
 const picker=app.slice(app.indexOf('function matchupPicker(){'),app.indexOf('function matchupForecast(){'));
 assert.deepEqual([...picker.matchAll(/ctl\('(a|b|venue)'/g)].map(x=>x[1]).sort(),['a','b','venue']);
});
