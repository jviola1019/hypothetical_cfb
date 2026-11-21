/* Presentation-only SVGs: marks represent input observations or generated game records. */
const num=x=>Number.isFinite(+x)?+x:0;
const n1=x=>num(x).toFixed(1);
const C={ink:'#f1f0e7',steel:'#b8c6b3',jade:'#91c7c1',mint:'#d5ef67',red:'#f1ae71',cream:'#121d17',grid:'#35463a'};
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const line=(x1,y1,x2,y2,cls='gridline')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const axis=(x,y,value,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="svg-text">${esc(value)}</text>`;
export function histogram(values,threshold,kind='margin'){
 if(!values?.length)return `<div class="emptygraph">Results appear after the simulation.</div>`;
 const step=kind==='total'?7:6,min=Math.floor(Math.min(...values)/step)*step,max=Math.ceil(Math.max(...values)/step)*step+step;
 const bins=Array(Math.ceil((max-min)/step)).fill(0);
 values.forEach(v=>bins[Math.min(bins.length-1,Math.floor((v-min)/step))]++);
 const w=690,h=260,L=49,R=14,T=26,B=44,pw=w-L-R,ph=h-T-B,peak=Math.max(1,...bins),bw=pw/bins.length;
 const y=n=>T+ph-(n/peak)*ph, x=i=>L+i*bw;
 const bars=bins.map((v,i)=>`<rect class="outcome-bar" x="${x(i)+1}" y="${y(v)}" width="${Math.max(1,bw-2)}" height="${T+ph-y(v)}" fill="${kind==='total'?C.jade:C.red}"><title>${min+i*step}–${min+(i+1)*step-1} points: ${(v/values.length*100).toFixed(1)}% of simulations</title></rect>`).join('');
 const horizontal=[0,.5,1].map(p=>line(L,y(peak*p),w-R,y(peak*p))+axis(L-7,y(peak*p)+4,(peak*p/values.length*100).toFixed(0)+'%','end')).join('');
 const mx=L+(threshold-min)/(max-min)*pw;
 const cut=Number.isFinite(threshold)&&mx>=L&&mx<=w-R?`<line x1="${mx}" x2="${mx}" y1="${T-5}" y2="${T+ph}" stroke="${C.ink}" stroke-width="1.8" stroke-dasharray="5 5"/>${axis(Math.min(w-40,Math.max(40,mx)),15,'LINE '+n1(threshold))}`:'';
 return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Sampled ${kind} histogram with ${values.length} synthetic simulations"><title>Simulated ${kind} distribution</title>${horizontal}${bars}${cut}${axis(L,h-13,min,'start')}${axis(w-R,h-13,max,'end')}${axis(w/2,h-13,kind==='total'?'TOTAL POINTS':'MARGIN — TEAM A MINUS B')}</svg>`;
}
export function atlas(scores,n){
 if(!scores?.length)return `<div class="emptygraph">No score distribution yet.</div>`;
 const step=7,bins=new Map();for(const {score,count} of scores){const [a,b]=score.split('-').map(Number);const key=Math.floor(a/step)+','+Math.floor(b/step);bins.set(key,(bins.get(key)||0)+count)}
 const coords=[...bins].map(([key,count])=>{const [x,y]=key.split(',').map(Number);return {x,y,count}});
 const mx=Math.max(...coords.map(x=>x.x),6),my=Math.max(...coords.map(x=>x.y),6),cell=Math.min(40,Math.max(23,530/(Math.max(mx,my)+1))),L=52,T=18,R=15,B=46,w=L+(mx+1)*cell+R,h=T+(my+1)*cell+B,top=Math.max(...coords.map(x=>x.count));
 const tiles=coords.map(({x,y,count})=>{const op=(.12+.88*count/top).toFixed(2);return `<rect x="${L+x*cell}" y="${T+(my-y)*cell}" width="${cell-2}" height="${cell-2}" fill="${C.jade}" opacity="${op}"><title>A ${x*7}–${x*7+6} / B ${y*7}–${y*7+6}: ${(count/n*100).toFixed(2)}%</title></rect>`}).join('');
 return `<div class="heatmap-scroll"><svg class="viz heatmap" viewBox="0 0 ${w} ${h}" role="img" aria-label="Joint simulated final score heatmap with seven point score bins"><title>Score outcome atlas</title>${tiles}${axis(w/2,h-8,'TEAM A · POINTS')}${axis(13,h/2,'TEAM B', 'start')}${axis(L,T+(my+1)*cell+13,'0','start')}${axis(w-R,T+(my+1)*cell+13,(mx+1)*7,'end')}${axis(L-9,T+(my+.5)*cell,'0','end')}${axis(L-9,T+cell/2,(my+1)*7,'end')}</svg></div>`;
}
export function scoreboardCurve(g){
 if(!g?.drives.length)return '';
 const w=700,h=236,L=43,T=17,R=18,B=39,pw=w-L-R,ph=h-T-B,max=Math.max(7,...g.final);let a=0,b=0;
 const path=(idx)=>{let cur=0;return 'M'+L+','+(T+ph)+' '+g.drives.map((d,i)=>{cur=idx===0?d.scoreA:d.scoreB;const x=L+(i+1)/g.drives.length*pw,y=T+ph-cur/max*ph;return 'H'+x+' V'+y}).join(' ')};
 const rules=[0,.5,1].map(q=>line(L,T+ph*(1-q),w-R,T+ph*(1-q))+axis(L-8,T+ph*(1-q)+4,Math.round(max*q),'end')).join('');
 const blocks=g.drives.map((d,i)=>d.points>0?`<circle cx="${L+(i+1)/g.drives.length*pw}" cy="${T+ph-(d.offense===g.config.a?d.scoreA:d.scoreB)/max*ph}" r="3.5" fill="${d.offense===g.config.a?C.red:C.jade}"><title>Drive ${i+1}: ${d.offense} ${d.outcome}, ${d.points} points</title></circle>`:'').join('');
 return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cumulative synthetic scoreboard by simulated drive"><title>Drive-by-drive scores</title>${rules}<path d="${path(0)}" fill="none" stroke="${C.red}" stroke-width="3" stroke-linejoin="round"/><path d="${path(1)}" fill="none" stroke="${C.jade}" stroke-width="3" stroke-linejoin="round"/>${blocks}${axis(L,h-8,'KICKOFF','start')}${axis(w-R,h-8,g.drives.length+' POSSESSIONS','end')}</svg>`;
}
export function convergence(points,p){if(!points?.length)return '';
 const w=690,h=210,L=43,T=15,R=17,B=38,pw=w-L-R,ph=h-T-B, mx=points.at(-1).n;
 const xx=n=>L+pw*n/mx,yy=p=>T+ph*(1-p);
 const pointsPath=points.map((v,i)=>(i?'L':'M')+xx(v.n).toFixed(1)+','+yy(v.p).toFixed(1)).join(' ');
 return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cumulative share of simulated games won by team A"><title>Monte Carlo convergence</title>${[0,.25,.5,.75,1].map(v=>line(L,yy(v),w-R,yy(v))+axis(L-8,yy(v)+3,(v*100).toFixed(0)+'%','end')).join('')}<path d="${pointsPath}" fill="none" stroke="${C.red}" stroke-width="2.7"/>${axis(L,h-8,'0 RUNS','start')}${axis(w-R,h-8,mx.toLocaleString()+' RUNS','end')}</svg>`;
}
export function driveStrip(g){if(!g)return '';
 const n=g.drives.length;
 return `<div class="drive-strip" role="img" aria-label="${n} simulated drives; bars show outcome and yards gained">${g.drives.map((d,i)=>{const type=d.points?'score':d.outcome==='TO'?'turnover':'stop';const height=Math.max(12,Math.min(100,d.gain||5));return `<div class="drive-slot ${type}" title="${esc(d.offense)}: ${esc(d.outcome)} · ${d.gain} yards · ${d.points} points"><span style="height:${height}%"></span></div>`}).join('')}</div><div class="mini-legend"><span><i class="legend-swatch score"></i>Scoring drive</span><span><i class="legend-swatch stop"></i>No score</span><span><i class="legend-swatch turnover"></i>Turnover</span></div>`;
}
export function propBars(values,line){if(!values?.length)return '';const sorted=[...values].sort((a,b)=>a-b),top=Math.max(1,sorted[Math.floor(sorted.length*.99)],line)*1.12;
 const N=30,bins=Array(N).fill(0);for(const v of values)bins[Math.min(N-1,Math.floor(v/top*N))]++;
 const peak=Math.max(1,...bins),w=680,h=180,L=20,T=14,R=10,B=32,pw=w-L-R,ph=h-T-B;
 const rectangles=bins.map((n,i)=>{const x=L+i/N*pw,y=T+ph-n/peak*ph;return `<rect x="${x+1}" y="${y}" width="${pw/N-2}" height="${T+ph-y}" fill="${i/N*top>line?C.red:C.jade}" opacity=".9"><title>Bin ${(i/N*top).toFixed(0)}–${((i+1)/N*top).toFixed(0)}: ${n} games</title></rect>`}).join('');
 const lx=L+Math.min(1,line/top)*pw;return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Simulated player statistic distribution and line ${line}"><title>Player prop probability distribution</title>${rectangles}<line x1="${lx}" x2="${lx}" y1="${T}" y2="${T+ph}" stroke="${C.ink}" stroke-dasharray="4 4" stroke-width="2"/>${axis(lx,12,'LINE '+line)}${axis(L,h-6,'0','start')}${axis(w-R,h-6,top.toFixed(0),'end')}</svg>`;
}
