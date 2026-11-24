/** Original team-colored, stylized console-era player artwork. No real athlete likeness, logos, or verified uniforms. */
import {teamKit} from './teamKits.js';
export function escapeXml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}

export function helmetBadge(teamId,instance='badge',variant='home'){
 const k=teamKit(teamId,variant);
 const id='hh-'+String(instance).replace(/[^a-z0-9-]/gi,'').slice(0,35);
 return `<svg class="uniform-helmet-svg" data-uniform-team="${escapeXml(k.id)}" viewBox="0 0 76 62" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".72"/><stop offset=".24" stop-color="${k.helmet}"/><stop offset=".72" stop-color="${k.helmet}"/><stop offset="1" stop-color="#111" stop-opacity=".83"/></linearGradient></defs><path d="M8 40C3 13 24 2 45 6c21 5 25 24 21 36L48 53 16 51Z" fill="url(#${id})" stroke="#dadbdc" stroke-width="2.2"/><path d="M30 8L38 7l8 39-10 4Z" fill="${k.accent}"/><path d="M43 42l26 1-3 8-19 3-13-13" fill="none" stroke="#d4d6d9" stroke-width="3.5"/><path d="M42 33l25 12" stroke="#30333a" stroke-width="3"/><path d="M14 47l26 3" stroke="#e9ecee" stroke-width="2"/></svg>`;
}

export function athleteModel(teamId,options={}){
 const k=teamKit(teamId,options.variant||'home');
 const role=options.role==='RB'?'RB':'QB';
 const number=String(options.number||'26').replace(/[^0-9]/g,'').slice(0,2)||'26';
 const id='pl-'+String(teamId||'unknown').replace(/[^a-z0-9-]/gi,'').slice(0,25)+'-'+String(options.instance||'game').replace(/[^a-z0-9-]/gi,'').slice(0,25);
 const mirrored=options.face==='left';
 const jersey=k.jersey,contrast=k.number,trim=k.accent,helmet=k.helmet,pants=k.pants;
 const skin=['#9D6B56','#B48165','#72513F','#AF7757'][(String(teamId).length+(role==='RB'?1:0))%4];
 const pads=k.stripe==='none'?'':k.stripe==='triple'?`<path d="M76 181l55-10m-56 20 53-10m-53 20 52-10m82-20 55 10m-54 0 53 10m-54 0 53 10" stroke="${trim}" stroke-width="6"/>`:k.stripe==='shoulder'?`<path d="M87 149l53 34-22 27-52-31m184-31-49 35 20 25 53-30" fill="${trim}" stroke="#101216" stroke-width="3"/>`:`<path d="M73 181l57-8m81-1 57 9" stroke="${trim}" stroke-width="${k.stripe==='double'?19:10}"/>${k.stripe==='double'?`<path d="M73 181l57-8m81-1 57 9" stroke="${contrast}" stroke-width="5"/>`:''}`;
 const ball=`<g transform="translate(${role==='QB'?269:247} ${role==='QB'?220:238}) rotate(${role==='QB'?32:-26})"><ellipse rx="30" ry="20" fill="#714328" stroke="#d6b69c" stroke-width="3"/><path d="M-22 0H22" stroke="#f4e7d7" stroke-width="3"/><path d="M-12-9v18m7-18v18m7-18v18m7-18v18" stroke="#f4e7d7" stroke-width="2.5"/></g>`;
 const core=`<g transform="${mirrored?'translate(340 0) scale(-1 1)':''}">
 <ellipse cx="171" cy="414" rx="122" ry="14" fill="#06070a" opacity=".5"/>
 <path d="M113 270L84 381l37 13 45-108Z" fill="url(#${id}-pants)" stroke="#282b30" stroke-width="5"/>
 <path d="M189 275l43 111 32-8-23-115Z" fill="url(#${id}-pants)" stroke="#282b30" stroke-width="5"/>
 <path d="M81 372l-15 39 71 5 2-23-30-16Z" fill="#1d2127" stroke="#74767b" stroke-width="4"/>
 <path d="M229 372l2 35 62 7-6-24-31-18Z" fill="#1d2127" stroke="#74767b" stroke-width="4"/>
 <path d="M95 313l33 9-21 66-28-7M213 320l25 67-31 7-18-75" stroke="${trim}" stroke-width="7" fill="none"/>
 <path d="M139 120l-41 23-32 61-28 54 28 27 41-74 45-19Z" fill="url(#${id}-skin)" stroke="#422b24" stroke-width="4"/>
 <path d="M215 122l41 19 28 56 22 50-27 24-48-67-39-15Z" fill="url(#${id}-skin)" stroke="#422b24" stroke-width="4"/>
 <path d="M93 165l-26 67m197-69 20 57" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="10"/>
 <path d="M130 128Q170 119 216 131l40 25 21 116-33 49Q168 340 95 323l-30-45 22-120Z" fill="url(#${id}-jersey)" stroke="#191b20" stroke-width="5"/>
 <path d="M92 145l44 17-11 43-54-14 8-27M251 145l-40 16 12 45 52-14-8-27" fill="${jersey}" stroke="#171a20" stroke-width="5"/>
 <path d="M137 147l37 31 33-31" fill="none" stroke="${trim}" stroke-width="9"/>
 ${pads}
 <path d="M113 307q60 18 121 0" fill="none" stroke="${trim}" stroke-width="7"/>
 <path d="M123 197l100 1-5 91-95-4Z" fill="url(#${id}-texture)" opacity=".84"/>
 <path d="M138 121l2-20 63 0 5 29" fill="url(#${id}-skin)" stroke="#50342d" stroke-width="3"/>
 <path d="M123 84Q118 29 174 22q63-1 68 66l-14 45-33 24-48-12Z" fill="url(#${id}-metal)" stroke="#22262b" stroke-width="6"/>
 <path d="M129 73Q138 27 176 26q44 3 57 49" fill="none" stroke="#f9faf9" stroke-opacity=".47" stroke-width="11"/>
 <path d="M170 24l13 0 13 126-14 2Z" fill="${trim}"/>
 <path d="M151 85l85 6-12 36-68 5-22-18Z" fill="#2a3038" stroke="#d2d6d7" stroke-width="4"/>
 <path d="M155 101l78 7 20 5-4 17-25 8-70-5-19-15" fill="none" stroke="#e1e3e2" stroke-width="6"/>
 <path d="M160 110l-1 35m28-32v39m29-36v29m-72-14 94-3" fill="none" stroke="#dadde0" stroke-width="4"/>
 <path d="M142 107l45 3-7 30-33-6Z" fill="url(#${id}-skin)"/>
 <path d="M150 132l43 17 29-16" fill="none" stroke="#35343a" stroke-width="6"/>
 <path d="M242 212l36-12 27 18-17 27-40 10Z" fill="url(#${id}-skin)" stroke="#533b2c" stroke-width="3"/>
 ${ball}
 <path d="M91 270L74 281M246 242l38 13" stroke="#e8e7e4" stroke-width="10" opacity=".85"/>
 </g>`;
 return `<svg class="uniform-athlete-svg" data-uniform-team="${escapeXml(k.id)}" data-uniform-variant="${k.variant}" viewBox="0 0 340 440" role="img" aria-label="${escapeXml(k.teamName)} original stylized ${role} in ${k.variant} school colors, not a real player's likeness or official uniform"><defs>
 <linearGradient id="${id}-jersey" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${trim}" stop-opacity=".8"/><stop offset=".24" stop-color="${jersey}"/><stop offset=".65" stop-color="${jersey}"/><stop offset="1" stop-color="#080b11" stop-opacity=".75"/></linearGradient>
 <linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${helmet}"/><stop offset=".7" stop-color="${helmet}"/><stop offset="1" stop-color="#161821"/></linearGradient>
 <linearGradient id="${id}-skin" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="#e7bda0"/><stop offset=".41" stop-color="${skin}"/><stop offset="1" stop-color="#3a2925"/></linearGradient>
 <linearGradient id="${id}-pants" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".73"/><stop offset=".33" stop-color="${pants}"/><stop offset="1" stop-color="#30343b"/></linearGradient>
 <pattern id="${id}-texture" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#fff" opacity=".09"/></pattern>
 </defs>${core}<text x="169" y="271" font-family="Arial Narrow,Arial,sans-serif" font-size="79" font-weight="900" stroke="${trim}" stroke-width="5" paint-order="stroke" text-anchor="middle" fill="${contrast}">${number}</text><text x="169" y="287" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="${trim}">GL 26</text></svg>`;
}
