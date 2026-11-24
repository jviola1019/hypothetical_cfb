/** Original, locally bundled game-render style portraits. Recolor only neutral
 * generated uniforms; never invent real school jersey numbers or player likenesses.
 * No network, eval, data-layer modification, or third-party image fetches.
 */
import {teamKit} from './teamKits.js';
const URLS=Object.freeze({
 qb:['./public/assets/qb-hero.webp','./public/assets/qb-mask.webp'],
 runner:['./public/assets/runner-hero.webp','./public/assets/runner-mask.webp'],
 receiver:['./public/assets/receiver-hero.webp','./public/assets/receiver-mask.webp'],
 defender:['./public/assets/defender-hero.webp','./public/assets/defender-mask.webp'],
 celebrate:['./public/assets/celebrate-hero.webp','./public/assets/celebrate-mask.webp'],
 trophy:['./public/assets/trophy-hero.webp','./public/assets/trophy-mask.webp']
});
/** Map award roles to the actual simulated position, never to award rank. */
export function awardPortraitRole(award,player){
 if(award==='DPOY')return 'defender';
 if(player?.role==='QB')return 'qb';
 if(player?.role==='RB')return 'runner';
 if(['WR1','WR2','WR','TE'].includes(player?.role))return 'receiver';
 return 'celebrate';
}
const sourceCache=new Map();
const tintCache=new Map();
const hexRgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
function loadImage(url){
 return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('Local portrait asset could not load: '+url));
  image.src=url;
 });
}
async function readSource(role){
 if(!sourceCache.has(role))sourceCache.set(role,Promise.all(URLS[role].map(loadImage)).then(([original,mask])=>{
  if(original.width!==mask.width||original.height!==mask.height||original.width>1024||original.height>1024)throw Error('Portrait source/mask dimensions inconsistent');
  const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('2D canvas unavailable');
  ctx.drawImage(original,0,0);const raw=ctx.getImageData(0,0,canvas.width,canvas.height);
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(mask,0,0);
  const mattes=ctx.getImageData(0,0,canvas.width,canvas.height);
  return {raw,mattes,width:canvas.width,height:canvas.height};
 }).catch(error=>{sourceCache.delete(role);throw error;}));
 return sourceCache.get(role);
}
function blendChannel(original,target,brightness,weight){
 const shadow=Math.max(.22,Math.min(1.16,.36+brightness/195));
 const highlight=Math.max(0,(brightness-165)*.13);
 const tinted=Math.min(255,target*shadow+highlight);
 return Math.round(original*(1-weight)+tinted*weight);
}
/** Repair open-neck/shoulder pixels omitted from the hand-built jersey matte.
 * Applies only to strongly green source jersey pixels, never to masks for
 * helmets, pants, skin, grass, or already neutral artwork. */
export function repairJerseyMask(r,g,b,mr,mg,mb){
 const sourceJerseyGreen=g>62&&g>r*1.25&&g>b*1.18;
 return sourceJerseyGreen&&mg<35&&mb<35?255:mr;
}
/** Pure pixel transform is independently tested with deliberately tiny fixtures. */
export function tintPixel(r,g,b,maskR,maskG,maskB,kit){
 return tintWithPalette(r,g,b,maskR,maskG,maskB,[kit.jersey,kit.helmet,kit.pants].map(hexRgb));
}
function tintWithPalette(r,g,b,maskR,maskG,maskB,colors){
 let v=[r,g,b];const brightness=r*.2126+g*.7152+b*.0722;
 for(const [i,m] of [maskR,maskG,maskB].entries()){
  const weight=Math.min(1,Math.max(0,m/255));if(weight<.005)continue;
  v=v.map((value,ch)=>blendChannel(value,colors[i][ch],brightness,weight));
 }
 return v;
}
async function makePortrait(team,role,variant){
 const selected=teamKit(team,variant),key=[selected.id,role,variant].join('|');
 if(tintCache.has(key))return tintCache.get(key);
 const promise=(async()=>{
  const {raw,mattes,width,height}=await readSource(role);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('2D canvas unavailable');
  const out=ctx.createImageData(width,height),s=raw.data,m=mattes.data,d=out.data;
  const palette=[selected.jersey,selected.helmet,selected.pants].map(hexRgb);
  for(let i=0;i<s.length;i+=4){
   if(!s[i+3])continue;
   const redMask=repairJerseyMask(s[i],s[i+1],s[i+2],m[i],m[i+1],m[i+2]);
   const v=tintWithPalette(s[i],s[i+1],s[i+2],redMask,m[i+1],m[i+2],palette);
   d[i]=v[0];d[i+1]=v[1];d[i+2]=v[2];d[i+3]=s[i+3];
  }
  ctx.putImageData(out,0,0);
  return canvas.toDataURL('image/webp',.86);
 })();
 promise.catch(()=>{if(tintCache.get(key)===promise)tintCache.delete(key);});
 tintCache.set(key,promise);
 if(tintCache.size>40)tintCache.delete(tintCache.keys().next().value);
 return promise;
}
/** Safe async repaint: do not update a DOM node from a previous user selection. */
export function mountRetroPortraits(root){
 const imgs=[...root.querySelectorAll('img[data-retro-player]')];
 for(const element of imgs){
  const role=element.dataset.retroPlayer;
  const id=element.dataset.team;
  const variant=element.dataset.variant||'home';
  if(!Object.hasOwn(URLS,role))continue;
  makePortrait(id,role,variant).then(data=>{
   if(!element.isConnected||element.dataset.team!==id||(element.dataset.variant||'home')!==variant||element.dataset.retroPlayer!==role)return;
   element.src=data;
   element.classList.add('retro-loaded');
   element.closest('.era-athlete-panel,.award-card,.era-champion-athlete,.retro-champion-portrait')?.classList.add('retro-rendered');
  }).catch(()=>{
   // The original SVG remains as a readable fallback rather than a broken image.
   if(element.isConnected)element.classList.add('retro-unavailable');
  });
 }
}
