/* ARETE — app logic: today, plan, tracking, status, timer, settings, reminders. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- storage ---------- */
const P='hunter:';
const S={get(k,d){try{const v=localStorage.getItem(P+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
         set(k,v){SV++;try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}},
         del(k){SV++;try{localStorage.removeItem(P+k)}catch(e){}}};
let SV=0;const _memo={};function memo(name,fn){const m=_memo[name];if(m&&m.v===SV&&m.d===ymd(new Date()))return m.r;const r=fn();_memo[name]={v:SV,d:ymd(new Date()),r};return r}

/* ---------- dates ---------- */
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseYmd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
const DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],DFULL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const RANKS=['E','D','C','B','A','S'];

/* ---------- profile ---------- */
const DEF={medHold:true,asthma:true,wt:72,ht:170,start:ymd(mondayOf(new Date())),diet:1,gym:'morning',supps:true};
let prof=Object.assign({},DEF,S.get('profile',{}));
if(!S.get('profile',null))S.set('profile',prof);
const saveProf=()=>{S.set('profile',prof);window.HUNTER_ASTHMA=!!prof.asthma};window.HUNTER_ASTHMA=!!prof.asthma;
if(!S.get('spiroMig',false)){if(prof.ht===170)prof.ht=178;if(prof.wt===72)prof.wt=76;S.set('profile',prof);S.set('spiroMig',true)}
if(S.get('mver',1)<2){const md=S.get('mdone',{}),nd={};Object.entries(md).forEach(([k,v])=>{nd[+k>=2?+k+1:k]=v});S.set('mdone',nd);S.set('mver',2)}
const protein=()=>Math.round(prof.wt*1.8);
const waterL=()=>Math.round(prof.wt*0.04*2)/2+0.5;   // +0.5 L for training
function posOf(date){const st=mondayOf(parseYmd(prof.start));const days=Math.floor((new Date(date.getFullYear(),date.getMonth(),date.getDate())-st)/864e5);return {w:Math.max(1,Math.floor(days/7)+1),d:(date.getDay()+6)%7,days}}
const todayStr=()=>ymd(new Date());
function earnedRank(){return S.get('rank','E')}

/* ---------- day record ---------- */
const dayKey=ds=>'day:'+ds;
function getDay(ds){return Object.assign({tl:{},water:0,q:{},workout:null},S.get(dayKey(ds),{}))}
function setDay(ds,o){S.set(dayKey(ds),o)}

/* ---------- quests ---------- */
function questsFor(ds){
  const p=posOf(parseYmd(ds)),sess=Plan.program(p.w,p.d),rec=getDay(ds);
  const tl=Diet.timeline(prof.gym,p.d,prof.diet,!!sess.rest,waterL(),prof.supps);
  const meals=tl.filter(t=>t.type==='meal'),mealsDone=meals.filter(t=>rec.tl[t.id]).length;
  const q=[];
  const br=prof.asthma?rec.breath:null;
  if(!sess.rest&&br==='y')q.push({id:'light',t:'Light day: 30 min easy walk + mobility',s:'Asthma yellow zone · no intervals or heavy sets',done:!!rec.q.light||!!rec.workout});
  else if(!sess.rest&&br!=='r')q.push({id:'work',t:`Complete: ${sess.t}`,s:'Finish the workout in Body',auto:true,done:!!rec.workout});
  if(p.d===6){const has=latestLog().some(r=>r.date===ds&&r.waist);q.push({id:'waistq',t:'Measure waist: morning, at the navel, before food',s:'Log it in Stats → Body log',auto:true,done:has})}
  q.push({id:'water',t:`Drink ${waterL().toFixed(1)} L water`,s:`${(rec.water/1000).toFixed(2)} L so far`,auto:true,done:rec.water>=waterL()*1000});
  q.push({id:'meals',t:`Eat ${meals.length} planned meals`,s:`${mealsDone} of ${meals.length} ticked in the timeline`,auto:true,done:mealsDone>=meals.length-1});
  const ft=(typeof totals==='function')?totals(ds):{n:0,p:0};
  if(ft.n)q.push({id:'prot',t:`Hit ${protein()} g protein`,s:`${Math.round(ft.p)} g logged in Food`,auto:true,done:ft.p>=protein()*0.95});
  else q.push({id:'prot',t:`Hit ${protein()} g protein`,s:'Log meals in Food to track this automatically',done:!!rec.q.prot});
  q.push({id:'steps',t:`Walk ${Plan.stepsFor(p.w).toLocaleString('en-IN')} steps`,s:'Check your phone\'s step counter',done:!!rec.q.steps});
  q.push({id:'clean',t:'No sugar, no fried food',s:'No chai sugar, samosa, biscuits, cold drinks',done:!!rec.q.clean});
  q.push({id:'pf',t:'Vitality routine (5 min)',s:'Pelvic floor, seated on the commute',done:!!rec.q.pf});
  q.push({id:'sleep',t:'Sleep by 10:30 pm',s:'Tick tomorrow morning if you made it',done:!!rec.q.sleep});
  habitsOn(ds).forEach(h=>q.push({id:'h:'+h.id,t:h.t,s:'Your habit',habit:true,done:!!rec.q['h:'+h.id]}));
  return q;
}
/* custom habits: {id,t,days:[0-6]|null,from,to}. Archived habits keep their history (from <= day < to). */
function habits(){return S.get('habits',[])}
function habitsOn(ds){const wd=(parseYmd(ds).getDay()+6)%7;return habits().filter(h=>h.from<=ds&&(!h.to||h.to>ds)&&(!h.days||!h.days.length||h.days.includes(wd)))}
let _dsc={v:-1,m:{}};
function dayScore(ds){if(_dsc.v!==SV)_dsc={v:SV,m:{}};if(ds in _dsc.m)return _dsc.m[ds];const q=questsFor(ds);return _dsc.m[ds]=q.filter(x=>x.done).length/q.length}
function hasData(ds){return localStorage.getItem(P+dayKey(ds))!==null}

/* ---------- XP / level / streak ---------- */
function allDays(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'day:'))out.push(k.slice((P+'day:').length))}}catch(e){}return out.sort()}
function xpTotal(){return memo('xp',xpCalc)}
function xpCalc(){let xp=0;for(const ds of allDays()){const q=questsFor(ds);xp+=q.filter(x=>x.done).length*15;if(getDay(ds).workout)xp+=50;try{xp+=missionQuests(ds).filter(x=>x.done).length*10}catch(e){}}
  try{xp+=Object.keys(S.get('mdone',{})).length*100}catch(e){}
  xp+=S.get('tests',[]).filter(t=>t.passed).length*500;
  try{const m0=mondayOf(parseYmd(prof.start)),now=mondayOf(new Date());for(let m=m0;m<=now;m=addDays(m,7))xp+=weeklyQuests(ymd(m)).filter(x=>x.done).reduce((a,x)=>a+x.xp,0)}catch(e){}
  return xp}
function streak(){return memo('streak',streakCalc)}
function streakCalc(){let d=new Date();if(dayScore(ymd(d))<0.8)d=addDays(d,-1);return runBack(d)}
function runBack(d){let n=0;for(let g=0;g<2000&&posOf(d).days>=0;g++){const ds=ymd(d);if(dayScore(ds)>=0.8)n++;else if(!isFrozen(ds))break;d=addDays(d,-1)}return n}
function isFrozen(ds){const p=posOf(parseYmd(ds));if(p.days<0)return false;if(Plan.program(p.w,p.d).rest)return true;if(prof.asthma&&getDay(ds).breath==='r')return true;return S.get('forgiven',[]).includes(ds)}

/* ---------- workout log ---------- */
const wlKey=(ds,k)=>`wl:${ds}:${k}`;
function hist(k){return S.get('hist:'+k,[])}
function saveHist(k,ds,sets,u){
  const h=hist(k).filter(x=>x.date!==ds);
  const valid=sets.filter(s=>s.reps>0);
  if(valid.length){const e1=Math.max(...valid.map(s=>(s.kg||0)*(1+s.reps/30)));const o={date:ds,sets:valid,e1:Math.round(e1*10)/10};if(u)o.u=u;h.push(o)}
  h.sort((a,b)=>a.date<b.date?-1:1);S.set('hist:'+k,h);
}
function lastBefore(k,ds){const h=hist(k).filter(x=>x.date<ds);return h[h.length-1]}
function progCue(dose,last){
  const m=/× (\d+)–(\d+)(?! s)/.exec(dose);if(!m||!last||last.u==='s'||!last.sets.length)return '';
  const lo=+m[1],hi=+m[2],reps=last.sets.map(s=>s.reps),kgs=last.sets.map(s=>s.kg||0),mx=Math.max(...kgs);
  if(Math.max(...reps)>hi+4)return `<p class="prog up">Too light last time (${Math.max(...reps)} reps). Pick a weight you can lift only ${hi} times.</p>`;
  if(reps.every(r=>r>=hi))return `<p class="prog up">▲ You hit ${hi} on every set. Add ${mx>=40?'5':'2.5'} kg today${mx?` → about ${mx+(mx>=40?5:2.5)} kg (or the next dumbbell up)`:''}.</p>`;
  if(reps.some(r=>r<lo))return `<p class="prog hold">Below ${lo} reps last time. Keep this weight until every set reaches ${lo}+.</p>`;
  return `<p class="prog">Same weight. Beat last time by 1 rep on any set.</p>`;
}
function setsIn(dose){const m=/^(\d+) ×/.exec(dose);return m?+m[1]:0}

/* ---------- colours ---------- */
const COL={warm:'var(--warm)',strength:'var(--strength)',cardio:'var(--cardio)',core:'var(--core)',stretch:'var(--stretch)'};
const HEX={warm:'#F2C14E',strength:'#6E97FF',cardio:'#FF8D52',core:'#3DDC97',stretch:'#B892FF'};

/* =================================================================
   HEADER
   ================================================================= */
function header(){
  const p=posOf(new Date()),st=Plan.stageOf(p.w),r=earnedRank();
  $('rank').textContent=r;
  $('ranksub').textContent=p.days<0?`Starts ${prof.start}`:`Week ${Math.min(p.w,999)} · ${st.name.split(' · ')[1]||st.name}`;
  const xp=xpTotal(),lv=Math.floor(xp/1000)+1;
  $('lv').textContent=lv;
  const seen=S.get('lvseen',0);if(!seen)S.set('lvseen',lv);else if(lv>seen){S.set('lvseen',lv);if(window.HUD)HUD.levelUp('[ SYSTEM ]','LEVEL UP',`You reached level ${lv}. Keep going, Hunter.`)}
  try{checkBadges()}catch(e){}
}

/* =================================================================
   TODAY
   ================================================================= */
function renderToday(){
  const now=new Date(),ds=ymd(now),p=posOf(now),sess=Plan.program(p.w,p.d),rec=getDay(ds),st=Plan.stageOf(p.w);
  const tl=Diet.timeline(prof.gym,p.d,prof.diet,!!sess.rest,waterL(),prof.supps);
  const hm=now.getHours()*60+now.getMinutes();
  const nxt=tl.find(t=>{const [h,m]=t.time.split(':').map(Number);return h*60+m>=hm&&!rec.tl[t.id]})||null;
  const ql=questsFor(ds),qd=ql.filter(q=>q.done).length,ft=totals(ds),T=targets();
  renderStatusWin(p,st);
  renderPenalty();
  renderGate(p,sess,rec,st);
  renderBreath();
  renderQuick(rec,ft,T);
  // daily quests
  $('daily').innerHTML=`<div class="wh"><h3 class="sub">Daily quests</h3><span class="qcount${qd===ql.length?' all':''}"><b>${qd}</b>/${ql.length}</span></div>
   <p class="cue">+15 XP each · resets at midnight${dayScore(ds)>=0.8?' · <b class="okc">streak secured today</b>':` · ${Math.max(0,Math.ceil(ql.length*0.8)-qd)} more keeps your streak`}</p>
   <div class="quests">${ql.map(q=>`<label class="q${q.auto?' auto':''}${q.id===justTick?' just':''}"><input type="checkbox" data-quest="${q.id}" ${q.done?'checked':''} ${q.auto?'disabled':''}><span>${esc(q.t)}<small>${esc(q.s)}${q.auto?' · ticks itself':''}</small></span></label>`).join('')}</div>${habitPanel()}`;
  renderWeekly();
  // mentor
  if(window.HUD){const h=now.getHours();let order='';
    if(!sess.rest&&!rec.workout&&h<11)order=`Clear today's Gate: ${sess.t}.`;
    else if(rec.water<waterL()*1000*Math.min(1,Math.max(0,(h-6)/14)))order='Drink 2 glasses of water now.';
    else if(ft.p<T.p*0.6&&h>=14)order=`Protein is at ${Math.round(ft.p)} g. Add whey, eggs, paneer or soya.`;
    else if(!sess.rest&&!rec.workout)order=`The ${sess.t} Gate is still open.`;
    else order='Sleep by 10:30. Growth happens tonight.';
    HUD.renderMentor($('mentor'),{date:ds,sessT:sess.t,rest:!!sess.rest,order})}
  renderMissionToday();
  // day plan (folded)
  const fold=$('tl-fold');if(fold&&!fold.dataset.init){fold.dataset.init=1;fold.open=S.get('tlOpen',false);fold.addEventListener('toggle',()=>S.set('tlOpen',fold.open))}
  $('tl-sum').textContent=nxt?`Next ${nxt.time} · ${nxt.title}`:'All done for today';
  $('tl-note').textContent=`${prof.gym==='morning'?'Morning':'Evening'} gym schedule · tick items as you go`;
  $('timeline').innerHTML=tl.map(t=>{const done=!!rec.tl[t.id];const [h,m]=t.time.split(':').map(Number);const past=h*60+m<hm;
    return `<li class="tl t-${t.type}${done?' done':''}${!done&&past?' late':''}"><label><input type="checkbox" data-tl="${t.id}" data-ml="${t.ml}" ${done?'checked':''}>
      <time>${t.time}</time><span class="tl-b"><b>${esc(t.title)}</b>${t.detail?`<span>${esc(t.detail)}</span>`:''}${t.note?`<small>${esc(t.note)}</small>`:''}</span>${t.ml?`<em>${t.ml} ml</em>`:''}</label></li>`}).join('');
  $('diet-rules').innerHTML=`<h3 class="sub">${st.rank}-Rank diet rules</h3><ul class="plain">${Diet.rulesFor(st.rank,Plan.origWeek(p.w)).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
   <p class="cue">Portions: 1 phulka is palm-sized without ghee. 1 cup cooked rice is a fist. 1 bowl dal is about 200 ml. 2–3 tsp oil per person per day in total.</p>`;
  renderCut();
  header();
}

/* ---------- Today: status window (rank, level, XP, streak) ---------- */
let xpShown=null,justTick=null;
const FLAME=`<svg viewBox="0 0 32 40" aria-hidden="true"><defs><linearGradient id="fl-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF5470"/><stop offset=".55" stop-color="#FF8D52"/><stop offset="1" stop-color="#FFC857"/></linearGradient></defs>
  <path class="fl-o" d="M16 1c2 7 11 11 11 22a11 11 0 0 1-22 0c0-6 3-9 5-12 1 4 3 5 4 5-1-6 0-11 2-15z" fill="url(#fl-g)"/><path class="fl-i" d="M16 20c1 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-7 0 2 1 3 2 3-.5-2 0-4 0-6z" fill="#FFF3C4"/></svg>`;
function renderStatusWin(p,st){
  const xp=xpTotal(),lv=Math.floor(xp/1000)+1,into=xp%1000,sk=streak(),r=earnedRank(),now=new Date();
  const name=prof.name?esc(prof.name):'Hunter';
  const el=$('statuswin');
  el.innerHTML=`<div class="sw-top"><span class="k">${DFULL[p.d]}, ${now.getDate()} ${now.toLocaleString('en-IN',{month:'short'})} · Week ${p.w} · ${esc(st.name.split(' · ')[1]||st.name)}</span></div>
   <div class="sw">
    <div class="rank xl"><span>${r}</span></div>
    <div class="sw-main"><b class="sw-name">${name}</b><span class="sw-title">${r}-Rank Hunter${titleName()?` · <b class="goldc">${esc(titleName())}</b>`:prof.goal?` · ${esc(GOALS[prof.goal]||'')}`:''}</span>
     <div class="lvrow"><span class="lvtag">LV <b>${lv}</b></span><span class="cue"><b class="goldc">${into.toLocaleString('en-IN')}</b> / 1,000 XP</span></div></div>
    <div class="flame${sk?'':' off'}" title="Streak"><span class="fl-ic">${FLAME}</span><b>${sk}</b><span>day${sk===1?'':'s'}</span></div>
   </div>
   <div class="xpbar" role="progressbar" aria-label="XP to next level" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="${into}"><i></i></div>
   <p class="cue sw-foot">${(1000-into).toLocaleString('en-IN')} XP to level ${lv+1} · ${xp.toLocaleString('en-IN')} XP total${isFrozen(todayStr())&&dayScore(todayStr())<0.8?' · <span class="frz">❄ streak frozen today</span>':''}</p>`;
  const bar=el.querySelector('.xpbar i'),to=into/10;
  const from=xpShown==null?0:(xpShown.lv===lv?xpShown.pct:0);
  bar.style.width=from+'%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.width=to+'%'}));
  if(xpShown&&xp>xpShown.xp){bar.parentElement.classList.add('gain');setTimeout(()=>bar.parentElement.classList.remove('gain'),900)}
  xpShown={xp,lv,pct:to};
}

/* ---------- Today: Gate card ---------- */
const GATE_SVG=`<svg viewBox="0 0 120 120" aria-hidden="true" class="gate-svg"><defs>
  <radialGradient id="gt-c" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#E8FBFF" stop-opacity=".95"/><stop offset=".35" stop-color="#4FD8FF" stop-opacity=".7"/><stop offset=".75" stop-color="#8B5CFF" stop-opacity=".35"/><stop offset="1" stop-color="#8B5CFF" stop-opacity="0"/></radialGradient>
  <linearGradient id="gt-e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FD8FF"/><stop offset="1" stop-color="#8B5CFF"/></linearGradient></defs>
  <ellipse cx="60" cy="64" rx="44" ry="50" fill="url(#gt-c)" class="gt-core"/>
  <g class="gt-r1"><polygon points="60,6 108,34 108,90 60,118 12,90 12,34" fill="none" stroke="url(#gt-e)" stroke-width="2.5"/></g>
  <g class="gt-r2"><polygon points="60,20 96,41 96,83 60,104 24,83 24,41" fill="none" stroke="#4FD8FF" stroke-width="1" stroke-dasharray="3 5" opacity=".8"/></g>
  <path d="M44 92V58a16 16 0 0 1 32 0v34" fill="none" stroke="#fff" stroke-width="2" opacity=".85"/></svg>`;
function gateXP(sess){return sess.rest?0:65}
function renderGate(p,sess,rec,st){
  const el=$('gate');const br=prof.asthma?rec.breath:null;
  const strength=sess.blocks.filter(b=>b.kind==='strength'||b.kind==='core').reduce((a,b)=>a+(b.items||[]).length,0);
  const total=sess.blocks.reduce((a,b)=>a+b.min,0);
  let state='open',title=sess.t,line='',btn='';
  if(sess.rest){state='rest';title='Rest + long walk';line='No Gate today. Muscle is built while you recover: easy walk for your steps, protein, early sleep.'}
  else if(rec.workout){state='clear';line='Gate cleared. Log any extra sets in Body.'}
  else if(br==='r'){state='sealed';line='Breathing check is red: the Gate stays sealed today. Rest and follow your asthma plan.'}
  else if(br==='y'){state='light';line='Yellow zone: enter the light version only. 30 min easy walk + mobility, no heavy sets.'}
  const resume=S.get('gateRun',{}).ds===todayStr();
  btn=state==='open'||state==='light'?`<button type="button" class="primary big gate-go" id="go-workout">${resume?'Resume Gate':'Enter Gate'}</button>`:state==='clear'?`<button type="button" class="ghost" id="go-workout">View workout</button>`:'';
  el.dataset.state=state;
  el.innerHTML=`<div class="gate-art">${GATE_SVG}</div>
   <div class="gate-b"><span class="k">Today's Gate · ${st.rank}-Rank${state==='clear'?' · <b class="okc">Cleared</b>':''}</span>
    <h2 class="gate-t">${esc(title)}</h2>
    ${sess.rest?'':`<div class="gate-meta"><span>${total} min</span><span>${strength} exercises</span><span class="gxp">+${gateXP(sess)} XP</span></div>
    <div class="bar">${sess.blocks.map(b=>`<i style="flex:${b.min};background:${COL[b.kind]}"></i>`).join('')}</div>`}
    ${line?`<p class="cue gate-line">${line}</p>`:''}${sess.note?`<p class="cue">${esc(sess.note)}</p>`:''}</div>${btn}`;
  const gw=$('go-workout');if(gw)gw.onclick=()=>{if(state==='clear'){selW=p.w;selD=p.d;showView('plan')}else openGate()};
}

/* ---------- Today: water + protein quick-add ---------- */
const PQUICK=[['whey',1,'Whey','1 scoop',0],['egg',2,'2 eggs','',1],['paneer',1,'Paneer','100 g',0],['soya',1,'Soya','50 g',0],['curd',1,'Curd','1 bowl',0]];
function renderQuick(rec,ft,T){
  const goal=waterL()*1000,w=rec.water||0,h=new Date().getHours();
  const need=h>=20&&w<3000?3000:h>=16&&w<2000?2000:h>=12&&w<1000?1000:0;
  const pq=PQUICK.filter(x=>!x[4]||prof.diet>=x[4]).map(([k,q,l,u])=>{const f=food(k);return f?`<button type="button" class="chipbtn" data-pq="${k}" data-q="${q}"><b>+${Math.round(f.p*q)} g</b><span>${l}${u?' · '+u:''}</span></button>`:''}).join('');
  $('quick').innerHTML=`<div class="qk">
    <div class="qk-h"><span class="k">Water</span><b class="qk-v">${(w/1000).toFixed(2)}<small> / ${waterL().toFixed(1)} L</small></b></div>
    <div class="mtrack lg"><i style="width:${Math.min(100,w/goal*100)}%;background:linear-gradient(90deg,#3D7BFF,var(--cyan))"></i></div>
    ${need?`<p class="cue warnc">Behind: you should be at ${need/1000} L by now. Drink 2 glasses.</p>`:''}
    <div class="qk-btns"><button type="button" class="primary" data-water="250">+ 250 ml</button><button type="button" class="ghost" data-water="500">+ 500 ml</button><button type="button" class="ghost" data-water="-250" aria-label="Remove 250 ml">− 250</button></div></div>
   <div class="qk">
    <div class="qk-h"><span class="k">Protein</span><b class="qk-v">${Math.round(ft.p)}<small> / ${T.p} g</small></b></div>
    <div class="mtrack lg"><i style="width:${Math.min(100,ft.p/T.p*100)}%;background:linear-gradient(90deg,#1FB57E,var(--ok))"></i></div>
    <div class="qk-chips">${pq}</div><p class="cue">Adds to your Food log for this meal.</p></div>`;
}
function addFoodOn(ds,k,q,m){const a=foodLog(ds);a.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),f:k,q:q||1,m:m||mealNow()});setFoodLog(ds,a)}
document.addEventListener('change',e=>{
  const t=e.target,ds=todayStr();
  if(t.dataset.quest){const r=getDay(ds);r.q[t.dataset.quest]=t.checked;setDay(ds,r);if(t.checked){buzz(15);justTick=t.dataset.quest}renderToday();justTick=null}
  if(t.dataset.tl){const r=getDay(ds);r.tl[t.dataset.tl]=t.checked;const ml=+t.dataset.ml||0;if(ml)r.water=Math.max(0,r.water+(t.checked?ml:-ml));setDay(ds,r);renderToday()}
});
document.addEventListener('click',e=>{
  const w=e.target.closest('[data-water]');if(w){const ds=todayStr(),r=getDay(ds);r.water=Math.max(0,r.water+ +w.dataset.water);setDay(ds,r);buzz(10);renderToday();return}
  const pq=e.target.closest('[data-pq]');if(pq){const k=pq.dataset.pq,q=+pq.dataset.q,f=food(k);addFoodOn(todayStr(),k,q);pushRecent(k);buzz(10);toast(`Added ${q>1?q+' × ':''}${f.n} · +${Math.round(f.p*q)} g protein`);renderToday()}
});
function buzz(ms){try{if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))navigator.vibrate(ms)}catch(e){}}

/* =================================================================
   PLAN
   ================================================================= */
let selW=1,selD=0;
function stageList(){return [...Plan.STAGES,{rank:'S',start:44,end:47,name:'S-Rank · Apex',goal:'Maintain. Repeat the A-Rank cycle with your new numbers.'}]}
function renderPlan(){
  const st=Plan.stageOf(selW),stages=stageList(),cur=posOf(new Date()).w;
  $('ranks').innerHTML=stages.map(s=>`<button type="button" data-st="${s.start}" aria-pressed="${s.rank===st.rank}"><b>${s.rank}</b><span>W${s.start}${s.rank==='S'?'+':'–'+s.end}</span></button>`).join('');
  $('stage-goal').innerHTML=`<b>${esc(st.name)}</b> · ${esc(st.goal)}${selW>=Plan.SPLIT_FROM?` · <span class="tag" style="--c:var(--cyan)">${Plan.SPLIT_PHASES[Plan.splitPhase(selW)]}</span>`:st.rank==='E'?` · <span class="tag" style="--c:var(--cyan)">${Plan.EPHASES[Plan.ePhase(selW)]}</span>`:''}`;
  const sEnd=st.rank==='S'?st.start+15:st.end;let wb='';
  for(let w=st.start;w<=sEnd;w++){let c=0;for(let d=0;d<7;d++){const ds=ymd(addDays(mondayOf(parseYmd(prof.start)),(w-1)*7+d));if(hasData(ds)&&getDay(ds).workout)c++}
    wb+=`<button type="button" data-w="${w}" aria-pressed="${w===selW}" class="${w===cur?'cur':''}${Plan.deloadOf(w,st)?' dl':''}">${w}<small><i style="width:${c/6*100}%"></i></small></button>`}
  $('weeks').innerHTML=wb;
  $('days').innerHTML=DN.map((n,d)=>`<button type="button" data-d="${d}" aria-pressed="${d===selD}"><b>${n}</b><span>${esc(Plan.program(selW,d).t)}</span></button>`).join('');
  renderSession();
}
$('ranks').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;selW=+b.dataset.st;renderPlan()});
$('weeks').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;selW=+b.dataset.w;renderPlan()});
$('days').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;selD=+b.dataset.d;renderPlan()});
$('btn-today').addEventListener('click',()=>{const p=posOf(new Date());selW=p.w;selD=p.d;renderPlan()});

function renderSession(){
  const sess=Plan.program(selW,selD),total=sess.blocks.reduce((a,b)=>a+b.min,0),ds=todayStr(),p=posOf(new Date());
  const isToday=selW===p.w&&selD===p.d;
  let h=`<section class="win"><div class="sys">Week ${selW} · ${DFULL[selD]}${isToday?' · Today':''}</div><div class="dayhead"><h2>${esc(sess.t)}</h2>${total?`<div class="total">${total}<span>min</span></div>`:''}</div>`;
  if(sess.note)h+=`<p class="note">${esc(sess.note)}</p>`;
  if(prof.medHold&&!sess.rest)h+=`<p class="note hold">Doctor review pending: sprints, burpees, jumps and hard runs are swapped for steady cardio at a pace where you can still talk. Strength work stays. Turn this off in Settings once your chest doctor clears you.</p>`;
  if(prof.medHold&&sess.test)h+=`<p class="note hold">Rank test postponed: do the strength parts only. Skip the timed run until your doctor clears you.</p>`;
  if(prof.asthma&&!sess.rest)h+=`<p class="note asn">Asthma mode: warm up 12–15 min, gradually. Reliever inhaler in your bag. On a yellow day do the light session instead. Stop at any wheeze or chest tightness.</p>`;
  if(sess.test)h+=`<p class="note">Rank assessment. Enter your results in Status → Rank test.</p>`;
  if(total)h+=`<div class="bar">${sess.blocks.map(b=>`<i style="flex:${b.min};background:${COL[b.kind]}"></i>`).join('')}</div><div class="legend">${sess.blocks.map(b=>`<span style="--c:${COL[b.kind]}">${esc(b.label)} ${b.min} min</span>`).join('')}</div>`;
  if(!isToday&&!sess.rest)h+=`<p class="cue" style="margin-top:10px">Sets you log here are saved to today's date.</p>`;
  if(isToday&&!sess.rest&&!getDay(ds).workout)h+=`<button type="button" class="primary big" id="body-gate" style="width:100%;margin-top:16px">Enter Gate · one exercise at a time</button>`;
  h+='</section>';
  const root=$('day');root.innerHTML=h;const bg=$('body-gate');if(bg)bg.onclick=()=>openGate();
  if(sess.rest){root.insertAdjacentHTML('beforeend','<section class="win rest"><b>Recovery</b><p class="cue">Muscles grow on rest days. Easy walk for your steps, eat your protein, sleep early.</p></section>');return}
  let n=0;
  sess.blocks.forEach(bl=>{
    const sec=document.createElement('section');sec.className='block';sec.style.setProperty('--c',COL[bl.kind]);
    if(prof.medHold&&bl.items)bl={...bl,items:adaptItems(bl.items)};
    const hard=!prof.medHold&&prof.asthma&&bl.items&&bl.items.some(([k])=>['sprints','intervals','jogint','run','burpee','kbswing','jumprope','climber','boxjump'].includes(k));
    sec.innerHTML=`${hard?'<p class="cue asn2">Asthma: if your chest tightens, switch to steady easy cycling for the rest of this block.</p>':''}<div class="bhead"><h3>${esc(bl.label)}</h3><span class="min">${bl.min} min</span>${bl.how?`<span class="how">${esc(bl.how)}</span>`:''}</div>${bl.text?`<p class="btext">${esc(bl.text)}</p>`:''}`;
    if(bl.kind==='stretch')sec.appendChild(mobLogger(bl,ds));
    if(bl.items){const g=document.createElement('div');g.className='grid';
      bl.items.forEach(([key,dose])=>{n++;const e=EX[key];if(!e)return;const c=document.createElement('article');c.className='card';
        const fg=document.createElement('button');fg.type='button';fg.className='fig';fg.setAttribute('aria-label','How to do '+e.n);fg.appendChild(Fig.svg(e.fig,HEX[bl.kind],e.n));fg.onclick=()=>openSheet(key);c.appendChild(fg);
        const mode=logMode(bl.kind,key,dose);const ns=(mode==='sets'||mode==='reps'||mode==='secs')?setsIn(dose):0;
        const last=lastBefore(key,ds);
        c.insertAdjacentHTML('beforeend',`<div class="info"><div class="top"><span class="tag">${esc(e.m)}</span><span class="num">${String(n).padStart(2,'0')}</span></div>
          <h4>${esc(e.n)}</h4><div class="dose">${esc(dose)}</div>
          ${mode==='cardio'?cardioLast(key,ds):last?`<p class="cue last">Last: ${last.sets.map(s=>`${s.kg?s.kg+'×':''}${s.reps}${last.u==='s'?' s':''}`).join(', ')}</p>${progCue(dose,last)}`:''}
          <div class="cardbtns"><button type="button" class="link" data-how="${key}">How to</button>${ns?`<button type="button" class="link" data-logt="${key}">${mode==='secs'?'Log hold times':'Log sets'}</button>`:''}${mode==='cardio'?`<button type="button" class="link" data-logt="${key}">Log cardio</button>`:''}</div></div>`);
        if(ns)c.appendChild(logger(key,ns,ds,last,mode));
        if(mode==='cardio')c.appendChild(cardioLogger(key,ds,dose,bl.label));
        g.appendChild(c)});
      sec.appendChild(g)}
    root.appendChild(sec);
  });
  const done=!!getDay(ds).workout;
  root.insertAdjacentHTML('beforeend',`<section class="win finish"><button type="button" class="primary big" id="finish" ${done?'disabled':''}>${done?'Workout logged for today ✓':'Finish workout'}</button><p class="cue">Logs your sets, ticks today's workout quest and adds 50 XP.</p></section>`);
  $('finish').onclick=()=>{const r=getDay(ds);r.workout={w:selW,d:selD,t:sess.t,at:Date.now()};setDay(ds,r);toast('Workout complete. +50 XP');renderSession();header()};
}
function logger(key,ns,ds,last,mode){
  mode=mode||'sets';
  const cur=S.get(wlKey(ds,key),[]);
  const box=document.createElement('div');box.className='logger';box.hidden=!cur.length;box.dataset.lg=key;
  if(mode!=='sets'){let rows='';const u=mode==='secs'?'sec':'reps';
    for(let i=0;i<ns;i++){const v=cur[i]||{},ph=last&&last.sets[i]?last.sets[i]:{};
      rows+=`<div class="setrow two"><span>Set ${i+1}</span><input type="number" inputmode="numeric" step="1" min="0" placeholder="${ph.reps??u}" value="${v.reps??''}" data-k="${key}" data-i="${i}" data-f="reps" data-u="${mode==='secs'?'s':''}" aria-label="Set ${i+1} ${u}"><span class="x">${u}</span></div>`}
    box.innerHTML=rows+`<p class="cue">${mode==='secs'?'Seconds you held with good form. Stop when your hips sag.':'Reps with good form. Beat last time by 1–2.'}</p>`;return box}
  let rows=`<div class="setrow head"><span></span><b>Weight kg</b><span></span><b>Reps</b></div>`;for(let i=0;i<ns;i++){const v=cur[i]||{},ph=last&&last.sets[i]?last.sets[i]:{};
    rows+=`<div class="setrow"><span>Set ${i+1}</span><input type="number" inputmode="decimal" step="0.5" min="0" placeholder="${ph.kg??'kg'}" value="${v.kg??''}" data-k="${key}" data-i="${i}" data-f="kg" aria-label="Set ${i+1} weight kg"><span class="x">kg ×</span><input type="number" inputmode="numeric" step="1" min="0" placeholder="${ph.reps??'reps'}" value="${v.reps??''}" data-k="${key}" data-i="${i}" data-f="reps" aria-label="Set ${i+1} reps"></div>`}
  const tip=last?`<p class="cue">Grey numbers are last time. Beat them by 1 rep or a little weight.</p>`:`<p class="cue">Bodyweight exercise? Leave kg empty.</p>`;
  box.innerHTML=rows+tip;return box;
}
$('day').addEventListener('click',e=>{
  const h=e.target.closest('[data-how]');if(h){openSheet(h.dataset.how);return}
  const l=e.target.closest('[data-logt]');if(l){const box=l.closest('.card').querySelector('.logger');box.hidden=!box.hidden;if(!box.hidden)box.querySelector('input').focus()}
});
$('day').addEventListener('change',e=>{
  const t=e.target;if(!t.dataset.k)return;const ds=todayStr(),k=t.dataset.k;
  const arr=S.get(wlKey(ds,k),[]);const i=+t.dataset.i;arr[i]=arr[i]||{};const v=parseFloat(t.value);arr[i][t.dataset.f]=isNaN(v)?null:v;
  S.set(wlKey(ds,k),arr);saveHist(k,ds,arr.filter(Boolean).map(s=>({kg:s.kg||0,reps:s.reps||0})),t.dataset.u);
  const s=arr[i];if(!t.dataset.u&&s&&s.kg&&s.reps&&s.reps>25&&s.kg<=15)toast(`${s.kg} kg × ${s.reps} reps? Check you didn't swap them: weight goes in the first box.`);
});

/* ---------- exercise sheet ---------- */
function openSheet(key){
  const e=EX[key];if(!e)return;
  $('sheet-title').textContent=e.n;$('sheet-m').textContent=e.m;$('sheet-eq').textContent='Equipment: '+e.eq;
  $('sheet-fig').innerHTML='';$('sheet-fig').appendChild(Fig.svg(e.fig,'#53C8FF',e.n));
  $('sheet-steps').innerHTML=e.steps.map(s=>`<li>${esc(s)}</li>`).join('');
  $('sheet-x').innerHTML=e.x.map(s=>`<li>${esc(s)}</li>`).join('');
  $('sheet-b').textContent=e.b;$('sheet-alt').textContent=e.alt||'';
  const h=hist(key).slice(-6).reverse();
  $('sheet-hist').innerHTML=h.length?`<table class="logt"><thead><tr><th>Date</th><th>Sets</th><th>Est. max</th></tr></thead><tbody>${h.map(x=>`<tr><td>${x.date.slice(5)}</td><td>${x.sets.map(s=>`${s.kg?s.kg+'×':''}${s.reps}`).join(', ')}</td><td>${x.e1?x.e1+' kg':'–'}</td></tr>`).join('')}</tbody></table>`:'Nothing logged yet.';
  const d=$('sheet');if(d.showModal)d.showModal();else d.setAttribute('open','');
}
$('sheet-close').onclick=()=>$('sheet').close();
$('sheet').addEventListener('click',e=>{if(e.target===$('sheet'))$('sheet').close()});

/* =================================================================
   STATUS
   ================================================================= */
function latestLog(){const l=S.get('log',[]).slice().sort((a,b)=>a.date<b.date?-1:1);return l}
function baseWaist(){const l=latestLog().filter(r=>r.waist);return l.length?l[0].waist:null}
function nextRank(){const r=earnedRank(),i=RANKS.indexOf(r);return i<5?RANKS[i+1]:null}
function evalTest(rank,res){
  const crit=Plan.criteria(rank,res.wt||prof.wt,prof.ht);
  return crit.map(c=>{let v=res[c.k];
    if(c.k==='waistDrop'){const b=baseWaist();v=(b!=null&&res.waist)?Math.round((b-res.waist)*10)/10:null}
    if(c.k==='whtr'){v=res.waist&&prof.ht?Math.round(res.waist/prof.ht*1000)/1000:null}
    const ok=v!=null&&!isNaN(v)&&(c.cmp==='>='?v>=c.t:v<=c.t);return {...c,v,ok}});
}
function renderStatus(){
  renderDash();
  renderAct();
  const r=earnedRank(),nr=nextRank(),tests=S.get('tests',[]);
  const lastT=tests.filter(t=>t.rank===nr).slice(-1)[0];
  const ev=nr?evalTest(nr,lastT?lastT.res:{}):[];
  const met=ev.filter(x=>x.ok).length;
  $('rankcard').innerHTML=`<div class="rc"><div class="rank xl"><span>${r}</span></div><div><div class="sys">[ System ] · Hunter rank</div><b class="big-t">${r}-Rank Hunter</b>
    <span class="cue">${nr?`Next: ${nr}-Rank · ${met} of ${ev.length} requirements met${lastT?` (test on ${lastT.date})`:''}`:'Top rank reached. Re-test every 3 months.'}</span></div></div>
    ${nr?`<ul class="reqs">${ev.map(c=>`<li class="${c.ok?'ok':''}"><span>${esc(c.l)}</span><b>${c.v!=null&&c.v!==undefined?c.v:'–'} <small>/ ${c.cmp==='<='?'≤':'≥'} ${c.t} ${c.u==='done'||c.u==='ratio'?'':c.u}</small></b></li>`).join('')}</ul>`:''}`;
  // stats
  const days=allDays(),workouts=days.filter(d=>getDay(d).workout).length;
  let sets=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'hist:'))sets+=JSON.parse(localStorage.getItem(k)).reduce((a,x)=>a+x.sets.length,0)}}catch(e){}
  const last7=[...Array(7)].map((_,i)=>getDay(ymd(addDays(new Date(),-i))).water);const avgW=last7.reduce((a,b)=>a+b,0)/7/1000;
  const l=latestLog(),w0=l.find(x=>x.wt),w1=[...l].reverse().find(x=>x.wt),wa1=[...l].reverse().find(x=>x.waist);
  const whtr=wa1&&prof.ht?(wa1.waist/prof.ht).toFixed(2):'–';
  const tiles=[['Streak',streak(),'days ≥ 80% quests'],['Workouts',workouts,'completed'],['Sets logged',sets,'all time'],['Water',avgW.toFixed(1)+' L','7-day average'],['Weight change',w0&&w1?((w1.wt-w0.wt>0?'+':'')+(w1.wt-w0.wt).toFixed(1)+' kg'):'–','since first entry'],['Waist ÷ height',whtr,'goal ≤ 0.45 for S-Rank']];
  $('statgrid').innerHTML=tiles.map(([k,v,s])=>`<div class="stat"><span class="k">${k}</span><div class="v">${v}</div><span class="cue">${s}</span></div>`).join('');
  // heatmap: 12 weeks ending this week
  const endMon=mondayOf(new Date());let hm='';
  for(let wk=11;wk>=0;wk--){hm+='<div class="hcol">';for(let d=0;d<7;d++){const dt=addDays(endMon,-wk*7+d),ds=ymd(dt);const fut=dt>new Date();const sc=fut||!hasData(ds)?-1:dayScore(ds);
    const lvl=sc<0?0:sc>=0.9?3:sc>=0.6?2:sc>0?1:0;hm+=`<i class="h${lvl}${fut?' fut':''}" title="${ds}${sc>=0?' · '+Math.round(sc*100)+'%':''}"></i>`}hm+='</div>'}
  $('heat').innerHTML=hm;
  renderTestForm();renderLog();renderLift();renderBadges();showPane(statPane);
  $('test-history').innerHTML=tests.length?`<table class="logt"><thead><tr><th>Date</th><th>For</th><th>Result</th></tr></thead><tbody>${tests.slice().reverse().map(t=>`<tr><td>${t.date}</td><td>${t.rank}-Rank</td><td>${t.passed?'<span class="pill ok">Passed</span>':`${t.met}/${t.total} met`}</td></tr>`).join('')}</tbody></table>`:'No tests yet. Your first test is week 12, Saturday.';
}
function renderTestForm(){
  const nr=nextRank();if(!nr){$('test-title').textContent='S-Rank reached';$('test-form').innerHTML='';$('test-hint').textContent='Keep training. Re-test every 3 months.';return}
  const crit=Plan.criteria(nr,prof.wt,prof.ht),st=Plan.STAGES.find(s=>s.to===nr);
  $('test-title').textContent=`${nr}-Rank test`;
  $('test-hint').textContent=`Scheduled for the last Saturday of week ${st?st.end:''}, but you can take it any time. Enter today's numbers. Run time in minutes (e.g. 17.5).`;
  const fields=[['wt','Body weight','kg'],['waist','Waist at navel','cm']];
  crit.forEach(c=>{if(c.k==='waistDrop'||c.k==='whtr')return;fields.push([c.k,c.l,c.u==='done'?'1 = yes':c.u])});
  $('test-form').innerHTML=fields.map(([k,l,u])=>`<label for="tf-${k}">${esc(l)} (${u})<input id="tf-${k}" data-tf="${k}" type="number" step="0.1" inputmode="decimal"></label>`).join('')+`<button type="submit" class="primary">Submit test</button>`;
}
$('test-form').addEventListener('submit',e=>{
  e.preventDefault();const nr=nextRank();if(!nr)return;const res={};
  document.querySelectorAll('[data-tf]').forEach(i=>{const v=parseFloat(i.value);if(!isNaN(v))res[i.dataset.tf]=v});
  if(!Object.keys(res).length){$('test-msg').textContent='Enter at least one result.';return}
  const ev=evalTest(nr,res),met=ev.filter(x=>x.ok).length,passed=met===ev.length;
  const tests=S.get('tests',[]);tests.push({date:todayStr(),rank:nr,res,met,total:ev.length,passed});S.set('tests',tests);
  if(res.wt||res.waist){const rows=S.get('log',[]).filter(r=>r.date!==todayStr());rows.push({date:todayStr(),wt:res.wt??null,waist:res.waist??null});S.set('log',rows)}
  if(passed){S.set('rank',nr);$('rankup-r').textContent=nr;$('rankup-t').textContent=`You are now a ${nr}-Rank Hunter. +500 XP`;$('rankup').hidden=false}
  else $('test-msg').textContent=`${met} of ${ev.length} requirements met. Keep training and test again in 2–4 weeks.`;
  renderStatus();header();
});
$('rankup-ok').onclick=()=>{$('rankup').hidden=true};

/* ---------- charts ---------- */
function lineChart(el,pts,unit,color,title,goodDown){
  if(pts.length<2){el.innerHTML=`<div class="chart-head"><span class="k">${title}</span></div><p class="cue empty">Add at least 2 entries to see the trend.</p>`;return}
  const Wd=600,Ht=260,pl=64,pr=16,pt=34,pb=40;
  const t0=parseYmd(pts[0].date).getTime(),t1=parseYmd(pts[pts.length-1].date).getTime();
  let lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));const pad=Math.max(1,(hi-lo)*0.15);lo=Math.floor(lo-pad);hi=Math.ceil(hi+pad);
  const X=t=>pl+(t1===t0?0.5:(t-t0)/(t1-t0))*(Wd-pl-pr),Y=v=>pt+(hi-v)/(hi-lo)*(Ht-pt-pb);
  const line=pts.map(p=>`${X(parseYmd(p.date).getTime()).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const first=pts[0],last=pts[pts.length-1],d=(last.v-first.v);const good=goodDown?d<=0:d>=0;
  el.innerHTML=`<div class="chart-head"><span class="k">${title}</span><span class="delta ${good?'good':'bad'}">${d>0?'+':''}${d.toFixed(1)} ${unit} since start</span></div>
  <svg viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="${title} trend">
   ${[lo,(lo+hi)/2,hi].map(v=>`<line x1="${pl}" x2="${Wd-pr}" y1="${Y(v)}" y2="${Y(v)}" class="grid-l"/><text x="${pl-10}" y="${Y(v)+7}" class="ax" text-anchor="end">${(+v).toFixed(v%1?1:0)}</text>`).join('')}
   <text x="${pl}" y="${Ht-10}" class="ax">${first.date.slice(5)}</text><text x="${Wd-pr}" y="${Ht-10}" class="ax" text-anchor="end">${last.date.slice(5)}</text>
   <polygon points="${X(t0)},${Ht-pb} ${line} ${X(t1)},${Ht-pb}" fill="${color}" fill-opacity=".12"/>
   <polyline points="${line}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
   ${pts.map(p=>`<circle cx="${X(parseYmd(p.date).getTime())}" cy="${Y(p.v)}" r="5" fill="${color}"/>`).join('')}
   <circle cx="${X(t1)}" cy="${Y(last.v)}" r="9" fill="var(--bg)" stroke="${color}" stroke-width="4"/>
   <text x="${Math.min(X(t1),Wd-pr-4)}" y="${Y(last.v)-18}" class="ax lastv" text-anchor="end">${last.v} ${unit}</text></svg>`;
}
function renderLog(){
  const rows=latestLog();
  lineChart($('chart-waist'),rows.filter(r=>r.waist!=null).map(r=>({date:r.date,v:r.waist})),'cm','var(--gold)','Waist at navel',true);
  lineChart($('chart-wt'),rows.filter(r=>r.wt!=null).map(r=>({date:r.date,v:r.wt})),'kg','var(--cyan)','Body weight',true);
  $('log-list').innerHTML=rows.length?rows.slice().reverse().map(r=>`<tr><td>${r.date}</td><td>${r.wt??'–'}</td><td>${r.waist??'–'}</td><td><button type="button" class="del" data-date="${r.date}" aria-label="Delete ${r.date}">✕</button></td></tr>`).join('')
    :'<tr><td colspan="4" class="cue">No entries yet. Weigh in once a week, same day, morning, before eating.</td></tr>';
}
const LIFTS=[['bbbench','Bench'],['squat','Squat'],['deadlift','Deadlift'],['ohp','Press'],['pulldown','Pulldown'],['legpress','Leg press']];
let liftSel=S.get('liftSel','legpress');
function renderLift(){
  $('lift-pick').innerHTML=LIFTS.map(([k,l])=>`<button type="button" data-lift="${k}" aria-pressed="${k===liftSel}">${l}</button>`).join('');
  const pts=hist(liftSel).filter(x=>x.e1>0).map(x=>({date:x.date,v:x.e1}));
  lineChart($('chart-lift'),pts,'kg','var(--strength)',EX[liftSel].n,false);
}
$('lift-pick').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;liftSel=b.dataset.lift;S.set('liftSel',liftSel);renderLift()});
$('log-date').value=todayStr();
$('log-form').addEventListener('submit',e=>{
  e.preventDefault();const date=$('log-date').value,wt=parseFloat($('log-wt').value),waist=parseFloat($('log-waist').value);
  if(!date||(isNaN(wt)&&isNaN(waist))){$('log-msg').textContent='Enter a date and at least one measurement.';return}
  const rows=S.get('log',[]).filter(r=>r.date!==date);rows.push({date,wt:isNaN(wt)?null:wt,waist:isNaN(waist)?null:waist});S.set('log',rows);
  if(!isNaN(wt)){prof.wt=wt;saveProf();fillSettings()}
  $('log-wt').value='';$('log-waist').value='';$('log-msg').textContent=`Saved ${date}.`;renderStatus();
});
$('log-list').addEventListener('click',e=>{const b=e.target.closest('.del');if(!b)return;
  if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Delete?';b.classList.add('arm');setTimeout(()=>{if(b.isConnected){b.dataset.confirm='';b.textContent='✕';b.classList.remove('arm')}},3000);return}
  S.set('log',S.get('log',[]).filter(r=>r.date!==b.dataset.date));renderStatus()});

/* =================================================================
   TIMER
   ================================================================= */
let tTotal=S.get('timer',90),tLeft=tTotal,tEnd=0,tRun=false,tInt=null,sets=0,actx=null,lock=null;
const part=2*Math.PI*88;$('t-ring').style.strokeDasharray=part;
const fmt=s=>{s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
function drawTimer(){$('t-time').textContent=fmt(tLeft);$('t-ring').style.strokeDashoffset=(1-(tTotal?tLeft/tTotal:0))*part;
  $('t-start').textContent=tRun?'Pause':(tLeft<tTotal&&tLeft>0?'Resume':'Start rest');$('t-sets').textContent=sets;
  document.querySelectorAll('#t-presets button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===tTotal))}
function audio(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}}
function beep(){try{audio();[0,.25,.5].forEach(o=>{const os=actx.createOscillator(),g=actx.createGain();os.frequency.value=880;os.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.25,actx.currentTime+o);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+o+.2);os.start(actx.currentTime+o);os.stop(actx.currentTime+o+.2)})}catch(e){}}
async function wake(on){try{if(on&&'wakeLock' in navigator)lock=await navigator.wakeLock.request('screen');else if(lock){lock.release();lock=null}}catch(e){}}
function tick(){tLeft=(tEnd-Date.now())/1000;if(tLeft<=0){tLeft=0;tRun=false;clearInterval(tInt);beep();navigator.vibrate&&navigator.vibrate([300,120,300,120,300]);$('t-done').hidden=false;wake(false)}drawTimer()}
function startRest(){if(tLeft<=0)tLeft=tTotal;tEnd=Date.now()+tLeft*1000;tRun=true;$('t-done').hidden=true;clearInterval(tInt);tInt=setInterval(tick,200);wake(true)}
$('t-start').onclick=()=>{audio();if(tRun){tRun=false;clearInterval(tInt);wake(false)}else startRest();drawTimer()};
$('t-reset').onclick=()=>{tRun=false;clearInterval(tInt);tLeft=tTotal;$('t-done').hidden=true;wake(false);drawTimer()};
$('t-presets').onclick=e=>{const b=e.target.closest('button');if(!b)return;tTotal=+b.dataset.s;S.set('timer',tTotal);tRun=false;clearInterval(tInt);tLeft=tTotal;$('t-done').hidden=true;drawTimer()};
$('t-plus').onclick=()=>{sets++;drawTimer()};$('t-minus').onclick=()=>{sets=Math.max(0,sets-1);drawTimer()};
$('t-setdone').onclick=()=>{audio();sets++;tLeft=tTotal;startRest();drawTimer()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(tRun)tick();refresh()}});

/* =================================================================
   SETTINGS
   ================================================================= */
function fillSettings(){$('s-name').value=prof.name||'';$('s-goal').value=prof.goal||'cut';$('s-asthma').checked=!!prof.asthma;$('s-hold').checked=!!prof.medHold;$('s-age').value=prof.age||'';$('s-wt').value=prof.wt;$('s-ht').value=prof.ht;$('s-start').value=prof.start;$('s-diet').value=prof.diet;$('s-gym').value=prof.gym;$('s-supp').checked=!!prof.supps;renderGcal()}
$('s-wt').onchange=()=>{const v=parseFloat($('s-wt').value);if(v>=35&&v<=200){prof.wt=v;saveProf();refresh()}};
$('s-age').onchange=()=>{const v=parseInt($('s-age').value);if(v>=15&&v<=90){prof.age=v;saveProf();refresh()}};
$('s-ht').onchange=()=>{const v=parseFloat($('s-ht').value);if(v>=120&&v<=220){prof.ht=v;saveProf();refresh()}};
$('s-start').onchange=()=>{if($('s-start').value){prof.start=ymd(mondayOf(parseYmd($('s-start').value)));$('s-start').value=prof.start;saveProf();const p=posOf(new Date());selW=p.w;selD=p.d;refresh()}};
$('s-diet').onchange=()=>{prof.diet=+$('s-diet').value;saveProf();refresh()};
$('s-gym').onchange=()=>{prof.gym=$('s-gym').value;saveProf();renderGcal();refresh()};
$('s-hold').onchange=()=>{prof.medHold=$('s-hold').checked;saveProf();toast(prof.medHold?'Doctor review mode on':'Doctor review mode off: full training unlocked');refresh()};
$('s-asthma').onchange=()=>{prof.asthma=$('s-asthma').checked;saveProf();refresh()};
$('s-supp').onchange=()=>{prof.supps=$('s-supp').checked;saveProf();renderGcal();refresh()};
$('s-name').onchange=()=>{prof.name=$('s-name').value.trim().slice(0,24);saveProf();refresh()};
$('s-goal').onchange=()=>{prof.goal=$('s-goal').value;saveProf();refresh()};
$('s-awaken').onclick=()=>{S.del('onboarded');showAwakening()};

/* ---------- reminders ---------- */
function reminderList(){
  const p=posOf(new Date());
  return Diet.timeline(prof.gym,0,prof.diet,false,waterL(),prof.supps).map(t=>({...t,
    title:t.type==='water'?`Water · ${t.ml} ml`:t.title,
    body:t.type==='meal'?'Check today\'s meal in ARETE':(t.detail||(t.ml?`Drink ${t.ml} ml`:''))}));
}
function gcalUrl(r){
  const d=new Date(),[h,m]=r.time.split(':').map(Number);d.setHours(h,m,0,0);const e=new Date(d.getTime()+(r.type==='gym'?75:10)*60000);
  const f=x=>`${x.getFullYear()}${String(x.getMonth()+1).padStart(2,'0')}${String(x.getDate()).padStart(2,'0')}T${String(x.getHours()).padStart(2,'0')}${String(x.getMinutes()).padStart(2,'0')}00`;
  const rr=r.type==='gym'||r.id==='pg'?'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA':'RRULE:FREQ=DAILY';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('⚔ '+r.title)}&details=${encodeURIComponent(r.body)}&dates=${f(d)}/${f(e)}&ctz=Asia%2FKolkata&recur=${encodeURIComponent(rr)}`;
}
function renderGcal(){$('gcal').innerHTML=reminderList().map(r=>`<li><time>${r.time}</time><span>${esc(r.title)}</span><a href="${gcalUrl(r)}" target="_blank" rel="noopener">Add</a></li>`).join('')}
$('ics').onclick=()=>{
  const start=new Date();const D=x=>`${x.getFullYear()}${String(x.getMonth()+1).padStart(2,'0')}${String(x.getDate()).padStart(2,'0')}`;
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ARETE//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:ARETE','BEGIN:VTIMEZONE','TZID:Asia/Kolkata','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0530','TZOFFSETTO:+0530','TZNAME:IST','END:STANDARD','END:VTIMEZONE'];
  reminderList().forEach((r,i)=>{const [h,m]=r.time.split(':');const dur=r.type==='gym'?'PT75M':'PT10M';
    L.push('BEGIN:VEVENT',`UID:hunter-${r.id}-${i}@hunter.app`,`DTSTAMP:${D(start)}T000000Z`,`DTSTART;TZID=Asia/Kolkata:${D(start)}T${h}${m}00`,`DURATION:${dur}`,
      r.type==='gym'||r.id==='pg'?'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA':'RRULE:FREQ=DAILY',`SUMMARY:${r.title.replace(/[,;]/g,' ')}`,`DESCRIPTION:${r.body.replace(/[,;]/g,' ')}`,
      'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${r.title.replace(/[,;]/g,' ')}`,'TRIGGER:PT0M','END:VALARM','END:VEVENT')});
  L.push('END:VCALENDAR');
  download(new Blob([L.join('\r\n')],{type:'text/calendar'}),'arete-reminders.ics');
  $('notif-msg').textContent='Calendar file saved. Open it with your calendar app to import all reminders.';
};
$('notif').onclick=async()=>{
  if(!('Notification' in window)){$('notif-msg').textContent='This browser does not support notifications. Use the calendar options below.';return}
  const p=await Notification.requestPermission();
  $('notif-msg').textContent=p==='granted'?'Notifications on. They fire while the app is open or recently used.':'Notifications are blocked. Allow them in Chrome → Site settings, or use the calendar options.';
  if(p==='granted')notify('ARETE','Reminders are on. Level up in real life.');
};
async function notify(title,body){
  try{const reg=await navigator.serviceWorker?.getRegistration();if(reg){reg.showNotification(title,{body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:title,vibrate:[200,100,200]});return}}catch(e){}
  try{new Notification(title,{body,icon:'icons/icon-192.png'})}catch(e){}
}
function checkReminders(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const now=new Date(),ds=ymd(now),p=posOf(now),sess=Plan.program(p.w,p.d),hm=now.getHours()*60+now.getMinutes();
  const sent=S.get('sent:'+ds,[]);const rec=getDay(ds);
  Diet.timeline(prof.gym,p.d,prof.diet,!!sess.rest,waterL(),prof.supps).forEach(t=>{
    const [h,m]=t.time.split(':').map(Number),tm=h*60+m;
    if(tm<=hm&&hm-tm<=15&&!sent.includes(t.id)&&!rec.tl[t.id]){sent.push(t.id);
      notify(t.type==='water'?`💧 Water · ${t.ml} ml`:t.title,t.type==='meal'?t.detail:(t.detail||`Drink ${t.ml} ml`))}
  });
  S.set('sent:'+ds,sent);
}

/* ---------- backup ---------- */
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function allData(){const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P))o[k]=localStorage.getItem(k)}}catch(e){}return o}
setTimeout(()=>{try{initExport();initSwapFix();initReset()}catch(e){console.error(e)}},0);
$('export').onclick=()=>{download(new Blob([JSON.stringify({app:'hunter',v:2,saved:new Date().toISOString(),data:allData()})],{type:'application/json'}),`arete-backup-${todayStr()}.json`);$('backup-msg').textContent='Backup saved to your Downloads.'};
$('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{const j=JSON.parse(await f.text());if(j.app!=='hunter'||!j.data)throw 0;Object.entries(j.data).forEach(([k,v])=>{if(k.startsWith(P))localStorage.setItem(k,v)});$('backup-msg').textContent='Backup restored. Reloading…';setTimeout(()=>location.reload(),700)}
  catch(err){$('backup-msg').textContent='That file is not an ARETE backup. Choose a file named arete-backup-….json (older hunter-backup-….json files work too).'}};
$('reset').onclick=()=>{const b=$('reset');if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Tap again to erase everything';setTimeout(()=>{b.dataset.confirm='';b.textContent='Erase all progress'},4000);return}
  Object.keys(allData()).forEach(k=>localStorage.removeItem(k));location.reload()};


/* =================================================================
   FOOD — log what you actually eat, compare with targets
   ================================================================= */
const MEALS=[['pg','Pre-gym'],['bf','Breakfast'],['ln','Lunch'],['sn','Snacks'],['dn','Dinner']];
const foodKey=ds=>'food:'+ds;
function customFoods(){return S.get('customFoods',{})}
function food(k){return FOODS[k]||customFoods()[k]}
function allFoods(){return [...Object.values(FOODS),...Object.values(customFoods())]}
function foodLog(ds){return S.get(foodKey(ds),[])}
function setFoodLog(ds,a){S.set(foodKey(ds),a)}
function totals(ds){const t={kcal:0,p:0,c:0,f:0,fi:0,n:0};foodLog(ds).forEach(e=>{const f=food(e.f);if(!f)return;t.n++;['kcal','p','c','f','fi'].forEach(m=>t[m]+=f[m]*e.q)});return t}
function stageAdj(){const w=posOf(new Date()).w;if(w<=26)return -500;const r=Plan.stageOf(w).rank;return {B:-250,A:-200,S:0}[r]||0}
function targets(){
  const age=prof.age||30,bmr=10*prof.wt+6.25*prof.ht-5*age+5,tdee=bmr*1.4;
  const kcal=Math.round((tdee+stageAdj())/50)*50,p=protein(),f=Math.round(kcal*0.25/9),c=Math.max(0,Math.round((kcal-p*4-f*9)/4));
  return {kcal,p,c,f,fi:30,tdee:Math.round(tdee)};
}
function mealNow(){const h=new Date().getHours();return prof.gym==='morning'?(h<7?'pg':h<11?'bf':h<16?'ln':h<19?'sn':'dn'):(h<11?'bf':h<16?'ln':h<18?'pg':h<19?'sn':'dn')}
let foodDate=todayStr(),foodMeal=mealNow();

/* ---------- plain-text parser ---------- */
const NUMW={half:0.5,quarter:0.25,one:1,a:1,an:1,single:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,ek:1,do:2,teen:3,char:4,paanch:5,couple:2};
function aliasIndex(){const out=[];allFoods().forEach(f=>(f.al||[f.n.toLowerCase()]).forEach(a=>out.push([a.toLowerCase(),f.k])));return out.sort((a,b)=>b[0].length-a[0].length)}
function parseMeal(text){
  const idx=aliasIndex(),found=[],missed=[];
  text.toLowerCase().replace(/[()]/g,' ').split(/,|;|\n|\+|\band\b|\bwith\b(?! sugar| ghee| milk)|&/).map(s=>s.trim()).filter(Boolean).forEach(seg=>{
    let q=null,m;
    if((m=/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/.exec(seg)))q=+m[1]/+m[2];
    else if((m=/(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|ml)\b/.exec(seg)))q={grams:+m[1]};
    else if((m=/(^|\s)(\d+(?:\.\d+)?)(?=\s|$|x|[a-z])/.exec(seg)))q=+m[2];
    else{for(const w of seg.split(/\s+/))if(NUMW[w]!=null){q=NUMW[w];break}}
    const rx=a=>new RegExp('(^|[^a-z])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)');
    let rest=seg,hits=[];
    for(let guard=0;guard<4;guard++){const h=idx.find(([a])=>rx(a).test(rest));if(!h)break;hits.push(h);rest=rest.replace(rx(h[0]),' | ')}
    if(!hits.length){if(seg.replace(/[^a-z]/g,'').length>1)missed.push(seg);return}
    hits.slice(1).forEach(h=>found.push({f:h[1],q:1,src:seg}));
    const hit=hits[0];
    const f=food(hit[1]);let qty=q==null?1:q;
    if(typeof qty==='object')qty=f.g?qty.grams/f.g:1;
    else{const pc=/^(\d+) pcs/.exec(f.u);if(pc&&q!=null&&!/\b(plate|pack|packet|serving)s?\b/.test(seg))qty=q/ +pc[1]}
    if(/\b(big|large|full)\b/.test(seg))qty*=1.5;else if(/\b(small|chhota|little)\b/.test(seg)&&!/small pack/.test(f.u))qty*=0.7;
    found.push({f:f.k,q:Math.round(qty*100)/100,src:seg});
  });
  return {found,missed};
}

/* ---------- insights ---------- */
function insights(ds){
  const t=totals(ds),T=targets(),log=foodLog(ds),out=[];
  if(!log.length)return ['Log everything you eat today, including every chai, the oil in sabzi, biscuits and snacks. The small things are usually the problem.'];
  const pct=x=>Math.round(x*100);
  if(t.kcal>T.kcal+150)out.push(['bad',`You are ${Math.round(t.kcal-T.kcal)} kcal over today's target. A daily surplus like this is exactly what grows the belly.`]);
  else if(t.kcal>=T.kcal*0.85)out.push(['ok',`Calories are on target (${Math.round(t.kcal)} of ${T.kcal}).`]);
  if(t.p<T.p*0.75){const sug=prof.diet===2?'150 g chicken (+45 g), 2 eggs (+13 g) or 1 scoop whey (+24 g)':prof.diet===1?'2 boiled eggs (+13 g), 100 g paneer (+18 g), 50 g soya chunks (+26 g) or 1 scoop whey (+24 g)':'100 g paneer (+18 g), 50 g soya chunks (+26 g), sprouts (+8 g) or 1 scoop whey (+24 g)';
    out.push(['bad',`Protein is only ${Math.round(t.p)} g of ${T.p} g (${pct(t.p/T.p)}%). Add ${sug}.`])}
  else if(t.p>=T.p*0.95)out.push(['ok',`Protein target hit: ${Math.round(t.p)} g.`]);
  if(t.kcal>300){const share=t.p*4/t.kcal;if(share<0.2)out.push(['bad',`Only ${pct(share)}% of your calories come from protein. Aim for 25–30%. Swap a roti or rice portion for a protein item.`])}
  const by=log.map(e=>({e,f:food(e.f)})).filter(x=>x.f);
  const sugar=by.filter(x=>x.f.tag==='sugar'||x.f.tag==='sweet'),fried=by.filter(x=>x.f.tag==='fried'),alc=by.filter(x=>x.f.tag==='alcohol');
  if(sugar.length)out.push(['bad',`Sugar today: ${sugar.map(x=>`${x.f.n} ×${x.e.q}`).join(', ')}, about ${Math.round(sugar.reduce((a,x)=>a+x.f.kcal*x.e.q,0))} kcal. Switch chai to no sugar first. That alone saves 60–80 kcal per cup.`]);
  if(fried.length)out.push(['bad',`Fried food: ${fried.map(x=>x.f.n).join(', ')} (${Math.round(fried.reduce((a,x)=>a+x.f.kcal*x.e.q,0))} kcal).`]);
  if(alc.length)out.push(['bad','Alcohol stops fat burning for hours and is stored around the belly first.']);
  if(t.fi<20&&t.kcal>800)out.push(['warn',`Fibre is low (${Math.round(t.fi)} g of 30 g). Add salad, a fruit, sprouts or dal.`]);
  const top=by.map(x=>({n:x.f.n,k:x.f.kcal*x.e.q})).sort((a,b)=>b.k-a.k).slice(0,3);
  if(t.kcal>0)out.push(['info',`Biggest calorie sources: ${top.map(x=>`${x.n} ${Math.round(x.k)} kcal (${pct(x.k/t.kcal)}%)`).join(' · ')}.`]);
  return out;
}

/* ---------- render ---------- */
function bar(label,v,t,unit,color,overBad){const pc=t?Math.min(100,v/t*100):0,over=overBad&&v>t*1.05;
  return `<div class="mbar"><div class="mtop"><span class="k">${label}</span><b class="${over?'over':''}">${Math.round(v)}<small> / ${t} ${unit}</small></b></div><div class="mtrack"><i style="width:${pc}%;background:${over?'var(--cardio)':color}"></i></div></div>`}
function renderFood(){
  const ds=foodDate,t=totals(ds),T=targets(),log=foodLog(ds),isToday=ds===todayStr();
  const d=parseYmd(ds);
  $('food-date').textContent=isToday?'Today':`${DFULL[(d.getDay()+6)%7]}, ${d.getDate()} ${d.toLocaleString('en-IN',{month:'short'})}`;
  $('food-next').disabled=isToday;
  $('food-sum').innerHTML=`<div class="kcal"><span class="k">Calories</span><b class="${t.kcal>T.kcal*1.05?'over':''}">${Math.round(t.kcal).toLocaleString('en-IN')}</b><small>/ ${T.kcal.toLocaleString('en-IN')} kcal target</small>
    <div class="mtrack lg"><i style="width:${Math.min(100,t.kcal/T.kcal*100)}%;background:${t.kcal>T.kcal*1.05?'var(--cardio)':'var(--cyan)'}"></i></div>
    <span class="cue">${t.kcal<=T.kcal?`${Math.round(T.kcal-t.kcal)} kcal left`:`${Math.round(t.kcal-T.kcal)} kcal over`} · maintenance about ${T.tdee.toLocaleString('en-IN')} kcal${prof.age?'':' · set your age in Settings for accuracy'}</span></div>
    <div class="macros">${bar('Protein',t.p,T.p,'g','var(--ok)')}${bar('Carbs',t.c,T.c,'g','var(--gold)',true)}${bar('Fat',t.f,T.f,'g','var(--stretch)',true)}${bar('Fibre',t.fi,T.fi,'g','var(--strength)')}</div>`;
  $('food-ins').innerHTML=insights(ds).map(x=>Array.isArray(x)?`<li class="${x[0]}">${esc(x[1])}</li>`:`<li class="info">${esc(x)}</li>`).join('');
  $('food-meal').innerHTML=MEALS.map(([k,l])=>`<button type="button" data-meal="${k}" aria-pressed="${k===foodMeal}">${l}</button>`).join('');
  // log grouped
  let h='';
  MEALS.forEach(([mk,ml])=>{const items=log.filter(e=>e.m===mk);if(!items.length)return;
    const mk_k=items.reduce((a,e)=>a+(food(e.f)?.kcal||0)*e.q,0),mk_p=items.reduce((a,e)=>a+(food(e.f)?.p||0)*e.q,0);
    h+=`<div class="mealgrp"><div class="mg-h"><b>${ml}</b><span>${Math.round(mk_k)} kcal · ${Math.round(mk_p)} g protein</span></div>`;
    items.forEach(e=>{const f=food(e.f);if(!f)return;
      h+=`<div class="fe${f.tag==='sugar'||f.tag==='fried'||f.tag==='sweet'||f.tag==='alcohol'?' flag':''}"><div class="fe-n"><b>${esc(f.n)}</b><span>${e.q} × ${esc(f.u)} · ${Math.round(f.kcal*e.q)} kcal · P ${Math.round(f.p*e.q)} · C ${Math.round(f.c*e.q)} · F ${Math.round(f.f*e.q)}</span></div>
        <div class="fe-q"><button type="button" data-fq="${e.id}" data-d="-0.5" aria-label="Less">−</button><button type="button" data-fq="${e.id}" data-d="0.5" aria-label="More">+</button><button type="button" class="x" data-fdel="${e.id}" aria-label="Remove ${esc(f.n)}">✕</button></div></div>`});
    h+='</div>'});
  $('food-log').innerHTML=h||'<p class="cue">Nothing logged for this day yet.</p>';
  renderFoodSearch();renderFoodWeek();
}
function addFood(k,q,m){const ds=foodDate,a=foodLog(ds);a.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),f:k,q:q||1,m:m||foodMeal});setFoodLog(ds,a)}
function renderFoodSearch(){
  const q=($('food-q').value||'').trim().toLowerCase();
  let list;
  if(!q){const rec=S.get('recentFoods',[]).map(food).filter(Boolean);list=rec.slice(0,8);$('food-res-h').textContent=list.length?'Recent':''}
  else{list=allFoods().map(f=>{const n=f.n.toLowerCase();const al=(f.al||[]);const score=n.startsWith(q)?3:al.some(a=>a.startsWith(q))?2:(n.includes(q)||al.some(a=>a.includes(q)))?1:0;return {f,score}}).filter(x=>x.score).sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.f);
    $('food-res-h').textContent=list.length?'Tap to add':'No match. Add it as a custom food below.'}
  $('food-res').innerHTML=list.map(f=>`<li><button type="button" data-fadd="${f.k}"><span><b>${esc(f.n)}</b><small>${esc(f.u)} · ${f.kcal} kcal · P ${f.p} · C ${f.c} · F ${f.f}</small></span><em>+</em></button></li>`).join('');
}
function pushRecent(k){const r=S.get('recentFoods',[]).filter(x=>x!==k);r.unshift(k);S.set('recentFoods',r.slice(0,12))}
function renderFoodWeek(){
  const T=targets(),days=[...Array(7)].map((_,i)=>ymd(addDays(parseYmd(todayStr()),i-6)));
  const rows=days.map(ds=>({ds,t:totals(ds)}));const logged=rows.filter(r=>r.t.n);
  const W=600,H=220,pl=74,pb=34,pt=16,bw=(W-pl-10)/7;const mx=Math.max(T.kcal*1.3,...rows.map(r=>r.t.kcal));const Y=v=>pt+(1-v/mx)*(H-pt-pb);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calories, last 7 days"><line x1="${pl}" x2="${W-10}" y1="${Y(T.kcal)}" y2="${Y(T.kcal)}" stroke="var(--gold)" stroke-dasharray="6 5" stroke-width="2"/><text x="${pl-6}" y="${Y(T.kcal)+5}" class="ax" text-anchor="end">${T.kcal}</text>`;
  rows.forEach((r,i)=>{const x=pl+i*bw+bw*0.2,w=bw*0.6;const d=parseYmd(r.ds);
    if(r.t.n)svg+=`<rect x="${x}" y="${Y(r.t.kcal)}" width="${w}" height="${H-pb-Y(r.t.kcal)}" rx="3" fill="${r.t.kcal>T.kcal*1.05?'var(--cardio)':'var(--cyan)'}" fill-opacity=".85"/>`;
    else svg+=`<rect x="${x}" y="${H-pb-3}" width="${w}" height="3" fill="var(--line)"/>`;
    svg+=`<text x="${x+w/2}" y="${H-10}" class="ax" text-anchor="middle">${DN[(d.getDay()+6)%7]}</text>`});
  svg+='</svg>';
  const avg=k=>logged.length?Math.round(logged.reduce((a,r)=>a+r.t[k],0)/logged.length):0;
  $('food-week').innerHTML=`<div class="chart-head"><span class="k">Calories, last 7 days</span><span class="cue">dashed line = target</span></div>${svg}
   <div class="statgrid three">${[['Avg calories',logged.length?avg('kcal').toLocaleString('en-IN'):'–',`target ${T.kcal}`],['Avg protein',logged.length?avg('p')+' g':'–',`target ${T.p} g`],['Days logged',logged.length+' / 7','log every day for a true picture']].map(([k,v,s])=>`<div class="stat"><span class="k">${k}</span><div class="v">${v}</div><span class="cue">${s}</span></div>`).join('')}</div>`;
}

/* ---------- events ---------- */
$('food-prev').onclick=()=>{foodDate=ymd(addDays(parseYmd(foodDate),-1));renderFood()};
$('food-next').onclick=()=>{if(foodDate<todayStr()){foodDate=ymd(addDays(parseYmd(foodDate),1));renderFood()}};
$('food-meal').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;foodMeal=b.dataset.meal;renderFood()});
$('food-parse').onclick=()=>{
  const txt=$('food-text').value.trim();if(!txt){$('food-parse-msg').textContent='Type what you ate first, for example: 3 roti, 1 bowl dal, bhindi, 2 chai with sugar.';return}
  const {found,missed}=parseMeal(txt);
  found.forEach(x=>{addFood(x.f,x.q,foodMeal);pushRecent(x.f)});
  $('food-parse-msg').innerHTML=(found.length?`Added ${found.map(x=>`<b>${esc(food(x.f).n)}</b> ×${x.q}`).join(', ')} to ${MEALS.find(m=>m[0]===foodMeal)[1]}.`:'')+(missed.length?` <span class="miss">Couldn't recognise: ${missed.map(esc).join(', ')}. Search for it below or add it as a custom food.</span>`:'');
  if(found.length)$('food-text').value='';renderFood();refreshQuests();
};
$('food-q').addEventListener('input',renderFoodSearch);$('food-q').addEventListener('focus',()=>loadINDB());
$('food-res').addEventListener('click',e=>{const b=e.target.closest('[data-fadd]');if(!b)return;addFood(b.dataset.fadd,1,foodMeal);pushRecent(b.dataset.fadd);toast(`Added ${food(b.dataset.fadd).n}`);renderFood();refreshQuests()});
$('food-log').addEventListener('click',e=>{
  const q=e.target.closest('[data-fq]'),x=e.target.closest('[data-fdel]');const a=foodLog(foodDate);
  if(q){const it=a.find(i=>i.id===q.dataset.fq);if(it){it.q=Math.max(0.5,Math.round((it.q+ +q.dataset.d)*100)/100);setFoodLog(foodDate,a);renderFood();refreshQuests()}}
  if(x){setFoodLog(foodDate,a.filter(i=>i.id!==x.dataset.fdel));renderFood();refreshQuests()}
});
$('food-copy').onclick=()=>{const y=foodLog(ymd(addDays(parseYmd(foodDate),-1)));if(!y.length){toast('Nothing logged the day before');return}
  const a=foodLog(foodDate);y.forEach(e=>a.push({...e,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6)}));setFoodLog(foodDate,a);toast(`Copied ${y.length} items`);renderFood();refreshQuests()};
$('cf-form').addEventListener('submit',e=>{e.preventDefault();
  const n=$('cf-n').value.trim(),u=$('cf-u').value.trim()||'1 serving',v=id=>parseFloat($(id).value)||0;
  if(!n||!v('cf-kcal')){$('cf-msg').textContent='Enter at least a name and calories.';return}
  const k='c_'+n.toLowerCase().replace(/[^a-z0-9]+/g,'_');const c=customFoods();
  c[k]={k,n,u,g:0,kcal:v('cf-kcal'),p:v('cf-p'),c:v('cf-c'),f:v('cf-f'),fi:v('cf-fi'),al:[n.toLowerCase()],tag:''};S.set('customFoods',c);
  addFood(k,1,foodMeal);pushRecent(k);$('cf-form').reset();$('cf-msg').textContent=`Saved "${n}" and added it to ${MEALS.find(m=>m[0]===foodMeal)[1]}. Type its name in future meals too.`;renderFood();refreshQuests()});
function refreshQuests(){if(foodDate===todayStr())header()}


/* =================================================================
   STATUS WINDOW — STR · AGI · VIT · PHY · FUEL · DIS from real logs
   ================================================================= */
const lin=(v,a,b)=>v==null||isNaN(v)?null:Math.max(0,Math.min(100,(v-a)/(b-a)*100));
const avgN=a=>{const v=a.filter(x=>x!=null);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};
const TESTKM={D:2,C:3,B:5,A:5,S:10};
function measures(asof){ // latest value of each self-test metric on or before asof
  const out={};const put=(k,v,d)=>{if(v==null||isNaN(v))return;if(!out[k]||out[k].d<=d)out[k]={v,d}};
  S.get('tests',[]).filter(t=>t.date<=asof).forEach(t=>{const r=t.res||{};put('push',r.push,t.date);put('pull',r.pull,t.date);put('plank',r.plank,t.date);
    if(r.run)put('pace',r.run/(TESTKM[t.rank]||2),t.date);if(r.bench5)put('bench',r.bench5*(1+5/30),t.date);if(r.squat5)put('squat',r.squat5*(1+5/30),t.date);if(r.dead5)put('dead',r.dead5*(1+5/30),t.date)});
  S.get('checks',[]).filter(c=>c.date<=asof).forEach(c=>{put('push',c.push,c.date);put('pull',c.pull,c.date);put('plank',c.plank,c.date);put('burpee',c.burpee,c.date);put('rhr',c.rhr,c.date);if(c.run2k)put('pace',c.run2k/2,c.date)});
  return out;
}
function bestE1(k,asof,days){const from=ymd(addDays(parseYmd(asof),-days));const h=hist(k).filter(x=>x.date<=asof&&x.date>from&&x.e1>0);return h.length?Math.max(...h.map(x=>x.e1)):null}
function liftProgress(asof){
  const gains=[];
  try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key.startsWith(P+'hist:'))continue;const k=key.slice((P+'hist:').length);
    const h=hist(k).filter(x=>x.date<=asof&&x.e1>0);if(h.length<2)continue;const first=h[0].e1,recent=bestE1(k,asof,21);if(first&&recent)gains.push(recent/first-1)}}catch(e){}
  return gains.length?{v:gains.reduce((a,b)=>a+b,0)/gains.length,n:gains.length}:null;
}
function plannedWorkouts(from,to){let n=0;for(let d=parseYmd(from);ymd(d)<=to;d=addDays(d,1)){const p=posOf(d);if(p.days>=0&&!Plan.program(p.w,p.d).rest)n++}return n}
function statsAt(asof){
  const m=measures(asof),bw=prof.wt,c={};
  const comp=(stat,label,score,shown)=>{if(score==null)return;(c[stat]=c[stat]||[]).push({label,score,shown})};
  // STR
  if(m.push)comp('STR','Push-ups',lin(m.push.v,0,60),`${m.push.v} reps`);
  if(m.pull)comp('STR','Pull-ups',lin(m.pull.v,0,15),`${m.pull.v} reps`);
  [['bbbench','bench','Bench',0.4,1.45],['squat','squat','Squat',0.5,1.75],['deadlift','dead','Deadlift',0.6,2.3]].forEach(([hk,mk,l,a,b])=>{
    const e=Math.max(bestE1(hk,asof,42)||0,m[mk]?m[mk].v:0);if(e)comp('STR',`${l} max ÷ body weight`,lin(e/bw,a,b),`${(e/bw).toFixed(2)}×`)});
  const lp=liftProgress(asof);if(lp)comp('STR','Lift progress since first log',lin(lp.v,0,1),`${lp.v>=0?'+':''}${Math.round(lp.v*100)}% (${lp.n} exercises)`);
  // AGI
  if(m.pace)comp('AGI','Run pace',lin(m.pace.v,9,4.5),`${m.pace.v.toFixed(1)} min/km`);
  if(m.burpee)comp('AGI','Burpees in 1 min',lin(m.burpee.v,5,30),`${m.burpee.v}`);
  // VIT
  if(m.plank)comp('VIT','Plank hold',lin(m.plank.v,0,180),`${m.plank.v} s`);
  if(m.rhr)comp('VIT','Resting heart rate',lin(m.rhr.v,90,55),`${m.rhr.v} bpm`);
  const from28=ymd(addDays(parseYmd(asof),-27)),plan=plannedWorkouts(from28,asof);
  if(plan>=3){let done=0;for(let d=parseYmd(from28);ymd(d)<=asof;d=addDays(d,1)){if(getDay(ymd(d)).workout)done++}comp('VIT','Workouts done, last 4 weeks',lin(done/plan,0,1),`${done} of ${plan}`)}
  // PHY
  const lw=latestLog().filter(r=>r.waist&&r.date<=asof).slice(-1)[0];
  if(lw&&prof.ht)comp('PHY','Waist ÷ height',lin(lw.waist/prof.ht,0.62,0.45),`${(lw.waist/prof.ht).toFixed(3)} (${lw.waist} cm)`);
  // FUEL
  const T=targets();let fd=0,pr=0,ad=0,cl=0;
  for(let i=0;i<7;i++){const ds=ymd(addDays(parseYmd(asof),-i)),t=totals(ds);if(!t.n)continue;fd++;pr+=Math.min(1,t.p/T.p);if(t.kcal<=T.kcal*1.05&&t.kcal>=T.kcal*0.7)ad++;
    if(!foodLog(ds).some(e=>{const f=food(e.f);return f&&['sugar','sweet','fried','alcohol'].includes(f.tag)}))cl++}
  if(fd){comp('FUEL','Protein vs target',pr/fd*100,`${Math.round(pr/fd*100)}% avg`);comp('FUEL','Days on calorie target',ad/fd*100,`${ad} of ${fd} logged days`);comp('FUEL','Days with no sugar or fried food',cl/fd*100,`${cl} of ${fd}`)}
  // DIS
  const st=parseYmd(prof.start);let qs=[],first=allDays()[0];
  for(let i=0;i<14;i++){const d=addDays(parseYmd(asof),-i),ds=ymd(d);if(d<st||!first||ds<first)continue;qs.push(hasData(ds)?dayScore(ds):0)}
  if(qs.length)comp('DIS','Daily quests completed, 14 days',avgN(qs)*100,`${Math.round(avgN(qs)*100)}%`);
  const out={};STATS.forEach(s=>{const cs=c[s.k]||[];out[s.k]={v:cs.length?Math.round(avgN(cs.map(x=>x.score))):null,cs}});return out;
}
const STATS=[{k:'STR',n:'Strength',hint:'Log sets in Plan and do a stat check.'},{k:'AGI',n:'Agility',hint:'Do a stat check: 2 km time and burpees.'},{k:'VIT',n:'Vitality',hint:'Plank, resting heart rate and finished workouts.'},
  {k:'PHY',n:'Physique',hint:'Log your waist in the body log.'},{k:'FUEL',n:'Fuel',hint:'Log what you eat in Food.'},{k:'DIS',n:'Discipline',hint:'Tick your daily quests.'}];
const statRank=v=>v==null?'–':v<15?'E':v<35?'D':v<55?'C':v<75?'B':v<90?'A':'S';
function statSeries(){ // weekly snapshots, oldest → newest (8 points, last = today)
  const today=todayStr(),pts=[];for(let i=7;i>=1;i--){const end=ymd(addDays(mondayOf(new Date()),-7*(i-1)-1));pts.push(end)}pts.push(today);
  return pts.map(d=>({d,s:statsAt(d)}));
}
function trendOf(series,k){const vals=series.map(x=>x.s[k].v);const now=vals[vals.length-1];if(now==null)return {now:null};
  const past=vals.slice(-5,-1).find(v=>v!=null);return {now,past:past??null,delta:past==null?null:now-past,vals}}
function radar(series){
  const now=series[series.length-1].s,ago=series[series.length-5]?.s;
  const W=320,H=300,cx=160,cy=150,R=110,n=STATS.length,ang=i=>-Math.PI/2+i*2*Math.PI/n;
  const pt=(i,v)=>[cx+Math.cos(ang(i))*R*v/100,cy+Math.sin(ang(i))*R*v/100];
  const poly=s=>STATS.map((st,i)=>pt(i,s[st.k].v??0).map(x=>x.toFixed(1)).join(',')).join(' ');
  let g='';[20,40,60,80,100].forEach(l=>{g+=`<polygon points="${STATS.map((_,i)=>pt(i,l).join(',')).join(' ')}" class="rg"/>`});
  STATS.forEach((_,i)=>{const [x,y]=pt(i,100);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="rg"/>`});
  const labels=STATS.map((st,i)=>{const [x,y]=pt(i,124);const v=now[st.k].v;return `<text x="${x}" y="${y+4}" text-anchor="${Math.abs(x-cx)<5?'middle':x>cx?'start':'end'}" class="rl">${st.k} <tspan class="rv">${v??'–'}</tspan></text>`}).join('');
  const dots=STATS.map((st,i)=>{const v=now[st.k].v;if(v==null)return '';const [x,y]=pt(i,v);return `<circle cx="${x}" cy="${y}" r="5" class="rd"><title>${st.n}: ${v}/100</title></circle>`}).join('');
  return `<svg viewBox="-30 0 380 ${H}" class="radar" role="img" aria-label="Stat radar: ${STATS.map(s=>`${s.n} ${now[s.k].v??'no data'}`).join(', ')}">${g}
    ${ago?`<polygon points="${poly(ago)}" class="ra"/>`:''}<polygon points="${poly(now)}" class="rn"/>${dots}${labels}</svg>`;
}
function spark(vals){
  const v=vals.map((x,i)=>[i,x]).filter(p=>p[1]!=null);if(v.length<2)return '<svg class="spark" viewBox="0 0 120 34"></svg>';
  const lo=Math.min(...v.map(p=>p[1]))-3,hi=Math.max(...v.map(p=>p[1]))+3,X=i=>4+i*(112/7),Y=x=>30-(x-lo)/(hi-lo||1)*26;
  const d=v.map(p=>`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' '),l=v[v.length-1];
  return `<svg class="spark" viewBox="0 0 120 34" aria-hidden="true"><polyline points="${d}" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(l[0])}" cy="${Y(l[1])}" r="3.5" fill="var(--cyan)"/></svg>`;
}
function renderDash(){
  const series=statSeries(),now=series[series.length-1].s;
  const tr=STATS.map(s=>({s,t:trendOf(series,s.k)}));
  const measured=tr.filter(x=>x.t.now!=null),up=measured.filter(x=>x.t.delta!=null&&x.t.delta>=3),down=measured.filter(x=>x.t.delta!=null&&x.t.delta<=-3);
  const power=measured.length?Math.round(avgN(measured.map(x=>x.t.now))):null;
  const verdict=!measured.length?'No data yet. Do your first stat check below.':!measured.some(x=>x.t.delta!=null)?`Baseline set for ${measured.length} stats. Trends appear after a few weeks of logging.`
    :`Improving in ${up.length} of ${measured.length} stats${down.length?` · slipping in ${down.map(x=>x.s.k).join(', ')}`:''}`;
  $('dash').innerHTML=`<div class="sys">[ System ] · Status window</div>
   <div class="dash-top"><div class="power"><span class="k">Power level</span><b>${power??'–'}</b><span class="cue">${esc(verdict)}</span></div>
   <div class="legend"><span style="--c:var(--cyan)">Now</span><span style="--c:var(--muted)" class="dashed">4 weeks ago</span></div></div>
   ${radar(series)}
   <div class="statcards">${tr.map(({s,t})=>{const cs=now[s.k].cs;const dl=t.delta;
     const cls=t.now==null?'none':dl==null?'flat':dl>=3?'up':dl<=-3?'down':'flat';
     const arrow=t.now==null?'No data':dl==null?'Baseline':dl>=3?`▲ +${dl}`:dl<=-3?`▼ ${dl}`:'→ Steady';
     return `<div class="sc ${cls}"><div class="sc-top"><b class="code">${s.k}</b><span class="sc-n">${s.n}</span><span class="sc-r">${statRank(t.now)}</span></div>
       <div class="sc-mid"><b class="sc-v">${t.now??'–'}</b><span class="sc-t">${arrow}</span>${spark(t.vals||[])}</div>
       <div class="sc-b">${cs.length?cs.map(x=>`${esc(x.label)}: ${esc(x.shown)}`).join(' · '):esc(s.hint)}</div></div>`}).join('')}</div>
   <p class="cue">Each stat is scored 0–100, where 100 means S-Rank level for that measure. Trends compare today with 4 weeks ago. ▲ means improving by 3 or more points.</p>`;
}
function renderMiniDash(){
  if(!$('mini-dash'))return;
  const series=statSeries(),tr=STATS.map(s=>({s,t:trendOf(series,s.k)})),meas=tr.filter(x=>x.t.now!=null),up=meas.filter(x=>x.t.delta>=3).length;
  $('mini-dash').innerHTML=`<div class="diethead"><h3 class="sub">Status window</h3><button type="button" class="link" id="open-stats">Open stats</button></div>
   <div class="minibars">${tr.map(({s,t})=>`<div class="mb"><span>${s.k}</span><div class="mtrack"><i style="width:${t.now??0}%;background:var(--cyan)"></i></div><b class="${t.delta>=3?'up':t.delta<=-3?'down':''}">${t.now??'–'}${t.delta>=3?' ▲':t.delta<=-3?' ▼':''}</b></div>`).join('')}</div>
   <p class="cue">${meas.length?`Improving in ${up} of ${meas.length} measured stats.`:'Do a stat check in Status to unlock your stats.'}</p>`;
  $('open-stats').onclick=()=>showView('status');
}
$('check-date').value=todayStr();
$('check-form').addEventListener('submit',e=>{e.preventDefault();
  const v=id=>{const x=parseFloat($(id).value);return isNaN(x)?null:x};
  const c={date:$('check-date').value||todayStr(),push:v('ck-push'),pull:v('ck-pull'),plank:v('ck-plank'),burpee:v('ck-burpee'),run2k:v('ck-run'),rhr:v('ck-rhr')};
  if(Object.entries(c).filter(([k,x])=>k!=='date'&&x!=null).length===0){$('check-msg').textContent='Enter at least one result.';return}
  const all=S.get('checks',[]).filter(x=>x.date!==c.date);all.push(c);all.sort((a,b)=>a.date<b.date?-1:1);S.set('checks',all);
  $('check-form').reset();$('check-date').value=todayStr();$('check-msg').textContent=`Stat check saved for ${c.date}. Repeat it every 2 weeks.`;renderStatus();
});


/* =================================================================
   MIND (INT) SYSTEM
   ================================================================= */
const inr=n=>{if(n==null||isNaN(n))return '–';const a=Math.abs(n),s=n<0?'−':'';if(a>=1e7)return `${s}₹${(a/1e7).toFixed(a>=1e9?0:2)} Cr`;if(a>=1e5)return `${s}₹${(a/1e5).toFixed(2)} L`;return `${s}₹${Math.round(a).toLocaleString('en-IN')}`};
const mon=d=>d.slice(0,7);
function focusLog(){return S.get('focus',[])}
function deepMin(ds){return focusLog().filter(f=>f.date===ds).reduce((a,f)=>a+f.min,0)}
function books(){return S.get('books',[])}
function pagesOn(ds){return S.get('read:'+ds,0)}
function notes(){return S.get('notes',[])}
function lessonsDone(){return S.get('lessonsDone',{})}
function mindTotals(){
  return {books:books().filter(b=>b.done).length,deep:Math.floor(focusLog().reduce((a,f)=>a+f.min,0)/60),lessons:Object.keys(lessonsDone()).length,notes:notes().length,courses:S.get('courses',[]).length,teach:S.get('teach',0)};
}
function mindRankIdx(){const t=mindTotals();let i=0;while(i<Mind.RANKS.length&&Object.entries(Mind.RANKS[i].req).every(([k,v])=>t[k]>=v))i++;return i}
function lessonWeek(){return Math.max(0,Math.min(51,Math.floor(Math.max(0,posOf(new Date()).days)/7)))}
function mindQuests(ds){
  const r=getDay(ds),mq=r.mq||{};
  const ld=Object.values(lessonsDone()).includes(ds);
  return [
    {id:'read',t:'Read 20 pages',s:`${pagesOn(ds)} pages today`,auto:true,done:pagesOn(ds)>=20},
    {id:'deep',t:'90 min deep work, phone away',s:`${deepMin(ds)} min logged in the focus timer`,auto:true,done:deepMin(ds)>=90},
    {id:'skill',t:'30 min on a skill track',s:'Leadership, AI, business or technical',done:!!mq.skill},
    {id:'money',t:'Money lesson (10 min)',s:ld?'Lesson completed today':'Read this week\'s lesson and do its action',done:ld||!!mq.money},
    {id:'note',t:'Write 1 insight',s:'What did you learn today?',auto:true,done:notes().some(n=>n.date===ds)},
    {id:'nophone',t:'No phone for the first hour after waking',s:'Tick it honestly',done:!!mq.nophone}
  ];
}
function questHTML(list,attr){return list.map(q=>`<label class="q${q.auto?' auto':''}"><input type="checkbox" ${attr}="${q.id}" ${q.done?'checked':''} ${q.auto?'disabled':''}><span>${esc(q.t)}<small>${esc(q.s)}${q.auto?' · ticks itself':''}</small></span></label>`).join('')}

let fTotal=S.get('focusLen',50)*60,fLeft=fTotal,fEnd=0,fRun=false,fInt=null,fStart=0;
function renderMind(){
  const t=mindTotals(),ri=mindRankIdx(),rk=Mind.RANKS[Math.min(ri,Mind.RANKS.length-1)],letter=ri>=Mind.RANKS.length?'S':Mind.RANKS[ri].r;
  const prev=S.get('mrank','E');if(RANKS.indexOf(letter)>RANKS.indexOf(prev)){S.set('mrank',letter);showRankUp(letter,'Mind')}
  const next=ri<Mind.RANKS.length?Mind.RANKS[ri]:null;
  $('mind-hero').innerHTML=`<div class="sys">[ System ] · INT window</div><div class="rc"><div class="rank xl"><span>${letter}</span></div><div><b class="big-t">${next?esc(next.name):'S-Rank · Sage of the System'}</b><span class="cue">${next?esc(next.goal):'Maximum INT. Keep teaching.'}</span></div></div>
   ${next?`<div class="reqbars">${Object.entries(next.req).filter(([,v])=>v>0).map(([k,v])=>bar(Mind.REQLABEL[k],Math.min(t[k],v),v,'','var(--stretch)')+`<span class="cue tot">${t[k]} total</span>`).join('')}</div><p class="cue">Reach every target to rank up to ${next.to}-Rank automatically.</p>`:''}`;
  $('mind-quests').innerHTML=questHTML(mindQuests(todayStr()),'data-mq');
  // focus
  drawFocus();
  const wk=[...Array(7)].map((_,i)=>deepMin(ymd(addDays(new Date(),-i)))).reduce((a,b)=>a+b,0);
  $('focus-stats').innerHTML=`<span><b>${deepMin(todayStr())}</b> min today</span><span><b>${(wk/60).toFixed(1)}</b> h this week</span><span><b>${t.deep}</b> h total</span>`;
  // books
  const bs=books();
  $('book-list').innerHTML=bs.filter(b=>!b.done).map(b=>`<div class="book"><div class="bk-t"><b>${esc(b.title)}</b><span>${esc(b.author||'')} · ${b.read} / ${b.pages} pages</span></div>
     <div class="mtrack"><i style="width:${Math.min(100,b.read/b.pages*100)}%;background:var(--stretch)"></i></div>
     <div class="t-actions left"><button type="button" class="ghost small" data-pg="${b.id}" data-n="10">+10 pages</button><button type="button" class="ghost small" data-pg="${b.id}" data-n="20">+20</button><button type="button" class="ghost small" data-pg="${b.id}" data-n="-10" aria-label="Remove 10 pages">−10</button><button type="button" class="primary small" data-bdone="${b.id}">Finished</button></div></div>`).join('')||'<p class="cue">No book in progress. Add one from the library below.</p>';
  const done=bs.filter(b=>b.done);
  $('book-done').innerHTML=done.length?`<p class="k">Finished · ${done.length}</p><ul class="plain">${done.slice().reverse().map(b=>`<li>${esc(b.title)} <span class="cue">· ${b.doneDate}</span></li>`).join('')}</ul>`:'';
  const have=new Set(bs.map(b=>b.title));
  const cats=[...new Set(Mind.LIBRARY.map(x=>x[0]))];
  $('library').innerHTML=cats.map(c=>`<p class="k" style="margin:12px 0 6px">${esc(c)}</p><ul class="foodres">${Mind.LIBRARY.filter(x=>x[0]===c).map(([,ti,au,pg])=>`<li><button type="button" data-lib="${esc(ti)}" ${have.has(ti)?'disabled':''}><span><b>${esc(ti)}</b><small>${esc(au)} · ~${pg} pages</small></span><em>${have.has(ti)?'✓':'+'}</em></button></li>`).join('')}</ul>`).join('');
  // lesson
  const lw=lessonWeek(),L=Mind.LESSONS[lw],ld=lessonsDone();
  $('lesson').innerHTML=`<div class="sys">Week ${lw+1} of 52 · Money lesson</div><h3 class="big-t">${esc(L[0])}</h3><p>${esc(L[1])}</p><p class="note">Action: ${esc(L[2])}</p>
   <button type="button" class="${ld[lw]?'ghost':'primary'}" data-lesson="${lw}">${ld[lw]?'Done ✓':'Mark lesson done'}</button>
   <details style="margin-top:12px"><summary><span class="k">All 52 lessons · ${Object.keys(ld).length} done</span></summary><ol class="lessons">${Mind.LESSONS.map((x,i)=>`<li class="${ld[i]?'ok':''}${i===lw?' cur':''}"><button type="button" class="link" data-lsn="${i}">${esc(x[0])}</button></li>`).join('')}</ol><div id="lesson-peek"></div></details>`;
  // skills
  const sk=S.get('skills',{});
  $('skills').innerHTML=Mind.SKILLS.map(s=>{const d=sk[s.k]||{},n=Object.values(d).filter(Boolean).length;
    return `<details class="skill"${n<s.steps.length&&n>0?' open':''}><summary><b>${esc(s.n)}</b><span class="cue">${n} / ${s.steps.length}</span><div class="mtrack"><i style="width:${n/s.steps.length*100}%;background:var(--stretch)"></i></div></summary>
     <div class="steps-ck">${s.steps.map((st,i)=>`<label class="q"><input type="checkbox" data-sk="${s.k}" data-i="${i}" ${d[i]?'checked':''}><span>${esc(st)}</span></label>`).join('')}</div></details>`}).join('');
  // notes
  const ns=notes();
  $('note-list').innerHTML=ns.slice(-8).reverse().map(n=>`<li><span class="cue">${n.date}</span> ${esc(n.text)}</li>`).join('')||'<li class="cue">No insights yet. One sentence a day adds up to 365 ideas a year.</li>';
  $('note-count').textContent=`${ns.length} insights written`;
  // courses & teaching
  const cs=S.get('courses',[]);
  $('course-list').innerHTML=cs.map(c=>`<li>${esc(c.name)} <span class="cue">· ${c.date}</span></li>`).join('')||'<li class="cue">None yet.</li>';
  $('teach-n').textContent=S.get('teach',0);
}
function drawFocus(){
  $('f-time').textContent=fmt(fLeft);$('f-ring').style.strokeDashoffset=(1-(fTotal?fLeft/fTotal:0))*part;
  $('f-start').textContent=fRun?'Pause':(fLeft<fTotal&&fLeft>0?'Resume':'Start focus');
  document.querySelectorAll('#f-presets button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.m*60===fTotal));
}
function logFocus(min){if(min<5)return;const a=focusLog();a.push({date:todayStr(),min:Math.round(min),label:($('f-label').value||'').trim()});S.set('focus',a);toast(`${Math.round(min)} min of deep work logged`)}
function fTick(){fLeft=(fEnd-Date.now())/1000;if(fLeft<=0){fLeft=0;fRun=false;clearInterval(fInt);beep();navigator.vibrate&&navigator.vibrate([400,150,400]);logFocus(fTotal/60);fLeft=fTotal;wake(false);renderMind();refreshAll()}drawFocus()}
$('f-ring').style.strokeDasharray=part;
$('f-start').onclick=()=>{audio();if(fRun){fRun=false;clearInterval(fInt);wake(false)}else{fEnd=Date.now()+fLeft*1000;fRun=true;clearInterval(fInt);fInt=setInterval(fTick,500);wake(true)}drawFocus()};
$('f-stop').onclick=()=>{if(fLeft<fTotal){const done=(fTotal-fLeft)/60;fRun=false;clearInterval(fInt);wake(false);logFocus(done);fLeft=fTotal;renderMind();refreshAll()}drawFocus()};
$('f-presets').onclick=e=>{const b=e.target.closest('button');if(!b||fRun)return;fTotal=+b.dataset.m*60;S.set('focusLen',+b.dataset.m);fLeft=fTotal;drawFocus()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&fRun)fTick()});
$('v-mind').addEventListener('click',e=>{
  const pg=e.target.closest('[data-pg]');if(pg){const a=books(),b=a.find(x=>x.id===pg.dataset.pg),n=+pg.dataset.n;if(b){const before=b.read;b.read=Math.max(0,Math.min(b.pages,b.read+n));S.set('books',a);S.set('read:'+todayStr(),Math.max(0,pagesOn(todayStr())+(b.read-before)));renderMind();refreshAll()}return}
  const bd=e.target.closest('[data-bdone]');if(bd){const a=books(),b=a.find(x=>x.id===bd.dataset.bdone);if(b){b.done=true;b.doneDate=todayStr();b.read=b.pages;S.set('books',a);toast(`Finished "${b.title}". +1 book`);renderMind()}return}
  const lib=e.target.closest('[data-lib]');if(lib){const L=Mind.LIBRARY.find(x=>x[1]===lib.dataset.lib);const a=books();a.push({id:Date.now().toString(36),title:L[1],author:L[2],pages:L[3],read:0,done:false});S.set('books',a);toast(`Added "${L[1]}"`);renderMind();return}
  const ls=e.target.closest('[data-lesson]');if(ls){const d=lessonsDone(),i=ls.dataset.lesson;if(d[i])delete d[i];else d[i]=todayStr();S.set('lessonsDone',d);renderMind();refreshAll();return}
  const pk=e.target.closest('[data-lsn]');if(pk){const i=+pk.dataset.lsn,L=Mind.LESSONS[i],d=lessonsDone();$('lesson-peek').innerHTML=`<div class="win" style="margin-top:8px"><b>${i+1}. ${esc(L[0])}</b><p>${esc(L[1])}</p><p class="note">Action: ${esc(L[2])}</p><button type="button" class="${d[i]?'ghost':'primary'} small" data-lesson="${i}">${d[i]?'Done ✓':'Mark done'}</button></div>`;return}
});
$('v-mind').addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.sk){const sk=S.get('skills',{});sk[t.dataset.sk]=sk[t.dataset.sk]||{};sk[t.dataset.sk][t.dataset.i]=t.checked;S.set('skills',sk);renderMind()}
});
$('book-form').addEventListener('submit',e=>{e.preventDefault();const ti=$('bk-title').value.trim(),pg=parseInt($('bk-pages').value)||250;if(!ti)return;const a=books();a.push({id:Date.now().toString(36),title:ti,author:'',pages:pg,read:0,done:false});S.set('books',a);$('book-form').reset();renderMind()});
$('note-form').addEventListener('submit',e=>{e.preventDefault();const tx=$('note-text').value.trim();if(!tx)return;const a=notes();a.push({date:todayStr(),text:tx});S.set('notes',a);$('note-text').value='';toast('Insight saved');renderMind();refreshAll()});
$('course-form').addEventListener('submit',e=>{e.preventDefault();const n=$('course-name').value.trim();if(!n)return;const a=S.get('courses',[]);a.push({date:todayStr(),name:n});S.set('courses',a);$('course-name').value='';renderMind()});
$('teach-plus').onclick=()=>{S.set('teach',S.get('teach',0)+1);renderMind()};
$('teach-minus').onclick=()=>{S.set('teach',Math.max(0,S.get('teach',0)-1));renderMind()};

/* =================================================================
   WEALTH SYSTEM
   ================================================================= */
function txs(){return S.get('tx',[])}
function bizRows(){return S.get('biz',[]).slice().sort((a,b)=>a.m<b.m?-1:1)}
function snaps(){return S.get('nw',[]).slice().sort((a,b)=>a.date<b.date?-1:1)}
function nwOf(s){if(!s)return null;const a=Object.values(s.a||{}).reduce((x,y)=>x+(+y||0),0),l=Object.values(s.l||{}).reduce((x,y)=>x+(+y||0),0);return a-l}
function monthStats(m){const r={inc:0,exp:0,inv:0,side:0};txs().filter(t=>mon(t.date)===m).forEach(t=>{if(t.type==='in'){r.inc+=t.amt;if(t.cat==='Freelance'||t.cat==='Futurnyx')r.side+=t.amt}else if(t.type==='out')r.exp+=t.amt;else r.inv+=t.amt});
  const b=bizRows().find(x=>x.m===m);r.bizRev=b?(+b.fx||0)+(+b.fl||0):0;r.bizCost=b?(+b.cost||0):0;r.sideAll=Math.max(r.side,r.bizRev);r.rate=r.inc>0?(r.inc-r.exp)/r.inc*100:null;return r}
function lastMonths(n,includeCurrent){const out=[];const d=new Date();d.setDate(1);if(!includeCurrent)d.setMonth(d.getMonth()-1);for(let i=0;i<n;i++){out.push(ymd(d).slice(0,7));d.setMonth(d.getMonth()-1)}return out}
function wealthMetrics(){
  const months=[...new Set(txs().filter(t=>t.type==='out').map(t=>mon(t.date)))];
  const l3=lastMonths(3,false),cur=mon(todayStr());
  const use3=l3.filter(m=>monthStats(m).inc>0).length?l3:[cur];
  const ms=use3.map(monthStats);
  const avg=f=>ms.length?ms.reduce((a,x)=>a+f(x),0)/ms.length:0;
  const rates=ms.map(x=>x.rate).filter(x=>x!=null);
  const s=snaps(),last=s[s.length-1];
  const avgExp=avg(x=>x.exp)||null;
  const liquid=last?(+last.a.bank||0)+(+last.a.fd||0):0;
  const b=bizRows();const lastB=b.slice(-3);const rev3=lastB.reduce((a,x)=>a+(+x.fx||0)+(+x.fl||0),0),cost3=lastB.reduce((a,x)=>a+(+x.cost||0),0);
  const b12=b.slice(-12);const prof12=b12.reduce((a,x)=>a+(+x.fx||0)+(+x.fl||0)-(+x.cost||0),0);
  const allSide=txs().filter(t=>t.type==='in'&&(t.cat==='Freelance'||t.cat==='Futurnyx')).reduce((a,t)=>a+t.amt,0);
  const bizTotal=b.reduce((a,x)=>a+(+x.fx||0)+(+x.fl||0),0);
  const mis=S.get('missions',{});
  return {tracked:months.length,efund:avgExp?Math.round(liquid/avgExp*10)/10:null,baddebt:last?(+last.l.personal||0)+(+last.l.card||0):null,
    srate:rates.length?Math.round(rates.reduce((a,b)=>a+b,0)/rates.length):null,sideTotal:Math.max(allSide,bizTotal),
    side3:Math.round(avg(x=>x.sideAll)),customers:b.reduce((a,x)=>a+(+x.cust||0),0),runrate:lastB.length?Math.round(rev3/lastB.length*12):0,
    team:b.length?(+b[b.length-1].team||0):0,margin:rev3>0?Math.round((rev3-cost3)/rev3*100):null,profit12:prof12,nw:nwOf(last),mis};
}
function critVal(k,M){if(k.startsWith('m_'))return M.mis[k]?1:0;return M[k]}
function critOk(c,M){const v=critVal(c[0],M);if(v==null)return false;return c[2]==='≥'?v>=c[3]:c[2]==='≤'?v<=c[3]:v>=1}
function wealthRankIdx(M){let i=0;while(i<Wealth.RANKS.length&&Wealth.RANKS[i].crit.every(c=>critOk(c,M)))i++;return i}
function wStart(){let w=S.get('wstart',null);if(!w){w=todayStr();S.set('wstart',w)}return w}
function monthsSince(ds){const a=parseYmd(ds),b=new Date();return (b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth()}
function wealthQuests(ds){const r=getDay(ds),wq=r.wq||{};const acts=S.get('acts:'+ds,{}),n=Object.values(acts).reduce((a,b)=>a+b,0);
  return [{id:'log',t:'Log today\'s money',s:'Every expense and income, even ₹10 chai',auto:true,done:txs().some(t=>t.date===ds)},
    {id:'acts',t:'3 revenue actions',s:`${n} done today (outreach, call, proposal, content, product)`,auto:true,done:n>=3},
    {id:'noimpulse',t:'No impulse buying',s:'Wait 48 hours before any non-essential purchase',done:!!wq.noimpulse}]}
let txType='out';
function renderWealth(){
  const M=wealthMetrics(),ri=wealthRankIdx(M),R=Wealth.RANKS,cur=ri>=R.length?{name:'S-Rank · Apex',goal:'₹100 Cr reached. Protect it and diversify.',month:60,crit:[]}:R[ri],letter=ri>=R.length?'S':R[ri].r;
  const prev=S.get('wrank','E');if(RANKS.indexOf(letter)>RANKS.indexOf(prev)){S.set('wrank',letter);showRankUp(letter,'Wealth')}
  const ms=monthsSince(wStart()),left=Math.max(1,60-ms);
  const nw=M.nw;
  $('wealth-hero').innerHTML=`<div class="sys">[ System ] · Wealth window · month ${ms+1} of 60</div>
   <div class="rc"><div class="rank xl gold"><span>${letter}</span></div><div><b class="big-t">${esc(cur.name)}</b><span class="cue">${esc(cur.goal)} Target: month ${cur.month}.</span></div></div>
   <div class="nwbig"><span class="k">Net worth</span><b>${nw==null?'–':inr(nw)}</b><span class="cue">${nw==null?'Add your first net worth snapshot below.':`${(nw/1e9*100).toFixed(2)}% of ₹100 Cr`}</span><div class="mtrack lg"><i style="width:${nw?Math.max(0.5,Math.min(100,nw/1e9*100)):0}%;background:var(--gold)"></i></div></div>
   ${ri<R.length?`<ul class="reqs">${cur.crit.map(c=>{const v=critVal(c[0],M),ok=critOk(c,M);const show=c[2]==='done'?(v?'Done':'Not yet'):v==null?'–':c[4]==='₹'?inr(v):`${v}${c[4]}`;const tgt=c[2]==='done'?'':` <small>/ ${c[2]} ${c[4]==='₹'?inr(c[3]):c[3]+c[4]}</small>`;return `<li class="${ok?'ok':''}"><span>${esc(c[1])}</span><b>${show}${tgt}</b></li>`}).join('')}</ul>`:''}`;
  // reality check
  const invMonthly=Math.max(0,(()=>{const l=lastMonths(3,false).map(monthStats).filter(x=>x.inc>0);return l.length?l.reduce((a,x)=>a+x.inc-x.exp,0)/l.length:0})());
  const last=snaps().slice(-1)[0],bizStake=last?(+last.a.business||0):0,fin=nw!=null?nw-bizStake:null;
  const r=0.12/12,n=left;const proj=fin!=null?fin*Math.pow(1+r,n)+invMonthly*((Math.pow(1+r,n)-1)/r):null;
  const need=nw&&nw>0?(Math.pow(1e9/nw,12/left)-1)*100:null;const gap=proj!=null?Math.max(0,1e9-proj):null;
  $('reality').innerHTML=`<h3 class="sub">Reality check</h3>${nw==null?'<p class="cue">Add a net worth snapshot and a few months of income and expenses to see your numbers.</p>':`
   <div class="statgrid three"><div class="stat"><span class="k">Growth needed</span><div class="v">${need==null?'–':need>999?'>999':Math.round(need)}%</div><span class="cue">per year for ${(left/12).toFixed(1)} years</span></div>
   <div class="stat"><span class="k">Investing alone</span><div class="v">${inr(proj)}</div><span class="cue">at 12% a year + ${inr(invMonthly)}/month saved</span></div>
   <div class="stat"><span class="k">Business must add</span><div class="v">${inr(gap)}</div><span class="cue">as your company stake</span></div></div>
   <p class="cue">${gap>0?`Investing and saving alone reach about ${inr(proj)} by month 60. The other ${inr(gap)} has to come from the value of your share in Futurnyx. Education and services companies are often valued at roughly 1–3× yearly revenue, and software at higher multiples, so that means building toward about ${inr(gap/3)}–${inr(gap)} of yearly revenue.`:'Your investments alone are on track for the goal.'} These are rough estimates, not financial advice.</p>`}`;
  $('wealth-quests').innerHTML=questHTML(wealthQuests(todayStr()),'data-wq');
  // actions
  const ta=S.get('acts:'+todayStr(),{});let wk=0;for(let i=0;i<7;i++){const a=S.get('acts:'+ymd(addDays(new Date(),-i)),{});wk+=Object.values(a).reduce((x,y)=>x+y,0)}
  $('acts').innerHTML=Wealth.ACTIONS.map(([k,l])=>`<button type="button" class="actbtn" data-act="${k}"><span>${l}</span><b>${ta[k]||0}</b></button>`).join('');
  $('acts-sum').innerHTML=`<b>${Object.values(ta).reduce((a,b)=>a+b,0)}</b> today · <b>${wk}</b> this week (target 15+)`;
  // tx form
  $('tx-type').innerHTML=[['out','Expense'],['in','Income'],['inv','Invest']].map(([k,l])=>`<button type="button" data-tt="${k}" aria-pressed="${k===txType}">${l}</button>`).join('');
  const cats=txType==='in'?Wealth.INCOME:txType==='out'?Wealth.EXPENSE:Wealth.INVEST;
  const sel=$('tx-cat').value;$('tx-cat').innerHTML=cats.map(c=>`<option${c===sel?' selected':''}>${esc(c)}</option>`).join('');
  if(!$('tx-date').value)$('tx-date').value=todayStr();
  // month summary
  const m=mon(todayStr()),st=monthStats(m);
  const byCat={};txs().filter(t=>t.type==='out'&&mon(t.date)===m).forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)+t.amt);
  const mx=Math.max(1,...Object.values(byCat));
  $('month-sum').innerHTML=`<div class="statgrid"><div class="stat"><span class="k">Income</span><div class="v">${inr(st.inc)}</div></div><div class="stat"><span class="k">Spent</span><div class="v">${inr(st.exp)}</div></div><div class="stat"><span class="k">Invested</span><div class="v">${inr(st.inv)}</div></div><div class="stat"><span class="k">Savings rate</span><div class="v">${st.rate==null?'–':Math.round(st.rate)+'%'}</div><span class="cue">target 30%+</span></div></div>
   ${Object.keys(byCat).length?`<div class="catbars">${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="cb"><span>${esc(c)}</span><div class="mtrack"><i style="width:${v/mx*100}%;background:var(--cardio)"></i></div><b>${inr(v)}</b></div>`).join('')}</div>`:''}`;
  $('tx-list').innerHTML=txs().slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,15).map(t=>`<div class="fe"><div class="fe-n"><b>${t.type==='in'?'+':t.type==='out'?'−':'→'} ${inr(t.amt)} · ${esc(t.cat)}</b><span>${t.date}${t.note?' · '+esc(t.note):''}</span></div><div class="fe-q"><button type="button" class="x" data-txdel="${t.id}" aria-label="Delete">✕</button></div></div>`).join('')||'<p class="cue">No entries yet.</p>';
  // business
  const b=bizRows();
  lineChart($('chart-run'),b.map(x=>({date:x.m+'-01',v:Math.round(((+x.fx||0)+(+x.fl||0))*12/1e5*10)/10})),'L/yr','var(--gold)','Business revenue run-rate (₹ lakh a year)',false);
  $('biz-list').innerHTML=b.length?`<table class="logt"><thead><tr><th>Month</th><th>Revenue</th><th>Profit</th><th>Cust.</th><th>Team</th></tr></thead><tbody>${b.slice().reverse().map(x=>{const rv=(+x.fx||0)+(+x.fl||0);return `<tr><td>${x.m}</td><td>${inr(rv)}</td><td>${inr(rv-(+x.cost||0))}</td><td>${x.cust||0}</td><td>${x.team||0}</td></tr>`}).join('')}</tbody></table>`:'';
  if(!$('biz-m').value)$('biz-m').value=mon(todayStr());
  // net worth
  const s=snaps(),ls=s[s.length-1];
  $('nw-fields').innerHTML=`<p class="k" style="grid-column:1/-1">Assets</p>${Wealth.ASSETS.map(([k,l])=>`<label for="nwa-${k}">${l}<input id="nwa-${k}" data-nwa="${k}" type="number" inputmode="numeric" min="0" step="1000" value="${ls&&ls.a[k]?ls.a[k]:''}"></label>`).join('')}
   <p class="k" style="grid-column:1/-1">Loans</p>${Wealth.LIABS.map(([k,l])=>`<label for="nwl-${k}">${l}<input id="nwl-${k}" data-nwl="${k}" type="number" inputmode="numeric" min="0" step="1000" value="${ls&&ls.l[k]?ls.l[k]:''}"></label>`).join('')}`;
  lineChart($('chart-nw'),s.map(x=>({date:x.date,v:Math.round(nwOf(x)/1e5*10)/10})),'L','var(--gold)','Net worth (₹ lakh)',false);
  // missions
  const mis=M.mis;
  $('missions').innerHTML=RANKS.map((rl,i)=>{const list=Wealth.MISSIONS[rl]||[];const d=list.filter(([k])=>mis[k]).length;
    return `<details class="skill"${i===ri?' open':''}><summary><b>${rl}-Rank missions</b><span class="cue">${d} / ${list.length}</span><div class="mtrack"><i style="width:${list.length?d/list.length*100:0}%;background:var(--gold)"></i></div></summary>
     <div class="steps-ck">${list.map(([k,t])=>`<label class="q"><input type="checkbox" data-mis="${k}" ${mis[k]?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></details>`}).join('');
}
$('v-wealth').addEventListener('click',e=>{
  const tt=e.target.closest('[data-tt]');if(tt){txType=tt.dataset.tt;$('tx-cat').value='';renderWealth();return}
  const a=e.target.closest('[data-act]');if(a){const ds=todayStr(),o=S.get('acts:'+ds,{});o[a.dataset.act]=(o[a.dataset.act]||0)+1;S.set('acts:'+ds,o);toast('+1 revenue action');renderWealth();refreshAll();return}
  const d=e.target.closest('[data-txdel]');if(d){if(d.dataset.confirm!=='1'){d.dataset.confirm='1';d.textContent='Delete?';d.classList.add('arm');return}S.set('tx',txs().filter(t=>t.id!==d.dataset.txdel));renderWealth();refreshAll()}
});
$('v-wealth').addEventListener('change',e=>{const t=e.target;if(t.dataset.mis){const m=S.get('missions',{});m[t.dataset.mis]=t.checked;S.set('missions',m);renderWealth()}});
$('tx-form').addEventListener('submit',e=>{e.preventDefault();const amt=parseFloat($('tx-amt').value);if(!(amt>0)){$('tx-msg').textContent='Enter an amount.';return}
  const a=txs();a.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),date:$('tx-date').value||todayStr(),type:txType,amt,cat:$('tx-cat').value,note:$('tx-note').value.trim()});S.set('tx',a);
  $('tx-amt').value='';$('tx-note').value='';$('tx-msg').textContent=`Saved ${inr(amt)} · ${$('tx-cat').value}`;renderWealth();refreshAll()});
$('biz-form').addEventListener('submit',e=>{e.preventDefault();const v=id=>parseFloat($(id).value)||0;const m=$('biz-m').value;if(!m)return;
  const rows=S.get('biz',[]).filter(x=>x.m!==m);rows.push({m,fx:v('biz-fx'),fl:v('biz-fl'),cost:v('biz-cost'),cust:v('biz-cust'),team:v('biz-team')});S.set('biz',rows);$('biz-form').reset();$('biz-m').value=mon(todayStr());$('biz-msg').textContent=`Saved ${m}.`;renderWealth()});
$('nw-form').addEventListener('submit',e=>{e.preventDefault();const a={},l={};document.querySelectorAll('[data-nwa]').forEach(i=>a[i.dataset.nwa]=parseFloat(i.value)||0);document.querySelectorAll('[data-nwl]').forEach(i=>l[i.dataset.nwl]=parseFloat(i.value)||0);
  const s=S.get('nw',[]).filter(x=>x.date!==todayStr());s.push({date:todayStr(),a,l});S.set('nw',s);const m=S.get('missions',{});m.m_networth=true;S.set('missions',m);$('nw-msg').textContent=`Snapshot saved: ${inr(nwOf({a,l}))}. Update it once a month.`;renderWealth()});

/* ---------- shared: rank-up overlay, Today summary ---------- */
function showRankUp(r,sys){$('rankup-r').textContent=r;$('rankup-t').textContent=`${sys} system: you are now ${r}-Rank.`;$('rankup').hidden=false}
function renderSystems(){
  const M=wealthMetrics();const mi=mindRankIdx(),wi=wealthRankIdx(M);
  const ml=mi>=Mind.RANKS.length?'S':Mind.RANKS[mi].r,wl=wi>=Wealth.RANKS.length?'S':Wealth.RANKS[wi].r;
  const mq=mindQuests(todayStr()),wq=wealthQuests(todayStr());
  $('systems').innerHTML=`<button type="button" class="sysbtn" data-go="plan"><span class="k">Body</span><b>${earnedRank()}</b><small>${questsFor(todayStr()).filter(q=>q.done).length}/${questsFor(todayStr()).length} quests</small></button>
   <button type="button" class="sysbtn mind" data-go="mind"><span class="k">Mind</span><b>${ml}</b><small>${mq.filter(q=>q.done).length}/${mq.length} quests</small></button>
   <button type="button" class="sysbtn gold" data-go="wealth"><span class="k">Wealth</span><b>${wl}</b><small>${wq.filter(q=>q.done).length}/${wq.length} quests</small></button>`;
  $('mind-quests-today').innerHTML=questHTML(mq,'data-mq');
  $('wealth-quests-today').innerHTML=questHTML(wq,'data-wq');
}
if($('systems'))$('systems').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)showView(b.dataset.go)});
document.addEventListener('change',e=>{const t=e.target,ds=todayStr();
  if(t.dataset.mq){const r=getDay(ds);r.mq=r.mq||{};r.mq[t.dataset.mq]=t.checked;setDay(ds,r);refreshAll()}
  if(t.dataset.wq){const r=getDay(ds);r.wq=r.wq||{};r.wq[t.dataset.wq]=t.checked;setDay(ds,r);refreshAll()}});
function refreshAll(){const v=S.get('view','today');if(v==='today')renderToday();if(v==='mind')renderMind();if(v==='wealth')renderWealth();header()}


/* =================================================================
   MISSION — one step at a time, 8 hours a week
   ================================================================= */
const STEPS=[];Mission.PHASES.forEach((ph,pi)=>ph.steps.forEach((st,si)=>STEPS.push({pi,si,ph,st})));
function mDone(){return S.get('mdone',{})}
function curStepIdx(){const d=mDone();const i=STEPS.findIndex((_,k)=>!d[k]);return i<0?STEPS.length:i}
function mLog(){return S.get('mtime',[])}
function mMin(ds){return mLog().filter(x=>x.date===ds).reduce((a,x)=>a+x.min,0)}
function weekMin(){const mon=mondayOf(new Date());let t=0;for(let i=0;i<7;i++)t+=mMin(ymd(addDays(mon,i)));return t}
function targetDate(){let t=S.get('target38',null);if(!t){const d=new Date();d.setFullYear(d.getFullYear()+3);t=ymd(d);S.set('target38',t)}return t}
function missionQuests(ds){
  const d=parseYmd(ds),wd=(d.getDay()+6)%7,r=getDay(ds),xq=r.xq||{},q=[];
  if(wd<5)q.push({id:'mhour',t:'Money hour: 60 min on the Mission',s:`${mMin(ds)} min logged · 8:45–9:45 pm`,auto:true,done:mMin(ds)>=45});
  if(wd===6)q.push({id:'mhour',t:'Sunday power block: 3 hours',s:`${mMin(ds)} min logged · 9:30–12:30`,auto:true,done:mMin(ds)>=150});
  if(wd<6)q.push({id:'commute',t:'Commute learning',s:'Audiobook or podcast instead of social media',done:!!xq.commute});
  q.push({id:'read10',t:'Read 10 pages before sleep',s:'Book, not phone',done:!!xq.read10});
  return q;
}
let mRun=false,mStart=0,mInt=null;
function renderMission(){
  const ci=curStepIdx(),cur=STEPS[ci],t38=targetDate(),days=Math.max(0,Math.round((parseYmd(t38)-parseYmd(todayStr()))/864e5));
  const phase=cur?cur.ph:Mission.PHASES[Mission.PHASES.length-1];
  const done=Object.keys(mDone()).length;
  const m=mon(todayStr()),rv=S.get('mrev',[]),thisM=rv.find(x=>x.m===m);
  $('mission-hero').innerHTML=`<div class="sys">[ System ] · Main quest</div><b class="big-t">Futurnyx → your own company</b>
   <div class="countdown"><div><b>${days.toLocaleString('en-IN')}</b><span class="k">days left</span></div><div><b>${done}/${STEPS.length}</b><span class="k">steps done</span></div><div><b>${(weekMin()/60).toFixed(1)}<small>/8 h</small></b><span class="k">this week</span></div></div>
   <div class="phases5">${Mission.PHASES.map((p,i)=>`<div class="ph ${cur&&i<cur.pi?'ok':cur&&i===cur.pi?'on':''}"><b>${i+1}</b><span>${esc(p.target)}</span></div>`).join('')}</div>
   <p class="cue">${esc(phase.n)} · ${esc(phase.months)} · goal: <b style="color:var(--ink)">${esc(phase.target)}</b>. This month: ${thisM?inr(thisM.rev):'₹0'} revenue.</p>`;
  $('mission-step').innerHTML=cur?`<div class="sys">Step ${ci+1} of ${STEPS.length} · ${esc(cur.ph.n)}</div><h2 class="vh" style="margin-bottom:6px">${esc(cur.st[0])}</h2>
    <p class="cue">${esc(cur.st[1])}</p><ol class="steps">${cur.st[2].map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    <p class="note">Time: ${esc(cur.st[3])}. Only this step matters right now.</p>
    <div class="t-actions left"><button type="button" class="primary" id="step-done">Step done → next</button></div>`
   :`<h2 class="vh">All steps done</h2><p>You built your company. Set the next 3-year plan.</p>`;
  const sd=$('step-done');if(sd)sd.onclick=()=>{const d=mDone();d[ci]=todayStr();S.set('mdone',d);toast('Step complete. +100 XP');renderMission();header()};
  // roadmap
  const d=mDone();
  $('mission-road').innerHTML=Mission.PHASES.map((p,pi)=>`<details class="skill"${cur&&pi===cur.pi?' open':''}><summary><b>${esc(p.n)}</b><span class="cue">${esc(p.months)}</span><div class="mtrack"><i style="width:${p.steps.filter((_,si)=>d[STEPS.findIndex(x=>x.pi===pi&&x.si===si)]).length/p.steps.length*100}%;background:var(--stretch)"></i></div></summary>
    <ol class="road">${p.steps.map((st,si)=>{const k=STEPS.findIndex(x=>x.pi===pi&&x.si===si);return `<li class="${d[k]?'ok':k===ci?'cur':''}"><b>${esc(st[0])}</b><span class="cue">${esc(st[3])}${d[k]?' · done '+d[k]:''}</span>${d[k]?`<button type="button" class="link" data-undo="${k}">Undo</button>`:''}</li>`}).join('')}</ol></details>`).join('');
  // timer
  drawMTimer();
  // revenue
  lineChart($('chart-mrev'),rv.slice().sort((a,b)=>a.m<b.m?-1:1).map(x=>({date:x.m+'-01',v:Math.round(x.rev/1000*10)/10})),'k','var(--stretch)','Futurnyx revenue (₹ thousand / month)',false);
  if(!$('mr-m').value)$('mr-m').value=m;
  $('week-plan').innerHTML=Mission.WEEK.map(([d,t,w])=>`<tr><td>${d}</td><td>${t}</td><td>${esc(w)}</td></tr>`).join('');
  $('parking').innerHTML=Mission.PARKING.map(x=>`<li>${esc(x)}</li>`).join('');
}
function drawMTimer(){const el=$('m-time');if(!el)return;const s=mRun?Math.floor((Date.now()-mStart)/1000):0;el.textContent=`${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  $('m-start').textContent=mRun?'Stop & log':'Start money hour';$('m-today').textContent=`${mMin(todayStr())} min today`}
$('m-start').onclick=()=>{
  if(!mRun){mRun=true;mStart=Date.now();S.set('mrun',mStart);mInt=setInterval(drawMTimer,1000);wake(true)}
  else{const min=Math.round((Date.now()-mStart)/60000);mRun=false;clearInterval(mInt);S.del('mrun');wake(false);
    if(min>=1){const a=mLog();a.push({date:todayStr(),min});S.set('mtime',a);toast(`${min} min logged on the Mission`)}renderMission();header()}
  drawMTimer();
};
$('m-add').onclick=()=>{const v=parseInt($('m-manual').value);if(v>0){const a=mLog();a.push({date:todayStr(),min:v});S.set('mtime',a);$('m-manual').value='';toast(`${v} min logged`);renderMission()}};
(function resumeTimer(){const st=S.get('mrun',null);if(st&&Date.now()-st<6*3600e3){mRun=true;mStart=st;mInt=setInterval(drawMTimer,1000)}})();
$('mr-form').addEventListener('submit',e=>{e.preventDefault();const m=$('mr-m').value,rev=parseFloat($('mr-rev').value)||0,stu=parseInt($('mr-stu').value)||0;if(!m)return;
  const a=S.get('mrev',[]).filter(x=>x.m!==m);a.push({m,rev,stu});S.set('mrev',a);$('mr-rev').value='';$('mr-stu').value='';toast(`Saved ${m}`);renderMission()});
$('mission-road').addEventListener('click',e=>{const u=e.target.closest('[data-undo]');if(!u)return;const d=mDone();delete d[u.dataset.undo];S.set('mdone',d);renderMission()});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.xq){const ds=todayStr(),r=getDay(ds);r.xq=r.xq||{};r.xq[t.dataset.xq]=t.checked;setDay(ds,r);renderToday()}});

/* ---------- Today: mission card ---------- */
function renderMissionToday(){
  const ci=curStepIdx(),cur=STEPS[ci];
  $('mission-today').innerHTML=`<div class="diethead"><h3 class="sub mindc">Main quest</h3><button type="button" class="link" id="go-mission">Open Mission</button></div>
   ${cur?`<b class="big-t">${esc(cur.st[0])}</b><span class="cue">Step ${ci+1} of ${STEPS.length} · ${esc(cur.ph.target)}</span>`:'<b class="big-t">All steps done</b>'}
   <div class="quests" style="margin-top:10px">${questHTML(missionQuests(todayStr()),'data-xq')}</div>`;
  $('go-mission').onclick=()=>showView('mission');
}

/* ---------- Body: vitality + belly protocol ---------- */
function vitalityLevel(){const w=posOf(new Date()).w;return w<=2?0:w<=6?1:2}
const VLEVELS=[
 {h:'Weeks 1–2 · Find the muscle',sets:'3 sets × 10 slow squeezes, hold 3 s, relax 3 s'},
 {h:'Weeks 3–6 · Build control',sets:'3 sets × 10 squeezes, hold 5 s, relax 5 s · then 10 quick flicks'},
 {h:'Week 7+ · Endurance',sets:'3 sets × 10 squeezes, hold 10 s, relax 10 s · then 20 quick flicks'}];
function renderBodyCards(){
  renderCareCards();
  renderHealth();
  const lv=VLEVELS[vitalityLevel()];
  $('vitality').innerHTML=`<details${S.get('vitOpen',true)?' open':''} id="vit-d"><summary><h3 class="sub" style="display:inline">Vitality routine · 5 min daily</h3></summary>
   <p class="cue">Pelvic floor training improves control and stamina. Nobody can tell you're doing it, so do it seated on your commute.</p>
   <p class="note"><b>${esc(lv.h)}</b><br>${esc(lv.sets)}</p>
   <ol class="steps"><li><b>Find the muscle:</b> it's the one you'd use to stop urinating midstream. Only use that test once to identify it, not as an exercise.</li>
   <li><b>Squeeze and lift</b> that muscle without tightening your stomach, thighs or buttocks. Keep breathing normally.</li>
   <li><b>Relax fully</b> between squeezes for the same time you held. Learning to relax it matters as much as squeezing.</li>
   <li><b>Finish with 5 slow belly breaths</b>, letting the pelvic floor drop and soften on each breath in.</li></ol>
   <p class="cue">Also helps: glute bridges, squats and the cardio in your plan improve blood flow. Results usually show in 6–12 weeks.</p>
   <h3 class="sub" style="margin-top:10px">Food for vitality</h3><ul class="plain">${Diet.VITALITY.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`;
  $('vit-d').addEventListener('toggle',e=>S.set('vitOpen',e.target.open));
  $('belly').innerHTML=`<details${S.get('bellyOpen',false)?' open':''} id="belly-d"><summary><h3 class="sub" style="display:inline">Belly-fat protocol</h3></summary>
   <ol class="steps"><li><b>Deficit first.</b> Stay under the calorie target in Food 6 days out of 7. Training can't out-run a surplus.</li>
   <li><b>No liquid sugar.</b> Chai without sugar, no juice, no cold drinks, no alcohol.</li>
   <li><b>Protein every meal</b> (${protein()} g a day) so you lose fat, not muscle.</li>
   <li><b>8,000–10,000 steps.</b> The 10–15 min walk after lunch adds about 1,500.</li>
   <li><b>Sleep 7 hours.</b> Short sleep raises hunger and belly-fat storage.</li>
   <li><b>Measure the waist every Sunday</b> in Stats. Expect about −1 cm every 2 weeks. The mirror lags behind the tape.</li></ol></details>`;
  $('belly-d').addEventListener('toggle',e=>S.set('bellyOpen',e.target.open));
}


/* =================================================================
   ASTHMA MODE · breathing check, care card, look-best card
   ================================================================= */
const BZ={g:['Green','Breathing normal, no cough or tightness','Train as planned. Warm up for 12–15 minutes and keep your reliever inhaler in your bag.'],
 y:['Yellow','Some cough, wheeze or chest tightness, or a cold','Light day only: 30-minute easy walk and mobility. No intervals, sprints or heavy sets. Follow your asthma action plan.'],
 r:['Red','Breathless at rest, or needing the reliever again and again','No exercise today. Use your reliever as prescribed and contact your doctor. If it doesn\'t help, you can\'t speak full sentences, or your lips turn blue, go to emergency care immediately.']};
function renderBreath(){
  const el=$('breath');if(!el)return;if(!prof.asthma){el.hidden=true;return}el.hidden=false;
  const ds=todayStr(),r=getDay(ds),b=r.breath;
  el.innerHTML=`${prof.medHold?'<p class="note hold" style="margin:0 0 10px">Doctor review pending: hard cardio is swapped for steady work.</p>':''}<div class="diethead"><h3 class="sub">Breathing check</h3><span class="cue">Asthma mode</span></div>
   <div class="bz">${Object.entries(BZ).map(([k,v])=>`<button type="button" class="bzb bz-${k}" data-bz="${k}" aria-pressed="${b===k}"><b>${v[0]}</b><small>${esc(v[1])}</small></button>`).join('')}</div>
   ${b?`<p class="note bzn-${b}">${esc(BZ[b][2])}</p>`:'<p class="cue">Tap how your breathing feels this morning before the gym.</p>'}`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-bz]');if(!b)return;const ds=todayStr(),r=getDay(ds);r.breath=r.breath===b.dataset.bz?null:b.dataset.bz;setDay(ds,r);renderToday()});
function renderCareCards(){
  const a=$('asthma');if(a){a.hidden=!prof.asthma;if(prof.asthma)a.innerHTML=`<details${S.get('asOpen',false)?' open':''} id="as-d"><summary><h3 class="sub" style="display:inline">Asthma-safe training</h3></summary>
   <ol class="steps">
    <li><b>Controller first.</b> If your doctor prescribed a daily (preventer) inhaler, take it every day, even when you feel fine. Well-controlled asthma lets you train hard.</li>
    <li><b>Get an asthma action plan</b> from your doctor: what to do in green, yellow and red zones. The breathing check on Today follows the same idea.</li>
    <li><b>Long, gradual warm-up:</b> 12–15 minutes, slowly building pace. This reduces exercise-induced tightening of the airways.</li>
    <li><b>Reliever with you, always.</b> Ask your doctor whether to use it 15 minutes before exercise.</li>
    <li><b>Prefer intervals over long hard efforts.</b> Short work bursts with easy recovery are usually better tolerated than continuous hard running.</li>
    <li><b>Avoid triggers:</b> cold or very dry air, dust, smoke and traffic fumes. Cover nose and mouth on cold or dusty mornings and on the commute.</li>
    <li><b>Breathing practice, 5 min daily:</b> slow belly breathing, in through the nose for 4, out through pursed lips for 6. It helps you stay calm when breathing feels tight.</li>
    <li><b>Stop immediately</b> if you wheeze, feel chest tightness or can't talk in sentences. Use your reliever and rest. Don't push through.</li>
    <li><b>Last week's chest cough</b> may have been an asthma flare. Mention it at your check-up and ask about a lung function (spirometry) test and a yearly flu shot.</li></ol>
   <p class="cue">The program already avoids long hard runs early on. From D-Rank, swap running for cycling intervals on any yellow day.</p></details>`;
   const d=$('as-d');if(d)d.addEventListener('toggle',e=>S.set('asOpen',e.target.open))}
  const l=$('lookbest');if(l)l.innerHTML=`<details${S.get('lbOpen',false)?' open':''} id="lb-d"><summary><h3 class="sub" style="display:inline">Look your best</h3></summary>
   <p class="cue">Attraction isn't only muscle. These make the biggest visible difference, roughly in order.</p>
   <ol class="steps"><li><b>Small waist, wide shoulders.</b> Losing the belly does more for your look than any exercise. Then lateral raises, pull-ups and rows build the V-taper.</li>
   <li><b>Posture.</b> Face pulls, rows and planks pull your shoulders back. Stand tall, chin level.</li>
   <li><b>Grooming.</b> A fresh haircut every 4 weeks, a sharp beard line or clean shave, trimmed nails.</li>
   <li><b>Skin.</b> Face wash, moisturiser and sunscreen every morning. Water and sleep show on your face.</li>
   <li><b>Clothes that fit.</b> As you lose fat, buy 2–3 well-fitted shirts and jeans in your new size. Fit beats brand.</li>
   <li><b>Teeth and smell.</b> Brush twice, floss, a dentist clean once a year, and a light fragrance.</li>
   <li><b>Energy and confidence.</b> Sleep, steady progress and keeping your word to yourself build real confidence. People notice that most.</li></ol></details>`;
  const lb=$('lb-d');if(lb)lb.addEventListener('toggle',e=>S.set('lbOpen',e.target.open));
}


/* =================================================================
   DOCTOR-REVIEW MODE + HEALTH TO-DO
   ================================================================= */
const HARD={sprints:['cycle','steady, talk pace'],intervals:['treadmill','brisk incline walk, talk pace'],jogint:['treadmill','brisk incline walk, talk pace'],run:['walk','brisk walk, same time'],
 burpee:['cycle','5 min steady'],climber:['cycle','3 min steady'],jumprope:['cycle','steady, talk pace'],boxjump:['stepup','3 × 10 each leg, controlled'],kbswing:['bridge','3 × 15']};
function adaptItems(items){const out=[];items.forEach(([k,d])=>{const h=HARD[k];if(!h){out.push([k,d]);return}
  const mins=(/(\d+)\s*min/.exec(d)||[])[1];const nd=h[1].includes('×')?h[1]:(mins?`${mins} min · ${h[1]}`:h[1]);
  if(out.length&&out[out.length-1][0]===h[0])return;out.push([h[0],nd])});return out}
const HEALTH=[['pulmo','See a pulmonologist (chest specialist) with your spirometry report'],['spiro','Repeat spirometry with correct age and a full 6-second blow'],['plan','Get a written asthma action plan and ask about a daily preventer inhaler'],
 ['blood','Blood tests: HbA1c, lipid profile, liver function (LFT), thyroid (TSH), vitamin D, B12'],['bp','Blood pressure check'],['testo','Ask about a morning testosterone test (for energy and stamina)'],['uro','Urologist / andrologist visit for early finishing'],['flu','Yearly flu vaccine (asthma)']];
function renderHealth(){const el=$('health');if(!el)return;const h=S.get('health',{});const n=HEALTH.filter(([k])=>h[k]).length;
  el.innerHTML=`<details${S.get('hOpen',true)?' open':''} id="h-d"><summary><h3 class="sub" style="display:inline">Health to-do · ${n}/${HEALTH.length}</h3></summary>
   <p class="cue">These protect the whole plan. Tick each when done.</p><div class="steps-ck">${HEALTH.map(([k,t])=>`<label class="q"><input type="checkbox" data-hl="${k}" ${h[k]?'checked':''}><span>${esc(t)}${h[k]?`<small>done ${h[k]}</small>`:''}</span></label>`).join('')}</div>
   ${prof.medHold?`<p class="note hold">Doctor review mode is on. After the pulmonologist clears you for hard cardio, turn it off in Settings.</p>`:''}</details>`;
  $('h-d').addEventListener('toggle',e=>S.set('hOpen',e.target.open));
}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.hl){const h=S.get('health',{});if(t.checked)h[t.dataset.hl]=todayStr();else delete h[t.dataset.hl];S.set('health',h);renderHealth();if(t.dataset.hl==='pulmo'&&t.checked&&prof.medHold)toast('Cleared by your doctor? Turn off doctor review mode in Settings')}});


/* =================================================================
   6-MONTH CUT CHECK (week 26): waist target on a straight line
   ================================================================= */
function cutCheck(){
  const log=latestLog().filter(r=>r.waist);const tgt=Math.round(0.45*prof.ht),sharp=Math.round(0.43*prof.ht);
  const w=posOf(new Date()).w,left=Math.max(0,26-w+1);
  if(!log.length)return {tgt,sharp,w,left,none:true};
  const start=log[0].waist,cur=log[log.length-1].waist;
  const exp=Math.round((start-(start-tgt)*Math.min(1,(w-1)/26))*10)/10;
  return {tgt,sharp,w,left,start,cur,exp,diff:Math.round((cur-exp)*10)/10};
}
function renderWaterNudge(){
  const el=$('waternudge');if(!el)return;const h=new Date().getHours(),w=getDay(todayStr()).water||0;
  const need=h>=16&&w<2000?2000:h>=12&&w<1000?1000:h>=20&&w<3000?3000:0;
  if(!need){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<p class="note hold" style="margin:0"><b>Water check:</b> ${(w/1000).toFixed(1)} L so far. You should be at ${need/1000} L by now. Low water causes constipation, gas and a swollen belly. Drink 2 glasses now.</p>`;
}
function renderCut(){
  const el=$('cutcheck');if(!el)return;const c=cutCheck();
  if(c.w>30){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<div class="diethead"><h3 class="sub">6-month cut check</h3><span class="cue">${c.left>0?`${c.left} weeks to week 26`:'Week 26 reached'}</span></div>
   ${c.none?`<p class="cue">Log your waist in Stats → Body log to start tracking. Target: <b style="color:var(--ink)">${c.tgt} cm</b> by week 26 (waist ÷ height 0.45, when abs usually show), then about ${Math.round(0.43*prof.ht)} cm for sharp cuts at about 8–10% body fat.</p>`:
   `<div class="cutrow"><div><span class="k">Start</span><b>${c.start}</b></div><div><span class="k">Now</span><b>${c.cur}</b></div><div><span class="k">Should be</span><b>${c.exp}</b></div><div><span class="k">Wk 26</span><b>${c.tgt}</b></div></div><p class="cue">Final sharp-cut target ≈ ${c.sharp} cm (about 8–10% body fat).</p>
    <div class="mtrack lg"><i style="width:${Math.max(2,Math.min(100,(c.start-c.cur)/(c.start-c.tgt)*100))}%;background:${c.diff<=0.5?'var(--ok)':'var(--cardio)'}"></i></div>
    <p class="note ${c.diff<=0.5?'':'hold'}">${c.diff<=0.5?`On track for sharp cuts by week 26. Keep the deficit 6 days a week.`:`${c.diff} cm behind schedule. Check the Food tab: most likely extra rice/roti, chai sugar or snacks. Add a 10-minute walk after dinner.`}</p>`}`;
}


/* =================================================================
   CARDIO · CORE · MOBILITY LOGGING
   ================================================================= */
const TIMED_CARDIO=['walk','cycle','treadmill','intervals','jogint','run','sprints','jumprope','rower','stairs','swim','elliptical'];
function logMode(kind,key,dose){
  if(kind==='strength')return 'sets';
  if(kind==='core'){if(!setsIn(dose))return '';return /\d\s*s\b/.test(dose)?'secs':'reps'}
  if(kind==='cardio'){if(TIMED_CARDIO.includes(key)||!setsIn(dose))return 'cardio';return 'reps'}
  return '';
}
const EFF=[['easy','Easy · can sing'],['mod','Moderate · can talk'],['hard','Hard · few words']];
const ACT_TYPES=[['walk','Brisk walk'],['cycle','Cycling'],['treadmill','Treadmill'],['jogint','Jog / walk'],['run','Run'],['swim','Swimming'],['sport','Sport (badminton, cricket…)'],['core','Core / abs'],['mob','Mobility / stretching / yoga']];
function actLog(){return S.get('actlog',[])}
function saveAct(entry){const l=actLog().filter(x=>x.id!==entry.id);if(entry.min>0||entry.km>0||entry.br||entry.eff||entry.hr>0)l.push(entry);l.sort((a,b)=>a.date<b.date?-1:1);S.set('actlog',l)}
function cardioLast(key,ds){const l=actLog().filter(x=>x.key===key&&x.date<ds).slice(-1)[0];return l?`<p class="cue last">Last: ${l.min} min${l.km?` · ${l.km} km`:''}${l.eff?` · ${EFF.find(e=>e[0]===l.eff)[1].split(' ·')[0].toLowerCase()}`:''}</p>`:''}
function defMin(dose){const m=/(\d+)\s*min/.exec(dose);if(m)return +m[1];const r=/(\d+)\s*(?:rounds|×)/.exec(dose);return r?Math.round(+r[1]*1):''}
function cardioLogger(key,ds,dose,label){
  const id=`w:${ds}:${key}`,cur=actLog().find(x=>x.id===id)||{};
  const box=document.createElement('div');box.className='logger';box.hidden=!cur.id;box.dataset.lg=key;
  box.innerHTML=`<div class="cgrid">
    <label><span>Minutes</span><input type="number" inputmode="numeric" min="0" step="1" placeholder="${defMin(dose)}" value="${cur.min??''}" data-c="${key}" data-cf="min"></label>
    <label><span>Distance km</span><input type="number" inputmode="decimal" min="0" step="0.1" placeholder="optional" value="${cur.km??''}" data-c="${key}" data-cf="km"></label>
    <label><span>Avg heart rate</span><input type="number" inputmode="numeric" min="0" step="1" placeholder="optional" value="${cur.hr??''}" data-c="${key}" data-cf="hr"></label>
    <label><span>Effort</span><select data-c="${key}" data-cf="eff"><option value="">–</option>${EFF.map(([v,t])=>`<option value="${v}" ${cur.eff===v?'selected':''}>${t}</option>`).join('')}</select></label></div>
    ${prof.asthma?`<div class="breathpick" role="group" aria-label="Breathing during cardio"><span>Breathing</span>${[['ok','Fine'],['tight','Got tight'],['inh','Used inhaler']].map(([v,t])=>`<button type="button" class="chip ${v!=='ok'?'warn':''} ${cur.br===v?'on':''}" data-cb="${key}" data-v="${v}">${t}</button>`).join('')}</div>`:''}
    <p class="cue">Saved automatically. Heart rate from a watch if you have one. Fat burn zone for you ≈ ${Math.round((220-(prof.age||35))*0.6)}–${Math.round((220-(prof.age||35))*0.7)} bpm.</p>`;
  box.dataset.id=id;box.dataset.label=label;return box;
}
function cardioSave(box,patch){
  const id=box.dataset.id,key=box.dataset.lg,ds=id.split(':')[1];
  const cur=actLog().find(x=>x.id===id)||{id,date:ds,key,type:key,src:'plan'};
  Object.assign(cur,patch);saveAct(cur);
}
function mobLogger(bl,ds){
  const id=`m:${ds}:${bl.label}`,cur=actLog().find(x=>x.id===id);
  const d=document.createElement('div');d.className='mobdone';
  d.innerHTML=`<button type="button" class="chip ${cur?'on':''}" data-mob="${esc(bl.label)}" data-min="${bl.min}" data-ds="${ds}">${cur?`✓ ${esc(bl.label)} done · ${cur.min} min`:`Mark ${esc(bl.label.toLowerCase())} done (${bl.min} min)`}</button>
   <label class="mobmin"><span>Minutes</span><input type="number" inputmode="numeric" min="0" step="1" value="${cur?cur.min:bl.min}" data-mobmin="${esc(bl.label)}"></label>
   <select data-mobtight="${esc(bl.label)}" aria-label="Tightest area"><option value="">Tightest area (optional)</option>${['Hamstrings','Hips','Lower back','Shoulders','Chest','Calves','Neck'].map(x=>`<option ${cur&&cur.tight===x?'selected':''}>${x}</option>`).join('')}</select>`;
  return d;
}
$('day').addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.c){const box=t.closest('.logger');const v=t.dataset.cf==='eff'?t.value:parseFloat(t.value);cardioSave(box,{[t.dataset.cf]:t.dataset.cf==='eff'?v:(isNaN(v)?0:v)});return}
  if(t.dataset.mobmin||t.dataset.mobtight){const w=t.closest('.mobdone'),b=w.querySelector('[data-mob]'),ds=b.dataset.ds,id=`m:${ds}:${b.dataset.mob}`,cur=actLog().find(x=>x.id===id);
    if(cur){if(t.dataset.mobmin)cur.min=+t.value||0;else cur.tight=t.value;saveAct(cur);renderSession()}}
});
$('day').addEventListener('click',e=>{
  const cb=e.target.closest('[data-cb]');if(cb){const box=cb.closest('.logger');cardioSave(box,{br:cb.dataset.v});box.querySelectorAll('[data-cb]').forEach(x=>x.classList.toggle('on',x===cb));if(cb.dataset.v!=='ok')toast('Noted. Slow down to an easy pace. Stop if it does not settle in 2–3 minutes.');return}
  const mb=e.target.closest('[data-mob]');if(mb){const ds=mb.dataset.ds,id=`m:${ds}:${mb.dataset.mob}`,w=mb.closest('.mobdone');
    if(actLog().some(x=>x.id===id)){S.set('actlog',actLog().filter(x=>x.id!==id))}
    else saveAct({id,date:ds,key:'mob',type:'mob',min:+w.querySelector('[data-mobmin]').value||+mb.dataset.min,tight:w.querySelector('[data-mobtight]').value,src:'plan'});
    renderSession()}
});

/* weekly totals: cardio minutes, core sets, mobility minutes */
function weekKeyOf(ds){return ymd(mondayOf(parseYmd(ds)))}
function coreSetsOn(ds){let n=0;for(const k of CORE_KEYS){const h=hist(k).find(x=>x.date===ds);if(h)n+=h.sets.length}return n}
const CORE_KEYS=new Set(['plank','kneeplank','sideplank','deadbug','legraise','bicycle','hangknee','hangleg','abwheel','cablecrunch','crunch','birddog','hollow','russian','mtclimb','pallof','vups','situp']);
function isCoreKey(k){return CORE_KEYS.has(k)}
function weekTotals(wk){
  const days=[...Array(7)].map((_,i)=>{const d=new Date(wk+'T00:00');d.setDate(d.getDate()+i);return localDs(d)});
  const al=actLog().filter(x=>days.includes(x.date));
  const cardio=al.filter(x=>x.type!=='mob'&&x.type!=='core').reduce((s,x)=>s+(x.min||0),0);
  const km=al.reduce((s,x)=>s+(x.km||0),0);
  const mob=al.filter(x=>x.type==='mob').reduce((s,x)=>s+(x.min||0),0);
  const coreMin=al.filter(x=>x.type==='core').reduce((s,x)=>s+(x.min||0),0);
  const coreSets=days.reduce((s,d)=>s+coreSetsOn(d),0);
  const tight=al.filter(x=>x.br&&x.br!=='ok').length;
  return {cardio,km:Math.round(km*10)/10,mob,coreSets,coreMin,tight};
}
function localDs(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const ACT_TGT={cardio:150,coreSets:18,mob:60};
function renderAct(){
  const el=$('actlog');if(!el)return;
  const wk=weekKeyOf(todayStr()),t=weekTotals(wk);
  const weeks=[...Array(8)].map((_,i)=>{const d=new Date(wk+'T00:00');d.setDate(d.getDate()-7*(7-i));const k=localDs(d);return {k,...weekTotals(k)}});
  const bar=(lab,v,tg,c,u)=>`<div class="mbar"><div class="mtop"><span class="k">${lab}</span><b>${v}<small> / ${tg} ${u}</small></b></div><div class="mtrack"><i style="width:${Math.min(100,v/tg*100)}%;background:${c}"></i></div></div>`;
  const W=300,H=110,pb=18,mx=Math.max(ACT_TGT.cardio,...weeks.map(w=>w.cardio+w.mob)),bw=W/8-8;
  let svg=`<svg viewBox="0 0 ${W} ${H}" class="actchart" role="img" aria-label="Cardio and mobility minutes, last 8 weeks"><line x1="0" x2="${W}" y1="${H-pb-(ACT_TGT.cardio/mx)*(H-pb-6)}" y2="${H-pb-(ACT_TGT.cardio/mx)*(H-pb-6)}" stroke="var(--dim)" stroke-dasharray="3 3"/>`;
  weeks.forEach((w,i)=>{const x=i*(W/8)+4,hc=(w.cardio/mx)*(H-pb-6),hm=(w.mob/mx)*(H-pb-6);
    svg+=`<rect x="${x}" y="${H-pb-hc}" width="${bw}" height="${hc}" rx="2" fill="${HEX.cardio}"/><rect x="${x}" y="${H-pb-hc-hm-(hm?1:0)}" width="${bw}" height="${hm}" rx="2" fill="${HEX.stretch}"/>
    <text x="${x+bw/2}" y="${H-4}" text-anchor="middle" font-size="9" fill="var(--muted)">${i===7?'This':new Date(w.k+'T00:00').getDate()+'/'+(new Date(w.k+'T00:00').getMonth()+1)}</text>`});
  svg+='</svg>';
  const recent=actLog().slice(-6).reverse();
  el.innerHTML=`<div class="diethead"><h3 class="sub">Cardio · Core · Mobility</h3><span class="cue">This week</span></div>
   ${bar('Cardio',t.cardio,ACT_TGT.cardio,HEX.cardio,'min')}
   ${bar('Core sets',t.coreSets+(t.coreMin?Math.round(t.coreMin/2):0),ACT_TGT.coreSets,HEX.core,'sets')}
   ${bar('Mobility',t.mob,ACT_TGT.mob,HEX.stretch,'min')}
   <p class="cue">${t.km?`${t.km} km covered this week. `:''}${prof.asthma&&t.tight?`Breathing got tight ${t.tight}× this week. Mention it to your chest doctor if it keeps happening. `:''}Targets: 150 min cardio (fat loss and heart), about 18 core sets, 60 min mobility.</p>
   ${svg}<div class="legend"><span style="--c:${HEX.cardio}">Cardio min</span><span style="--c:${HEX.stretch}">Mobility min</span><span style="--c:var(--dim)">150 min target</span></div>
   <details class="actadd"><summary>Log extra activity (evening walk, Sunday walk, yoga, sport)</summary>
   <form id="act-form" class="logform">
    <label><span>Date</span><input type="date" name="date" value="${todayStr()}" max="${todayStr()}"></label>
    <label><span>Activity</span><select name="type">${ACT_TYPES.map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label>
    <label><span>Minutes</span><input type="number" name="min" inputmode="numeric" min="1" step="1" required></label>
    <label><span>Distance km</span><input type="number" name="km" inputmode="decimal" min="0" step="0.1" placeholder="optional"></label>
    <label><span>Effort</span><select name="eff"><option value="">–</option>${EFF.map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label>
    ${prof.asthma?`<label><span>Breathing</span><select name="br"><option value="ok">Fine</option><option value="tight">Got tight</option><option value="inh">Used inhaler</option></select></label>`:''}
    <button type="submit" class="primary">Save</button></form></details>
   ${recent.length?`<h4 class="sub" style="margin-top:12px">Recent</h4><ul class="actlist">${recent.map(r=>`<li><span>${r.date.slice(8)}/${r.date.slice(5,7)}</span><b>${esc((ACT_TYPES.find(a=>a[0]===r.type)||[0,EX[r.key]?EX[r.key].n:r.type])[1])}</b><span>${r.min||0} min${r.km?` · ${r.km} km`:''}${r.br&&r.br!=='ok'?' · <em>tight</em>':''}</span>${r.src==='extra'?`<button type="button" class="link" data-actdel="${r.id}" aria-label="Delete">✕</button>`:'<i></i>'}</li>`).join('')}</ul>`:''}`;
  $('act-form').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target);const o={id:'x:'+Date.now(),src:'extra',date:f.get('date'),type:f.get('type'),key:f.get('type'),min:+f.get('min')||0,km:+f.get('km')||0,eff:f.get('eff')||'',br:f.get('br')||''};
    saveAct(o);toast('Activity saved');renderAct()};
  el.querySelectorAll('[data-actdel]').forEach(b=>b.onclick=()=>{S.set('actlog',actLog().filter(x=>x.id!==b.dataset.actdel));renderAct()});
}


/* =================================================================
   EXPORT FOR ANALYSIS — readable file + chat summary + daily CSV
   ================================================================= */
const r1=x=>Math.round(x*10)/10;
function firstDataDate(){let m=todayStr();try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i).slice(P.length);const mm=/^(?:day|food):(\d{4}-\d\d-\d\d)$/.exec(k);if(mm&&mm[1]<m)m=mm[1]}}catch(e){}if(prof.start<m)m=prof.start;return m}
function dateRange(days){const out=[];const end=new Date();let d=days?addDays(end,-(days-1)):parseYmd(firstDataDate());while(ymd(d)<=ymd(end)){out.push(ymd(d));d=addDays(d,1)}return out}
function dayRow(ds){
  const p=posOf(parseYmd(ds)),sess=Plan.program(p.w,p.d),rec=getDay(ds),t=totals(ds),fl=foodLog(ds);
  const acts=actLog().filter(x=>x.date===ds);
  const q=questsFor(ds);
  return {date:ds,week:p.w,weekday:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][p.d],rank_stage:Plan.stageOf(p.w).rank,planned:ds<ymd(mondayOf(parseYmd(prof.start)))?'(before plan start)':sess.t,
    workout_done:!!rec.workout,breathing:rec.breath?({g:'green',y:'yellow',r:'red'}[rec.breath]||rec.breath):'',
    quests_done:q.filter(x=>x.done).length,quests_total:q.length,water_l:r1((rec.water||0)/1000),
    kcal:Math.round(t.kcal),protein_g:Math.round(t.p),carbs_g:Math.round(t.c),fat_g:Math.round(t.f),fibre_g:Math.round(t.fi),food_items:fl.length,
    foods:fl.map(e=>{const f=food(e.f);return f?`${f.n} ×${e.q}`:e.f}).join('; '),
    cardio_min:acts.filter(x=>x.type!=='mob'&&x.type!=='core').reduce((s,x)=>s+(x.min||0),0),
    cardio_km:r1(acts.reduce((s,x)=>s+(x.km||0),0)),mobility_min:acts.filter(x=>x.type==='mob').reduce((s,x)=>s+(x.min||0),0),
    core_sets:coreSetsOn(ds),breath_tight_events:acts.filter(x=>x.br&&x.br!=='ok').length};
}
function liftHistory(){const out={};Object.keys(EX).forEach(k=>{const h=hist(k);if(h.length)out[EX[k].n]=h.map(x=>({date:x.date,sets:x.sets.map(s=>x.u==='s'?`${s.reps}s`:`${s.kg?s.kg+'kg×':''}${s.reps}`).join(', '),est_1rm_kg:x.e1||undefined}))});return out}
function analysisData(days){
  const dates=dateRange(days),T=targets(),rows=dates.map(dayRow);
  const logged=rows.filter(r=>r.food_items>0),avg=k=>logged.length?Math.round(logged.reduce((s,r)=>s+r[k],0)/logged.length):null;
  const nowP=posOf(new Date());
  return {app:'ARETE',export:'analysis',version:'5.3',exported:new Date().toISOString(),period:{from:dates[0],to:dates[dates.length-1],days:dates.length},
    profile:{age:prof.age,height_cm:prof.ht,weight_kg:prof.wt,diet:['veg','veg + egg','non-veg'][prof.diet]||prof.diet,gym_time:prof.gym,plan_start:prof.start,asthma_mode:!!prof.asthma,doctor_review_mode:!!prof.medHold},
    plan:{current_week:nowP.w,total_weeks:Plan.TOTAL,cut_check_week:26,stage:Plan.stageOf(nowP.w).name,earned_rank:earnedRank()},
    daily_targets:{kcal:T.kcal,protein_g:T.p,carbs_g:T.c,fat_g:T.f,fibre_g:T.fi,maintenance_kcal:T.tdee,water_l:waterL()},
    averages_on_logged_days:{days_with_food_logged:logged.length,kcal:avg('kcal'),protein_g:avg('protein_g'),carbs_g:avg('carbs_g'),fat_g:avg('fat_g'),fibre_g:avg('fibre_g')},
    days:rows,
    body_log:latestLog().filter(r=>r.date>=dates[0]),
    lifts_and_core:liftHistory(),
    cardio_core_mobility:actLog().filter(x=>x.date>=dates[0]).map(({id,src,...x})=>({...x,source:src})),
    rank_tests:S.get('tests',[]),stat_checks:S.get('checks',[]),
    health_todo:S.get('health',{}),
    mission:{steps_done:(S.get('mdone',[])||[]).length,money_hours:mLog().filter(x=>!x.date||x.date>=dates[0]),revenue_by_month:S.get('mrev',[])},
    custom_foods:customFoods()};
}
function summaryText(days){
  const d=analysisData(days),T=d.daily_targets;
  const L=[`ARETE export · ${d.period.from} to ${d.period.to} (${d.period.days} days)`,
   `Me: ${d.profile.age||'?'} y, ${d.profile.height_cm} cm, ${d.profile.weight_kg} kg, ${d.profile.diet}, asthma mode ${d.profile.asthma_mode?'on':'off'}. Week ${d.plan.current_week} of ${d.plan.total_weeks}, ${d.plan.stage}, rank ${d.plan.earned_rank}.`,
   `Targets: ${T.kcal} kcal, protein ${T.protein_g} g, carbs ${T.carbs_g} g, fat ${T.fat_g} g, fibre ${T.fibre_g} g, water ${T.water_l} L.`,
   `Average on ${d.averages_on_logged_days.days_with_food_logged} logged days: ${d.averages_on_logged_days.kcal??'–'} kcal, protein ${d.averages_on_logged_days.protein_g??'–'} g, carbs ${d.averages_on_logged_days.carbs_g??'–'} g, fat ${d.averages_on_logged_days.fat_g??'–'} g, fibre ${d.averages_on_logged_days.fibre_g??'–'} g.`,'',
   'Date | Plan | Done | Breath | kcal | P | C | F | Fib | Water L | Cardio min | Mob min | Core sets'];
  d.days.forEach(r=>L.push(`${r.date} ${r.weekday} | ${r.planned} | ${r.workout_done?'Y':'-'} | ${r.breathing||'-'} | ${r.kcal||'-'} | ${r.protein_g||'-'} | ${r.carbs_g||'-'} | ${r.fat_g||'-'} | ${r.fibre_g||'-'} | ${r.water_l||'-'} | ${r.cardio_min||'-'} | ${r.mobility_min||'-'} | ${r.core_sets||'-'}`));
  if(d.body_log.length){L.push('','Body log (date: weight kg, waist cm):');d.body_log.forEach(b=>L.push(`${b.date}: ${b.wt??'-'} kg, ${b.waist??'-'} cm`))}
  const lifts=Object.entries(d.lifts_and_core).map(([n,h])=>{const f=h.filter(x=>x.date>=d.period.from);return f.length?`${n}: ${f[0].date} ${f[0].sets}${f.length>1?` → ${f[f.length-1].date} ${f[f.length-1].sets}`:''}`:null}).filter(Boolean);
  if(lifts.length){L.push('','Lifts and core (first → latest in period):',...lifts)}
  const foodDays=d.days.filter(r=>r.foods).slice(-7);
  if(foodDays.length){L.push('','Food, last 7 logged days:');foodDays.forEach(r=>L.push(`${r.date}: ${r.foods}`))}
  L.push('','Please analyse my progress: fat loss, protein, training consistency, strength and what to change.');
  return L.join('\n');
}
function csvOf(rows){if(!rows.length)return '';const ks=Object.keys(rows[0]);const q=v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v};return [ks.join(','),...rows.map(r=>ks.map(k=>q(r[k])).join(','))].join('\r\n')}
async function shareOrDownload(blob,name,msg){
  try{const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});msg('Shared. Pick Claude, WhatsApp or Drive in the share menu.');return}}catch(e){if(e&&e.name==='AbortError'){msg('Share cancelled.');return}}
  download(blob,name);msg('Saved to your Downloads: '+name);
}
window.HunterExport={summaryText:(d)=>summaryText(d),analysisData:(d)=>analysisData(d)};
function initExport(){
  const el=$('exportwin');if(!el)return;
  const msg=t=>{$('ex-msg').textContent=t};
  const days=()=>+$('ex-range').value;
  $('ex-file').onclick=()=>shareOrDownload(new Blob([JSON.stringify(analysisData(days()),null,1)],{type:'application/json'}),`arete-analysis-${todayStr()}.json`,msg);
  $('ex-csv').onclick=()=>shareOrDownload(new Blob(['﻿'+csvOf(dateRange(days()).map(dayRow))],{type:'text/csv'}),`arete-daily-${todayStr()}.csv`,msg);
  $('ex-copy').onclick=async()=>{const t=summaryText(days());try{await navigator.clipboard.writeText(t);msg('Summary copied. Paste it into your chat with Claude.')}catch(e){const ta=$('ex-text');ta.hidden=false;ta.value=t;ta.select();msg('Select all and copy the text below.')}};
}


/* ---------- fix: kg and reps entered the wrong way round ---------- */
function swapLogs(from,before){
  const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'hist:')||k.startsWith(P+'wl:'))keys.push(k.slice(P.length))}
  const backup={};let n=0;
  keys.forEach(k=>{
    if(k.startsWith('hist:')){const h=S.get(k,[]);backup[k]=JSON.parse(JSON.stringify(h));let ch=false;
      h.forEach(x=>{if(x.date>before||x.date<from||x.u==='s')return;if(!x.sets.every(s=>s.kg>0))return;x.sets=x.sets.map(s=>({kg:s.reps,reps:s.kg}));x.e1=Math.round(Math.max(...x.sets.map(s=>s.kg*(1+s.reps/30)))*10)/10;ch=true;n++});
      if(ch)S.set(k,h)}
    else{const ds=k.split(':')[1];if(ds>before||ds<from)return;const arr=S.get(k,[]);if(!Array.isArray(arr))return;backup[k]=arr;
      S.set(k,arr.map(s=>s&&s.kg&&s.reps?{...s,kg:s.reps,reps:s.kg}:s))}
  });
  S.set('swapBackup',{at:new Date().toISOString(),from,before,data:backup});return n;
}
function initSwapFix(){
  const b=$('swap-go');if(!b)return;const msg=t=>$('swap-msg').textContent=t;
  $('swap-date').value=todayStr();$('swap-date').max=todayStr();$('swap-from').value=prof.start;$('swap-from').max=todayStr();
  const bk=S.get('swapBackup',null);$('swap-undo').hidden=!bk;
  b.onclick=()=>{const d=$('swap-date').value||todayStr(),f=$('swap-from').value||'2000-01-01';if(!confirm(`Swap kg and reps in every strength log from ${f} to ${d}?`))return;const n=swapLogs(f,d);msg(`Fixed ${n} workout entries. Open Body to see the corrected numbers.`);$('swap-undo').hidden=false};
  $('swap-undo').onclick=()=>{const bk=S.get('swapBackup',null);if(!bk)return;Object.entries(bk.data).forEach(([k,v])=>S.set(k,v));S.del('swapBackup');$('swap-undo').hidden=true;msg('Undone. Logs are back to how they were.')};
}


/* ---------- start fresh: erase every log, keep profile settings ---------- */
function initReset(){
  const b=$('reset-go');if(!b)return;
  const mon=ymd(mondayOf(new Date()));$('reset-start').value=mon;
  b.onclick=()=>{
    if($('reset-confirm').value.trim().toUpperCase()!=='RESET'){$('reset-msg').textContent='Type RESET in the box first.';return}
    try{download(new Blob([JSON.stringify({app:'hunter',v:2,saved:new Date().toISOString(),data:allData()})],{type:'application/json'}),`arete-before-reset-${todayStr()}.json`)}catch(e){}
    const keep=S.get('profile',{});const del=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P)||k.startsWith('erank:'))del.push(k)}
    del.forEach(k=>localStorage.removeItem(k));
    keep.start=$('reset-start').value||mon;S.set('profile',keep);S.set('rank','E');S.set('mver',99);S.set('migratedV1',true);S.set('spiroMig',true);S.set('resetAt',new Date().toISOString());
    $('reset-msg').textContent='Done. Starting fresh…';setTimeout(()=>location.reload(),600);
  };
}

/* ---------- toast ---------- */
function toast(t){let el=$('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200)}

/* =================================================================
   GATE MODE — full-screen workout, one exercise at a time (v8.1)
   Same storage as Body: wl:<ds>:<key> sets + hist:<key>, actlog for cardio
   and mobility, day.workout when cleared. Position: hunter:gateRun.
   ================================================================= */
const GT={open:false,ds:null,p:null,sess:null,light:false,steps:[],i:0,done:{},extra:{},t0:0,xp0:0,restEnd:0,restTotal:0,restInt:null,confirm:false};
const HEAVY=['bbbench','squat','bbrow','ohp','deadlift','dead'];
function restFor(bl,key){if(bl.kind==='core')return 45;if(/pump/i.test(bl.label||''))return 60;if(HEAVY.includes(key))return 150;const m=/Rest (\d+)–(\d+) s/.exec(bl.how||'');return m?+m[2]:90}
function gateSteps(sess,light){
  if(light)return [{type:'cardio',key:'walk',dose:'30 min easy walk, talk pace',bl:{kind:'cardio',label:'Light day'}},
    {type:'text',bl:{kind:'stretch',label:'Mobility',min:15,text:'Easy mobility for hips, hamstrings, chest and shoulders. Slow nose breathing. Nothing hard today.'}}];
  const out=[];
  sess.blocks.forEach(b=>{const bl=prof.medHold&&b.items?{...b,items:adaptItems(b.items)}:b;
    if(!bl.items||!bl.items.length){out.push({type:'text',bl});return}
    bl.items.forEach(([key,dose])=>{if(!EX[key])return;const mode=logMode(bl.kind,key,dose);
      out.push({type:mode==='cardio'?'cardio':mode?'sets':'info',mode,key,dose,bl})})});
  return out;
}
const gSets=k=>S.get(wlKey(GT.ds,k),[]);
function nSets(st){return Math.max(setsIn(st.dose)||3,(gSets(st.key).length||0))+(GT.extra[st.key]||0)}
function stepDone(k){const st=GT.steps[k];if(!st)return false;
  if(st.type==='sets')return gSets(st.key).filter(s=>s&&s.reps>0).length>=(setsIn(st.dose)||3);
  if(st.type==='cardio')return actLog().some(x=>x.id===`w:${GT.ds}:${st.key}`&&x.min>0);
  if(st.type==='text'&&st.bl.kind==='stretch')return actLog().some(x=>x.id===`m:${GT.ds}:${st.bl.label}`);
  return !!GT.done[k]}
function saveRun(){S.set('gateRun',{ds:GT.ds,i:GT.i,done:GT.done,t0:GT.t0})}

function openGate(){
  const now=new Date(),ds=ymd(now),p=posOf(now),sess=Plan.program(p.w,p.d),rec=getDay(ds);
  if(sess.rest||(prof.asthma&&rec.breath==='r'))return;
  const light=!!(prof.asthma&&rec.breath==='y'),run=S.get('gateRun',{}),same=run.ds===ds;
  Object.assign(GT,{open:true,ds,p,sess,light,steps:gateSteps(sess,light),done:same?(run.done||{}):{},extra:{},t0:same&&run.t0?run.t0:Date.now(),xp0:xpTotal(),confirm:false});
  GT.i=Math.max(0,Math.min(same?(run.i||0):0,GT.steps.length-1));
  let o=$('gatemode');
  if(!o){o=document.createElement('div');o.id='gatemode';o.className='gatemode';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Gate: workout mode');
    o.innerHTML=`<div class="gm-top"><button type="button" class="gm-x" data-g="close" aria-label="Leave Gate (progress is saved)"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="gm-prog" id="gm-prog" aria-hidden="true"></div><span class="gm-n" id="gm-n"></span></div>
      <div class="gm-stage" id="gm-stage"></div><div class="gm-nav" id="gm-nav"></div><div class="gm-rest" id="gm-rest" hidden></div>`;
    document.body.appendChild(o);bindGate(o)}
  o.hidden=false;o.classList.remove('cleared');document.body.classList.add('locked');wake(true);audio();saveRun();
  try{history.pushState({gate:1},'')}catch(e){}
  renderGateStep(0);
}
function closeGate(fromPop){
  if(!GT.open)return;
  if(!fromPop&&history.state&&history.state.gate){history.back();return}
  GT.open=false;stopRest();wake(false);const o=$('gatemode');if(o)o.hidden=true;document.body.classList.remove('locked');refresh();
}
window.addEventListener('popstate',()=>{if(GT.open)closeGate(true)});

function renderGateStep(dir){
  const st=GT.steps[GT.i],n=GT.steps.length,ds=GT.ds;
  $('gm-prog').innerHTML=GT.steps.map((_,k)=>`<i class="${stepDone(k)?'ok':''}${k===GT.i?' on':''}"></i>`).join('');
  $('gm-n').textContent=`${GT.i+1}/${n}`;
  const e=st.key?EX[st.key]:null;let h='';
  const head=(tag,title,sub)=>`<p class="gm-tag" style="--c:${COL[st.bl.kind]||'var(--cyan)'}">${tag}</p><h2 class="gm-h">${esc(title)}</h2>${sub?`<p class="gm-dose">${esc(sub)}</p>`:''}`;
  if(st.type==='sets'){
    const last=lastBefore(st.key,ds),cur=gSets(st.key),ns=nSets(st),isW=st.mode==='sets';
    const act=[...Array(ns).keys()].find(i=>!(cur[i]&&cur[i].reps>0));
    const ph=i=>(last&&(last.sets[i]||last.sets[last.sets.length-1]))||{};
    h=head(`${esc(st.bl.label)} · ${esc(e.m)}`,e.n,st.dose)+
     `<div class="gm-figrow"><div class="gm-fig" id="gm-fig"></div><div class="gm-last">${last?`<span class="k">Last time · ${last.date.slice(5).split('-').reverse().join('/')}</span><b>${last.sets.map(s=>`${s.kg?s.kg+'×':''}${s.reps}${last.u==='s'?' s':''}`).join('  ')}</b>`:'<span class="k">First time</span><b>Find a weight you can lift with good form</b>'}
       <button type="button" class="link" data-g="how">How to do it</button></div></div>
     ${progCue(st.dose,last)}
     <div class="gs" role="group" aria-label="Sets">${[...Array(ns).keys()].map(i=>{const v=cur[i]||{},done=v.reps>0,p=ph(i);
       return `<div class="gs-row${done?' done':''}${i===act?' act':''}"><span class="gs-n">${done?'✓':i+1}</span>
        ${isW?`<label class="gs-f"><span>Weight kg</span><input type="number" inputmode="decimal" step="0.5" min="0" data-gk="kg" data-i="${i}" value="${v.kg??''}" placeholder="${p.kg??'–'}" aria-label="Set ${i+1} weight kg"></label>`:''}
        <label class="gs-f"><span>${st.mode==='secs'?'Seconds':'Reps'}</span><input type="number" inputmode="numeric" step="1" min="0" data-gk="reps" data-i="${i}" value="${v.reps??''}" placeholder="${p.reps??'–'}" aria-label="Set ${i+1} ${st.mode==='secs'?'seconds':'reps'}"></label>
        <button type="button" class="gs-ok" data-g="set" data-i="${i}" aria-label="Log set ${i+1}">${done?'Edit':'Log'}</button></div>`}).join('')}</div>
     ${act!=null?`<div class="gs-step" aria-label="Adjust set ${act+1}">${isW?`<button type="button" data-g="adj" data-f="kg" data-d="-2.5">−2.5 kg</button><button type="button" data-g="adj" data-f="kg" data-d="2.5">+2.5 kg</button>`:''}<button type="button" data-g="adj" data-f="reps" data-d="-1">−1</button><button type="button" data-g="adj" data-f="reps" data-d="1">+1</button></div>`:''}
     <div class="gm-row2"><button type="button" class="link" data-g="addset">+ Add a set</button><span class="cue">Rest ${restFor(st.bl,st.key)} s after each set</span></div>
     <p class="cue">${isW?'Empty boxes use the grey numbers from last time. Bodyweight move? Leave weight empty.':st.mode==='secs'?'Seconds held with good form. Stop when your hips sag.':'Reps with good form.'}</p>`;
  }
  else if(st.type==='cardio'){
    const id=`w:${ds}:${st.key}`,cur=actLog().find(x=>x.id===id)||{},d=defMin(st.dose);
    h=head(`${esc(st.bl.label)}${e?' · '+esc(e.m):''}`,e?e.n:'Walk',st.dose)+`<div class="gm-figrow"><div class="gm-fig" id="gm-fig"></div><div class="gm-last">${cardioLast(st.key,ds)||'<span class="k">Talk pace</span><b>You can speak in full sentences</b>'}</div></div>
     <div class="gc-grid"><label class="gs-f"><span>Minutes</span><input type="number" inputmode="numeric" min="0" step="1" id="gc-min" value="${cur.min??d}"></label>
      <label class="gs-f"><span>Distance km</span><input type="number" inputmode="decimal" min="0" step="0.1" id="gc-km" value="${cur.km??''}" placeholder="optional"></label></div>
     <p class="k" style="margin-top:12px">Effort</p><div class="gm-chips">${EFF.map(([v,t])=>`<button type="button" class="chip${cur.eff===v?' on':''}" data-g="eff" data-v="${v}">${t}</button>`).join('')}</div>
     ${prof.asthma?`<p class="k" style="margin-top:12px">Breathing</p><div class="gm-chips">${[['ok','Fine'],['tight','Got tight'],['inh','Used inhaler']].map(([v,t])=>`<button type="button" class="chip${v!=='ok'?' warn':''}${cur.br===v?' on':''}" data-g="br" data-v="${v}">${t}</button>`).join('')}</div>`:''}
     <button type="button" class="primary big gm-done" data-g="cardio">${cur.min>0?'Update · done ✓':'Mark done'}</button>
     <p class="cue">Fat-burn zone ≈ ${Math.round((220-(prof.age||35))*0.6)}–${Math.round((220-(prof.age||35))*0.7)} bpm.</p>`;
  }
  else{
    const bl=st.bl,done=stepDone(GT.i);
    h=head(bl.kind==='warm'?'Prepare':bl.kind==='stretch'?'Cool down':esc(bl.label),e?e.n:bl.label,e?st.dose:`${bl.min} min`)+
     (e?`<div class="gm-figrow"><div class="gm-fig" id="gm-fig"></div></div>`:`<div class="gm-art" aria-hidden="true">${GATE_SVG}</div>`)+
     `${bl.text?`<p class="gm-text">${esc(bl.text)}</p>`:''}${prof.asthma&&bl.kind==='warm'?'<p class="note asn">Asthma mode: build up slowly for 12–15 min. Reliever inhaler in your bag.</p>':''}
     <button type="button" class="${done?'ghost':'primary'} big gm-done" data-g="textdone">${done?'Done ✓':'Mark done'}</button>`;
  }
  const stage=$('gm-stage');stage.innerHTML=`<div class="gm-in ${dir>0?'from-r':dir<0?'from-l':''}">${h}</div>`;stage.scrollTop=0;
  const fg=$('gm-fig');if(fg&&e)fg.appendChild(Fig.svg(e.fig,HEX[st.bl.kind]||'#4FD8FF',e.n));
  const open=GT.steps.filter((_,k)=>!stepDone(k)).length;
  $('gm-nav').innerHTML=`<button type="button" class="ghost" data-g="prev" ${GT.i===0?'disabled':''} aria-label="Previous exercise">‹</button>`+
   (GT.i<n-1?`<button type="button" class="primary" data-g="next">Next · ${esc(nextName(GT.i+1))}</button>`
    :`<button type="button" class="primary gm-clear" data-g="finish">${GT.confirm&&open?`Clear anyway · ${open} open`:'Clear Gate'}</button>`);
}
function nextName(k){const s=GT.steps[k];if(!s)return '';return s.key&&EX[s.key]?EX[s.key].n:s.bl.label}
function gotoStep(k){if(k<0||k>=GT.steps.length)return;const d=k>GT.i?1:-1;GT.i=k;GT.confirm=false;saveRun();renderGateStep(d)}

function gLogSet(i){
  const st=GT.steps[GT.i],row=$('gm-stage').querySelectorAll('.gs-row')[i];if(!row)return;
  const val=f=>{const inp=row.querySelector(`[data-gk=${f}]`);if(!inp)return null;const v=parseFloat(inp.value!==''?inp.value:inp.placeholder);return isNaN(v)?null:v};
  const reps=val('reps'),kg=st.mode==='sets'?val('kg'):null;
  if(!(reps>0)){toast(st.mode==='secs'?'Enter the seconds you held':'Enter your reps first');const r=row.querySelector('[data-gk=reps]');if(r)r.focus();return}
  const arr=gSets(st.key);arr[i]={...(arr[i]||{}),reps};if(st.mode==='sets')arr[i].kg=kg||0;
  S.set(wlKey(GT.ds,st.key),arr);
  saveHist(st.key,GT.ds,arr.filter(Boolean).map(s=>({kg:s.kg||0,reps:s.reps||0})),st.mode==='secs'?'s':undefined);
  if(st.mode==='sets'&&kg&&reps>25&&kg<=15)toast(`${kg} kg × ${reps} reps? Weight goes in the first box.`);
  buzz(20);
  const left=[...Array(nSets(st)).keys()].some(k=>!(arr[k]&&arr[k].reps>0));
  renderGateStep(0);
  if(left)startGateRest(restFor(st.bl,st.key),`Next: set ${arr.filter(s=>s&&s.reps>0).length+1} of ${EX[st.key].n}`);
  else if(GT.i<GT.steps.length-1)startGateRest(restFor(st.bl,st.key),`Exercise done. Next: ${nextName(GT.i+1)}`);
}
function gAdj(f,d){
  const row=$('gm-stage').querySelector('.gs-row.act');if(!row)return;const inp=row.querySelector(`[data-gk=${f}]`);if(!inp)return;
  const base=parseFloat(inp.value!==''?inp.value:inp.placeholder)||0;inp.value=Math.max(0,Math.round((base+d)*10)/10);buzz(5);
}
function startGateRest(sec,next){
  GT.restTotal=sec;GT.restEnd=Date.now()+sec*1000;const r=$('gm-rest');r.hidden=false;
  r.innerHTML=`<div class="gr-in"><div class="gr-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="gr-bg" cx="60" cy="60" r="52"/><circle class="gr-fg" id="gr-fg" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"/></svg><div class="gr-c"><span class="k">Rest</span><b id="gr-t" role="timer"></b></div></div>
   <div class="gr-side"><p class="gr-next">${esc(next)}</p><div class="gr-btns"><button type="button" class="ghost" data-g="rest15">+15 s</button><button type="button" class="primary" data-g="restskip">Skip</button></div></div></div>`;
  clearInterval(GT.restInt);GT.restInt=setInterval(gRestTick,200);gRestTick();
}
function gRestTick(){
  const fg=$('gr-fg');if(!fg)return;const left=Math.max(0,(GT.restEnd-Date.now())/1000),C=2*Math.PI*52;
  fg.style.strokeDasharray=C;fg.style.strokeDashoffset=C*(1-left/GT.restTotal);$('gr-t').textContent=fmt(left);
  if(left<=0){stopRest();beep();buzz([300,120,300]);toast('Rest over. Next set.')}
}
function stopRest(){clearInterval(GT.restInt);GT.restInt=null;const r=$('gm-rest');if(r){r.hidden=true;r.innerHTML=''}}

function gCardioSave(patch){const st=GT.steps[GT.i],id=`w:${GT.ds}:${st.key}`;const cur=actLog().find(x=>x.id===id)||{id,date:GT.ds,key:st.key,type:st.key,src:'gate'};Object.assign(cur,patch);saveAct(cur)}

function finishGate(){
  const ds=GT.ds,r=getDay(ds),mins=Math.max(1,Math.round((Date.now()-GT.t0)/60000));
  if(!r.workout){r.workout={w:GT.p.w,d:GT.p.d,t:GT.light?'Light day':GT.sess.t,at:Date.now(),gate:true,min:mins};if(GT.light)r.q.light=true;setDay(ds,r)}
  stopRest();S.del('gateRun');
  const gained=Math.max(0,xpTotal()-GT.xp0);
  let sets=0,vol=0;const prs=[];
  GT.steps.filter(s=>s.type==='sets').forEach(s=>{
    const arr=gSets(s.key).filter(x=>x&&x.reps>0);sets+=arr.length;arr.forEach(x=>{vol+=(x.kg||0)*x.reps});
    const h=hist(s.key),t=h.find(x=>x.date===ds),prev=h.filter(x=>x.date<ds);if(!t||!prev.length)return;
    if(s.mode==='sets'&&t.e1>0){const best=Math.max(...prev.map(x=>x.e1||0));if(t.e1>best)prs.push([EX[s.key].n,`${t.e1} kg est. 1-rep max`,`+${Math.round((t.e1-best)*10)/10} kg`])}
    else{const br=Math.max(...prev.flatMap(x=>x.sets.map(y=>y.reps))),tr=Math.max(...t.sets.map(y=>y.reps));if(tr>br)prs.push([EX[s.key].n,`${tr} ${s.mode==='secs'?'s':'reps'}`,`+${tr-br}`])}});
  const o=$('gatemode');o.classList.add('cleared');
  $('gm-prog').innerHTML=GT.steps.map(()=>'<i class="ok"></i>').join('');$('gm-n').textContent='';
  $('gm-stage').innerHTML=`<div class="gc">
    <div class="gc-burst" aria-hidden="true">${GATE_SVG}</div>
    <p class="aw-sys">[ System ]</p><h1 class="gc-t">GATE<br>CLEARED</h1><p class="cue">${esc(GT.light?'Light day':GT.sess.t)} · ${mins} min</p>
    <div class="gc-xp">+<b id="gc-xp">0</b> XP</div>
    <div class="aw-stats"><div><b>${sets}</b><span>sets</span></div><div><b>${Math.round(vol).toLocaleString('en-IN')}</b><span>kg lifted</span></div><div><b>${mins}</b><span>minutes</span></div></div>
    ${prs.length?`<div class="gc-prs"><p class="k">New personal records</p>${prs.map(([n,v,d])=>`<div class="gc-pr"><span class="gc-badge">PR</span><span><b>${esc(n)}</b><small>${esc(v)}</small></span><em>${esc(d)}</em></div>`).join('')}</div>`
      :'<p class="cue">No new records today. Beat one number next time.</p>'}</div>`;
  $('gm-nav').innerHTML='<button type="button" class="primary big" data-g="close">Return</button>';
  buzz([40,60,40,60,140]);
  const el=$('gc-xp'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!gained)el.textContent=gained;else{const t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/1200);el.textContent=Math.round(gained*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};setTimeout(()=>requestAnimationFrame(step),450)}
}

function bindGate(o){
  o.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;const a=b.dataset.g,st=GT.steps[GT.i];
    if(a==='close'){closeGate();return}
    if(a==='next'){stopRest();gotoStep(GT.i+1);return}
    if(a==='prev'){stopRest();gotoStep(GT.i-1);return}
    if(a==='set'){gLogSet(+b.dataset.i);return}
    if(a==='adj'){gAdj(b.dataset.f,+b.dataset.d);return}
    if(a==='addset'){GT.extra[st.key]=(GT.extra[st.key]||0)+1;renderGateStep(0);return}
    if(a==='how'){openSheet(st.key);return}
    if(a==='rest15'){GT.restEnd+=15000;GT.restTotal+=15;gRestTick();return}
    if(a==='restskip'){stopRest();return}
    if(a==='eff'||a==='br'){gCardioSave({[a]:b.dataset.v,min:parseFloat($('gc-min').value)||0});if(a==='br'&&b.dataset.v!=='ok')toast('Slow to an easy pace. Stop if it does not settle in 2–3 minutes.');renderGateStep(0);return}
    if(a==='cardio'){const min=parseFloat($('gc-min').value)||0,km=parseFloat($('gc-km').value)||0;if(!(min>0)){toast('Enter the minutes');return}gCardioSave({min,km});buzz(20);toast(`${min} min logged`);renderGateStep(0);return}
    if(a==='textdone'){const bl=st.bl;if(bl.kind==='stretch'){const id=`m:${GT.ds}:${bl.label}`;if(!actLog().some(x=>x.id===id))saveAct({id,date:GT.ds,key:'mob',type:'mob',min:bl.min,src:'gate'})}else GT.done[GT.i]=true;
      saveRun();buzz(15);if(GT.i<GT.steps.length-1)gotoStep(GT.i+1);else renderGateStep(0);return}
    if(a==='finish'){const open=GT.steps.filter((_,k)=>!stepDone(k)).length;if(open&&!GT.confirm){GT.confirm=true;renderGateStep(0);return}finishGate();return}
  });
  // typing a value saves it straight away (same as Body)
  o.addEventListener('change',e=>{const t=e.target;if(!t.dataset.gk)return;const st=GT.steps[GT.i],i=+t.dataset.i,arr=gSets(st.key);
    if(!arr[i]||!(arr[i].reps>0))return;const v=parseFloat(t.value);arr[i][t.dataset.gk]=isNaN(v)?null:v;S.set(wlKey(GT.ds,st.key),arr);
    saveHist(st.key,GT.ds,arr.filter(Boolean).map(s=>({kg:s.kg||0,reps:s.reps||0})),st.mode==='secs'?'s':undefined)});
  // swipe between exercises
  let sx=0,sy=0,on=false;
  o.addEventListener('touchstart',e=>{if(e.target.closest('input,.gm-rest,.gs-step,.gm-chips'))return;on=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  o.addEventListener('touchend',e=>{if(!on||o.classList.contains('cleared'))return;on=false;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5){stopRest();gotoStep(GT.i+(dx<0?1:-1))}},{passive:true});
}

/* =================================================================
   PROGRESS (v8.2) — Stats sections: Status · Records · Calendar · Charts · Photos
   Reads existing logs only. Photos live in IndexedDB 'arete-photos' on this
   phone and are never uploaded (and not in the backup file).
   ================================================================= */
let statPane=S.get('statPane','status');
function showPane(p){
  if(!document.querySelector(`#st-tabs [data-pane="${p}"]`))p='status';statPane=p;S.set('statPane',p);
  document.querySelectorAll('#st-tabs [data-pane]').forEach(b=>{const on=b.dataset.pane===p;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1});
  document.querySelectorAll('#v-status .pane').forEach(x=>{x.hidden=x.dataset.pane!==p});
  if(p==='records')renderRecords();if(p==='calendar')renderCal();if(p==='charts')renderCharts();if(p==='photos')renderPhotos();
}
$('st-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-pane]');if(b){showPane(b.dataset.pane);window.scrollTo(0,0)}});
$('st-tabs').addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const t=[...document.querySelectorAll('#st-tabs [data-pane]')],i=t.findIndex(b=>b.dataset.pane===statPane),n=t[(i+(e.key==='ArrowRight'?1:t.length-1))%t.length];showPane(n.dataset.pane);n.focus()});

/* ---------- muscle groups ---------- */
const MGROUPS=[['Chest','#FF5470'],['Back','#8B5CFF'],['Shoulders','#4FD8FF'],['Arms','#FFC857'],['Legs','#2EF2A0'],['Core','#6E97FF']];
const MRULES=[['Core',/abs|core|oblique/],['Chest',/chest|pec/],['Shoulders',/delt|shoulder/],['Arms',/bicep|tricep|forearm|brachi/],['Back',/lat|back|rhomboid|trap/],['Legs',/quad|glute|hamstring|calf|calves|leg|hip|adductor/]];
function muscleOf(k){if(isCoreKey(k))return 'Core';const m=((EX[k]||{}).m||'').toLowerCase(),first=m.split('·')[0];
  for(const [g,rx] of MRULES)if(rx.test(first))return g;for(const [g,rx] of MRULES)if(rx.test(m))return g;return 'Other'}
const MCOL=Object.fromEntries(MGROUPS);
function histKeys(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'hist:'))out.push(k.slice((P+'hist:').length))}}catch(e){}return out}

/* ---------- personal records ---------- */
function prRecords(){
  const out=[];
  histKeys().forEach(k=>{const e=EX[k],h=hist(k).filter(x=>x.sets&&x.sets.length);if(!e||!h.length)return;
    const secs=h.some(x=>x.u==='s'),weighted=!secs&&h.some(x=>x.sets.some(s=>s.kg>0));
    const val=x=>weighted?(x.e1||0):Math.max(...x.sets.map(s=>s.reps||0));
    let run=-1,best=h[0];const events=[];
    h.forEach(x=>{const v=val(x);if(v>run){if(run>0)events.push({date:x.date,v,prev:run});run=v;best=x}});
    const top=weighted?best.sets.reduce((a,s)=>(s.kg||0)*(1+s.reps/30)>(a.kg||0)*(1+a.reps/30)?s:a):best.sets.reduce((a,s)=>s.reps>a.reps?s:a);
    out.push({k,e,g:muscleOf(k),weighted,secs,best,top,v:run,events,heaviest:weighted?Math.max(...h.flatMap(x=>x.sets.map(s=>s.kg||0))):0,sessions:h.length,last:h[h.length-1].date,series:h.map(val)});
  });
  return out;
}
function recSpark(v){const W=300,H=34,lo=Math.min(...v),hi=Math.max(...v),X=i=>6+i*(W-12)/(v.length-1),Y=x=>H-6-(hi>lo?(x-lo)/(hi-lo):.5)*(H-12);const pts=v.map((x,i)=>X(i).toFixed(1)+','+Y(x).toFixed(1)).join(' ');return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--mc)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(v.length-1)}" cy="${Y(v[v.length-1])}" r="4" fill="var(--mc)"/></svg>`}
let recFilter='All';
function renderRecords(){
  const el=$('records');const all=prRecords(),wkAgo=ymd(addDays(new Date(),-7));
  const recent=r=>r.events.length&&r.events[r.events.length-1].date>=wkAgo;
  const prs=all.reduce((a,r)=>a+r.events.length,0),fresh=all.filter(recent).length;
  if(!all.length){el.innerHTML=`<div class="wh"><h3 class="sub">Personal records</h3></div><div class="empty-st"><div class="gc-badge big">PR</div><p><b>No records yet.</b></p><p class="cue">Log sets in a Gate or in Body. Your best set, estimated 1-rep max and every new record show up here.</p></div>`;return}
  const groups=['All',...MGROUPS.map(g=>g[0]).filter(g=>all.some(r=>r.g===g))];if(!groups.includes(recFilter))recFilter='All';
  const list=all.filter(r=>recFilter==='All'||r.g===recFilter).sort((a,b)=>(recent(b)-recent(a))||(b.last>a.last?1:b.last<a.last?-1:0));
  const fmtD=d=>{const x=parseYmd(d);return `${x.getDate()} ${x.toLocaleString('en-IN',{month:'short'})}`};
  el.innerHTML=`<div class="wh"><h3 class="sub">Personal records</h3></div>
   <div class="rec-sum"><div><b>${all.length}</b><span>exercises</span></div><div><b>${prs}</b><span>records broken</span></div><div class="${fresh?'hot':''}"><b>${fresh}</b><span>new this week</span></div></div>
   <div class="seg rec-f" role="group" aria-label="Muscle group">${groups.map(g=>`<button type="button" data-rf="${g}" aria-pressed="${g===recFilter}">${g}</button>`).join('')}</div>
   <div class="recs">${list.map(r=>{const isNew=recent(r),u=r.secs?'s':'reps';
     const main=r.weighted?`${r.top.kg} kg × ${r.top.reps}`:`${r.v} ${u}`;
     const sub=r.weighted?`est. 1-rep max <b>${r.v} kg</b> · heaviest ${r.heaviest} kg`:`best single set`;
     return `<article class="rec${isNew?' new':''}" style="--mc:${MCOL[r.g]||'var(--dim)'}">
       <div class="rec-h"><span class="rec-g">${r.g}</span>${isNew?'<span class="gc-badge">PR</span><span class="rec-new">New</span>':r.events.length?`<span class="rec-n">${r.events.length} PR${r.events.length>1?'s':''}</span>`:''}</div>
       <b class="rec-name">${esc(r.e.n)}</b>
       <div class="rec-v"><b>${main}</b><span>${fmtD(r.best.date)}</span></div>
       <p class="cue">${sub} · ${r.sessions} session${r.sessions>1?'s':''}</p>
       ${r.series.length>1?`<div class="rec-sp">${recSpark(r.series.slice(-12))}</div>`:''}</article>`}).join('')}</div>`;
}
$('records').addEventListener('click',e=>{const b=e.target.closest('[data-rf]');if(b){recFilter=b.dataset.rf;renderRecords()}});

/* ---------- calendar ---------- */
let calMonth=null,calSel=null;
function dayInfo(ds){
  const has=hasData(ds),rec=getDay(ds),fl=foodLog(ds);let sets=0;
  histKeys().forEach(k=>{const x=hist(k).find(h=>h.date===ds);if(x)sets+=x.sets.length});
  const q=has?questsFor(ds):[],qd=q.filter(x=>x.done).length,t=fl.length?totals(ds):null;
  const cardio=actLog().filter(x=>x.date===ds&&x.type!=='mob').reduce((a,x)=>a+(x.min||0),0);
  const body=S.get('log',[]).find(r=>r.date===ds);
  return {has,rec,w:!!rec.workout,sets,q:q.length,qd,qok:q.length&&qd/q.length>=0.8,food:fl.length,t,water:rec.water||0,cardio,body};
}
function renderCal(){
  const now=new Date(),today=todayStr();if(!calMonth)calMonth=new Date(now.getFullYear(),now.getMonth(),1);if(!calSel)calSel=today;
  const y=calMonth.getFullYear(),m=calMonth.getMonth(),lead=(new Date(y,m,1).getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
  let cells='',nw=0,nq=0,nf=0;
  for(let i=0;i<lead;i++)cells+='<span class="cd pad" aria-hidden="true"></span>';
  for(let d=1;d<=dim;d++){const ds=ymd(new Date(y,m,d)),fut=ds>today,inf=fut?null:dayInfo(ds);
    if(inf){if(inf.w)nw++;if(inf.qok)nq++;if(inf.food)nf++}
    const lab=`${d} ${calMonth.toLocaleString('en-IN',{month:'long'})}${inf?`: ${inf.w?'workout done':'no workout'}, ${inf.q?`${inf.qd} of ${inf.q} quests`:'no quests logged'}, ${inf.food?'food logged':'no food logged'}`:''}`;
    cells+=`<button type="button" class="cd${inf&&inf.w?' w':''}${inf&&inf.qok?' q':''}${ds===today?' today':''}${ds===calSel?' sel':''}${fut?' fut':''}" data-cd="${ds}" ${fut?'disabled':''} aria-label="${lab}" aria-pressed="${ds===calSel}"><b>${d}</b>${inf?`<span class="cd-m"><i class="${inf.w?'mw':''}"></i><i class="${inf.qok?'mq':''}"></i><i class="${inf.food?'mf':''}"></i></span>`:''}</button>`}
  const isCur=y===now.getFullYear()&&m===now.getMonth();
  $('cal').innerHTML=`<div class="cal-h"><button type="button" class="ghost cal-nav" data-cm="-1" aria-label="Previous month">‹</button><b>${calMonth.toLocaleString('en-IN',{month:'long',year:'numeric'})}</b><button type="button" class="ghost cal-nav" data-cm="1" aria-label="Next month" ${isCur?'disabled':''}>›</button></div>
   <div class="cal-sum"><span><i class="mw"></i><b>${nw}</b> workouts</span><span><i class="mq"></i><b>${nq}</b> quest days</span><span><i class="mf"></i><b>${nf}</b> food logged</span></div>
   <div class="cal-g" role="grid"><span class="cw">M</span><span class="cw">T</span><span class="cw">W</span><span class="cw">T</span><span class="cw">F</span><span class="cw">S</span><span class="cw">S</span>${cells}</div>
   <p class="cue">Cyan = Gate cleared · gold ring = 80%+ of quests · green dot = food logged. Tap a day.</p>`;
  renderCalDay(calSel);
}
function renderCalDay(ds){
  const d=parseYmd(ds),p=posOf(d),sess=p.days>=0?Plan.program(p.w,p.d):null,inf=dayInfo(ds),T=targets();
  const row=(k,v,ok)=>`<div class="cdr${ok===true?' ok':ok===false?' no':''}"><span class="k">${k}</span><b>${v}</b></div>`;
  $('cal-day').innerHTML=`<div class="wh"><h3 class="sub">${DFULL[(d.getDay()+6)%7]}, ${d.getDate()} ${d.toLocaleString('en-IN',{month:'short'})}</h3>${p.days>=0?`<span class="cue">Week ${p.w}</span>`:''}</div>
   <div class="cdrs">
    ${row('Gate',sess?(sess.rest?'Rest day':`${esc(sess.t)} · ${inf.w?'cleared':'not cleared'}`):'Before plan start',sess&&!sess.rest?inf.w:undefined)}
    ${row('Sets logged',inf.sets||'–')}
    ${row('Quests',inf.q?`${inf.qd} / ${inf.q}`:'–',inf.q?!!inf.qok:undefined)}
    ${row('Food',inf.t?`${Math.round(inf.t.kcal).toLocaleString('en-IN')} kcal · ${Math.round(inf.t.p)} g protein`:'not logged',inf.t?inf.t.kcal<=T.kcal*1.05&&inf.t.p>=T.p*0.9:undefined)}
    ${row('Water',`${(inf.water/1000).toFixed(1)} L`,inf.has?inf.water>=waterL()*1000:undefined)}
    ${inf.cardio?row('Cardio',`${inf.cardio} min`):''}
    ${inf.body?row('Body',[inf.body.wt?inf.body.wt+' kg':'',inf.body.waist?inf.body.waist+' cm waist':''].filter(Boolean).join(' · ')):''}
   </div>
   <div class="t-actions left"><button type="button" class="ghost" data-cfood="${ds}">Open this day in Food</button></div>`;
}
$('cal').addEventListener('click',e=>{const c=e.target.closest('[data-cd]');if(c){calSel=c.dataset.cd;buzz(5);renderCal();return}
  const n=e.target.closest('[data-cm]');if(n){calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()+ +n.dataset.cm,1);renderCal()}});
$('cal-day').addEventListener('click',e=>{const b=e.target.closest('[data-cfood]');if(!b)return;showView('food');foodDate=b.dataset.cfood;renderFood()});

/* ---------- charts: weekly volume per muscle, calories + protein ---------- */
function renderCharts(){renderVolume();renderFuel();if(!window.FOODS_INDB)loadINDB()}
function weekMondays(n){const m0=mondayOf(new Date());return [...Array(n)].map((_,i)=>ymd(addDays(m0,-7*(n-1-i))))}
function renderVolume(){
  const wks=weekMondays(8),keys=histKeys();
  const data=wks.map(w=>{const end=ymd(addDays(parseYmd(w),6)),g={},s={};
    keys.forEach(k=>{const mg=muscleOf(k);hist(k).forEach(x=>{if(x.date<w||x.date>end)return;g[mg]=(g[mg]||0)+x.sets.reduce((a,y)=>a+(y.kg||0)*(y.reps||0),0);s[mg]=(s[mg]||0)+x.sets.length})});
    return {w,g,s,tot:Object.values(g).reduce((a,b)=>a+b,0)}});
  const el=$('chart-vol'),mx=Math.max(1,...data.map(d=>d.tot));
  if(!data.some(d=>d.tot||Object.keys(d.s).length)){el.innerHTML=`<div class="chart-head"><span class="k">Weekly volume per muscle</span></div><p class="cue empty">Log sets with a weight to see kg lifted per muscle each week.</p>`;return}
  const W=600,H=230,pl=56,pb=34,pt=14,bw=(W-pl-8)/8;const Y=v=>pt+(1-v/mx)*(H-pt-pb);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly training volume per muscle group, last 8 weeks">`;
  [0,mx/2,mx].forEach(v=>{svg+=`<line x1="${pl}" x2="${W-8}" y1="${Y(v)}" y2="${Y(v)}" class="grid-l"/><text x="${pl-8}" y="${Y(v)+6}" class="ax" text-anchor="end">${v>=1000?(v/1000).toFixed(v>=10000?0:1)+'k':Math.round(v)}</text>`});
  data.forEach((d,i)=>{const x=pl+i*bw+bw*.18,w=bw*.64;let y=H-pb;
    MGROUPS.forEach(([g,c])=>{const v=d.g[g]||0;if(!v)return;const h=v/mx*(H-pt-pb);y-=h;svg+=`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(0,h-1.5)}" fill="${c}" fill-opacity="${i===7?1:.75}"/>`});
    const dt=parseYmd(d.w);svg+=`<text x="${x+w/2}" y="${H-10}" class="ax" text-anchor="middle">${i===7?'This':dt.getDate()+'/'+(dt.getMonth()+1)}</text>`});
  svg+='</svg>';
  const cur=data[7],prev=data[6];
  el.innerHTML=`<div class="chart-head"><span class="k">Weekly volume per muscle · kg lifted</span><span class="cue">${Math.round(cur.tot).toLocaleString('en-IN')} kg so far this week${prev.tot?` · ${Math.round(prev.tot).toLocaleString('en-IN')} last week`:''}</span></div>${svg}
   <div class="legend">${MGROUPS.map(([g,c])=>`<span style="--c:${c}">${g}</span>`).join('')}</div>
   <p class="k" style="margin-top:14px">Sets this week</p>
   <div class="msets">${MGROUPS.map(([g,c])=>{const n=cur.s[g]||0;return `<div class="ms"><span>${g}</span><div class="mtrack"><i style="width:${Math.min(100,n/20*100)}%;background:${c}"></i></div><b>${n}</b></div>`}).join('')}</div>
   <p class="cue">About 10–20 hard sets per muscle a week builds muscle. Bodyweight sets count as sets, not kg.</p>`;
}
function renderFuel(){
  const T=targets(),days=[...Array(14)].map((_,i)=>ymd(addDays(new Date(),i-13))),rows=days.map(ds=>({ds,n:foodLog(ds).length,t:totals(ds)}));
  const el=$('chart-fuel'),logged=rows.filter(r=>r.n);
  const chart=(key,tgt,color,label,unit,overBad)=>{const W=600,H=150,pl=56,pb=26,pt=10,bw=(W-pl-8)/14,mx=Math.max(tgt*1.35,...rows.map(r=>r.t[key]));const Y=v=>pt+(1-v/mx)*(H-pt-pb);
    let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}, last 14 days, target ${tgt} ${unit}"><line x1="${pl}" x2="${W-8}" y1="${Y(tgt)}" y2="${Y(tgt)}" stroke="var(--gold)" stroke-dasharray="6 5" stroke-width="2"/><text x="${pl-8}" y="${Y(tgt)+6}" class="ax" text-anchor="end">${tgt}</text>`;
    rows.forEach((r,i)=>{const x=pl+i*bw+bw*.2,w=bw*.6,v=r.t[key];
      if(r.n){const bad=overBad?v>tgt*1.05:v<tgt*0.9;s+=`<rect x="${x}" y="${Y(v)}" width="${w}" height="${H-pb-Y(v)}" fill="${bad&&overBad?'var(--cardio)':color}" fill-opacity="${bad&&!overBad?.38:1}"/>`}
      else s+=`<rect x="${x}" y="${H-pb-2}" width="${w}" height="2" fill="var(--line)"/>`;
      if(i%2===1||i===13){const d=parseYmd(r.ds);s+=`<text x="${x+w/2}" y="${H-6}" class="ax" text-anchor="middle">${i===13?'Today':d.getDate()}</text>`}});
    return `<p class="k fuel-k">${label} <span class="cue">target ${tgt} ${unit}${overBad?' · orange = over':' · faded = under 90%'}</span></p>${s}</svg>`};
  const avg=k=>logged.length?Math.round(logged.reduce((a,r)=>a+r.t[k],0)/logged.length):null;
  const onK=logged.filter(r=>r.t.kcal<=T.kcal*1.05).length,onP=logged.filter(r=>r.t.p>=T.p*0.9).length;
  el.innerHTML=`<div class="chart-head"><span class="k">Calories &amp; protein · last 14 days</span><span class="cue">${logged.length} of 14 days logged</span></div>
   ${logged.length?chart('kcal',T.kcal,'var(--cyan)','Calories','kcal',true)+chart('p',T.p,'var(--ok)','Protein','g',false)
     +`<div class="statgrid three"><div class="stat"><span class="k">Avg kcal</span><div class="v">${avg('kcal').toLocaleString('en-IN')}</div><span class="cue">${onK} days on target</span></div><div class="stat"><span class="k">Avg protein</span><div class="v">${avg('p')} g</div><span class="cue">${onP} days ≥ 90%</span></div><div class="stat"><span class="k">Target</span><div class="v">${T.kcal.toLocaleString('en-IN')}</div><span class="cue">${T.p} g protein</span></div></div>`
     :'<p class="cue empty">Log meals in Food to see calories and protein against your targets.</p>'}`;
}

/* ---------- progress photos (IndexedDB, this phone only) ---------- */
const PDB={p:null,
  open(){if(!this.p)this.p=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('no idb'));const r=indexedDB.open('arete-photos',1);
    r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return this.p},
  async run(mode,fn){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('photos',mode),rq=fn(t.objectStore('photos'));t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  all(){return this.run('readonly',s=>s.getAll())},put(o){return this.run('readwrite',s=>s.put(o))},del(id){return this.run('readwrite',s=>s.delete(id))}};
let phURLs=[],phPose=S.get('phPose','front'),phCmp={a:null,b:null,pos:50},phDel=null;
const POSES=[['front','Front'],['side','Side'],['back','Back']];
async function compressImg(file){
  const url=URL.createObjectURL(file);
  try{const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('bad image'));i.src=url});
    const s=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.82));return {blob,w:c.width,h:c.height}}
  finally{URL.revokeObjectURL(url)}
}
function bodyNear(ds){const l=latestLog();let best=null;l.forEach(r=>{if(!r.wt&&!r.waist)return;const d=Math.abs(parseYmd(r.date)-parseYmd(ds));if(d<=4*864e5&&(!best||d<best.d))best={...r,d}});return best}
async function renderPhotos(){
  const el=$('photos'),cmp=$('ph-cmp');
  let list=[];try{list=(await PDB.all()).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.at-b.at)}catch(e){el.innerHTML='<h3 class="sub">Progress photos</h3><p class="cue">Photos need browser storage, which is blocked here. Check that the site isn\'t in private mode.</p>';cmp.hidden=true;return}
  phURLs.forEach(u=>URL.revokeObjectURL(u));phURLs=[];const url=o=>{const u=URL.createObjectURL(o.blob);phURLs.push(u);return u};
  const fmtD=d=>{const x=parseYmd(d);return `${x.getDate()} ${x.toLocaleString('en-IN',{month:'short'})} ${String(x.getFullYear()).slice(2)}`};
  el.innerHTML=`<div class="wh"><h3 class="sub">Progress photos</h3><span class="cue">${list.length} saved</span></div>
   <p class="ph-priv"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg><span>Stored only on this phone. Never uploaded, not in the backup file. Uninstalling the app deletes them, so use <b>Save copy</b> for any you want to keep.</span></p>
   <p class="k">Pose</p><div class="seg" role="group" aria-label="Pose">${POSES.map(([k,l])=>`<button type="button" data-pp="${k}" aria-pressed="${k===phPose}">${l}</button>`).join('')}</div>
   <div class="ph-add"><label class="primary ph-btn">Take photo<input type="file" accept="image/*" capture="environment" data-phin hidden></label><label class="ghost ph-btn">Choose from gallery<input type="file" accept="image/*" data-phin hidden></label></div>
   <p class="cue" id="ph-msg" role="status">Same spot, same light, morning before food. Every 2 weeks is enough.</p>
   ${list.length?`<div class="ph-grid">${list.slice().reverse().map(o=>`<figure class="ph"><img src="${url(o)}" alt="${POSES.find(p=>p[0]===o.pose)?.[1]||''} photo, ${fmtD(o.date)}" loading="lazy">
     <figcaption><b>${fmtD(o.date)}</b><span>${POSES.find(p=>p[0]===o.pose)?.[1]||''}</span></figcaption>
     <div class="ph-act"><button type="button" class="ph-ic" data-phsave="${o.id}" aria-label="Save copy of ${fmtD(o.date)} photo"><svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></button><button type="button" class="ph-ic${phDel===o.id?' warn':''}" data-phdel="${o.id}" aria-label="${phDel===o.id?'Tap again to delete':'Delete'} ${fmtD(o.date)} photo">${phDel===o.id?'Delete?':'<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>'}</button></div></figure>`).join('')}</div>`
    :'<div class="empty-st"><p><b>No photos yet.</b></p><p class="cue">Take your first one today. In a few weeks the slider shows the change the mirror hides.</p></div>'}`;
  // compare
  if(list.length<2){cmp.hidden=true;return}cmp.hidden=false;
  if(!list.some(o=>o.id===phCmp.a))phCmp.a=list[0].id;if(!list.some(o=>o.id===phCmp.b))phCmp.b=list[list.length-1].id;
  const A=list.find(o=>o.id===phCmp.a),B=list.find(o=>o.id===phCmp.b),opt=sel=>list.map(o=>`<option value="${o.id}" ${o.id===sel?'selected':''}>${fmtD(o.date)} · ${POSES.find(p=>p[0]===o.pose)?.[1]||''}</option>`).join('');
  const ba=bodyNear(A.date),bb=bodyNear(B.date),dd=Math.round((parseYmd(B.date)-parseYmd(A.date))/864e5);
  const delta=(k,u)=>ba&&bb&&ba[k]&&bb[k]?`<span class="${bb[k]<=ba[k]?'okc':'warnc'}">${bb[k]-ba[k]>0?'+':''}${(bb[k]-ba[k]).toFixed(1)} ${u}</span>`:'';
  cmp.innerHTML=`<div class="wh"><h3 class="sub">Before / after</h3><span class="cue">${dd} days apart</span></div>
   <div class="ph-sel"><label>Before<select data-phc="a">${opt(A.id)}</select></label><label>After<select data-phc="b">${opt(B.id)}</select></label></div>
   <div class="cmp" id="cmp" style="--pos:${phCmp.pos}%"><img src="${url(A)}" alt="Before, ${fmtD(A.date)}"><img class="cmp-b" src="${url(B)}" alt="After, ${fmtD(B.date)}">
    <span class="cmp-l">Before · ${fmtD(A.date)}</span><span class="cmp-r">After · ${fmtD(B.date)}</span><i class="cmp-h" aria-hidden="true"></i>
    <input type="range" min="0" max="100" value="${phCmp.pos}" class="cmp-in" aria-label="Slide to compare before and after"></div>
   ${delta('wt','kg')||delta('waist','cm')?`<p class="cue cmp-d">Change: ${[delta('wt','kg'),delta('waist','cm')+(delta('waist','cm')?' waist':'')].filter(Boolean).join(' · ')}</p>`:''}`;
}
$('photos').addEventListener('change',async e=>{const inp=e.target.closest('[data-phin]');if(!inp||!inp.files||!inp.files[0])return;const f=inp.files[0];inp.value='';
  const msg=$('ph-msg');msg.textContent='Saving…';
  try{const {blob,w,h}=await compressImg(f);await PDB.put({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),date:todayStr(),pose:phPose,blob,w,h,at:Date.now()});
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(x){}
    buzz(20);toast('Photo saved on this phone');renderPhotos()}
  catch(err){msg.textContent='Could not save that photo. Try another one.'}});
$('photos').addEventListener('click',async e=>{
  const pp=e.target.closest('[data-pp]');if(pp){phPose=pp.dataset.pp;S.set('phPose',phPose);renderPhotos();return}
  const sv=e.target.closest('[data-phsave]');if(sv){const o=(await PDB.all()).find(x=>x.id===sv.dataset.phsave);if(o)download(o.blob,`arete-photo-${o.date}-${o.pose}.jpg`);return}
  const dl=e.target.closest('[data-phdel]');if(dl){if(phDel!==dl.dataset.phdel){phDel=dl.dataset.phdel;renderPhotos();return}await PDB.del(phDel);phDel=null;toast('Photo deleted');renderPhotos()}});
$('ph-cmp').addEventListener('change',e=>{const s=e.target.closest('[data-phc]');if(s){phCmp[s.dataset.phc]=s.value;renderPhotos()}});
$('ph-cmp').addEventListener('input',e=>{if(!e.target.classList.contains('cmp-in'))return;phCmp.pos=+e.target.value;$('cmp').style.setProperty('--pos',phCmp.pos+'%')});

/* =================================================================
   QUESTS & HABITS (v8.3) — weekly quests, custom habits, penalty quest,
   milestone badges / titles. Everything is computed from existing logs.
   New keys: hunter:habits, hunter:forgiven, hunter:badges, hunter:title.
   ================================================================= */
function weeklyQuests(mon){
  const days=[...Array(7)].map((_,i)=>ymd(addDays(parseYmd(mon),i))),today=todayStr(),past=days.filter(d=>d<=today),T=targets();
  const gates=past.filter(d=>getDay(d).workout).length,food=past.filter(d=>foodLog(d).length).length;
  const prot=past.filter(d=>{if(!foodLog(d).length)return false;return totals(d).p>=T.p*0.95}).length;
  const cardio=weekTotals(mon).cardio,weigh=S.get('log',[]).some(r=>r.date>=mon&&r.date<=days[6]&&r.wt&&r.waist);
  const mh=Math.round(days.reduce((a,d)=>a+mMin(d),0)/6)/10;
  return [
   {id:'gates',t:'Clear 5 Gates',v:gates,n:5,xp:150},
   {id:'food',t:'Log food on 5 days',v:food,n:5,xp:100},
   {id:'prot',t:`Hit ${T.p} g protein on 4 days`,v:prot,n:4,xp:100},
   {id:'cardio',t:'150 min cardio',v:cardio,n:150,u:'min',xp:100},
   {id:'weigh',t:'Weigh-in: weight + waist',v:weigh?1:0,n:1,xp:50},
   {id:'mission',t:'8 hours on the Mission',v:mh,n:8,u:'h',xp:100}
  ].map(q=>({...q,done:q.v>=q.n}));
}
function renderWeekly(){
  const mon=ymd(mondayOf(new Date())),q=weeklyQuests(mon),d=q.filter(x=>x.done).length,left=7-((new Date().getDay()+6)%7);
  $('weekly').innerHTML=`<div class="wh"><h3 class="sub">Weekly quests</h3><span class="qcount${d===q.length?' all':''}"><b>${d}</b>/${q.length}</span></div>
   <p class="cue">Tracked from your logs · resets Monday · ${left===1?'last day':left+' days left'}</p>
   <div class="wq">${q.map(x=>`<div class="wqr${x.done?' done':''}"><div class="wq-t"><span>${esc(x.t)}</span><b>${x.done?'✓':`${x.u==='h'?x.v.toFixed(1):x.v}${x.u?' '+x.u:''} / ${x.n}${x.u?' '+x.u:''}`}</b></div>
     <div class="mtrack"><i style="width:${Math.min(100,x.v/x.n*100)}%"></i></div><span class="wq-xp">+${x.xp} XP</span></div>`).join('')}</div>`;
}

/* ---------- penalty quest: 2 missed days in a row ---------- */
function penaltyState(){
  const t=new Date(),y1=ymd(addDays(t,-1)),y2=ymd(addDays(t,-2));
  const miss=ds=>posOf(parseYmd(ds)).days>=0&&dayScore(ds)<0.8&&!isFrozen(ds);
  if(!miss(y1)||!miss(y2))return null;
  const n=runBack(addDays(t,-3));return n?{days:[y2,y1],n}:null;
}
function renderPenalty(){
  const el=$('penalty'),ps=penaltyState();if(!ps){el.hidden=true;return}el.hidden=false;
  const r=getDay(todayStr()),pen=r.pen||{};
  el.innerHTML=`<div class="pen-h"><span class="pen-ic" aria-hidden="true">!</span><div><p class="k">Penalty quest · today only</p><b>You missed 2 days</b></div></div>
   <p>Complete both before midnight to restore your <b>${ps.n}-day streak</b>. Miss it and the streak resets.</p>
   <div class="quests">${[['walk','20-minute walk',prof.asthma?'Talk pace. Asthma-safe.':'Brisk, outdoors if you can'],['squat','50 bodyweight squats','Any number of sets']].map(([k,t,s])=>
     `<label class="q"><input type="checkbox" data-pen="${k}" ${pen[k]?'checked':''}><span>${t}<small>${s}</small></span></label>`).join('')}</div>`;
}
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset.pen)return;const ds=todayStr(),r=getDay(ds);r.pen=r.pen||{};r.pen[t.dataset.pen]=t.checked;setDay(ds,r);
  if(r.pen.walk&&r.pen.squat){const ps=penaltyState();if(ps){S.set('forgiven',[...new Set([...S.get('forgiven',[]),...ps.days])]);buzz([40,40,120]);
    if(window.HUD)HUD.levelUp('[ SYSTEM ]','RESTORED',`Penalty cleared. Your ${ps.n}-day streak is back.`)}}
  renderToday()});

/* ---------- custom habits (manage from Today) ---------- */
let habitForm=false,habitDays=[0,1,2,3,4,5,6];
function habitPanel(){
  const act=habits().filter(h=>!h.to||h.to>todayStr());
  return `<div class="hab">${habitForm?`<form class="hab-f" id="hab-f"><label class="gs-f"><span>New habit</span><input id="hab-t" maxlength="40" placeholder="e.g. 10 pages reading" autocomplete="off"></label>
     <div class="hab-days" role="group" aria-label="Days">${DN.map((n,i)=>`<button type="button" data-hd="${i}" aria-pressed="${habitDays.includes(i)}">${n[0]}</button>`).join('')}</div>
     <div class="t-actions left"><button type="submit" class="primary">Add habit</button><button type="button" class="ghost" data-hab="cancel">Cancel</button></div>
     ${act.length?`<p class="k" style="margin-top:12px">Your habits</p><ul class="hab-l">${act.map(h=>`<li><span>${esc(h.t)}<small>${!h.days||h.days.length===7?'Every day':h.days.map(i=>DN[i]).join(' ')}</small></span><button type="button" class="ghost small" data-hdel="${h.id}">Remove</button></li>`).join('')}</ul>`:''}
     <p class="cue">Each habit is a daily quest: +15 XP and it counts toward your streak. Removing a habit keeps its history.</p></form>`
   :`<button type="button" class="link" data-hab="open">+ Add or manage habits${act.length?` (${act.length})`:''}</button>`}</div>`;
}
document.addEventListener('click',e=>{
  const h=e.target.closest('[data-hab]');if(h){habitForm=h.dataset.hab==='open';renderToday();if(habitForm){const i=$('hab-t');if(i)i.focus()}return}
  const d=e.target.closest('[data-hd]');if(d){const i=+d.dataset.hd;habitDays=habitDays.includes(i)?habitDays.filter(x=>x!==i):[...habitDays,i].sort();d.setAttribute('aria-pressed',habitDays.includes(i));return}
  const x=e.target.closest('[data-hdel]');if(x){const ds=todayStr();let a=habits();const hb=a.find(y=>y.id===x.dataset.hdel);if(!hb)return;
    a=hb.from>=ds?a.filter(y=>y.id!==hb.id):a.map(y=>y.id===hb.id?{...y,to:ds}:y);S.set('habits',a);toast(`Removed "${hb.t}"`);renderToday()}});
document.addEventListener('submit',e=>{if(e.target.id!=='hab-f')return;e.preventDefault();const t=($('hab-t').value||'').trim();
  if(!t){$('hab-t').focus();return}if(!habitDays.length){toast('Pick at least one day');return}
  const a=habits();a.push({id:Date.now().toString(36),t,days:habitDays.length===7?null:habitDays.slice(),from:todayStr()});S.set('habits',a);
  habitDays=[0,1,2,3,4,5,6];habitForm=false;toast(`Habit added: ${t}`);buzz(15);renderToday()});

/* ---------- badges & titles ---------- */
function badgeMetrics(){return memo('badgeM',()=>{
  const days=allDays(),start=prof.start,today=todayStr(),T=targets();
  let gates=0,water=0;days.forEach(ds=>{const r=getDay(ds);if(r.workout)gates++;if((r.water||0)>=waterL()*1000)water++});
  let best=0,run=0;for(let d=mondayOf(parseYmd(start));ymd(d)<=today;d=addDays(d,1)){const ds=ymd(d);if(dayScore(ds)>=0.8){run++;best=Math.max(best,run)}else if(ds===today||isFrozen(ds))continue;else run=0}
  let prs=0,gain=0;histKeys().forEach(k=>{const h=hist(k);if(!h.length)return;const w=h.some(x=>x.sets.some(s=>s.kg>0))&&!h.some(x=>x.u==='s');
    let run=-1;h.forEach(x=>{const v=w?(x.e1||0):Math.max(...x.sets.map(s=>s.reps||0));if(v>run){if(run>0)prs++;run=v}});
    if(w){const first=Math.max(...h[0].sets.map(s=>s.kg||0)),top=Math.max(...h.flatMap(x=>x.sets.map(s=>s.kg||0)));gain=Math.max(gain,top-first)}});
  const l=latestLog(),wts=l.filter(r=>r.wt).map(r=>r.wt),ws=l.filter(r=>r.waist).map(r=>r.waist);
  let prot=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'food:')){const ds=k.slice((P+'food:').length);if(totals(ds).p>=T.p*0.95)prot++}}}catch(e){}
  return {gates,water,best,prs,gain,prot,kg:wts.length>1?wts[0]-Math.min(...wts.slice(1)):0,waist:ws.length>1?ws[0]-Math.min(...ws.slice(1)):0,rank:RANKS.indexOf(earnedRank()),lv:Math.floor(xpTotal()/1000)+1}})}
const BADGES=[
 ['gate1','Initiate','Clear your first Gate',m=>[m.gates,1]],
 ['gate10','Gatebreaker','Clear 10 Gates',m=>[m.gates,10]],
 ['gate50','Veteran','Clear 50 Gates',m=>[m.gates,50]],
 ['streak3','Kindled','3-day streak',m=>[m.best,3]],
 ['streak7','Unbroken','7-day streak',m=>[m.best,7]],
 ['streak30','Relentless','30-day streak',m=>[m.best,30]],
 ['pr1','Record Breaker','Break your first personal record',m=>[m.prs,1]],
 ['plus10','Iron Climber','+10 kg on any lift since your first session',m=>[Math.floor(m.gain),10]],
 ['kg5','Lighter','Lose 5 kg from your first weigh-in',m=>[Math.round(m.kg*10)/10,5]],
 ['waist5','Tapered','Waist −5 cm from your first measurement',m=>[Math.round(m.waist*10)/10,5]],
 ['prot7','Brick by Brick','Hit your protein target on 7 days',m=>[m.prot,7]],
 ['water30','Wellspring','Hit your water goal on 30 days',m=>[m.water,30]],
 ['rankD','Forged','Pass the D-Rank test',m=>[m.rank,1]],
 ['lv10','Ascendant','Reach level 10',m=>[m.lv,10]]];
const BADGE_SVG=(on)=>`<svg viewBox="0 0 48 52" aria-hidden="true"><polygon points="24,2 46,14 46,38 24,50 2,38 2,14" fill="${on?'url(#bd-g)':'#121a30'}" stroke="${on?'#FFE29A':'#26324f'}" stroke-width="2"/>${on?'<path d="M15 26l6 6 12-13" fill="none" stroke="#1a1200" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>':'<rect x="17" y="24" width="14" height="11" rx="2" fill="#26324f"/><path d="M19.5 24v-3a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#26324f" stroke-width="2.5"/>'}</svg>`;
function checkBadges(){
  const m=badgeMetrics(),had=S.get('badges',null),got=had?{...had}:{},fresh=[];
  BADGES.forEach(([id,n])=>{const [v,t]=BADGES.find(b=>b[0]===id)[3](m);if(v>=t&&!got[id]){got[id]=todayStr();fresh.push(n)}});
  if(!fresh.length&&had)return;S.set('badges',got);if(!fresh.length||!window.HUD)return;
  if(!had)HUD.levelUp('[ SYSTEM ]',fresh.length>1?'TITLES':'TITLE',`${fresh.length} unlocked from your history: ${fresh.join(', ')}. Equip one in Stats.`);
  else fresh.forEach(n=>HUD.levelUp('[ TITLE UNLOCKED ]',n.toUpperCase(),'Equip it in Stats → Status to show it on your status window.'));
}
function renderBadges(){
  const el=$('badges');if(!el)return;const m=badgeMetrics(),got=S.get('badges',{}),eq=S.get('title',null),n=Object.keys(got).length;
  el.innerHTML=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="bd-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset="1" stop-color="#FFC857"/></linearGradient></defs></svg>
   <div class="wh"><h3 class="sub">Titles</h3><span class="cue">${n} / ${BADGES.length} unlocked</span></div>
   <p class="cue">Unlock titles with real milestones. Tap an unlocked one to wear it on your status window.</p>
   <div class="bdg">${BADGES.map(([id,name,desc,f])=>{const on=!!got[id],[v,t]=f(m),pct=Math.max(0,Math.min(100,v/t*100));
     return `<button type="button" class="bd${on?' on':''}${eq===id?' eq':''}" data-badge="${id}" ${on?'':'aria-disabled="true"'} aria-label="${esc(name)}: ${esc(desc)}${on?`, unlocked ${got[id]}${eq===id?', worn':''}`:`, ${Math.round(pct)}%`}">
       <span class="bd-i">${BADGE_SVG(on)}</span><b>${esc(name)}</b><small>${esc(desc)}</small>
       ${on?`<em>${eq===id?'Worn':'Unlocked'}</em>`:`<span class="mtrack"><i style="width:${pct}%"></i></span>`}</button>`}).join('')}</div>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-badge]');if(!b||b.getAttribute('aria-disabled'))return;const id=b.dataset.badge;
  S.set('title',S.get('title',null)===id?null:id);const nm=BADGES.find(x=>x[0]===id)[1];toast(S.get('title',null)?`Title worn: ${nm}`:'Title removed');buzz(10);renderBadges();header()});
function titleName(){const id=S.get('title',null);if(!id||!S.get('badges',{})[id])return null;const b=BADGES.find(x=>x[0]===id);return b?b[1]:null}

/* =================================================================
   GOAL + LAZY FOOD DATABASE
   ================================================================= */
const GOALS={cut:'Fat loss',strength:'Strength',both:'Recomp'};
// js/foods_indb.js (1,014 INDB recipes, 108 KB) loads after first paint, or as soon as Food needs it.
let indbP=null;
function loadINDB(){
  if(window.FOODS_INDB)return Promise.resolve();if(indbP)return indbP;
  indbP=new Promise(res=>{const s=document.createElement('script');s.src='js/foods_indb.js';
    s.onload=()=>{window.addFoods(window.FOODS_INDB);SV++;res();const v=S.get('view','today');if(v==='food')renderFood();else if(v==='today')renderToday()};
    s.onerror=()=>{indbP=null;res()};document.head.appendChild(s)});
  return indbP;
}

/* =================================================================
   SYSTEM AWAKENING — first-launch onboarding
   Shown once for a new install (or after Start fresh). Existing users with
   logs skip it. Saves into the same profile object Settings uses.
   ================================================================= */
const AW_SIGIL=`<svg viewBox="0 0 100 100" class="aw-sig" aria-hidden="true"><polygon class="aw-hex" pathLength="100" points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" fill="none" stroke="url(#ag-e)" stroke-width="3"/><polygon class="aw-hex2" points="50,16 79,33 79,67 50,84 21,67 21,33" fill="none" stroke="#4FD8FF" stroke-width=".8" stroke-dasharray="2 4"/><g class="aw-a"><path d="M50 22L71 75H61L50 47L39 75H29Z" fill="url(#ag-a)"/><path d="M44.9 60H55.1L57.5 66H42.5Z" fill="url(#ag-a)"/></g></svg>`;
function needsAwakening(){
  if(S.get('onboarded',false))return false;
  if(allDays().length||S.get('log',[]).length||S.get('tests',[]).length){S.set('onboarded',true);return false}
  return true;
}
function showAwakening(){
  let o=$('awaken');if(o)o.remove();
  o=document.createElement('div');o.id='awaken';o.className='awaken';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','System awakening');
  document.body.appendChild(o);document.body.classList.add('locked');
  let step=0;const N=6;
  const dots=()=>`<div class="aw-dots" aria-hidden="true">${[...Array(N)].map((_,i)=>`<i class="${i<step?'ok':i===step?'on':''}"></i>`).join('')}</div>`;
  const opt=(name,val,cur,title,sub)=>`<label class="aw-opt"><input type="radio" name="${name}" value="${val}" ${String(cur)===String(val)?'checked':''}><span><b>${title}</b>${sub?`<small>${sub}</small>`:''}</span></label>`;
  const nav=(next,back=true)=>`<div class="aw-nav">${back?'<button type="button" class="ghost" data-aw="back">Back</button>':''}<button type="button" class="primary big" data-aw="next">${next}</button></div>`;
  function render(){
    let h='';
    if(step===0)h=`<div class="aw-intro">${AW_SIGIL}<div class="aw-scan" aria-hidden="true"></div>
      <p class="aw-sys">[ SYSTEM ]</p><h1 class="aw-big">SYSTEM<br>AWAKENED</h1>
      <p class="aw-lead">Your real-life level starts today. Answer five quick questions and the System builds your plan: training, food, water and quests.</p>
      <button type="button" class="primary big" data-aw="next">Begin awakening</button><p class="cue">About one minute. Everything stays on this phone.</p></div>`;
    if(step===1)h=`${dots()}<p class="aw-sys">Identify</p><h2 class="aw-q">What should the System call you?</h2>
      <label class="aw-field">Name<input id="aw-name" maxlength="24" autocomplete="given-name" placeholder="Your name" value="${esc(prof.name||'')}"></label>${nav('Next',false)}`;
    if(step===2)h=`${dots()}<p class="aw-sys">Scan body</p><h2 class="aw-q">Your measurements</h2>
      <div class="aw-grid"><label class="aw-field">Height (cm)<input id="aw-ht" type="number" inputmode="numeric" min="120" max="220" value="${prof.ht||''}"></label>
      <label class="aw-field">Weight (kg)<input id="aw-wt" type="number" inputmode="decimal" step="0.1" min="35" max="200" value="${prof.wt||''}"></label>
      <label class="aw-field">Age<input id="aw-age" type="number" inputmode="numeric" min="15" max="90" value="${prof.age||''}"></label></div>
      <p class="cue">Used for your calorie, protein and water targets.</p><p class="cue warnc" id="aw-err" role="status"></p>${nav('Next')}`;
    if(step===3)h=`${dots()}<p class="aw-sys">Choose a path</p><h2 class="aw-q">What is your main goal?</h2>
      <div class="aw-opts">${opt('goal','cut',prof.goal||'cut','Lose fat, get sharp cuts','Belly first, then visible abs at about 8–10% body fat')}${opt('goal','strength',prof.goal,'Get stronger','Bigger numbers on every lift')}${opt('goal','both',prof.goal,'Both','Lose fat while building muscle')}</div>${nav('Next')}`;
    if(step===4)h=`${dots()}<p class="aw-sys">Daily rhythm</p><h2 class="aw-q">When do you train, and what do you eat?</h2>
      <p class="k">Gym time</p><div class="aw-opts two">${opt('gym','morning',prof.gym,'Morning','6:45 am')}${opt('gym','evening',prof.gym,'Evening','5:30 pm')}</div>
      <p class="k" style="margin-top:16px">Diet</p><div class="aw-opts">${opt('diet',0,prof.diet,'Pure veg','')}${opt('diet',1,prof.diet,'Veg + egg','')}${opt('diet',2,prof.diet,'Non-veg','')}</div>${nav('Next')}`;
    if(step===5)h=`${dots()}<p class="aw-sys">Safety</p><h2 class="aw-q">Breathing and health</h2>
      <label class="aw-tog"><input type="checkbox" id="aw-asthma" ${prof.asthma?'checked':''}><span><b>Asthma mode</b><small>Daily green / yellow / red breathing check, longer warm-ups, safer cues.</small></span></label>
      <label class="aw-tog"><input type="checkbox" id="aw-hold" ${prof.medHold?'checked':''}><span><b>Waiting for a doctor's review</b><small>Swaps sprints, jumps and hard runs for steady cardio until you're cleared.</small></span></label>
      <p class="cue">Change these any time in Settings.</p>${nav('Finish')}`;
    if(step===6){const T=targets();h=`<div class="aw-done"><div class="rank xl aw-rank"><span>E</span></div><p class="aw-sys">Awakening complete</p>
      <h1 class="aw-big sm">${esc(prof.name||'Hunter')}<br><span>E-Rank Hunter</span></h1>
      <div class="aw-stats"><div><b>${T.kcal.toLocaleString('en-IN')}</b><span>kcal / day</span></div><div><b>${T.p} g</b><span>protein</span></div><div><b>${waterL().toFixed(1)} L</b><span>water</span></div></div>
      <p class="aw-lead">One muscle a day, abs every gym day, legs on Saturday. Clear today's Gate and your daily quests to level up.</p>
      <button type="button" class="primary big" data-aw="enter">Enter</button></div>`}
    o.innerHTML=`<div class="aw-card" data-step="${step}">${h}</div>`;
    const f=o.querySelector('input:not([type=radio]):not([type=checkbox]),button.primary');if(f&&step>0)setTimeout(()=>f.focus(),50);
  }
  function save(){
    const v=id=>{const x=parseFloat(($(id)||{}).value);return isNaN(x)?null:x};
    if(step===1){const n=($('aw-name').value||'').trim();if(n)prof.name=n}
    if(step===2){const ht=v('aw-ht'),wt=v('aw-wt'),age=v('aw-age');
      if(!(ht>=120&&ht<=220)||!(wt>=35&&wt<=200)||!(age>=15&&age<=90)){$('aw-err').textContent='Check the numbers: height 120–220 cm, weight 35–200 kg, age 15–90.';return false}
      prof.ht=Math.round(ht);prof.wt=Math.round(wt*10)/10;prof.age=Math.round(age)}
    const r=n=>{const x=o.querySelector(`input[name=${n}]:checked`);return x?x.value:null};
    if(step===3)prof.goal=r('goal')||'cut';
    if(step===4){prof.gym=r('gym')||prof.gym;const d=r('diet');if(d!=null)prof.diet=+d}
    if(step===5){prof.asthma=$('aw-asthma').checked;prof.medHold=$('aw-hold').checked}
    saveProf();SV++;return true;
  }
  o.addEventListener('click',e=>{const b=e.target.closest('[data-aw]');if(!b)return;const a=b.dataset.aw;
    if(a==='back'){step=Math.max(0,step-1);render();return}
    if(a==='next'){if(step>0&&save()===false)return;step++;render();buzz(10);if(step===6)buzz([30,40,90]);return}
    if(a==='enter'){S.set('onboarded',true);o.classList.add('out');document.body.classList.remove('locked');setTimeout(()=>o.remove(),350);fillSettings();refresh()}});
  o.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();const b=o.querySelector('[data-aw=next]');if(b)b.click()}});
  render();
}

/* =================================================================
   NAV + BOOT
   ================================================================= */
const VIEWS=['today','plan','food','mission','mind','wealth','status','timer','settings'];
function showView(v){VIEWS.forEach(x=>{$('v-'+x).hidden=x!==v;const tb=$('tab-'+x);if(tb)tb.setAttribute('aria-current',x===v||(v==='timer'&&x==='plan')?'page':'false')});S.set('view',v);window.scrollTo(0,0);
  if(v==='today')renderToday();if(v==='plan')renderPlan();if(v==='food'){foodDate=todayStr();foodMeal=mealNow();renderFood();loadINDB()}if(v==='settings')loadINDB();if(v==='mind')renderMind();if(v==='wealth')renderWealth();if(v==='mission')renderMission();if(v==='plan')renderBodyCards();if(v==='status')renderStatus();}
VIEWS.forEach(v=>{const tb=$('tab-'+v);if(tb)tb.addEventListener('click',()=>showView(v))});
$('btn-settings').onclick=()=>showView('settings');$('adv-mind').onclick=()=>showView('mind');$('adv-wealth').onclick=()=>showView('wealth');
$('s-t38').value=targetDate();$('s-t38').onchange=()=>{if($('s-t38').value){S.set('target38',$('s-t38').value);toast('Target date saved')}};$('open-timer').onclick=()=>showView('timer');
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>showView(b.dataset.back));
function refresh(){header();const v=S.get('view','today');if(v==='today')renderToday();if(v==='plan')renderPlan();if(v==='food')renderFood();if(v==='mind')renderMind();if(v==='wealth')renderWealth();if(v==='mission')renderMission();if(v==='status')renderStatus()}

let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').hidden=false});
$('install').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('install').hidden=true};
/* ---------- splash: CSS plays it (under 1.2 s); remove it afterwards ---------- */
setTimeout(()=>{const s=$('splash');if(s)s.remove()},1200);

/* ---------- service worker + "new version" banner ---------- */
function updateBanner(sw){
  let b=$('upd');if(!b){b=document.createElement('button');b.type='button';b.id='upd';b.className='updbar';b.innerHTML='<b>New version available</b><span>Tap to update</span>';document.body.appendChild(b)}
  b.hidden=false;b.onclick=()=>{b.disabled=true;b.querySelector('span').textContent='Updating…';sw.postMessage({type:'SKIP_WAITING'})};
}
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>{
  const hadCtrl=!!navigator.serviceWorker.controller;let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadCtrl||reloading)return;reloading=true;location.reload()});
  navigator.serviceWorker.register('sw.js').then(reg=>{
    const watch=sw=>{if(!sw)return;sw.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller)updateBanner(sw)})};
    if(reg.waiting&&navigator.serviceWorker.controller)updateBanner(reg.waiting);
    reg.addEventListener('updatefound',()=>watch(reg.installing));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{})});
  }).catch(()=>{});
});

/* ---------- one-time import from E-Rank Quest (v1) ---------- */
(function importV1(){
  if(S.get('migratedV1',false))return;
  const V={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('erank:'))V[k.slice(6)]=localStorage.getItem(k)}}catch(e){return}
  if(!Object.keys(V).length)return;
  const J=k=>{try{return JSON.parse(V[k])}catch(e){return null}};
  let days=0;
  const st=J('start');
  if(st&&/^\d{4}-\d{2}-\d{2}$/.test(st)&&(allDays().length===0||st<prof.start)){prof.start=st;saveProf()}
  const w0=parseFloat(J('wt'));if(w0>=35&&w0<=200&&!S.get('log',[]).length){prof.wt=w0;saveProf()}
  const base=mondayOf(parseYmd(st||prof.start));
  const touched={};
  Object.keys(V).forEach(k=>{const m=/^q:(\d+):(\d+):(\w+)$/.exec(k);if(!m||J(k)!==true)return;
    const ds=ymd(addDays(base,(+m[1]-1)*7+ +m[2]));if(ds>todayStr())return;const r=getDay(ds),id=m[3];
    if(id==='work')r.workout=r.workout||{t:'Imported from E-Rank Quest',imported:true};
    else if(id==='water')r.water=Math.max(r.water,Math.round(waterL()*1000));
    else r.q[id]=true;
    setDay(ds,r);touched[ds]=1});
  days=Object.keys(touched).length;
  const oldLog=J('log')||[];if(oldLog.length){const cur=S.get('log',[]);oldLog.forEach(r=>{if(r&&r.date&&!cur.some(c=>c.date===r.date))cur.push(r)});S.set('log',cur)}
  const tb=J('test:base');if(tb&&Object.keys(tb).length){const d0=ymd(base);const ck=S.get('checks',[]);if(!ck.some(c=>c.date===d0)){ck.push({date:d0,push:tb.push??null,plank:tb.plank??null,run2k:tb.walk??null});S.set('checks',ck)}
    if(tb.waist||tb.wt){const cur=S.get('log',[]);if(!cur.some(c=>c.date===d0)){cur.push({date:d0,wt:tb.wt??null,waist:tb.waist??null});S.set('log',cur)}}}
  S.set('migratedV1',true);
  if(days||oldLog.length||tb)setTimeout(()=>toast(`Imported ${days} day${days===1?'':'s'} from E-Rank Quest`),600);
})();

const p0=posOf(new Date());selW=p0.w;selD=p0.d;
const qv=new URLSearchParams(location.search).get('view');
fillSettings();drawTimer();showView(VIEWS.includes(qv)?qv:S.get('view','today'));header();
if(needsAwakening())showAwakening();
setInterval(()=>{checkReminders();if(!document.hidden&&S.get('view','today')==='today')renderToday()},60000);
checkReminders();
setTimeout(()=>loadINDB(),2500);
})();
