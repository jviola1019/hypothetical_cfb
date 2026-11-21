/**
 * College Football Playoff qualification from externally supplied committee rankings.
 *
 * This module never creates committee rankings or decides conference champions.
 * Callers must supply both, and treat unranked qualifiers as provisional seeds.
 * Official policy sources are linked from each ruleset.
 */
import { FBS_TEAMS } from './catalog.js';

const KNOWN_FBS = new Set(FBS_TEAMS.map(team => team.id));

export const POWER_CONFERENCES = Object.freeze(['ACC', 'Big Ten', 'Big 12', 'SEC']);
export const OTHER_CONFERENCES = Object.freeze([
  'American', 'Conference USA', 'Mid-American',
  'Mountain West', 'Pac-12', 'Sun Belt'
]);

export const QUALIFICATION_RULES = Object.freeze({
  fbs12: Object.freeze({
    season: '2026–27', fieldSize: 12, atLarge: 7,
    notreDameTop12Automatic: true,
    firstRoundByes: 4,
    source: 'https://collegefootballplayoff.com/sports/2024/5/29/12-team-format'
  }),
  fbs24: Object.freeze({
    season: '2027–28', fieldSize: 24, atLarge: 19,
    notreDameTop12Automatic: false,
    firstRoundByes: 8,
    source: 'https://collegefootballplayoff.com/sports/2026/11/9/24-team-format'
  })
});

function validateRankings(rankings, fieldSize) {
  if (!Array.isArray(rankings) || rankings.length < Math.max(25, fieldSize) ||
      rankings.length > KNOWN_FBS.size) {
    throw new Error('A complete top-25-or-better committee ranking is required');
  }
  const rankByTeam = new Map();
  for (const [index, teamId] of rankings.entries()) {
    if (!KNOWN_FBS.has(teamId) || rankByTeam.has(teamId)) {
      throw new Error('Rankings contain an unknown or duplicate FBS school');
    }
    rankByTeam.set(teamId, index + 1);
  }
  return rankByTeam;
}

function validateChampions(champions) {
  const required = [...POWER_CONFERENCES, ...OTHER_CONFERENCES];
  if (!champions || Array.isArray(champions) ||
      Object.keys(champions).length !== required.length ||
      required.some(name => !Object.hasOwn(champions, name))) {
    throw new Error('Supply a conference champion for every required conference');
  }
  const values = required.map(name => champions[name]);
  if (values.some(team => !KNOWN_FBS.has(team)) || new Set(values).size !== values.length) {
    throw new Error('Conference champions must be unique, supported FBS schools');
  }
  return values;
}

/**
 * Returns a hypothetical field based on *supplied* inputs and official bid rules.
 * Seeding is provisional when an automatic qualifier is outside the supplied
 * committee ranking; we cannot reconstruct the committee's undisclosed order.
 */
export function selectCFPField({ formatId, rankings, champions }) {
  const rules = QUALIFICATION_RULES[formatId];
  if (!rules) throw new Error('Only the official 12- and 24-team CFP rules are supported');
  const rankByTeam = validateRankings(rankings, rules.fieldSize);
  validateChampions(champions);

  const selection = new Map();
  const add = (teamId, qualification) => {
    if (selection.has(teamId)) throw new Error('Duplicate automatic qualifier');
    selection.set(teamId, { teamId, qualification, committeeRank: rankByTeam.get(teamId) ?? null });
  };

  for (const conference of POWER_CONFERENCES) {
    add(champions[conference], `automatic — ${conference} champion`);
  }
  const other = OTHER_CONFERENCES
    .map(conference => ({ conference, teamId: champions[conference] }))
    .filter(item => rankByTeam.has(item.teamId))
    .sort((left, right) => rankByTeam.get(left.teamId) - rankByTeam.get(right.teamId));
  if (!other.length) {
    throw new Error('At least one other-conference champion must have a supplied committee ranking');
  }
  add(other[0].teamId, `automatic — highest-ranked other conference champion (${other[0].conference})`);

  if (rules.notreDameTop12Automatic && rankByTeam.has('notre-dame') &&
      rankByTeam.get('notre-dame') <= 12) {
    add('notre-dame', 'automatic — Notre Dame ranked top 12');
  }

  for (const teamId of rankings) {
    if (selection.size === rules.fieldSize) break;
    if (!selection.has(teamId)) add(teamId, 'at-large');
  }
  if (selection.size !== rules.fieldSize) throw new Error('Not enough eligible ranked schools');

  const field = [...selection.values()].sort((left, right) =>
    (left.committeeRank ?? Infinity) - (right.committeeRank ?? Infinity) ||
    left.teamId.localeCompare(right.teamId)
  ).map((row, index) => ({ ...row, seed: index + 1, bye: index < rules.firstRoundByes }));
  const provisional = field.some(row => row.committeeRank === null);
  return {
    formatId, season: rules.season, field,
    participantIds: field.map(row => row.teamId),
    automatic: field.filter(row => row.qualification.startsWith('automatic')).length,
    atLarge: field.filter(row => row.qualification === 'at-large').length,
    provisional,
    committeeRankingsProvided: rankings.length,
    classification: 'hypothetical-field-from-user-supplied-committee-rankings-and-champions',
    disclaimer: 'Conference winners and committee ranking inputs are not independently verified. This is not an official CFP bracket.',
    rulesSource: rules.source
  };
}
