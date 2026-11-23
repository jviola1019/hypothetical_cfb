/** Source-locked 2026 CFP interim rankings — Nov 17, 2026.
 * This is NOT the Selection Day bracket or a forecast. Rank is NOT an Elo statistic.
 * Source: https://collegefootballplayoff.com/news/2026/11/17/rankings
 */
export const COMMITTEE_2026=Object.freeze({
 date:'2026-11-17',
 through:'2026-11-15',
 nextExpected:'2026-11-24',
 url:'https://collegefootballplayoff.com/news/2026/11/17/rankings',
 classification:'official-interim-top-25-not-final-selection',
 ids:Object.freeze([
 'georgia','utah','alabama','ucla','texas','notre-dame','miami','indiana',
 'tennessee','byu','wake-forest','texas-tech','oregon','ohio-state','iowa',
 'kentucky','boise-state','usc','arizona','houston','south-carolina',
 'oklahoma','louisville','florida','ole-miss'])
});
const rankMap=new Map(COMMITTEE_2026.ids.map((id,i)=>[id,i+1]));
export function committeeRank(id){return rankMap.get(id)??null;}
/** Apply *published rankings* to visible fantasy field order, never to eligibility.
 * Automatic qualifiers and conference championships are unknown until selection day.
 */
export function committeeOrderedField(modelIds){
 const seen=new Set(COMMITTEE_2026.ids);
 return [...COMMITTEE_2026.ids,...modelIds.filter(id=>!seen.has(id))];
}
/** An explicitly unvalidated CONTEXT GUARD for playable exhibition matchups.
 * Distinguishes CFP top-three versus unranked teams from compressed winner-only
 * Elo. It never changes the historical research model or its Brier score;
 * it does not apply an indiscriminate Power-Four conference adjustment.
 * 200 Elo-equivalent points = an editorial game-balance guard, not estimated odds.
 */
export function provisionalEliteGap(a,b,observedEloGap){
 if(!Number.isFinite(observedEloGap))return observedEloGap;
 const ra=committeeRank(a),rb=committeeRank(b);
 const eliteA=ra!==null&&ra<=3&&rb===null;
 const eliteB=rb!==null&&rb<=3&&ra===null;
 if(!eliteA&&!eliteB)return observedEloGap;
 const minGap=200;
 return eliteA?Math.max(minGap,observedEloGap):Math.min(-minGap,observedEloGap);
}
