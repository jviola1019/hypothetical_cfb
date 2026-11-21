import test from 'node:test';
import assert from 'node:assert/strict';
import { FBS_TEAMS } from '../src/catalog.js';
import { selectCFPField } from '../src/cfpSelection.js';

const ids = FBS_TEAMS.map(team => team.id);
const conferences = {
  ACC: 'clemson', 'Big Ten': 'ohio-state', 'Big 12': 'utah', SEC: 'georgia',
  American: 'memphis', 'Conference USA': 'liberty', 'Mid-American': 'toledo',
  'Mountain West': 'boise-state', 'Pac-12': 'oregon-state', 'Sun Belt': 'james-madison'
};
function ranking(front = []) { return [...new Set([...front, ...ids])]; }

test('2026 CFP includes five conference bids and Notre Dame top-12 automatic qualification', () => {
  const result = selectCFPField({
    formatId: 'fbs12',
    rankings: ranking(['notre-dame', 'ohio-state', 'georgia', 'utah', 'clemson', 'memphis']),
    champions: conferences
  });
  assert.equal(result.field.length, 12);
  assert.equal(result.automatic, 6);
  assert.equal(result.atLarge, 6);
  assert.equal(result.field.filter(row => row.bye).length, 4);
  assert.ok(result.field.some(row => row.teamId === 'notre-dame' && row.qualification.includes('automatic')));
  assert.equal(new Set(result.participantIds).size, 12);
});

test('2026 outside-top-12 Notre Dame does not receive the special bid', () => {
  const ranked = ranking(['georgia', 'ohio-state', 'utah', 'clemson', 'memphis'])
    .filter(team => team !== 'notre-dame');
  ranked.splice(14, 0, 'notre-dame');
  const result = selectCFPField({ formatId: 'fbs12', rankings: ranked, champions: conferences });
  assert.equal(result.automatic, 5);
  assert.equal(result.atLarge, 7);
});

test('2027 CFP has 24 schools, 8 byes, five AQs and nineteen at-large bids', () => {
  const result = selectCFPField({
    formatId: 'fbs24', rankings: ranking(['notre-dame', 'ohio-state', 'georgia', 'utah', 'clemson', 'memphis']),
    champions: conferences
  });
  assert.equal(result.field.length, 24);
  assert.equal(result.automatic, 5);
  assert.equal(result.atLarge, 19);
  assert.equal(result.field.filter(row => row.bye).length, 8);
  assert.equal(result.field.find(row => row.teamId === 'notre-dame').qualification, 'at-large');
});

test('mandatory unranked major champion gets provisional bottom seeding', () => {
  const ranked = ranking().filter(team => team !== 'clemson');
  const result = selectCFPField({ formatId: 'fbs12', rankings: ranked, champions: conferences });
  assert.equal(result.provisional, true);
  assert.equal(result.field.at(-1).teamId, 'clemson');
});

test('incomplete champion map, duplicates and out-of-field names fail closed', () => {
  const ranked = ranking();
  assert.throws(() => selectCFPField({ formatId: 'fbs12', rankings: ranked, champions: { ...conferences, SEC: 'clemson' } }), /unique/);
  assert.throws(() => selectCFPField({ formatId: 'fbs12', rankings: ranked, champions: { ...conferences, SEC: undefined } }), /supported/);
  assert.throws(() => selectCFPField({ formatId: 'fbs12', rankings: ['fake', ...ranked.slice(1)], champions: conferences }), /unknown/);
  assert.throws(() => selectCFPField({ formatId: 'fbs12', rankings: ranked.slice(0, 12), champions: conferences }), /top-25/);
});

test('selection never claims actual 2026 committee rankings', () => {
  const result = selectCFPField({formatId:'fbs12',rankings:ranking(),champions:conferences});
  assert.match(result.classification, /hypothetical/);
  assert.match(result.disclaimer, /not an official CFP bracket/i);
});

test('explicit selected field feeds correct tournament byes, matchups and hosts', async () => {
  const { createCommitteeInputTournament, playablePairs, simulateTournament } = await import('../src/tournament.js');
  for (const formatId of ['fbs12','fbs24']) {
    const tournament = createCommitteeInputTournament({formatId,rankings:ranking(),champions:conferences});
    const expectedByes = formatId==='fbs12' ? 4 : 8;
    assert.equal(playablePairs(tournament).length, (tournament.participants.length-expectedByes)/2);
    assert.equal(tournament.selection.field.filter(row => row.bye).length,expectedByes);
    const done = simulateTournament(tournament,{seasonA:2026,seasonB:2026});
    assert.equal(done.rounds.flatMap(round => round.matches).filter(match => match.game).length,
                 tournament.participants.length - 1);
    assert.ok(tournament.participants.includes(done.champion));
  }
});
