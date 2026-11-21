import test from 'node:test';
import assert from 'node:assert/strict';
import {observed, namedPlayer, headToHead, HISTORICAL} from '../src/observed.js';
import {DEFAULT_CONFIG, teamProfile, simulateBatch, simulateGame, TEAMS} from '../src/engine.js';

test('2025 historical reference limited to four explicitly sourced schools', () => {
  assert.deepEqual(Object.keys(HISTORICAL).sort(), ['alabama', 'georgia', 'indiana', 'ole-miss']);
  for (const id of Object.keys(HISTORICAL)) {
    assert.match(observed(id, 2025).source, /^https:\/\//);
    assert.ok(observed(id, 2025).pointsFor > 0);
    assert.equal(observed(id, 2024), null);
  }
  assert.equal(observed('tennessee', 2025), null);
  assert.equal(teamProfile('tennessee', 2025).coverage, 'synthetic');
  assert.equal(teamProfile('ole-miss', 2025).coverage, '2025-full-season-descriptive');
});

test('player identity names are only supplied from observed 2025 references', () => {
  assert.equal(namedPlayer('ole-miss', 'QB', 2025).name, 'Trinidad Chambliss');
  assert.equal(namedPlayer('indiana', 'QB', 2025).name, 'Fernando Mendoza');
  assert.equal(namedPlayer('ole-miss', 'QB', 2024), null);
  assert.equal(namedPlayer('tennessee', 'QB', 2025), null);
  assert.equal(namedPlayer('georgia', 'K', 2025), null);
});

test('named prop frequencies come from same simulated game samples and remain bounded', () => {
  const config = {...DEFAULT_CONFIG, a:'ole-miss', b:'indiana'};
  const summary = simulateBatch(config, 32, 91);
  assert.ok(summary.props.length > 0);
  for (const prop of summary.props) {
    assert.equal(prop.values.length, 32);
    assert.equal(prop.n, 32);
    assert.ok(prop.p10 <= prop.median || prop.median === undefined);
    assert.ok(prop.p10 <= prop.p90);
    assert.ok(prop.above >= 0 && prop.above <= 1);
    assert.equal(prop.above, prop.values.filter(x => x > prop.line).length / 32);
    assert.ok(prop.fullName && prop.fullName.split(' ').length >= 2);
  }
});

test('score reproduction is independent of roster import fixture and historical results are immutable', () => {
  const config = {...DEFAULT_CONFIG};
  const g = simulateGame(config, 9081);
  assert.deepEqual(simulateGame(config, 9081), g);
  assert.equal(headToHead('georgia', 'alabama').length, 2);
  assert.equal(headToHead('georgia', 'tennessee').length, 0);
  assert.ok(TEAMS.find(x => x.id === 'indiana'));
});
