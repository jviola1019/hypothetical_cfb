/** Institution-inspired, unlicensed school-color accents for every indexed FBS
 * program and five non-FBS reference entries. Same static kit registry as 3D art.
 * Presentation only; never modifies ratings, roster IDs, stats, or simulated games.
 */
import {FBS_TEAMS,FCS_REFERENCE} from './catalog.js';
import {teamKit} from './teamKits.js';
const known=Object.freeze([...FBS_TEAMS,...FCS_REFERENCE].map(t=>t.id));
const knownSet=new Set(known);
const neutral='#8895A8';
export const teamAccent=id=>knownSet.has(id)?teamKit(id).jersey:neutral;
export const teamAccentIsCurated=id=>knownSet.has(id);
export const teamAccentMap=()=>Object.fromEntries(known.map(id=>[id,teamAccent(id)]));
