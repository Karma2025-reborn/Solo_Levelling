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
  q.push({id:'prot',t:`Hit ${protein()} g protein`,s:'Every meal has a protein source',done:!!rec.q.prot});
  q.push({id:'steps',t:`Walk ${Plan.stepsFor(p.w).toLocaleString('en-IN')} steps`,s:'Check your phone\'s step counter',done:!!rec.q.steps});
  q.push({id:'clean',t:'No sugar, no fried food',s:'No chai sugar, samosa, biscuits, cold drinks',done:!!rec.q.clean});
  q.push({id:'sleep',t:'Sleep by 10:30 pm',s:'Tick tomorrow morning if you made it',done:!!rec.q.sleep});
  return q;
}
function dayScore(ds){const q=questsFor(ds);return q.filter(x=>x.done).length/q.length}
function hasData(ds){return localStorage.getItem(P+dayKey(ds))!==null}

/* ---------- XP / level / streak ---------- */
function allDays(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(P+'day:'))out.push(k.slice((P+'day:').length))}}catch(e){}return out.sort()}
function xpTotal(){let xp=0;for(const ds of allDays()){const q=questsFor(ds);xp+=q.filter(x=>x.done).length*15;if(getDay(ds).workout)xp+=50}
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
function fillSettings(){$('s-wt').value=prof.wt;$('s-ht').value=prof.ht;$('s-start').value=prof.start;$('s-diet').value=prof.diet;$('s-gym').value=prof.gym;$('s-supp').checked=!!prof.supps;renderGcal()}
$('s-wt').onchange=()=>{const v=parseFloat($('s-wt').value);if(v>=35&&v<=200){prof.wt=v;saveProf();refresh()}};
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

/* ---------- toast ---------- */
function toast(t){let el=$('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200)}

/* =================================================================
   NAV + BOOT
   ================================================================= */
const VIEWS=['today','plan','status','timer','settings'];
function showView(v){VIEWS.forEach(x=>{$('v-'+x).hidden=x!==v;$('tab-'+x).setAttribute('aria-current',x===v?'page':'false')});S.set('view',v);window.scrollTo(0,0);
  if(v==='today')renderToday();if(v==='plan')renderPlan();if(v==='status')renderStatus();}
VIEWS.forEach(v=>$('tab-'+v).addEventListener('click',()=>showView(v)));
function refresh(){header();const v=S.get('view','today');if(v==='today')renderToday();if(v==='plan')renderPlan();if(v==='status')renderStatus()}

let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').hidden=false});
$('install').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('install').hidden=true};
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

const p0=posOf(new Date());selW=p0.w;selD=p0.d;
const qv=new URLSearchParams(location.search).get('view');
fillSettings();drawTimer();showView(VIEWS.includes(qv)?qv:S.get('view','today'));
setInterval(()=>{checkReminders();if(!document.hidden&&S.get('view','today')==='today')renderToday()},60000);
checkReminders();
})();
