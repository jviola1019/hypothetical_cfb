/** Visual-only school color accents, NOT sports statistics or official licensed artwork.
 * Values are approximate institutional palettes; unlisted teams stay neutral
 * rather than being assigned unsupported identity colors. Never used in models.
 */
const ACCENTS=Object.freeze({
 'ole-miss':'#ce1126','georgia':'#ba0c2f','alabama':'#9e1b32',
 'ohio-state':'#bb0000','tennessee':'#ff8200','texas':'#bf5700',
 'michigan':'#ffcb05','oregon':'#fce122','lsu':'#fdd023',
 'penn-state':'#e4e9f0','notre-dame':'#c99700','clemson':'#f56600',
 'texas-am':'#500000','oklahoma':'#841617','usc':'#ffc72c',
 'florida':'#fa4616','florida-state':'#ceb888','auburn':'#f26522',
 'wisconsin':'#c5050c','washington':'#b7a57a','nebraska':'#e41c38',
 'miami':'#f47321','boise-state':'#d64309','indiana':'#990000',
 'iowa':'#ffcd00','texas-tech':'#cc0000','arkansas':'#9d2235',
 'missouri':'#f1b82d','michigan-state':'#18453b',
 'north-carolina':'#7bafd4','nc-state':'#cc0000'
});
const FALLBACK='#8895a8';
export const teamAccent=id=>ACCENTS[id]||FALLBACK;
export const teamAccentIsCurated=id=>Object.hasOwn(ACCENTS,id);
export const teamAccentMap=()=>({...ACCENTS});
