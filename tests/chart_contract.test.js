import test from 'node:test';
import assert from 'node:assert/strict';
import {histogram,propBars,atlas,scoreboardCurve} from '../src/charts.js';
import {simulateBatch,simulateGame,DEFAULT_CONFIG} from '../src/engine.js';
test('generated histogram bins conserve sample frequency and marker is legible',()=>{
 const x=simulateBatch(DEFAULT_CONFIG,120);
 const h=histogram(x.margin,x.markets.reference.marginThreshold,'margin');
 const percentages=[...h.matchAll(/<title>[^<]*: ([0-9]+[.][0-9]+)% of simulations<[/]title>/g)].map(v=>Number(v[1]));
 assert.ok(percentages.length>=2);
 assert.ok(Math.abs(percentages.reduce((a,b)=>a+b,0)-100)<percentages.length*.06);
 assert.ok(h.includes('stroke="#d5ef67"'));
 assert.ok(histogram(x.total,x.markets.reference.totalLine,'total').includes('LINE '+x.markets.reference.totalLine.toFixed(1)));
});
test('player bins disclose open-ended outliers and conserve observations',()=>{
 const values=[0,1,3,4,5,6,7,8,9,10,1000];
 const html=propBars(values,5.5);
 assert.ok(html.includes('≥'));
 const counts=[...html.matchAll(/<title>Bin [^<]*: ([0-9]+) games<[/]title>/g)].map(v=>Number(v[1]));
 assert.equal(counts.reduce((a,b)=>a+b,0),values.length);
 assert.ok(html.includes('stroke="#d5ef67"'));
});
test('heatmap and possession chart use generated scores and games',()=>{
 const d=simulateBatch(DEFAULT_CONFIG,75);
 assert.equal(d.scores.reduce((a,b)=>a+b.count,0),d.n);
 assert.ok(atlas(d.scores,d.n).includes('score heatmap'));
 const g=simulateGame(DEFAULT_CONFIG,8917);
 assert.ok(scoreboardCurve(g).includes(g.drives.length+' POSSESSIONS'));
});
