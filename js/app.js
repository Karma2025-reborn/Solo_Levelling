/* Hunter System — app logic: today, plan, tracking, status, timer, settings, reminders. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- storage ---------- */
const P='hunter:';
const S={get(k,d){try{const v=localStorage.getItem(P+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
         set(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}},
         del(k){try{localStorage.removeItem(P+k)}catch(e){}}};

/* ---------- dates ---------- */
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseYmd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
const DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],DFULL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const RANKS=['E','D','C','B','A','S'];

/* ---------- profile ---------- */
const DEF={wt:72,ht:170,start:ymd(mondayOf(new Date())),diet:1,gym:'morning',supps:true};
let prof=Object.assign({},DEF,S.get('profile',{}));
if(!S.get('profile',null))S.set('profile',prof);
const saveProf=()=>S.set('profile',prof);
const protein=()=>Math.round(prof.wt*1.6);
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
  if(!sess.rest)q.push({id:'work',t:`Complete: ${sess.t}`,s:'Finish the workout in Plan',auto:true,done:!!rec.workout});
  q.push({id:'water',t:`Drink ${waterL().toFixed(1)} L water`,s:`${(rec.water/1000).toFixed(2)} L so far`,auto:true,done:rec.water>=waterL()*1000});
  q.push({id:'meals',t:`Eat ${meals.length} planned meals`,s:`${mealsDone} of ${meals.length} ticked in the timeline`,auto:true,done:mealsDone>=meals.length-1});
  const ft=(typeof totals==='function')?totals(ds):{n:0,p:0};
  if(ft.n)q.push({id:'prot',t:`Hit ${protein()} g protein`,s:`${Math.round(ft.p)} g logged in Food`,auto:true,done:ft.p>=protein()*0.95});
  else q.push({id:'prot',t:`Hit ${protein()} g protein`,s:'Log meals in Food to track this automatically',done:!!rec.q.prot});
  q.push({id:'steps',t:`Walk ${Plan.stepsFor(p.w).toLocaleString('en-IN')} steps`,s:'Check your phone\'s step counter',done:!!rec.q.steps});
  q.push({id:'clean',t:'No sugar, no fried food',s:'No chai sugar, samosa, biscuits, cold drinks',done:!!rec.q.clean});
  q.push({id:'sleep',t:'Sleep by 10:30 pm',s:'Tick tomorrow morning if you made it',done:!!rec.q.sleep});
  return q;
}
function dayScore(ds){const q=questsFor(ds);return q.filter(x=>x.done).length/q.length}
function hasData(ds){return localStorage.getItem(P+dayKey(ds))!==null}

/* ---------- XP / level / streak ---------- */
function allDays(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'day:'))out.push(k.slice((P+'day:').length))}}catch(e){}return out.sort()}
function xpTotal(){let xp=0;for(const ds of allDays()){const q=questsFor(ds);xp+=q.filter(x=>x.done).length*15;if(getDay(ds).workout)xp+=50;try{xp+=mindQuests(ds).filter(x=>x.done).length*10+wealthQuests(ds).filter(x=>x.done).length*10}catch(e){}}
  xp+=S.get('tests',[]).filter(t=>t.passed).length*500;return xp}
function streak(){let n=0,d=new Date();if(dayScore(ymd(d))<0.8)d=addDays(d,-1);while(dayScore(ymd(d))>=0.8&&n<1000){n++;d=addDays(d,-1)}return n}

/* ---------- workout log ---------- */
const wlKey=(ds,k)=>`wl:${ds}:${k}`;
function hist(k){return S.get('hist:'+k,[])}
function saveHist(k,ds,sets){
  const h=hist(k).filter(x=>x.date!==ds);
  const valid=sets.filter(s=>s.reps>0);
  if(valid.length){const e1=Math.max(...valid.map(s=>(s.kg||0)*(1+s.reps/30)));h.push({date:ds,sets:valid,e1:Math.round(e1*10)/10})}
  h.sort((a,b)=>a.date<b.date?-1:1);S.set('hist:'+k,h);
}
function lastBefore(k,ds){const h=hist(k).filter(x=>x.date<ds);return h[h.length-1]}
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
  $('xpbar').style.width=((xp%1000)/10)+'%';
  $('xptext').textContent=`${xp.toLocaleString('en-IN')} XP · ${1000-xp%1000} XP to level ${lv+1} · ${streak()}-day streak`;
}

/* =================================================================
   TODAY
   ================================================================= */
function renderToday(){
  const now=new Date(),ds=ymd(now),p=posOf(now),sess=Plan.program(p.w,p.d),rec=getDay(ds),st=Plan.stageOf(p.w);
  $('today-date').textContent=`[ System ] · ${DFULL[p.d]}, ${now.getDate()} ${now.toLocaleString('en-IN',{month:'short'})} · Week ${p.w}`;
  const tl=Diet.timeline(prof.gym,p.d,prof.diet,!!sess.rest,waterL(),prof.supps);
  // next up
  const hm=now.getHours()*60+now.getMinutes();
  const nxt=tl.find(t=>{const [h,m]=t.time.split(':').map(Number);return h*60+m>=hm&&!rec.tl[t.id]})||null;
  $('nextup').innerHTML=nxt?`<span class="k">Next up · ${nxt.time}</span><b>${esc(nxt.title)}</b><span class="cue">${esc(nxt.detail)}${nxt.ml?` · ${nxt.ml} ml water`:''}</span>`
    :`<span class="k">Today</span><b>${dayScore(ds)>=0.8?'Daily quest complete':'Wind down and sleep'}</b><span class="cue">Lights out by 10:30 pm.</span>`;
  // water
  const goal=waterL()*1000;$('water-now').textContent=(rec.water/1000).toFixed(2);$('water-goal').textContent=` / ${waterL().toFixed(1)} L`;
  $('water-fill').style.height=Math.min(100,rec.water/goal*100)+'%';
  // quests
  $('quests').innerHTML=questsFor(ds).map(q=>`<label class="q${q.auto?' auto':''}"><input type="checkbox" data-quest="${q.id}" ${q.done?'checked':''} ${q.auto?'disabled':''}><span>${esc(q.t)}<small>${esc(q.s)}${q.auto?' · ticks itself':''}</small></span></label>`).join('');
  // workout card
  const total=sess.blocks.reduce((a,b)=>a+b.min,0);
  $('today-workout').innerHTML=sess.rest?`<h3 class="sub">Workout</h3><b class="big-t">Rest day</b><p class="cue">Recovery is when muscle is built. Easy walk for your steps, eat your protein, sleep early.</p>`
    :`<h3 class="sub">Today's workout</h3><div class="tw"><div><b class="big-t">${esc(sess.t)}</b><span class="cue">${total} min · ${st.name}${sess.note?' · '+esc(sess.note):''}</span></div>
      ${rec.workout?'<span class="pill ok">Done</span>':`<button type="button" class="primary" id="go-workout">Start workout</button>`}</div>
      <div class="bar">${sess.blocks.map(b=>`<i style="flex:${b.min};background:${COL[b.kind]}"></i>`).join('')}</div>`;
  const gw=$('go-workout');if(gw)gw.onclick=()=>{selW=p.w;selD=p.d;showView('plan')};
  // timeline
  $('tl-note').textContent=prof.gym==='morning'?'Morning gym schedule':'Evening gym schedule';
  $('timeline').innerHTML=tl.map(t=>{const done=!!rec.tl[t.id];const [h,m]=t.time.split(':').map(Number);const past=h*60+m<hm;
    return `<li class="tl t-${t.type}${done?' done':''}${!done&&past?' late':''}"><label><input type="checkbox" data-tl="${t.id}" data-ml="${t.ml}" ${done?'checked':''}>
      <time>${t.time}</time><span class="tl-b"><b>${esc(t.title)}</b>${t.detail?`<span>${esc(t.detail)}</span>`:''}${t.note?`<small>${esc(t.note)}</small>`:''}</span>${t.ml?`<em>${t.ml} ml</em>`:''}</label></li>`}).join('');
  $('diet-rules').innerHTML=`<h3 class="sub">${st.rank}-Rank diet rules</h3><ul class="plain">${Diet.rulesFor(st.rank,p.w).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
   <p class="cue">Portions: 1 phulka is palm-sized without ghee. 1 cup cooked rice is a fist. 1 bowl dal is about 200 ml. 2–3 tsp oil per person per day in total.</p>`;
  renderMiniDash();
  renderSystems();
  header();
}
document.addEventListener('change',e=>{
  const t=e.target,ds=todayStr();
  if(t.dataset.quest){const r=getDay(ds);r.q[t.dataset.quest]=t.checked;setDay(ds,r);renderToday()}
  if(t.dataset.tl){const r=getDay(ds);r.tl[t.dataset.tl]=t.checked;const ml=+t.dataset.ml||0;if(ml)r.water=Math.max(0,r.water+(t.checked?ml:-ml));setDay(ds,r);renderToday()}
});
document.querySelectorAll('[data-water]').forEach(b=>b.addEventListener('click',()=>{const ds=todayStr(),r=getDay(ds);r.water=Math.max(0,r.water+ +b.dataset.water);setDay(ds,r);renderToday()}));

/* =================================================================
   PLAN
   ================================================================= */
let selW=1,selD=0;
function stageList(){return [...Plan.STAGES,{rank:'S',start:73,end:76,name:'S-Rank · Shadow Monarch',goal:'Maintain. Repeat the A-Rank cycle with your new numbers.'}]}
function renderPlan(){
  const st=Plan.stageOf(selW),stages=stageList(),cur=posOf(new Date()).w;
  $('ranks').innerHTML=stages.map(s=>`<button type="button" data-st="${s.start}" aria-pressed="${s.rank===st.rank}"><b>${s.rank}</b><span>W${s.start}${s.rank==='S'?'+':'–'+s.end}</span></button>`).join('');
  $('stage-goal').innerHTML=`<b>${esc(st.name)}</b> · ${esc(st.goal)}${st.rank==='E'?` · <span class="tag" style="--c:var(--cyan)">${Plan.EPHASES[Plan.ePhase(selW)]}</span>`:''}`;
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
  if(sess.test)h+=`<p class="note">Rank assessment. Enter your results in Status → Rank test.</p>`;
  if(total)h+=`<div class="bar">${sess.blocks.map(b=>`<i style="flex:${b.min};background:${COL[b.kind]}"></i>`).join('')}</div><div class="legend">${sess.blocks.map(b=>`<span style="--c:${COL[b.kind]}">${esc(b.label)} ${b.min} min</span>`).join('')}</div>`;
  if(!isToday&&!sess.rest)h+=`<p class="cue" style="margin-top:10px">Sets you log here are saved to today's date.</p>`;
  h+='</section>';
  const root=$('day');root.innerHTML=h;
  if(sess.rest){root.insertAdjacentHTML('beforeend','<section class="win rest"><b>Recovery</b><p class="cue">Muscles grow on rest days. Easy walk for your steps, eat your protein, sleep early.</p></section>');return}
  let n=0;
  sess.blocks.forEach(bl=>{
    const sec=document.createElement('section');sec.className='block';sec.style.setProperty('--c',COL[bl.kind]);
    sec.innerHTML=`<div class="bhead"><h3>${esc(bl.label)}</h3><span class="min">${bl.min} min</span>${bl.how?`<span class="how">${esc(bl.how)}</span>`:''}</div>${bl.text?`<p class="btext">${esc(bl.text)}</p>`:''}`;
    if(bl.items){const g=document.createElement('div');g.className='grid';
      bl.items.forEach(([key,dose])=>{n++;const e=EX[key];if(!e)return;const c=document.createElement('article');c.className='card';
        const fg=document.createElement('button');fg.type='button';fg.className='fig';fg.setAttribute('aria-label','How to do '+e.n);fg.appendChild(Fig.svg(e.fig,HEX[bl.kind],e.n));fg.onclick=()=>openSheet(key);c.appendChild(fg);
        const ns=bl.kind==='strength'?setsIn(dose):0;
        const last=lastBefore(key,ds);
        c.insertAdjacentHTML('beforeend',`<div class="info"><div class="top"><span class="tag">${esc(e.m)}</span><span class="num">${String(n).padStart(2,'0')}</span></div>
          <h4>${esc(e.n)}</h4><div class="dose">${esc(dose)}</div>
          ${last?`<p class="cue last">Last: ${last.sets.map(s=>`${s.kg?s.kg+'×':''}${s.reps}`).join(', ')}</p>`:''}
          <div class="cardbtns"><button type="button" class="link" data-how="${key}">How to</button>${ns?`<button type="button" class="link" data-logt="${key}">Log sets</button>`:''}</div></div>`);
        if(ns)c.appendChild(logger(key,ns,ds,last));
        g.appendChild(c)});
      sec.appendChild(g)}
    root.appendChild(sec);
  });
  const done=!!getDay(ds).workout;
  root.insertAdjacentHTML('beforeend',`<section class="win finish"><button type="button" class="primary big" id="finish" ${done?'disabled':''}>${done?'Workout logged for today ✓':'Finish workout'}</button><p class="cue">Logs your sets, ticks today's workout quest and adds 50 XP.</p></section>`);
  $('finish').onclick=()=>{const r=getDay(ds);r.workout={w:selW,d:selD,t:sess.t,at:Date.now()};setDay(ds,r);toast('Workout complete. +50 XP');renderSession();header()};
}
function logger(key,ns,ds,last){
  const cur=S.get(wlKey(ds,key),[]);
  const box=document.createElement('div');box.className='logger';box.hidden=!cur.length;box.dataset.lg=key;
  let rows='';for(let i=0;i<ns;i++){const v=cur[i]||{},ph=last&&last.sets[i]?last.sets[i]:{};
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
  S.set(wlKey(ds,k),arr);saveHist(k,ds,arr.filter(Boolean).map(s=>({kg:s.kg||0,reps:s.reps||0})));
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
  renderTestForm();renderLog();renderLift();
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
function fillSettings(){$('s-age').value=prof.age||'';$('s-wt').value=prof.wt;$('s-ht').value=prof.ht;$('s-start').value=prof.start;$('s-diet').value=prof.diet;$('s-gym').value=prof.gym;$('s-supp').checked=!!prof.supps;renderGcal()}
$('s-wt').onchange=()=>{const v=parseFloat($('s-wt').value);if(v>=35&&v<=200){prof.wt=v;saveProf();refresh()}};
$('s-age').onchange=()=>{const v=parseInt($('s-age').value);if(v>=15&&v<=90){prof.age=v;saveProf();refresh()}};
$('s-ht').onchange=()=>{const v=parseFloat($('s-ht').value);if(v>=120&&v<=220){prof.ht=v;saveProf();refresh()}};
$('s-start').onchange=()=>{if($('s-start').value){prof.start=ymd(mondayOf(parseYmd($('s-start').value)));$('s-start').value=prof.start;saveProf();const p=posOf(new Date());selW=p.w;selD=p.d;refresh()}};
$('s-diet').onchange=()=>{prof.diet=+$('s-diet').value;saveProf();refresh()};
$('s-gym').onchange=()=>{prof.gym=$('s-gym').value;saveProf();renderGcal();refresh()};
$('s-supp').onchange=()=>{prof.supps=$('s-supp').checked;saveProf();renderGcal();refresh()};

/* ---------- reminders ---------- */
function reminderList(){
  const p=posOf(new Date());
  return Diet.timeline(prof.gym,0,prof.diet,false,waterL(),prof.supps).map(t=>({...t,
    title:t.type==='water'?`Water · ${t.ml} ml`:t.title,
    body:t.type==='meal'?'Check today\'s meal in the Hunter app':(t.detail||(t.ml?`Drink ${t.ml} ml`:''))}));
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
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Hunter System//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:Hunter System','BEGIN:VTIMEZONE','TZID:Asia/Kolkata','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0530','TZOFFSETTO:+0530','TZNAME:IST','END:STANDARD','END:VTIMEZONE'];
  reminderList().forEach((r,i)=>{const [h,m]=r.time.split(':');const dur=r.type==='gym'?'PT75M':'PT10M';
    L.push('BEGIN:VEVENT',`UID:hunter-${r.id}-${i}@hunter.app`,`DTSTAMP:${D(start)}T000000Z`,`DTSTART;TZID=Asia/Kolkata:${D(start)}T${h}${m}00`,`DURATION:${dur}`,
      r.type==='gym'||r.id==='pg'?'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA':'RRULE:FREQ=DAILY',`SUMMARY:${r.title.replace(/[,;]/g,' ')}`,`DESCRIPTION:${r.body.replace(/[,;]/g,' ')}`,
      'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${r.title.replace(/[,;]/g,' ')}`,'TRIGGER:PT0M','END:VALARM','END:VEVENT')});
  L.push('END:VCALENDAR');
  download(new Blob([L.join('\r\n')],{type:'text/calendar'}),'hunter-reminders.ics');
  $('notif-msg').textContent='Calendar file saved. Open it with your calendar app to import all reminders.';
};
$('notif').onclick=async()=>{
  if(!('Notification' in window)){$('notif-msg').textContent='This browser does not support notifications. Use the calendar options below.';return}
  const p=await Notification.requestPermission();
  $('notif-msg').textContent=p==='granted'?'Notifications on. They fire while the app is open or recently used.':'Notifications are blocked. Allow them in Chrome → Site settings, or use the calendar options.';
  if(p==='granted')notify('Hunter System','Reminders are on. Arise.');
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
$('export').onclick=()=>{download(new Blob([JSON.stringify({app:'hunter',v:2,saved:new Date().toISOString(),data:allData()})],{type:'application/json'}),`hunter-backup-${todayStr()}.json`);$('backup-msg').textContent='Backup saved to your Downloads.'};
$('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{const j=JSON.parse(await f.text());if(j.app!=='hunter'||!j.data)throw 0;Object.entries(j.data).forEach(([k,v])=>{if(k.startsWith(P))localStorage.setItem(k,v)});$('backup-msg').textContent='Backup restored. Reloading…';setTimeout(()=>location.reload(),700)}
  catch(err){$('backup-msg').textContent='That file is not a Hunter System backup. Choose a file named hunter-backup-….json.'}};
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
function stageAdj(){const r=Plan.stageOf(posOf(new Date()).w).rank;return {E:-500,D:-300,C:200,B:-400,A:0,S:0}[r]||0}
function targets(){
  const age=prof.age||30,bmr=10*prof.wt+6.25*prof.ht-5*age+5,tdee=bmr*1.5;
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
    const hit=idx.find(([a])=>new RegExp('(^|[^a-z])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)').test(seg));
    if(!hit){if(seg.replace(/[^a-z]/g,'').length>1)missed.push(seg);return}
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
$('food-q').addEventListener('input',renderFoodSearch);
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
  const M=wealthMetrics(),ri=wealthRankIdx(M),R=Wealth.RANKS,cur=ri>=R.length?{name:'S-Rank · Shadow Monarch',goal:'₹100 Cr reached. Protect it and diversify.',month:60,crit:[]}:R[ri],letter=ri>=R.length?'S':R[ri].r;
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
$('systems').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)showView(b.dataset.go)});
document.addEventListener('change',e=>{const t=e.target,ds=todayStr();
  if(t.dataset.mq){const r=getDay(ds);r.mq=r.mq||{};r.mq[t.dataset.mq]=t.checked;setDay(ds,r);refreshAll()}
  if(t.dataset.wq){const r=getDay(ds);r.wq=r.wq||{};r.wq[t.dataset.wq]=t.checked;setDay(ds,r);refreshAll()}});
function refreshAll(){const v=S.get('view','today');if(v==='today')renderToday();if(v==='mind')renderMind();if(v==='wealth')renderWealth();header()}

/* ---------- toast ---------- */
function toast(t){let el=$('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200)}

/* =================================================================
   NAV + BOOT
   ================================================================= */
const VIEWS=['today','plan','food','mind','wealth','status','timer','settings'];
function showView(v){VIEWS.forEach(x=>{$('v-'+x).hidden=x!==v;const tb=$('tab-'+x);if(tb)tb.setAttribute('aria-current',x===v||(v==='timer'&&x==='plan')?'page':'false')});S.set('view',v);window.scrollTo(0,0);
  if(v==='today')renderToday();if(v==='plan')renderPlan();if(v==='food'){foodDate=todayStr();foodMeal=mealNow();renderFood()}if(v==='mind')renderMind();if(v==='wealth')renderWealth();if(v==='status')renderStatus();}
VIEWS.forEach(v=>{const tb=$('tab-'+v);if(tb)tb.addEventListener('click',()=>showView(v))});
$('btn-settings').onclick=()=>showView('settings');$('open-timer').onclick=()=>showView('timer');
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>showView(b.dataset.back));
function refresh(){header();const v=S.get('view','today');if(v==='today')renderToday();if(v==='plan')renderPlan();if(v==='food')renderFood();if(v==='mind')renderMind();if(v==='wealth')renderWealth();if(v==='status')renderStatus()}

let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').hidden=false});
$('install').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('install').hidden=true};
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

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
fillSettings();drawTimer();showView(VIEWS.includes(qv)?qv:S.get('view','today'));
setInterval(()=>{checkReminders();if(!document.hidden&&S.get('view','today')==='today')renderToday()},60000);
checkReminders();
})();
