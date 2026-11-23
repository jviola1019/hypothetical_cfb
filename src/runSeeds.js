/**
 * Fresh game seeds — distinct adjacent sessions, replayable on demand.
 * A seed controls fictional simulator output; it is NOT a security token.
 * The default uses browser crypto entropy, with a nonsecurity fallback for
 * environments where getRandomValues is unavailable.
 */
const MAX_SEED=0xFFFFFFFF;
const STEP=0x9E3779B9;

export function entropySeed32() {
 if(typeof globalThis.crypto?.getRandomValues==='function'){
  const a=new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0];
 }
 // Only a gameplay randomness fallback; NEVER reuse for auth or secrets.
 return ((Date.now()>>>0)^Math.floor(Math.random()*4294967296))>>>0;
}

/**
 * Generate a new seed, guaranteed different from the immediately prior seed.
 * Inject entropy for exhaustive and repeatable testing; no future game is
 * "corrected" or manipulated to achieve a different final score.
 */
export function freshSimulationSeed(previous=null,entropy=entropySeed32) {
 if(previous!==null&&(!Number.isInteger(previous)||previous<0||previous>MAX_SEED))
  throw new Error('Invalid previous simulation seed');
 if(typeof entropy!=='function')throw new Error('Missing entropy provider');
 const raw=entropy();
 if(!Number.isInteger(raw)||raw<0||raw>MAX_SEED)throw new Error('Invalid simulation entropy');
 const candidate=raw>>>0;
 return candidate===previous?(candidate+STEP)>>>0:candidate;
}
