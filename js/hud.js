/* ARETE v7 · HUD layer
   - Mana-particle background (canvas, ~30 fps, pauses when hidden, off for reduced motion)
   - Mentors: four original characters with sigils and lines that change with your day
   - Progress ring + level-up overlay helpers
   Exposes window.HUD. */
(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- background ---------- */
function startBg(){
  const host=document.getElementById('hud-bg');if(!host||reduce)return;
  const c=document.createElement('canvas');host.appendChild(c);const x=c.getContext('2d');
  let W,H,dpr=Math.min(devicePixelRatio||1,2),P=[];
  const N=()=>Math.round(Math.min(46,W*H/26000));
  function size(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    while(P.length<N())P.push(mk(true));P.length=N()}
  function mk(any){return {x:Math.random()*W,y:any?Math.random()*H:H+10,r:Math.random()*1.6+.4,v:Math.random()*.35+.08,a:Math.random()*.6+.2,h:Math.random()<.75?195:265,w:Math.random()*6.28}}
  size();addEventListener('resize',size,{passive:true});
  let last=0,run=true;
  document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run)requestAnimationFrame(loop)});
  function loop(t){if(!run)return;requestAnimationFrame(loop);if(t-last<33)return;last=t;
    x.clearRect(0,0,W,H);
    for(const p of P){p.y-=p.v;p.w+=.02;p.x+=Math.sin(p.w)*.15;if(p.y<-10)Object.assign(p,mk(false));
      const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5);g.addColorStop(0,`hsla(${p.h},100%,72%,${p.a})`);g.addColorStop(1,`hsla(${p.h},100%,60%,0)`);
      x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.r*5,0,6.283);x.fill()}
  }
  requestAnimationFrame(loop);
}

/* ---------- mentors (original characters) ---------- */
const SIG={
 kael:`<g class="spin"><polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6 4"/></g>
  <g class="spin2"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="2 6"/></g>
  <g class="pulse"><path d="M62 28a24 24 0 1 0 0 44a19 19 0 1 1 0-44z" fill="currentColor" opacity=".9"/>
  <path d="M50 18l4 14h-8zM50 82l4-14h-8zM22 50l14-4v8z" fill="currentColor"/><rect x="45" y="45" width="10" height="10" transform="rotate(45 50 50)" fill="#fff"/></g>`,
 garo:`<g class="spin2"><polygon points="32,6 68,6 94,32 94,68 68,94 32,94 6,68 6,32" fill="none" stroke="currentColor" stroke-width="2.2"/></g>
  <g class="spin"><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="10 5"/></g>
  <g class="pulse"><path d="M18 70L38 34l10 16 10-24 24 44z" fill="currentColor" opacity=".9"/><path d="M38 34l6 10-6 4-6-4zM58 26l6 12-6 4-6-4z" fill="#fff" opacity=".85"/></g>`,
 sora:`<g class="spin"><circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 5"/></g>
  <g class="spin2"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="50" cy="16" r="2.5" fill="currentColor"/><circle cx="50" cy="84" r="2.5" fill="currentColor"/></g>
  <g class="pulse"><path d="M50 22l5 23 23 5-23 5-5 23-5-23-23-5 23-5z" fill="currentColor"/><circle cx="50" cy="50" r="6" fill="#fff"/></g>`,
 ryn:`<g class="spin"><rect x="14" y="14" width="72" height="72" fill="none" stroke="currentColor" stroke-width="1.2" transform="rotate(45 50 50)"/></g>
  <g class="spin2"><rect x="22" y="22" width="56" height="56" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="4 4"/></g>
  <g class="pulse"><path d="M50 14v72" stroke="currentColor" stroke-width="3"/><path d="M34 40l16-10 16 10M34 58l16-10 16 10M34 76l16-10 16 10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="miter"/></g>`
};
const MENTORS={
 kael:{name:'Kael',title:'The Night Warden',color:'#8B5CFF',lines:[
  'An army is not summoned. It is built, one quiet morning at a time.',
  'Every rep you finish becomes a soldier that never leaves you.',
  'They will see the result. They will never see the 5:45 alarms. That is your power.',
  'Discipline is the shadow that follows you when motivation has gone home.',
  'Rise. The weak version of you is still asleep. Leave him there.',
  'You do not need to feel ready. You need to be on time.',
  'Darkness before the gym is where kings are made.',
  'One more set. The gate does not close for the tired.']},
 garo:{name:'Garo',title:'The Living Mountain',color:'#FF5470',lines:[
  'Weight does not care about excuses. Lift it anyway.',
  'Legs are the foundation. A mountain without a base is a hill.',
  'Pain is information. Weakness leaving through the front door.',
  'Add the plate. Fear is just weight you have not lifted yet.',
  'You are not tired. You are being forged.',
  'Hunger fades in an hour. The body you build stays for years.',
  'Strong is not a feeling. It is a number on the bar going up.',
  'Hit the top of the range? Then the weight is lying to you. Add more.']},
 sora:{name:'Sora',title:'The Still Sky',color:'#4FD8FF',lines:[
  'Breathe first. A calm chest lifts more than an angry one.',
  'Mastery looks effortless because the effort happened where no one watched.',
  'Control the lowering. Power without control is noise.',
  'Rest is part of the technique. Sleep by 10:30.',
  'Water, protein, sleep. The sky is simple. Be simple.',
  'Wide shoulders, narrow waist. Patience draws that shape.',
  'Do not chase the pump. Chase perfect form, the pump follows.',
  'The strongest move today might be the walk after dinner.']},
 ryn:{name:'Ryn',title:'The Unblessed',color:'#2EF2A0',lines:[
  'No gift. No shortcut. Only the body you earn.',
  'Talent is borrowed. Work is owned.',
  'They had magic. You have reps. Reps win over time.',
  'Every gram of protein is a brick. Count your bricks.',
  'Abs are built in the gym and revealed in the kitchen.',
  'The one who never skips beats the one who was born strong.',
  'Sugar in the chai is a debt. Your belly pays it.',
  'Earn the cuts. Nobody can give them to you.']}
};
function mentorFor(sessT,rest){
  const t=(sessT||'').toLowerCase();
  if(rest)return 'sora';
  if(/chest|leg/.test(t))return 'garo';
  if(/back|pump|pull/.test(t))return 'kael';
  if(/arm/.test(t))return 'ryn';
  if(/shoulder|cardio|mobility/.test(t))return 'sora';
  return ['kael','garo','sora','ryn'][new Date().getDate()%4];
}
function dayHash(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h)}
function renderMentor(el,ctx){
  if(!el)return;const id=mentorFor(ctx.sessT,ctx.rest),m=MENTORS[id];
  const line=m.lines[dayHash(ctx.date+id)%m.lines.length];
  el.style.setProperty('--m',m.color);el.classList.add('mentorwin');
  el.innerHTML=`<div class="mentor"><div class="emb" style="color:${m.color}" aria-hidden="true"><svg viewBox="0 0 100 100">${SIG[id]}</svg></div>
   <div><div class="who">Mentor · ${m.title}</div><h3>${m.name}</h3><blockquote>${line}</blockquote>${ctx.order?`<div class="order">${ctx.order}</div>`:''}</div></div>`;
}

/* ---------- ring ---------- */
function ring(pct,label,value){
  const r=44,C=2*Math.PI*r,off=C*(1-Math.max(0,Math.min(1,pct)));
  return `<div class="ringwrap" role="img" aria-label="${label} ${Math.round(pct*100)}%"><svg viewBox="0 0 100 100"><defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CFF"/><stop offset="1" stop-color="#4FD8FF"/></linearGradient></defs>
   <circle class="ring-bg" cx="50" cy="50" r="${r}"/><circle class="ring-fg" cx="50" cy="50" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/><circle class="ring-tick" cx="50" cy="50" r="${r}"/></svg>
   <div class="rv"><b>${value}</b><span>${label}</span></div></div>`;
}

/* ---------- level up ---------- */
// Overlays queue up: a level-up and a title unlock at the same moment show one after the other.
const lvq=[];
function levelUp(t1,t2,t3){
  let o=document.getElementById('lvup');
  if(!o){o=document.createElement('div');o.id='lvup';o.className='lvup';o.hidden=true;o.setAttribute('role','alertdialog');o.innerHTML='<div class="core"><div class="rings"><i></i><i></i><i></i></div><div class="t1"></div><div class="t2"></div><div class="t3"></div><button type="button" class="primary" style="margin-top:14px">Continue</button></div>';document.body.appendChild(o);
    o.querySelector('button').onclick=()=>{const n=lvq.shift();if(n)show(o,n);else o.hidden=true}}
  if(!o.hidden){lvq.push([t1,t2,t3]);return}
  show(o,[t1,t2,t3]);
}
function show(o,[t1,t2,t3]){
  o.querySelector('.t1').textContent=t1;o.querySelector('.t2').textContent=t2;o.querySelector('.t3').textContent=t3||'';o.hidden=false;
  const t2e=o.querySelector('.t2');t2e.style.animation='none';void t2e.offsetWidth;t2e.style.animation='';
  try{if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))navigator.vibrate([40,40,90])}catch(e){}
}

window.HUD={startBg,renderMentor,ring,levelUp,MENTORS};
// Particles start after the page has loaded and settled, so they don't compete with the first render.
const bgLater=()=>setTimeout(startBg,3000);if(document.readyState==='complete')bgLater();else addEventListener('load',bgLater,{once:true});
})();
