/** Independently checks internal consistency of a generated football game. */
function demand(condition, message) {
  if (!condition) throw new Error(`Invalid generated game: ${message}`);
}

export function auditGeneratedGame(game) {
  demand(game && Array.isArray(game.teams) && game.teams.length === 2, 'team structure');
  demand(Array.isArray(game.drives) && game.drives.length > 0, 'missing drives');
  const [first, second] = game.teams;
  demand(first.team !== second.team, 'duplicate teams');
  demand(first.team === game.config.a && second.team === game.config.b, 'team identity');
  demand(first.points === game.final[0] && second.points === game.final[1], 'final score');
  demand(game.final[0] !== game.final[1], 'unresolved overtime');
  demand(game.margin === first.points-second.points && game.total === first.points+second.points, 'margin/total');
  demand(game.winner === (game.margin > 0 ? first.team : second.team), 'winner');

  const possessions = {[first.team]: [], [second.team]: []};
  const score = {[first.team]: 0, [second.team]: 0};
  let clock = 3600;
  for (const [index, drive] of game.drives.entries()) {
    demand(Object.hasOwn(possessions, drive.offense), `unknown offense at drive ${index}`);
    demand(drive.defense !== drive.offense, `self-defending drive ${index}`);
    demand(Number.isInteger(drive.points) && drive.points >= 0 && drive.points <= 8, 'invalid drive score');
    demand(Number.isInteger(drive.plays) && drive.plays >= 1 && drive.plays <= 20, 'invalid play count');
    demand(Number.isInteger(drive.start) && drive.start >= 5 && drive.start <= 97, 'invalid field position');
    demand(Number.isInteger(drive.gain) && drive.gain >= 0 && drive.gain <= 100-drive.start, 'invalid yard gain');
    if (typeof drive.quarter === 'number') {
      demand(drive.quarter >= 1 && drive.quarter <= 4, 'invalid quarter');
      demand(Number.isInteger(drive.elapsed) && drive.elapsed >= 1 && drive.elapsed <= clock, 'invalid duration');
      demand(drive.clock === clock, 'broken regulation clock');
      clock -= drive.elapsed;
    } else {
      demand(/^OT\d+$/.test(drive.quarter), 'invalid overtime label');
      demand(drive.elapsed === 0 && drive.clock === 0, 'overtime game-clock violation');
    }
    const validOutcomes = {
      TD: [6,7,8], FG: [3], 'MISSED FG': [0], TO: [0], PUNT: [0],
      '2PT GOOD': [2], '2PT FAIL': [0]
    };
    demand(validOutcomes[drive.outcome]?.includes(drive.points), 'invalid outcome points');
    if (drive.outcome.startsWith('2PT')) demand(/^OT(?:[3-9]|[1-9]\d+)$/.test(drive.quarter), 'shootout before OT3');
    score[drive.offense] += drive.points;
    possessions[drive.offense].push(drive);
    demand(score[first.team] === drive.scoreA && score[second.team] === drive.scoreB,
      'score timeline does not reconcile');
  }
  demand(clock === 0, 'regulation did not consume 3600 seconds');
  demand(score[first.team] === first.points && score[second.team] === second.points, 'drive score does not reconcile');

  for (const team of [first, second]) {
    const drives = possessions[team.team];
    const sum = key => drives.reduce((total, drive) => total + (drive[key] ?? 0), 0);
    demand(team.drives === drives.length, 'possession total');
    for (const key of ['plays','passAttempts','completions','passYards','rushYards']) {
      demand(team[key] === sum(key), `team ${key} differs from drives`);
    }
    demand(team.completions <= team.passAttempts, 'completions exceed attempts');
    const regular = drives.filter(d => typeof d.quarter === 'number');
    const overtime = drives.filter(d => typeof d.quarter === 'string');
    demand(team.byQuarter.length === 4, 'quarter scoring array');
    for (let quarter=1; quarter<=4; quarter++) {
      const points = regular.filter(d => d.quarter === quarter).reduce((n,d)=>n+d.points,0);
      demand(team.byQuarter[quarter-1] === points, 'quarter score not assigned at drive end');
    }
    demand(team.overtimePoints === overtime.reduce((n,d)=>n+d.points,0), 'overtime points');
    demand(team.points === team.byQuarter.reduce((a,b)=>a+b,0) + team.overtimePoints, 'team points');

    const p = team.players;
    const qb = p.QB, rb = p.RB;
    const eligible = [p.WR1,p.WR2,p.TE,rb];
    demand(qb.passingAttempts === team.passAttempts && qb.completions === team.completions &&
           qb.passingYards === team.passYards, 'quarterback passing totals');
    demand(qb.rushAttempts + rb.rushAttempts === team.rushAttempts, 'rushing attempts');
    demand(qb.rushYards + rb.rushYards === team.rushYards, 'rushing yards');
    demand(eligible.reduce((n,v)=>n+v.targets,0) === team.passAttempts, 'receiving targets');
    demand(eligible.reduce((n,v)=>n+v.receptions,0) === team.completions, 'receiving catches');
    demand(eligible.reduce((n,v)=>n+v.receivingYards,0) === team.passYards, 'receiving yards');
    demand(eligible.every(v=>v.receptions<=v.targets), 'catches exceed targets');
    demand(qb.passingTD === team.passingTD, 'quarterback passing TDs');
    demand(eligible.reduce((n,v)=>n+v.receivingTD,0) === team.passingTD, 'receiver passing TDs');
    demand(qb.rushingTD + rb.rushingTD === team.rushingTD, 'rushing TDs');
    demand(qb.interceptions+team.fumblesLost === team.turnovers, 'turnovers');
    demand(p.K.fieldGoalsMade === team.fieldGoals, 'kicker FG totals');
    demand(p.K.fieldGoalsMade <= p.K.fieldGoalsAttempted, 'made FGs exceed attempted');
    demand(team.twoPointMade <= team.twoPointAttempts, 'made 2PT exceeds attempted');
  }
  return true;
}
