/* Hunter System — the 72-week E → S program.
   program(week, dayIndex) returns the session for that day (0 = Monday).
   Each block: {kind, label, min, how, text, items:[[exerciseKey, dose]]}.
   A dose starting with "N × …" is loggable as N sets. */
(function(){
const blk=(kind,label,min,items,how)=>({kind,label,min,items,how});
const WARM={kind:'warm',label:'Warm-up',min:10,text:'5 min easy treadmill or cycle. Then arm circles, leg swings, hip circles, 10 bodyweight squats, 10 band pull-aparts, and 1–2 light sets of your first exercise.'};
const STRETCH={kind:'stretch',label:'Stretch',min:5,text:'Chest, lats, quads, hamstrings and hip flexors. Hold each for 20–30 s and breathe slowly.'};
const MOB={kind:'stretch',label:'Mobility',min:15,text:'Deep breathing 1 min · knee-to-chest 1 min · lying hamstring 2 min · spinal twist 1.5 min · cat-cow 1.5 min · child\'s pose 1 min · kneeling hip flexor 2 min · quad 1 min · calf 1 min · doorway chest 1 min · cross-body shoulder 1 min · overhead triceps 1 min.'};
const REST={t:'Rest',rest:true,blocks:[]};

const STAGES=[
 {rank:'E',to:'D',start:1,end:12,name:'E-Rank · Awakening',goal:'Learn the movements, walk daily, fix food, lose the first belly fat.',runKm:2},
 {rank:'D',to:'C',start:13,end:24,name:'D-Rank · Hunter Training',goal:'Barbell strength: 5×5 on the big lifts, first unassisted pull-up, steady running.',runKm:3},
 {rank:'C',to:'B',start:25,end:40,name:'C-Rank · Gate Raids',goal:'Push / pull / legs split. Build the V-taper: shoulders, lats, upper chest.',runKm:5},
 {rank:'B',to:'A',start:41,end:56,name:'B-Rank · Shadow Extraction',goal:'Cut phase. Keep the strength, strip the fat, reveal the abs.',runKm:5},
 {rank:'A',to:'S',start:57,end:72,name:'A-Rank · Monarch Ascension',goal:'Power and athleticism. Full Daily Quest: 100 / 100 / 100 / 10 km.',runKm:10}
];
const TOTAL=72;
function stageOf(w){return STAGES.find(s=>w>=s.start&&w<=s.end)||{rank:'S',to:null,start:73,end:9999,name:'S-Rank · Shadow Monarch',goal:'Maintain. Repeat the A-Rank cycle with your new numbers.',runKm:10}}

/* sub-phases inside E */
function ePhase(w){return w<=4?0:w<=8?1:2}
const EPHASES=['Awakening (weeks 1–4)','Daily Quest (weeks 5–8)','Dungeon (weeks 9–12)'];

function stepsFor(w){if(w<=4)return [6000,7000,8000,8000][w-1];if(w<=8)return 9000;if(w<=24)return 10000;if(w<=56)return 12000;return 10000}

/* helpers for later stages */
function deloadOf(w,s){const wk=w-s.start;return s.rank!=='E'&&s.rank!=='S'?((wk+1)%4===0&&w!==s.end):false}
function adj(dose,deload){if(!deload)return dose;return dose.replace(/^(\d+) ×/,(m,n)=>`${Math.max(2,n-1)} ×`)}
function S(items,deload){return items.map(([k,d])=>[k,adj(d,deload)])}
function quest(n,km){return blk('core','Daily Quest',Math.round(20+km*7),[['pushup',`${n} total, any sets`],['situp',`${n} total, any sets`],['airsquat',`${n} total, any sets`],['run',`${km} km`]],'Spread through the day if needed. Tick the quest only when all four are done.')}
const NOTE_PROG='Main lifts: when you complete every rep of every set, add 2.5 kg next time (5 kg for squat and deadlift).';

function eProgram(w,d){
  const ph=ePhase(w);
  if(ph===0){
    const s=w===1?2:3,x=r=>`${s} × ${r}`;
    const A={t:'Full Body A',blocks:[WARM,blk('strength','Strength',40,[['legpress',x(12)],['chestpress',x(12)],['pulldown',x(12)],['boxsquat',x(10)],['machinepress',x(12)],['pushdown',x(12)],['curl',x(12)]],'90 s rest between sets'),blk('cardio','Cardio',15,[['treadmill','15 min']]),blk('core','Abs',5,[['kneeplank',`${s} × ${w>2?30:20} s`],['deadbug','2 × 8 each side']]),STRETCH]};
    const B={t:'Full Body B',blocks:[WARM,blk('strength','Strength',40,[['goblet',x(12)],['cablerow',x(12)],['incline',x(12)],['legcurl',x(12)],['closepull',x(12)],['lateral',x(12)],['facepull',x(15)]],'90 s rest between sets'),blk('cardio','Cardio',15,[['cycle','15 min']]),blk('core','Abs',5,[['bicycle','2 × 12'],['kneeplank',`2 × ${w>2?30:20} s`]]),STRETCH]};
    const C={t:'Cardio + Core',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Easy walk, gradually speeding up.'},blk('cardio','Cardio',35,[[w===1?'treadmill':'intervals',w===1?'35 min steady':'35 min · 2 min brisk / 1 min easy']]),blk('core','Core',15,[['kneeplank','3 × 20 s'],['bridge','3 × 12'],['birddog','2 × 8 each side'],['legraise','2 × 10']]),MOB]};
    const m=[30,40,50,60][w-1];
    const sat={t:'Active Day',blocks:[blk('cardio','Walk',m,[['walk',`${m} min`]]),{...MOB}]};
    return [A,C,B,C,{...A,note:'Same as Monday. Add a little weight to 2–3 exercises.'},sat,REST][d];
  }
  if(ph===1){
    const h=w>=7?' · add weight vs weeks 5–6':'';
    const UA={t:'Upper A',blocks:[WARM,blk('strength','Strength',40,[['bench','3 × 10'],['pulldown','3 × 10'],['cablerow','3 × 10'],['shoulderpress','3 × 10'],['lateral','3 × 15'],['curl','2 × 12'],['pushdown','2 × 12']],'90 s rest'+h),blk('cardio','Cardio',15,[['treadmill','15 min incline']]),blk('core','Abs',5,[['plank',`3 × ${w>=7?40:30} s`]]),STRETCH]};
    const LA={t:'Lower A + Abs',blocks:[WARM,blk('strength','Strength',40,[['goblet','3 × 10'],['legpress','3 × 12'],['rdl','3 × 10'],['lunge','2 × 10 each leg'],['calf','3 × 15']],'90–120 s rest'+h),blk('cardio','Cardio',15,[['cycle','15 min']]),blk('core','Abs',5,[['deadbug','3 × 10 each'],['legraise','2 × 12']]),STRETCH]};
    const UB={t:'Upper B',blocks:[WARM,blk('strength','Strength',40,[['incline','3 × 10'],['closepull','3 × 10'],['dbrow','3 × 10 each'],['machinepress','3 × 10'],['facepull','3 × 15'],['hammer','2 × 12'],['ohext','2 × 12']],'90 s rest'+h),blk('cardio','Cardio',15,[['treadmill','15 min incline']]),blk('core','Abs',5,[['bicycle','3 × 16']]),STRETCH]};
    const LB={t:'Lower B + Abs',blocks:[WARM,blk('strength','Strength',40,[['legpress','3 × 12'],['rdl','3 × 10'],['legcurl','3 × 12'],['stepup','2 × 10 each leg'],['bridge','3 × 15']],'90 s rest'+h),blk('cardio','Cardio',15,[['cycle','15 min']]),blk('core','Abs',5,[['hangknee','3 × 8'],['plank',`2 × ${w>=7?40:30} s`]]),STRETCH]};
    const C={t:'Cardio + Mobility',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Easy walk, gradually speeding up.'},blk('cardio','Intervals',30,[[w>=7?'jogint':'intervals',w>=7?'30 min · 1 min slow jog / 2 min walk':'30 min · 2 min fast walk / 1 min easy']]),blk('core','Core',20,[['plank','3 × 30 s'],['birddog','3 × 8 each'],['bridge','3 × 15'],['russian','2 × 16']]),MOB]};
    const r=w>=7?4:3;
    const Q={t:'Daily Quest Circuit',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Brisk walk, arm circles, leg swings.'},blk('strength','Circuit',20,[['airsquat','10 reps'],['pushup','10 reps (knees or bench)'],['bridge','15 reps'],['plank','30 s']],`${r} rounds · 60 s rest between rounds`),blk('cardio','Walk',45,[['walk','45 min brisk']])]};
    return [UA,LA,C,UB,LB,Q,REST][d];
  }
  const UH={t:'Upper Heavy',blocks:[WARM,blk('strength','Strength',45,[['bbbench','4 × 8'],['bbrow','4 × 8'],['pullup','3 × 6–8'],['shoulderpress','3 × 10'],['lateral','3 × 15'],['curl','3 × 10']],'2 min rest on the first three, 75 s on the rest'),blk('cardio','Finisher',10,[['sprints','10 rounds · 20 s fast / 40 s easy']]),blk('core','Abs',5,[['hangknee','3 × 10']]),STRETCH]};
  const LH={t:'Lower Heavy + Abs',blocks:[WARM,blk('strength','Strength',45,[['squat','4 × 8'],['rdl','4 × 8'],['legpress','3 × 12'],['lunge','2 × 10 each leg'],['calf','4 × 15']],'2 min rest on squat and RDL'),blk('cardio','Cardio',10,[['cycle','10 min easy']]),blk('core','Abs',5,[['hangknee','3 × 12'],['plank','3 × 45 s']]),STRETCH]};
  const UV={t:'Upper Volume',blocks:[WARM,blk('strength','Strength',45,[['incline','3 × 12'],['closepull','3 × 12'],['dbrow','3 × 12 each'],['facepull','3 × 15'],['lateral','3 × 15'],['hammer','3 × 12'],['ohext','3 × 12']],'60–75 s rest'),blk('cardio','Finisher',10,[['pushup','3 × max, good form']]),blk('core','Abs',5,[['russian','3 × 20']]),STRETCH]};
  const LC={t:'Lower + Conditioning',blocks:[WARM,blk('strength','Strength',35,[['goblet','3 × 12'],['stepup','3 × 10 each leg'],['legcurl','3 × 12'],['bridge','3 × 15']],'75 s rest'),blk('cardio','Conditioning',20,[['kbswing','6 × 15 · rest 45 s'],['jogint','8 min · 2 min jog / 1 min walk']]),blk('core','Abs',5,[['legraise','3 × 12'],['bicycle','2 × 20']]),STRETCH]};
  const C={t:'Intervals + Core',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Easy walk, then 2 min slow jog.'},blk('cardio','Intervals',30,[['jogint','30 min · 2 min jog / 1 min walk']]),blk('core','Core',20,[['plank','3 × 45 s'],['russian','3 × 20'],['deadbug','3 × 10 each'],['hangknee','2 × 10']]),MOB]};
  const D={t:'Dungeon Circuit',blocks:[WARM,blk('strength','Circuit',30,[['kbswing','15 reps'],['pushup','10 reps'],['goblet','12 reps'],['dbrow','10 each arm'],['plank','40 s']],`${w>=11?5:4} rounds · 90 s rest between rounds`),blk('cardio','Walk',30,[['walk','30 min brisk']]),STRETCH]};
  return [UH,LH,C,UV,LC,D,REST][d];
}

function dProgram(w,d,s){
  const wk=w-s.start,dl=deloadOf(w,s),pullKey=wk>=6?'pullbw':'pullup',pullDose=wk>=6?'4 × 3–5 (jump up, 5 s lowering)':'3 × 6–8';
  const UpS={t:'Upper Strength',blocks:[WARM,blk('strength','Strength',45,S([['bbbench','5 × 5'],['bbrow','5 × 5'],['ohp','3 × 8'],[pullKey,pullDose],['lateral','3 × 15'],['curl','3 × 10'],['pushdown','3 × 12']],dl),'3 min rest on 5 × 5, 75 s on the rest. '+NOTE_PROG),blk('cardio','Finisher',10,[['sprints','8 rounds · 20 s fast / 40 s easy']]),blk('core','Abs',5,[['hangknee','3 × 12']]),STRETCH]};
  const LoS={t:'Lower Strength',blocks:[WARM,blk('strength','Strength',45,S([['squat','5 × 5'],['rdl','3 × 8'],['bulgarian','3 × 8 each'],['legcurl','3 × 12'],['calf','4 × 15']],dl),'3 min rest on squats. '+NOTE_PROG),blk('cardio','Cardio',10,[['cycle','10 min easy']]),blk('core','Abs',5,[['plank','3 × 60 s'],['hangknee','2 × 12']]),STRETCH]};
  const Cond={t:'Run + Core',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Brisk walk 5 min, leg swings, 2 min easy jog.'},blk('cardio','Run',30,[[wk>=6?'run':'jogint',wk>=6?`${(3+wk*0.1).toFixed(1)} km continuous, easy pace`:'30 min · 3 min jog / 1 min walk']]),blk('core','Core',20,[['situp','3 × 20'],['russian','3 × 20'],['climber','3 × 30 s'],['plank','2 × 60 s']]),MOB]};
  const UpH={t:'Upper V-Taper',blocks:[WARM,blk('strength','Hypertrophy',45,S([['incline','4 × 10'],['pulldown','4 × 10'],['dbrow','3 × 12 each'],['lateral','4 × 15'],['facepull','3 × 15'],['dips','3 × 8 (assisted if needed)'],['hammer','3 × 12']],dl),'60–90 s rest'),blk('cardio','Finisher',10,[['pushup','3 × max, perfect form']]),blk('core','Abs',5,[['cablecrunch','3 × 15']]),STRETCH]};
  const LoA={t:'Lower + Athletic',blocks:[WARM,blk('strength','Strength',40,S([['deadlift','4 × 5'],['legpress','3 × 12'],['hipthrust','3 × 10']],dl),'3 min rest on deadlift. '+NOTE_PROG),blk('cardio','Athletic',15,[['boxjump','4 × 5, step down'],['kbswing','5 × 15']]),blk('core','Abs',5,[['legraise','3 × 15']]),STRETCH]};
  const n=50+Math.round(wk*25/11),km=Math.round((2+wk*0.15)*2)/2;
  const Q={t:'Daily Quest',blocks:[WARM,quest(n,km),{...MOB}]};
  const day=[UpS,LoS,Cond,UpH,LoA,Q,REST][d];
  return dl&&!day.rest?{...day,note:'Deload week: 1 set fewer and about 10% lighter. Let your body catch up.'}:day;
}

function cProgram(w,d,s){
  const wk=w-s.start,dl=deloadOf(w,s);
  const Push={t:'Push',blocks:[WARM,blk('strength','Strength',50,S([['bbbench','4 × 6'],['ohp','4 × 8'],['incline','3 × 10'],['cablefly','3 × 12'],['lateral','4 × 15'],['dips','3 × max'],['skull','3 × 10']],dl),'2–3 min rest on bench and press, 60–75 s on the rest. '+NOTE_PROG),blk('core','Abs',5,[['cablecrunch','3 × 15']]),STRETCH]};
  const Pull={t:'Pull',blocks:[WARM,blk('strength','Strength',50,S([['deadlift','3 × 5'],['pullbw','4 × max'],['bbrow','4 × 8'],['facepull','3 × 15'],['shrug','3 × 12'],['curl','3 × 10'],['hammer','2 × 12']],dl),'3 min rest on deadlift. '+NOTE_PROG),blk('core','Abs',5,[['hangleg','3 × 10']]),STRETCH]};
  const Legs={t:'Legs',blocks:[WARM,blk('strength','Strength',50,S([['squat','4 × 6'],['rdl','3 × 8'],['bulgarian','3 × 10 each'],['legext','3 × 15'],['legcurl','3 × 12'],['calf','4 × 15']],dl),'3 min rest on squats. '+NOTE_PROG),blk('core','Abs',5,[['abwheel','3 × 8']]),STRETCH]};
  const n=75+Math.round(wk*25/15),km=Math.round((3+wk*2/15)*2)/2;
  const Q={t:'Daily Quest + Run',blocks:[WARM,quest(n,km),{...MOB}]};
  const Up={t:'Upper V-Taper',blocks:[WARM,blk('strength','Hypertrophy',50,S([['pullbw','4 × max, wide grip'],['shoulderpress','3 × 10'],['pulldown','3 × 12'],['lateral','5 × 15'],['revfly','3 × 15'],['curl','3 × 12'],['pushdown','3 × 12']],dl),'60 s rest. Last lateral set: drop the weight and keep going.'),blk('cardio','Finisher',5,[['pushup','2 × max']]),STRETCH]};
  const Ath={t:'Lower Athletic',blocks:[WARM,blk('strength','Athletic',40,S([['boxjump','5 × 5'],['kbswing','5 × 20'],['lunge','3 × 12 each'],['farmer','4 × 40 m']],dl),'90 s rest'),blk('cardio','Conditioning',15,[['burpee','5 × 10 · 45 s rest']]),blk('core','Abs',5,[['russian','3 × 20']]),STRETCH]};
  const day=[Push,Pull,Legs,Q,Up,Ath,REST][d];
  return dl&&!day.rest?{...day,note:'Deload week: 1 set fewer and about 10% lighter.'}:day;
}

function bProgram(w,d,s){
  const wk=w-s.start,dl=deloadOf(w,s);
  const fin=(k,dose)=>blk('cardio','Fat-burn finisher',10,[[k,dose]]);
  const PH={t:'Push Heavy',blocks:[WARM,blk('strength','Strength',45,S([['bbbench','5 × 5'],['ohp','4 × 6'],['incline','3 × 10'],['lateral','4 × 15'],['dips','3 × 8, add weight if easy'],['skull','3 × 10']],dl),'Hold your strength while cutting. '+NOTE_PROG),fin('burpee','5 × 10'),STRETCH]};
  const PuH={t:'Pull Heavy',blocks:[WARM,blk('strength','Strength',45,S([['deadlift','5 × 3'],['pullbw','4 × 6, add weight if easy'],['bbrow','4 × 8'],['facepull','3 × 15'],['curl','3 × 10'],['hammer','2 × 12']],dl),'3 min rest on deadlift.'),fin('jumprope','10 × 30 s on / 30 s off'),STRETCH]};
  const LH={t:'Legs Heavy',blocks:[WARM,blk('strength','Strength',45,S([['squat','5 × 5'],['hipthrust','4 × 8'],['bulgarian','3 × 10 each'],['legcurl','3 × 12'],['calf','4 × 15']],dl),'3 min rest on squats.'),blk('core','Abs',10,[['hangleg','3 × 12'],['abwheel','3 × 10']]),STRETCH]};
  const PV={t:'Push Volume + HIIT',blocks:[WARM,blk('strength','Hypertrophy',40,S([['incline','4 × 12'],['cablefly','3 × 15'],['shoulderpress','3 × 12'],['lateral','5 × 15'],['pikepush','3 × 10'],['pushdown','3 × 15'],['ohext','3 × 12']],dl),'45–60 s rest'),fin('sprints','10 rounds · 20 s / 40 s'),STRETCH]};
  const PuV={t:'Pull Volume + HIIT',blocks:[WARM,blk('strength','Hypertrophy',40,S([['pulldown','4 × 12'],['cablerow','3 × 12'],['dbrow','3 × 12 each'],['revfly','3 × 15'],['shrug','3 × 15'],['curl','3 × 12'],['hammer','3 × 12']],dl),'45–60 s rest'),fin('kbswing','5 × 20 · 40 s rest'),STRETCH]};
  const n=100,km=Math.round((5+wk/15)*2)/2;
  const LA={t:'Legs Athletic + Quest',blocks:[WARM,blk('strength','Athletic',20,S([['boxjump','4 × 5'],['lunge','3 × 12 each']],dl),'90 s rest'),quest(n,km)]};
  const day=[PH,PuH,LH,PV,PuV,LA,REST][d];
  return dl&&!day.rest?{...day,note:'Deload week: 1 set fewer and about 10% lighter. Eat at maintenance this week.'}:day;
}

function aProgram(w,d,s,maintain){
  const wk=maintain?((w-73)%16):(w-s.start),dl=maintain?false:deloadOf(w,s);
  const UP={t:'Upper Power',blocks:[WARM,blk('strength','Power + strength',50,S([['ohp','5 × 3, push press: dip and drive'],['bbbench','4 × 5'],['pullbw','5 × 5, weighted'],['bbrow','4 × 6'],['lateral','4 × 15'],['dips','3 × 8, weighted']],dl),'3 min rest on the first three. Move the bar fast.'),blk('core','Abs',5,[['abwheel','3 × 10']]),STRETCH]};
  const LP={t:'Lower Power',blocks:[WARM,blk('strength','Power + strength',50,S([['boxjump','5 × 3, max height'],['squat','5 × 3'],['deadlift','3 × 3'],['hipthrust','3 × 8'],['calf','4 × 12']],dl),'3 min rest on squat and deadlift.'),blk('core','Abs',5,[['hangleg','3 × 12']]),STRETCH]};
  const km=Math.round((6+wk*2/15)*2)/2;
  const R={t:'Run + Core',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Brisk walk, leg swings, strides.'},blk('cardio','Run',Math.round(km*6.5),[['run',`${km} km, easy pace`]]),blk('core','Core',15,[['situp','3 × 25'],['russian','3 × 24'],['plank','2 × 90 s']])]};
  const UH={t:'Upper Aesthetics',blocks:[WARM,blk('strength','Hypertrophy',50,S([['incline','4 × 10'],['pullbw','4 × 10'],['cablefly','3 × 12'],['lateral','5 × 15'],['revfly','3 × 15'],['curl','3 × 12'],['skull','3 × 12']],dl),'60 s rest. Superset curls with skull crushers.'),STRETCH]};
  const LH={t:'Lower + Sprints',blocks:[WARM,blk('strength','Hypertrophy',35,S([['bulgarian','4 × 10 each'],['rdl','4 × 8'],['legext','3 × 15'],['legcurl','3 × 12']],dl),'90 s rest'),blk('cardio','Sprints',15,[['sprints','10 × 30 s hard / 60 s easy']]),STRETCH]};
  const qkm=maintain?10:Math.min(10,Math.round((8+wk*2/14)*2)/2);
  const Q={t:'Full Daily Quest',blocks:[WARM,quest(100,qkm),{...MOB}]};
  const day=[UP,LP,R,UH,LH,Q,REST][d];
  if(maintain&&!day.rest)return {...day,note:'S-Rank maintenance: repeat this cycle. Try to beat your best numbers every 4 weeks.'};
  return dl&&!day.rest?{...day,note:'Deload week: 1 set fewer and about 10% lighter.'}:day;
}

/* Rank assessment: last Saturday of each stage */
function testDay(s){
  return {t:`${s.to}-Rank Assessment`,test:s.to,blocks:[WARM,{kind:'core',label:'Assessment',min:45,text:`Test day. Do these fresh, in this order, with 5 minutes rest between tests: max push-ups in one set → max pull-ups → max dips → plank hold → 5-rep strength tests (if this rank needs them) → ${s.runKm} km run or walk for time. Then enter results in Status → Rank test.`},{...MOB}]};
}

function program(w,d){
  const s=stageOf(w);
  if(s.rank!=='S'&&w===s.end&&d===5)return testDay(s);
  if(s.rank==='E')return eProgram(w,d);
  if(s.rank==='D')return dProgram(w,d,s);
  if(s.rank==='C')return cProgram(w,d,s);
  if(s.rank==='B')return bProgram(w,d,s);
  if(s.rank==='A')return aProgram(w,d,s,false);
  return aProgram(w,d,s,true);
}

/* Rank-up criteria. bw = body weight kg, ht = height cm, base = starting stats */
function criteria(rank,bw,ht,base){
  const r=x=>Math.round(x*2)/2;
  const C={
   D:[['push','Push-ups, one set','reps',15,'>='],['plank','Plank hold','s',60,'>='],['run','2 km walk or jog','min',18,'<='],['waistDrop','Waist lost since start','cm',5,'>=']],
   C:[['push','Push-ups, one set','reps',25,'>='],['pull','Pull-ups (bodyweight)','reps',1,'>='],['plank','Plank hold','s',90,'>='],['run','3 km run','min',20,'<='],['squat5','Squat × 5','kg',r(bw*0.75),'>='],['bench5','Bench press × 5','kg',r(bw*0.6),'>=']],
   B:[['push','Push-ups, one set','reps',40,'>='],['pull','Pull-ups','reps',5,'>='],['dips','Dips','reps',10,'>='],['run','5 km run','min',32,'<='],['squat5','Squat × 5','kg',r(bw*1.0),'>='],['bench5','Bench press × 5','kg',r(bw*0.8),'>='],['dead5','Deadlift × 5','kg',r(bw*1.25),'>=']],
   A:[['push','Push-ups, one set','reps',50,'>='],['pull','Pull-ups','reps',10,'>='],['dips','Dips','reps',15,'>='],['run','5 km run','min',28,'<='],['squat5','Squat × 5','kg',r(bw*1.25),'>='],['bench5','Bench press × 5','kg',r(bw*1.0),'>='],['dead5','Deadlift × 5','kg',r(bw*1.5),'>='],['whtr','Waist ÷ height','ratio',0.48,'<=']],
   S:[['push','Push-ups, one set','reps',60,'>='],['pull','Pull-ups','reps',15,'>='],['dips','Dips','reps',25,'>='],['run','10 km run','min',60,'<='],['squat5','Squat × 5','kg',r(bw*1.5),'>='],['bench5','Bench press × 5','kg',r(bw*1.25),'>='],['dead5','Deadlift × 5','kg',r(bw*2.0),'>='],['whtr','Waist ÷ height','ratio',0.45,'<='],['quest','Full Daily Quest (100/100/100/10 km) in one day','done',1,'>=']]
  };
  return (C[rank]||[]).map(([k,l,u,t,cmp])=>({k,l,u,t,cmp}));
}

window.Plan={STAGES,TOTAL,stageOf,program,stepsFor,criteria,ePhase,EPHASES,deloadOf};
})();
