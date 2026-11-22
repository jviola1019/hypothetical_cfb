import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Saturday Night CSS is loaded after structural CSS with an independent stadium asset',()=>{
 const html=read('index.html'),css=read('src/stadium-edition.css'),app=read('src/app.js');
 assert.ok(html.indexOf('src/stadium-edition.css')>html.indexOf('src/styles.css'));
 for(const s of ['.fixture-score{','.play-console,','.page-intro{','@media(max-width:480px)','prefers-reduced-motion:reduce'])
  assert.ok(css.includes(s),s);
 assert.match(app,/NOT NCAA-AFFILIATED/);
 assert.match(css,/\.game-tape \.position-sheet \.viz-head h3\{color:#1e2730\}/);
 assert.match(css,/\.game-tape \.drive-ledger h3\{color:#fff\}/);
 const picker=app.slice(app.indexOf('function matchupPicker(){'),app.indexOf('function matchupForecast(){'));
 assert.deepEqual([...picker.matchAll(/ctl\('(a|b|venue)'/g)].map(x=>x[1]).sort(),['a','b','venue']);
});
