/* E-Rank Quest — plan data, figures and app logic.
   Edit the plan in program(), the exercises in EX and the meals in MEALS. */
(function(){
/* ---------- storage (per-device convenience) ---------- */
const S={get(k,d){try{const v=localStorage.getItem('erank:'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
         set(k,v){try{localStorage.setItem('erank:'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- figure engine ---------- */
const NS='http://www.w3.org/2000/svg';
const L=(a,b,c)=>`<polyline points="${a[0]},${a[1]} ${b[0]},${b[1]}${c?` ${c[0]},${c[1]}`:''}"/>`;
const db=(p,v)=>v?`<g class="pr"><line x1="${p[0]}" y1="${p[1]-8}" x2="${p[0]}" y2="${p[1]+8}"/><rect x="${p[0]-5}" y="${p[1]-11}" width="10" height="4" rx="1"/><rect x="${p[0]-5}" y="${p[1]+7}" width="10" height="4" rx="1"/></g>`
  :`<g class="pr"><line x1="${p[0]-8}" y1="${p[1]}" x2="${p[0]+8}" y2="${p[1]}"/><rect x="${p[0]-11}" y="${p[1]-5}" width="4" height="10" rx="1"/><rect x="${p[0]+7}" y="${p[1]-5}" width="4" height="10" rx="1"/></g>`;
const plate=p=>`<circle class="plate" cx="${p[0]}" cy="${p[1]}" r="9"/>`;
const kb=p=>`<g class="pr"><circle cx="${p[0]}" cy="${p[1]+7}" r="6" class="fillc"/><path d="M${p[0]-4} ${p[1]+2} Q${p[0]} ${p[1]-5} ${p[0]+4} ${p[1]+2}"/></g>`;
const cable=(p,to)=>`<line class="cb" x1="${p[0]}" y1="${p[1]}" x2="${to[0]}" y2="${to[1]}"/>`;
const handle=p=>`<g class="pr"><line x1="${p[0]}" y1="${p[1]-6}" x2="${p[0]}" y2="${p[1]+6}"/></g>`;
const G='<line x1="4" y1="131" x2="156" y2="131" class="gd"/>';
const STAND={h:[62,27],n:[62,40],p:[60,80],e:[62,61],w:[63,82],k:[62,105],f:[62,130]};
const BAR='<path class="eq" d="M30 10 L130 10 M36 4 L36 131 M124 4 L124 131"/>';
const FIG={
 legpress:{eq:G+'<path class="eq" d="M30 118 L68 118 M30 118 L36 70 M78 124 L150 72"/>',a:{h:[36,64],n:[42,77],p:[60,112],e:[54,96],w:[64,108],k:[70,88],f:[94,96]},b:{k:[84,97],f:[110,82]},pr:P=>`<line class="eq2" x1="${P.f[0]-8}" y1="${P.f[1]-13}" x2="${P.f[0]+7}" y2="${P.f[1]+12}"/>`},
 chestpress:{eq:G+'<path class="eq" d="M48 66 L48 118 L82 118 M60 118 L60 131"/>',a:{h:[60,59],n:[58,72],p:[58,112],e:[46,86],w:[62,80],k:[84,110],f:[84,130]},b:{e:[78,76],w:[100,74]},pr:P=>handle(P.w)},
 pulldown:{eq:G+'<path class="eq" d="M50 116 L92 116 M70 116 L70 131 M86 101 L104 101 M120 8 L120 131 M78 10 L120 10"/><circle class="eq" cx="80" cy="12" r="4"/>',a:{h:[70,61],n:[68,74],p:[70,112],e:[72,51],w:[77,29],k:[94,108],f:[96,130]},b:{e:[57,87],w:[74,71]},pr:P=>cable(P.w,[80,14])+`<g class="pr"><line x1="${P.w[0]-15}" y1="${P.w[1]}" x2="${P.w[0]+15}" y2="${P.w[1]}"/></g>`},
 closepull:{eq:G+'<path class="eq" d="M50 116 L92 116 M70 116 L70 131 M86 101 L104 101 M120 8 L120 131 M78 10 L120 10"/><circle class="eq" cx="80" cy="12" r="4"/>',a:{h:[70,61],n:[68,74],p:[70,112],e:[73,51],w:[78,29],k:[94,108],f:[96,130]},b:{h:[66,62],n:[64,75],e:[55,90],w:[74,73]},pr:P=>cable(P.w,[80,14])+`<g class="pr"><path d="M${P.w[0]-6} ${P.w[1]+2} L${P.w[0]} ${P.w[1]-6} L${P.w[0]+6} ${P.w[1]+2}"/></g>`},
 boxsquat:{eq:G+'<rect class="eq" x="30" y="109" width="26" height="22" rx="2"/>',a:{h:[62,27],n:[62,40],p:[60,80],e:[76,52],w:[92,54],k:[62,105],f:[62,130]},b:{h:[74,60],n:[68,72],p:[50,106],e:[82,80],w:[98,78],k:[76,103],f:[68,130]}},
 airsquat:{eq:G,a:{h:[62,27],n:[62,40],p:[60,80],e:[76,52],w:[92,54],k:[62,105],f:[62,130]},b:{h:[74,60],n:[68,72],p:[50,106],e:[82,80],w:[98,78],k:[76,103],f:[68,130]}},
 squat:{eq:G,a:{h:[62,27],n:[62,40],p:[60,80],e:[48,50],w:[58,38],k:[62,105],f:[62,130]},b:{h:[76,58],n:[70,70],p:[48,104],e:[56,80],w:[66,68],k:[76,102],f:[66,130]},pr:P=>`<g class="pr"><line x1="${P.n[0]-12}" y1="${P.n[1]-4}" x2="${P.n[0]+12}" y2="${P.n[1]-4}"/></g>`+plate([P.n[0],P.n[1]-4])},
 shoulderpress:{eq:G+'<path class="eq" d="M48 60 L48 118 L82 118 M60 118 L60 131"/>',a:{h:[60,59],n:[58,72],p:[58,112],e:[66,90],w:[66,69],k:[84,110],f:[84,130]},b:{e:[62,52],w:[64,30]},pr:P=>db(P.w)},
 pushdown:{eq:G+'<path class="eq" d="M114 8 L114 131 M100 12 L114 12"/><circle class="eq" cx="104" cy="15" r="4"/>',a:{h:[68,29],n:[64,42],p:[60,82],e:[66,64],w:[82,52],k:[62,106],f:[60,130],k2:[56,106],f2:[50,130]},b:{w:[70,86]},pr:P=>cable(P.w,[104,17])+`<g class="pr"><line x1="${P.w[0]}" y1="${P.w[1]}" x2="${P.w[0]+4}" y2="${P.w[1]+7}"/></g>`},
 curl:{eq:G,a:{h:[60,29],n:[60,42],p:[60,82],e:[62,64],w:[64,86],k:[62,106],f:[62,130],k2:[57,106],f2:[54,130]},b:{w:[76,48]},pr:P=>db(P.w)},
 hammer:{eq:G,a:{h:[60,29],n:[60,42],p:[60,82],e:[62,64],w:[64,86],k:[62,106],f:[62,130],k2:[57,106],f2:[54,130]},b:{w:[76,48]},pr:P=>db(P.w,true)},
 goblet:{eq:G,a:{h:[62,27],n:[62,40],p:[60,80],e:[70,64],w:[72,50],k:[62,105],f:[62,130]},b:{h:[64,56],n:[60,68],p:[48,104],e:[70,88],w:[70,74],k:[76,102],f:[66,130]},pr:P=>db([P.w[0]+2,P.w[1]],true)},
 cablerow:{eq:G+'<path class="eq" d="M28 114 L82 114 M40 114 L40 131 M104 94 L104 124 M112 100 L112 131"/><circle class="eq" cx="110" cy="104" r="3"/>',a:{h:[68,58],n:[62,70],p:[50,110],e:[80,78],w:[100,82],k:[74,95],f:[100,108]},b:{h:[56,58],n:[54,71],e:[40,86],w:[62,90]},pr:P=>cable(P.w,[108,104])+handle(P.w)},
 incline:{eq:G+'<path class="eq" d="M32 76 L78 118 L102 118 M70 118 L70 131"/>',a:{h:[38,70],n:[46,82],p:[76,112],e:[48,100],w:[56,78],k:[98,110],f:[100,130]},b:{e:[56,62],w:[62,40]},pr:P=>db(P.w)},
 bench:{eq:G+'<path class="eq" d="M22 100 L98 100 M36 100 L36 131 M88 100 L88 131"/>',a:{h:[28,90],n:[40,94],p:[80,94],e:[52,110],w:[46,90],k:[102,98],f:[108,130]},b:{e:[44,73],w:[44,52]},pr:P=>db(P.w)},
 bbbench:{eq:G+'<path class="eq" d="M22 100 L98 100 M36 100 L36 131 M88 100 L88 131 M30 100 L30 40 M54 100 L54 40"/>',a:{h:[28,90],n:[40,94],p:[80,94],e:[52,110],w:[46,86],k:[102,98],f:[108,130]},b:{e:[44,71],w:[44,50]},pr:P=>plate(P.w)},
 legcurl:{eq:G+'<path class="eq" d="M22 100 L112 100 M40 100 L40 131 M96 100 L96 131"/>',a:{h:[24,88],n:[36,92],p:[78,93],e:[40,106],w:[52,110],k:[104,93],f:[128,94]},b:{f:[114,70]},pr:P=>`<circle class="pad" cx="${P.f[0]}" cy="${P.f[1]}" r="5"/>`},
 lateral:{eq:G,a:{h:[80,28],n:[80,42],p:[80,82],e:[72,62],w:[70,82],e2:[88,62],w2:[90,82],k:[74,106],f:[72,130],k2:[86,106],f2:[88,130]},b:{e:[62,46],w:[44,45],e2:[98,46],w2:[116,45]},pr:P=>db(P.w,true)+db(P.w2,true)},
 facepull:{eq:G+'<path class="eq" d="M136 8 L136 131 M124 36 L136 36"/><circle class="eq" cx="128" cy="38" r="4"/>',a:{h:[66,29],n:[64,42],p:[60,82],e:[84,42],w:[102,40],k:[62,106],f:[60,130],k2:[56,106],f2:[50,130]},b:{e:[50,36],w:[72,30]},pr:P=>cable(P.w,[128,40])+handle(P.w)},
 rdl:{eq:G,a:{...STAND},b:{h:[96,56],n:[86,58],p:[56,80],e:[88,78],w:[88,100],k:[64,105]},pr:P=>db(P.w)},
 bbrow:{eq:G,a:{h:[96,56],n:[86,58],p:[56,80],e:[86,80],w:[86,102],k:[66,104],f:[62,130]},b:{e:[68,62],w:[78,80]},pr:P=>plate(P.w)},
 dbrow:{eq:G+'<path class="eq" d="M70 98 L134 98 M78 98 L78 131 M126 98 L126 131"/>',a:{h:[108,68],n:[96,72],p:[54,76],e:[94,94],w:[94,116],e2:[100,84],w2:[102,96],k:[52,104],f:[48,130],k2:[76,98],f2:[96,98]},b:{e:[74,64],w:[80,86]},pr:P=>db(P.w)},
 lunge:{eq:G,a:{h:[70,27],n:[70,40],p:[70,80],e:[70,60],w:[70,82],k:[72,105],f:[72,130],k2:[68,105],f2:[66,130]},b:{h:[70,46],n:[70,59],p:[70,99],e:[70,79],w:[70,101],k:[94,104],f:[96,130],k2:[56,124],f2:[34,128]},pr:P=>db(P.w,true)},
 stepup:{eq:G+'<rect class="eq" x="72" y="104" width="44" height="27" rx="2"/>',a:{h:[54,27],n:[54,40],p:[54,80],e:[54,60],w:[54,82],k:[78,90],f:[84,104],k2:[54,105],f2:[52,130]},b:{h:[84,8],n:[84,21],p:[84,61],e:[84,41],w:[84,63],k:[86,84],f:[86,104],k2:[80,84],f2:[76,104]},pr:P=>db(P.w,true)},
 calf:{eq:G+'<rect class="eq" x="54" y="124" width="30" height="7" rx="1"/>',a:{h:[70,26],n:[70,39],p:[70,79],e:[70,59],w:[70,81],k:[70,103],f:[70,124]},b:{h:[70,18],n:[70,31],p:[70,71],e:[70,51],w:[70,73],k:[70,95],f:[70,116]},pr:P=>db(P.w,true)+`<line class="bdl" x1="${P.f[0]}" y1="${P.f[1]}" x2="${P.f[0]+8}" y2="124"/>`},
 pushup:{eq:G,a:{h:[118,82],n:[106,88],p:[66,104],e:[106,108],w:[106,129],k:[42,116],f:[18,126]},b:{h:[122,108],n:[110,113],p:[68,119],e:[94,114],k:[42,124],f:[18,128]}},
 pullup:{eq:G+BAR+'<rect class="eq" x="50" y="112" width="44" height="12" rx="2"/>',a:{h:[71,46],n:[70,58],p:[70,98],e:[71,36],w:[72,12],k:[78,116],f:[64,120]},b:{h:[71,4],n:[70,26],p:[70,66],e:[54,26],k:[78,86],f:[64,92]}},
 hangknee:{eq:G+BAR,a:{h:[71,46],n:[70,58],p:[70,98],e:[71,36],w:[72,12],k:[70,120],f:[68,136]},b:{p:[72,96],k:[94,88],f:[98,112]}},
 kbswing:{eq:G,a:{h:[92,58],n:[84,62],p:[56,80],e:[80,82],w:[72,102],k:[66,105],f:[62,130],k2:[58,105],f2:[54,130]},b:{h:[62,27],n:[62,40],p:[60,80],e:[80,46],w:[100,40],k:[62,105],f:[62,130],k2:[58,105],f2:[54,130]},pr:P=>kb(P.w)},
 ohext:{eq:G+'<path class="eq" d="M48 118 L82 118 M60 118 L60 131"/>',a:{h:[60,59],n:[58,72],p:[58,112],e:[56,50],w:[42,64],k:[84,110],f:[84,130]},b:{w:[56,28]},pr:P=>db(P.w,true)},
 kneeplank:{eq:G,a:{h:[104,98],n:[90,104],p:[54,110],e:[88,129],w:[106,129],k:[34,129],f:[12,120]},b:{h:[104,97],n:[90,103],p:[54,107]},hold:true},
 plank:{eq:G,a:{h:[118,100],n:[106,106],p:[64,112],e:[104,129],w:[124,129],k:[40,119],f:[14,127]},b:{h:[118,99],n:[106,105],p:[64,110]},hold:true},
 deadbug:{eq:G,a:{h:[24,112],n:[38,117],p:[78,120],e:[40,99],w:[42,79],e2:[40,99],w2:[42,79],k:[80,96],f:[102,96],k2:[80,96],f2:[102,96]},b:{e2:[22,112],w2:[4,110],k2:[104,114],f2:[128,116]}},
 bridge:{eq:G,a:{h:[22,122],n:[36,125],p:[74,127],e:[52,129],w:[66,129],k:[94,104],f:[104,129]},b:{p:[72,104],k:[96,102]}},
 birddog:{eq:G,a:{h:[106,89],n:[94,94],p:[54,94],e:[94,112],w:[94,129],e2:[94,112],w2:[94,129],k:[54,128],f:[30,129],k2:[54,128],f2:[30,129]},b:{e2:[114,91],w2:[136,88],k2:[30,94],f2:[6,94]}},
 legraise:{eq:G,a:{h:[22,123],n:[36,126],p:[80,127],e:[56,129],w:[74,130],k:[104,127],f:[128,127]},b:{k:[92,104],f:[102,80]}},
 bicycle:{eq:G,a:{h:[30,104],n:[44,112],p:[80,125],e:[44,96],w:[32,100],k:[70,98],f:[92,104],k2:[104,120],f2:[128,116]},b:{n:[46,110],k:[104,120],f:[128,116],k2:[70,98],f2:[92,104]}},
 russian:{eq:G,a:{h:[80,74],n:[76,88],p:[56,124],e:[94,98],w:[106,106],k:[84,104],f:[108,110]},b:{h:[72,74],e:[70,108],w:[58,116]},pr:P=>db(P.w,true)},
 treadmill:{eq:'<path class="eq" d="M16 132 L136 124 M118 70 L122 125 M110 70 L126 70"/>',a:{h:[70,27],n:[68,40],p:[66,80],e:[76,60],w:[86,70],e2:[60,60],w2:[56,80],k:[76,103],f:[84,126],k2:[60,104],f2:[50,127]},b:{e:[60,60],w:[56,80],e2:[76,60],w2:[86,70],k:[60,104],f:[50,127],k2:[76,103],f2:[84,126]}},
 walk:{eq:G,a:{h:[70,27],n:[68,40],p:[66,80],e:[76,60],w:[86,70],e2:[60,60],w2:[56,80],k:[76,104],f:[84,129],k2:[60,104],f2:[50,129]},b:{e:[60,60],w:[56,80],e2:[76,60],w2:[86,70],k:[60,104],f:[50,129],k2:[76,104],f2:[84,129]}},
 jog:{eq:G,a:{h:[74,27],n:[71,40],p:[66,79],e:[82,54],w:[92,44],e2:[56,58],w2:[48,48],k:[86,96],f:[82,120],k2:[56,102],f2:[40,112]},b:{e:[56,58],w:[48,48],e2:[82,54],w2:[92,44],k:[56,102],f:[40,112],k2:[86,96],f2:[82,120]}},
 cycle:{eq:G+'<path class="eq" d="M52 80 L68 80 M60 80 L80 112 L60 131 M80 112 L100 131 M80 112 L104 62 M98 62 L110 62"/><circle class="eq" cx="80" cy="112" r="12"/>',a:{h:[86,35],n:[80,46],p:[60,78],e:[94,56],w:[106,62]},cycle:true}
};

/* ---------- exercises: [name, muscle, cue, figure] ---------- */
const EX={
 legpress:['Leg press','Legs','Feet shoulder-width on the plate. Lower to about 90° at the knee, push through your heels.'],
 chestpress:['Chest press machine','Chest · triceps','Handles at mid-chest. Push forward and stop just short of locking your elbows.'],
 pulldown:['Lat pulldown, wide grip','Lats · V-taper','Pull the bar to your upper chest, driving your elbows down.'],
 closepull:['Close-grip lat pulldown','Lats','V-handle to your chest, leaning back only slightly.'],
 boxsquat:['Box squat','Legs · glutes','Sit back to the bench under control, then stand by pushing the floor away.'],
 airsquat:['Bodyweight squat','Legs','Arms forward, chest up. Sit down as low as is comfortable.'],
 squat:['Barbell back squat','Legs · core','Bar on upper back. Sit down between your heels. Use goblet squat until form feels solid.'],
 shoulderpress:['Seated dumbbell shoulder press','Shoulders','Start at ear level. Press up without arching your lower back.'],
 machinepress:['Shoulder press machine','Shoulders','Handles at shoulder height. Press up smoothly.','shoulderpress'],
 pushdown:['Rope pushdown','Triceps','Elbows pinned to your sides. Spread the rope at the bottom.'],
 curl:['Dumbbell or EZ-bar curl','Biceps','Elbows still, no swinging. Lower over 2–3 seconds.'],
 hammer:['Hammer curl','Biceps · forearms','Thumbs up. Curl without moving the elbows.'],
 goblet:['Goblet squat','Legs','Dumbbell held at your chest. Sit down between your heels, chest up.'],
 cablerow:['Seated cable row','Mid back','Sit tall. Pull the handle to your belly and squeeze your shoulder blades.'],
 incline:['Incline dumbbell press','Upper chest','Bench at about 30°. Press up and slightly together.'],
 bench:['Flat dumbbell bench press','Chest','Feet flat. Lower to chest level, press up over your shoulders.'],
 bbbench:['Barbell bench press','Chest · triceps','Use a spotter or safety bars. Bar to lower chest, then press.'],
 legcurl:['Leg curl machine','Hamstrings','Curl heels toward your hips, pause, lower slowly.'],
 lateral:['Dumbbell lateral raise','Side shoulders','The width maker. Light weight, raise to shoulder height.'],
 facepull:['Face pull','Rear shoulders','Rope at head height. Pull to your forehead, elbows high.'],
 rdl:['Romanian deadlift','Hamstrings · glutes','Soft knees. Push your hips back, keep the weights close to your legs, back flat.'],
 bbrow:['Barbell bent-over row','Back thickness','Hinge to about 45°, back flat. Pull the bar to your belly button.'],
 dbrow:['Single-arm dumbbell row','Lats','Hand and knee on the bench. Pull the dumbbell to your hip.'],
 lunge:['Walking lunge','Legs · glutes','Long step, back knee toward the floor, front knee over the foot.'],
 stepup:['Dumbbell step-up','Legs · glutes','Whole foot on the box. Drive up through the front heel.'],
 calf:['Standing calf raise','Calves','Rise high on your toes, pause, lower slowly below the step.'],
 pushup:['Push-up','Chest · triceps · core','Body in one straight line. Hands on a bench or knees down if needed.'],
 pullup:['Assisted pull-up','Lats · biceps','Use the assisted machine or a band. Chin over the bar, lower slowly.'],
 hangknee:['Hanging knee raise','Lower abs','Hang still, curl your knees up to chest height. No swinging.'],
 kbswing:['Kettlebell swing','Glutes · conditioning','A hip snap, not a squat or an arm lift. Bell floats to chest height.'],
 ohext:['Overhead dumbbell extension','Triceps long head','Elbows point up. Lower behind your head, extend fully.'],
 kneeplank:['Knee plank','Core','Forearms and knees down. Straight line from head to knees.'],
 plank:['Plank','Core','Forearms and toes. Squeeze glutes and abs, keep hips level.'],
 deadbug:['Dead bug','Core','Lower back pressed down. Extend the opposite arm and leg slowly.'],
 bridge:['Glute bridge','Glutes · core','Push through your heels, squeeze your glutes at the top.'],
 birddog:['Bird dog','Core · lower back','Reach one arm forward and the opposite leg back. Hold 2 seconds.'],
 legraise:['Lying leg raise','Lower abs','Hands under hips. Bend the knees if your lower back lifts.'],
 bicycle:['Bicycle crunch','Abs · obliques','Slow. Elbow toward the opposite knee.'],
 russian:['Russian twist','Obliques','Lean back slightly, rotate side to side. Feet down if needed.'],
 treadmill:['Incline treadmill walk','Cardio','Incline 3–5, speed 4.5–5 km/h. You can talk, not sing.'],
 intervals:['Treadmill intervals','Cardio','Alternate the fast and easy pace shown.','treadmill'],
 jogint:['Walk-jog intervals','Cardio','Jog slowly, then walk. You should be able to speak a few words while jogging.','jog'],
 cycle:['Stationary cycle','Cardio','Moderate, steady pace.'],
 sprints:['Cycle sprints','Conditioning','Sprint hard on the fast part, pedal easy on the rest.','cycle'],
 walk:['Brisk outdoor walk','Cardio','Pace where you can talk but not sing.']
};

/* ---------- day building blocks ---------- */
const COL={warm:'var(--warm)',strength:'var(--strength)',cardio:'var(--cardio)',core:'var(--core)',stretch:'var(--stretch)'};
const WARM={kind:'warm',label:'Warm-up',min:10,text:'5 min easy treadmill walk, then arm circles, leg swings, 10 bodyweight squats and 1 light set of your first exercise.'};
const STRETCH={kind:'stretch',label:'Stretch',min:5,text:'Chest, back, quads and hamstrings. Hold each for 20 seconds and breathe slowly.'};
const MOB={kind:'stretch',label:'Stretch',min:15,text:'Deep breathing 1 min · knee-to-chest 1 min · lying hamstring 2 min · spinal twist 1.5 min · cat-cow 1.5 min · child\'s pose 1 min · kneeling hip flexor 2 min · quad 1 min · calf 1 min · doorway chest 1 min · shoulder 1 min · triceps 1 min.'};
const blk=(kind,label,min,items,how)=>({kind,label,min,items,how});
const REST={t:'Rest',rest:true,blocks:[]};

function phaseOf(w){return w<=4?0:w<=8?1:2}
const PHASES=[
 {name:'Phase 1 · Awakening',weeks:'Weeks 1–4',goal:'Learn the movements on machines, walk every day, fix the food.'},
 {name:'Phase 2 · Daily Quest',weeks:'Weeks 5–8',goal:'Upper / lower split with free weights. Hit protein every day.'},
 {name:'Phase 3 · Dungeon',weeks:'Weeks 9–12',goal:'Heavier compound lifts plus conditioning. Rank test in week 12.'}
];
const STEPS=[0,6000,7000,8000,8000,9000,9000,9000,9000,10000,10000,10000,10000];

function program(w,d){ // d: 0=Mon … 6=Sun
  const ph=phaseOf(w);
  if(ph===0){
    const s=w===1?2:3, sets=r=>`${s} × ${r}`;
    const A={t:'Full Body A',blocks:[WARM,
      blk('strength','Strength',40,[['legpress',sets(12)],['chestpress',sets(12)],['pulldown',sets(12)],['boxsquat',sets(10)],['machinepress',sets(12)],['pushdown',sets(12)],['curl',sets(12)]],'90 s rest between sets'),
      blk('cardio','Cardio',15,[['treadmill','15 min']]),
      blk('core','Abs',5,[['kneeplank',`${s} × ${w>2?30:20} s`],['deadbug','2 × 8 each side']]),STRETCH]};
    const B={t:'Full Body B',blocks:[WARM,
      blk('strength','Strength',40,[['goblet',sets(12)],['cablerow',sets(12)],['incline',sets(12)],['legcurl',sets(12)],['closepull',sets(12)],['lateral',sets(12)],['facepull',sets(15)]],'90 s rest between sets'),
      blk('cardio','Cardio',15,[['cycle','15 min']]),
      blk('core','Abs',5,[['bicycle','2 × 12'],['kneeplank',`2 × ${w>2?30:20} s`]]),STRETCH]};
    const C={t:'Cardio + Core',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Easy walk, gradually speeding up.'},
      blk('cardio','Cardio',35,[[w===1?'treadmill':'intervals',w===1?'35 min steady':'35 min · 2 min brisk / 1 min easy']]),
      blk('core','Core',15,[['kneeplank','3 × 20 s'],['bridge','3 × 12'],['birddog','2 × 8 each side'],['legraise','2 × 10']]),MOB]};
    const sat={t:'Active Day',blocks:[blk('cardio','Walk',[30,40,50,60][w-1],[['walk',`${[30,40,50,60][w-1]} min`]]),{kind:'stretch',label:'Stretch',min:15,text:MOB.text}]};
    return [A,C,B,{...C,t:'Cardio + Core'},{...A,note:'Same as Monday. Add a little weight to 2–3 exercises.'},sat,REST][d];
  }
  if(ph===1){
    const heavier=w>=7?' (add weight vs weeks 5–6)':'';
    const UA={t:'Upper A',blocks:[WARM,
      blk('strength','Strength',40,[['bench','3 × 10'],['pulldown','3 × 10'],['cablerow','3 × 10'],['shoulderpress','3 × 10'],['lateral','3 × 15'],['curl','2 × 12'],['pushdown','2 × 12']],'90 s rest'+heavier),
      blk('cardio','Cardio',15,[['treadmill','15 min incline']]),
      blk('core','Abs',5,[['plank',`3 × ${w>=7?40:30} s`]]),STRETCH]};
    const LA={t:'Lower A + Abs',blocks:[WARM,
      blk('strength','Strength',40,[['goblet','3 × 10'],['legpress','3 × 12'],['rdl','3 × 10'],['lunge','2 × 10 each leg'],['calf','3 × 15']],'90–120 s rest'+heavier),
      blk('cardio','Cardio',15,[['cycle','15 min']]),
      blk('core','Abs',5,[['deadbug','3 × 10 each'],['legraise','2 × 12']]),STRETCH]};
    const UB={t:'Upper B',blocks:[WARM,
      blk('strength','Strength',40,[['incline','3 × 10'],['closepull','3 × 10'],['dbrow','3 × 10 each'],['machinepress','3 × 10'],['facepull','3 × 15'],['hammer','2 × 12'],['ohext','2 × 12']],'90 s rest'+heavier),
      blk('cardio','Cardio',15,[['treadmill','15 min incline']]),
      blk('core','Abs',5,[['bicycle','3 × 16']]),STRETCH]};
    const LB={t:'Lower B + Abs',blocks:[WARM,
      blk('strength','Strength',40,[['legpress','3 × 12'],['rdl','3 × 10'],['legcurl','3 × 12'],['stepup','2 × 10 each leg'],['bridge','3 × 15']],'90 s rest'+heavier),
      blk('cardio','Cardio',15,[['cycle','15 min']]),
      blk('core','Abs',5,[['hangknee','3 × 8'],['plank',`2 × ${w>=7?40:30} s`]]),STRETCH]};
    const C={t:'Cardio + Mobility',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Easy walk, gradually speeding up.'},
      blk('cardio','Intervals',30,[[w>=7?'jogint':'intervals',w>=7?'30 min · 1 min slow jog / 2 min walk':'30 min · 2 min fast walk / 1 min easy']]),
      blk('core','Core',20,[['plank','3 × 30 s'],['birddog','3 × 8 each'],['bridge','3 × 15'],['russian','2 × 16']]),MOB]};
    const r=w>=7?4:3;
    const Q={t:'Daily Quest Circuit',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Brisk walk, arm circles, leg swings.'},
      blk('strength','Circuit',20,[['airsquat','10 reps'],['pushup','10 reps (knees or bench)'],['bridge','15 reps'],['plank','30 s']],`${r} rounds · 60 s rest between rounds`),
      blk('cardio','Walk',45,[['walk','45 min brisk']])]};
    return [UA,LA,C,UB,LB,Q,REST][d];
  }
  const test=w===12;
  const UH={t:'Upper Heavy',blocks:[WARM,
    blk('strength','Strength',45,[['bbbench','4 × 8'],['bbrow','4 × 8'],['pullup','3 × 6–8'],['shoulderpress','3 × 10'],['lateral','3 × 15'],['curl','3 × 10']],'2 min rest on the first three, 75 s on the rest'),
    blk('cardio','Finisher',10,[['sprints','10 rounds · 20 s fast / 40 s easy']]),
    blk('core','Abs',5,[['hangknee','3 × 10']]),STRETCH]};
  const LH={t:'Lower Heavy + Abs',blocks:[WARM,
    blk('strength','Strength',45,[['squat','4 × 8'],['rdl','4 × 8'],['legpress','3 × 12'],['lunge','2 × 10 each leg'],['calf','4 × 15']],'2 min rest on squat and RDL'),
    blk('cardio','Cardio',10,[['cycle','10 min easy']]),
    blk('core','Abs',5,[['hangknee','3 × 12'],['plank','3 × 45 s']]),STRETCH]};
  const UV={t:'Upper Volume',blocks:[WARM,
    blk('strength','Strength',45,[['incline','3 × 12'],['closepull','3 × 12'],['dbrow','3 × 12 each'],['facepull','3 × 15'],['lateral','3 × 15'],['hammer','3 × 12'],['ohext','3 × 12']],'60–75 s rest'),
    blk('cardio','Finisher',10,[['pushup','3 × max, good form']]),
    blk('core','Abs',5,[['russian','3 × 20']]),STRETCH]};
  const LC={t:'Lower + Conditioning',blocks:[WARM,
    blk('strength','Strength',35,[['goblet','3 × 12'],['stepup','3 × 10 each leg'],['legcurl','3 × 12'],['bridge','3 × 15']],'75 s rest'),
    blk('cardio','Conditioning',20,[['kbswing','6 × 15 · rest 45 s'],['jogint','8 min · 2 min jog / 1 min walk']]),
    blk('core','Abs',5,[['legraise','3 × 12'],['bicycle','2 × 20']]),STRETCH]};
  const C={t:'Intervals + Core',blocks:[{kind:'warm',label:'Warm-up',min:10,text:'Easy walk, then 2 min slow jog.'},
    blk('cardio','Intervals',30,[['jogint','30 min · 2 min jog / 1 min walk']]),
    blk('core','Core',20,[['plank','3 × 45 s'],['russian','3 × 20'],['deadbug','3 × 10 each'],['hangknee','2 × 10']]),MOB]};
  const D={t:'Dungeon Circuit',blocks:[WARM,
    blk('strength','Circuit',30,[['kbswing','15 reps'],['pushup','10 reps'],['goblet','12 reps'],['dbrow','10 each arm'],['plank','40 s']],`${w>=11?5:4} rounds · 90 s rest between rounds`),
    blk('cardio','Walk',30,[['walk','30 min brisk']]),STRETCH]};
  const T={t:'D-Rank Assessment',test:true,blocks:[WARM,
    {kind:'core',label:'Assessment',min:30,text:'Do these fresh, in this order, with 5 minutes rest between tests. Then enter your results below and compare with week 1.'},
    blk('cardio','Walk',30,[['walk','30 min easy cool-down']])]};
  return [UH,LH,C,UV,LC,test?T:D,REST][d];
}

/* ---------- diet ---------- */
const MEALS=[ // per weekday; protein option: [veg, egg, nonveg]
 {bf:['Besan chilla (2) stuffed with 60 g paneer, green chutney','3-egg vegetable omelette + 1 multigrain toast','3-egg vegetable omelette + 1 multigrain toast'],
  ln:['2 phulka + dal + 75 g paneer sabzi + salad + curd','2 phulka + dal + 2 boiled eggs + sabzi + salad','2 phulka + 150 g chicken curry + sabzi + salad + curd'],
  sn:['1 apple + 30 g roasted chana','1 apple + 2 boiled eggs','1 apple + 2 boiled eggs'],
  dn:['100 g paneer bhurji + sautéed vegetables + 1 roti','3-egg bhurji + sautéed vegetables + 1 roti','150 g grilled chicken + sautéed vegetables + 1 roti']},
 {bf:['Moong dal chilla (2) + 1 bowl curd','Moong dal chilla (2) + 2 boiled eggs','Moong dal chilla (2) + 2 boiled eggs'],
  ln:['1 cup rice + rajma + salad + curd','1 cup rice + rajma + 2 boiled eggs + salad','1 cup rice + 150 g fish curry + salad'],
  sn:['Sprouts chaat (1 bowl) + buttermilk','Sprouts chaat + buttermilk','Sprouts chaat + buttermilk'],
  dn:['Soya chunk sabzi (50 g dry) + 1 roti + salad','Egg curry (3 eggs) + 1 roti + salad','Chicken tikka 150 g + salad + 1 roti']},
 {bf:['Vegetable poha + 1 bowl curd + 30 g roasted peanuts','Vegetable poha + 2 boiled eggs','Vegetable poha + 2 boiled eggs'],
  ln:['2 phulka + chole + salad + curd','2 phulka + chole + 2 boiled eggs + salad','2 phulka + 150 g chicken curry + salad + curd'],
  sn:['Guava or orange + 1 glass milk (no sugar)','Fruit + 1 glass milk (no sugar)','Fruit + 1 glass milk (no sugar)'],
  dn:['Moong dal khichdi (1 bowl) + curd + salad','Moong dal khichdi + 2-egg omelette','Moong dal khichdi + 100 g grilled chicken']},
 {bf:['3 idli + sambar + 60 g paneer cubes','3 idli + sambar + 2 boiled eggs','3 idli + sambar + 2 boiled eggs'],
  ln:['2 phulka + dal + palak paneer + salad','2 phulka + dal + egg bhurji (2) + salad','2 phulka + 150 g chicken + dal + salad'],
  sn:['1 banana + 30 g roasted chana','1 banana + 2 boiled eggs','1 banana + 2 boiled eggs'],
  dn:['Paneer tikka 100 g + clear vegetable soup','Egg white bhurji (4 whites + 1 egg) + soup','150 g fish or chicken + clear soup']},
 {bf:['Vegetable daliya + 1 bowl curd','Vegetable daliya + 2 boiled eggs','Vegetable daliya + 2 boiled eggs'],
  ln:['1 cup rice + dal + soya sabzi + salad','1 cup rice + dal + egg curry (2) + salad','1 cup rice + 150 g chicken curry + salad'],
  sn:['Buttermilk + 1 fruit + 15 g peanuts','Buttermilk + 2 boiled eggs','Buttermilk + 2 boiled eggs'],
  dn:['100 g tofu or paneer stir-fry + 1 roti','3-egg bhurji + 1 roti + salad','150 g grilled chicken + 1 roti + salad']},
 {bf:['Paneer paratha (1, little oil) + curd','1 paratha + 2-egg omelette','1 paratha + 2-egg omelette'],
  ln:['2 phulka + dal + mixed sabzi + salad + curd','2 phulka + dal + 2 boiled eggs + sabzi','2 phulka + 150 g mutton or chicken + salad'],
  sn:['Sprouts chaat + buttermilk','Sprouts chaat + 1 boiled egg','Sprouts chaat + 1 boiled egg'],
  dn:['Chana or rajma salad bowl + 75 g paneer','Egg and vegetable salad bowl (3 eggs)','Chicken salad bowl (150 g)']},
 {bf:['Upma with vegetables + 1 bowl curd','Upma + 2 boiled eggs','Upma + 2 boiled eggs'],
  ln:['Home-style thali, normal portions. From week 9 this is your one weekly treat meal.','Home-style thali, normal portions. From week 9 this is your one weekly treat meal.','Home-style thali, normal portions. From week 9 this is your one weekly treat meal.'],
  sn:['1 fruit + green tea','1 fruit + green tea','1 fruit + green tea'],
  dn:['Dal + sabzi + 1 roti + salad, light','2-egg omelette + sabzi + 1 roti','100 g chicken + sabzi + 1 roti']}
];
const DIETFOCUS=[
 ['Week 1: chai with half the sugar. Week 2 onward: no sugar at all.','Stop fried snacks, cold drinks, biscuits and namkeen completely.','Protein in every meal, even if the portions are small at first.','Finish dinner by 8:30 pm, at least 2–3 hours before bed.'],
 ['Hit your protein target every day. If you fall short, 1 scoop of whey in milk or water covers about 24 g.','Dinner: drop to 1 roti and double the sabzi or salad.','Add a 1-cup bowl of curd or buttermilk to lunch daily.','Gym day? Eat the snack 60–90 min before training.'],
 ['Keep most carbs (rice, roti, fruit) at breakfast, lunch and the pre-workout snack.','Dinner is protein + vegetables, with 1 roti at most.','One treat meal per week, Sunday lunch. Not a whole treat day.','Hungry at night? 1 glass warm milk with haldi, no sugar.']
];

/* ---------- state ---------- */
const DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],DFULL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
let W=S.get('week',1),D=S.get('day',(new Date().getDay()+6)%7),DIET=S.get('diet',1);
const $=id=>document.getElementById(id);

function weight(){const v=parseFloat($('wt').value);return v>=35&&v<=200?v:72}
function quests(w,d){
  const p=program(w,d),wt=weight(),q=[];
  if(!p.rest)q.push(['work',`Complete: ${p.t}`,'All blocks of today\'s session']);
  q.push(['steps',`Walk ${STEPS[w].toLocaleString('en-IN')} steps`,'Includes your gym walking']);
  q.push(['prot',`Eat ${Math.round(wt*1.6)} g protein`,'Follow today\'s meals']);
  q.push(['water',`Drink ${(Math.round(wt*0.04*2)/2).toFixed(1)} L water`,'Spread through the day']);
  q.push(['clean','No sugar, no fried food','Check the never-on-the-menu list']);
  q.push(['sleep','Sleep 7–8 hours','Screens off 30 min before bed']);
  return q;
}
const qkey=(w,d,id)=>`q:${w}:${d}:${id}`;
function dayDone(w,d){return quests(w,d).every(([id])=>S.get(qkey(w,d,id),false))}
function progress(){
  let t=0,c=0;
  for(let w=1;w<=12;w++)for(let d=0;d<7;d++)for(const [id] of quests(w,d)){t++;if(S.get(qkey(w,d,id),false))c++;}
  const pct=Math.round(c/t*100);$('xpv').innerHTML=`${pct}<small>% · ${c}/${t} quests</small>`;$('xpbar').style.width=pct+'%';
}
function stats(){const wt=weight();$('prot').innerHTML=`${Math.round(wt*1.6)}–${Math.round(wt*2)}<small>g</small>`;$('water').innerHTML=`${(Math.round(wt*0.04*2)/2).toFixed(1)}<small>L / day</small>`}

/* ---------- figures ---------- */
const figs=[];
function svgFor(key,color){
  const f=FIG[EX[key][3]||key];
  const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 160 140');s.setAttribute('role','img');s.setAttribute('aria-label',EX[key][0]+' movement');
  s.innerHTML=`<style>.eq,.eq2,.gd{fill:none;stroke:#2A3F66;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.eq2{stroke:#6A7FA8;stroke-width:4}.gd{stroke-width:2}
  .cb{stroke:#6A7FA8;stroke-width:1.2;stroke-dasharray:3 2}.pr line,.pr path{stroke:${color};stroke-width:4;stroke-linecap:round;fill:none}.pr rect,.fillc,.pad{fill:${color}}
  .plate{fill:none;stroke:${color};stroke-width:4}.far polyline{stroke:#3B5079}.bd polyline,.bdl{fill:none;stroke:#DDE7FF;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.hd{fill:#0A1222;stroke:#DDE7FF;stroke-width:3.5}</style>${f.eq}<g class="dyn"></g>`;
  figs.push({f,g:s.querySelector('.dyn'),ph:Math.random()*0.3});return s;
}
function ik(h,ft,l1,l2){const dx=ft[0]-h[0],dy=ft[1]-h[1];let d=Math.hypot(dx,dy);d=Math.min(d,l1+l2-.1);const a=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d)))),b=Math.atan2(dy,dx);return [h[0]+l1*Math.cos(b-a),h[1]+l1*Math.sin(b-a)]}
function pose(f,t){
  if(f.cycle){const P={...f.a},c=[80,112],r=12,an=t*Math.PI*2;P.f=[c[0]+r*Math.cos(an),c[1]+r*Math.sin(an)];P.f2=[c[0]-r*Math.cos(an),c[1]-r*Math.sin(an)];P.k=ik(P.p,P.f,27,27);P.k2=ik(P.p,P.f2,27,27);return P}
  const s=(1-Math.cos(t*Math.PI*2))/2,P={};for(const k in f.a){const a=f.a[k],b=(f.b&&f.b[k])||a;P[k]=[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s]}return P;
}
function draw(o,t){const P=pose(o.f,t);let far='',near='';if(P.e2)far+=L(P.n,P.e2,P.w2);if(P.k2)far+=L(P.p,P.k2,P.f2);near+=L(P.n,P.p)+L(P.p,P.k,P.f)+L(P.n,P.e,P.w);
  o.g.innerHTML=`<g class="bd far">${far}</g><g class="bd">${near}</g><circle class="hd" cx="${P.h[0]}" cy="${P.h[1]}" r="8"/>${o.f.pr?o.f.pr(P):''}`}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let t0=performance.now();
function loop(now){for(const o of figs){const per=o.f.hold?4200:o.f.cycle?1800:2600;draw(o,((now-t0)/per+o.ph)%1)}if(!reduce)requestAnimationFrame(loop)}

/* ---------- render ---------- */
function renderNav(){
  $('phases').innerHTML=PHASES.map((p,i)=>`<div class="phase${phaseOf(W)===i?' on':''}"><b>${p.name}</b><span>${p.weeks} · ${p.goal}</span></div>`).join('');
  $('weeks').innerHTML='';for(let w=1;w<=12;w++){let c=0;for(let d=0;d<7;d++)if(dayDone(w,d))c++;
    const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',w===W);b.setAttribute('aria-label','Week '+w);
    b.innerHTML=`W${w}<small><i style="width:${c/7*100}%"></i></small>`;b.onclick=()=>{W=w;S.set('week',W);render()};$('weeks').appendChild(b)}
  $('days').innerHTML='';DN.forEach((n,d)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',d===D);if(dayDone(W,d))b.className='done';
    b.innerHTML=`<b>${n}</b><span>${program(W,d).t}</span>`;b.onclick=()=>{D=d;S.set('day',D);render()};$('days').appendChild(b)});
}
function testPanel(key,title,goalsOn){
  const F=[['wt','Weight','kg',''],['waist','Waist at navel','cm','5 cm less than week 1'],['push','Push-ups, full, in a row','reps','15 or more'],['plank','Plank hold','sec','60 s or more'],['walk','2 km brisk walk or jog','min','Under 18 min, no stopping']];
  const saved=S.get('test:'+key,{}),base=S.get('test:base',{});
  let h=`<section class="win" style="margin-top:22px"><div class="sys">[ System ] · ${title}</div><div class="test">`;
  F.forEach(([id,l,u,g])=>{h+=`<label>${l} (${u})<input id="t-${key}-${id}" data-k="${id}" type="number" step="0.1" value="${saved[id]??''}">${goalsOn&&g?`<span class="goal">D-Rank: ${g}</span>`:''}</label>`});
  h+='</div>';
  if(goalsOn&&Object.keys(base).length){h+='<div class="cmp">';F.forEach(([id,l,u])=>{if(base[id]!=null&&saved[id]!=null){const dlt=(saved[id]-base[id]).toFixed(1);h+=`${l}: ${base[id]} → <b>${saved[id]}</b> ${u} (${dlt>0?'+':''}${dlt}) · `}});h+='</div>'}
  return h+'</section>';
}
function render(){
  figs.length=0;renderNav();
  const p=program(W,D),ph=phaseOf(W),total=p.blocks.reduce((a,b)=>a+b.min,0);
  let h=`<section class="win"><div class="sys">Week ${W} · ${PHASES[ph].name}</div><div class="dayhead"><h2>${DFULL[D]} · ${p.t}</h2>${total?`<div class="total">${total}<span>min</span></div>`:''}</div>`;
  if(p.note)h+=`<p class="note">${p.note}</p>`;
  if(W===1&&D===0)h+=`<p class="note">Day 1: before training, record your starting stats in the box below the meals. These are what you compare against in week 12.</p>`;
  if(total)h+=`<div class="bar">${p.blocks.map(b=>`<i style="flex:${b.min};background:${COL[b.kind]}"></i>`).join('')}</div><div class="legend">${p.blocks.map(b=>`<span style="--c:${COL[b.kind]}">${b.label} ${b.min} min</span>`).join('')}</div>`;
  h+=`<div class="quests">${quests(W,D).map(([id,t,s])=>`<label class="q"><input type="checkbox" id="${qkey(W,D,id)}" data-q="${id}" ${S.get(qkey(W,D,id),false)?'checked':''}><span>${t}<small>${s}</small></span></label>`).join('')}</div></section>`;
  $('day').innerHTML=h;
  if(p.rest)$('day').insertAdjacentHTML('beforeend','<section class="win rest" style="margin-top:14px"><b>Recovery</b><p class="cue">Muscles grow on rest days. Hit your steps with an easy walk, eat your protein, sleep early.</p></section>');
  let n=0;
  p.blocks.forEach(bl=>{
    const sec=document.createElement('section');sec.className='block';sec.style.setProperty('--c',COL[bl.kind]);
    sec.innerHTML=`<div class="bhead"><h3>${bl.label}</h3><span class="min">${bl.min} min</span>${bl.how?`<span class="how">${bl.how}</span>`:''}</div>`;
    if(bl.text)sec.insertAdjacentHTML('beforeend',`<p class="btext">${bl.text}</p>`);
    if(bl.items){const g=document.createElement('div');g.className='grid';
      bl.items.forEach(([key,dose])=>{n++;const e=EX[key],c=document.createElement('article');c.className='card';
        const fg=document.createElement('div');fg.className='fig';fg.appendChild(svgFor(key,COL[bl.kind]));c.appendChild(fg);
        c.insertAdjacentHTML('beforeend',`<div class="info"><div class="top"><span class="tag">${e[1]}</span><span class="num">${String(n).padStart(2,'0')}</span></div><h4>${e[0]}</h4><div class="dose">${dose}</div><p class="cue">${e[2]}</p></div>`);
        g.appendChild(c)});sec.appendChild(g)}
    $('day').appendChild(sec);
  });
  if(p.test)$('day').insertAdjacentHTML('beforeend',testPanel('final','D-Rank assessment results',true));
  // meals
  const m=MEALS[D],wt=weight();
  let mh=`<section class="block" style="--c:var(--gold)"><div class="bhead diethead"><h3>Today's meals</h3><div class="seg" id="diet">${['Veg','Veg + egg','Non-veg'].map((l,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===DIET}">${l}</button>`).join('')}</div></div>
   <div class="meals">
    <div class="meal"><div class="t"><b>On waking</b><time>6:30</time></div><p>1 glass warm water, 5 soaked almonds and 2 walnuts.</p></div>
    <div class="meal"><div class="t"><b>Breakfast</b><time>8:00</time></div><p>${m.bf[DIET]}</p><span class="p">Protein focus</span></div>
    <div class="meal"><div class="t"><b>Lunch</b><time>13:30</time></div><p>${m.ln[DIET]}</p><span class="p">Half the plate vegetables or salad</span></div>
    <div class="meal"><div class="t"><b>Pre-gym snack</b><time>17:00</time></div><p>${m.sn[DIET]}</p><span class="p">Training in the morning? Eat this before the gym instead.</span></div>
    <div class="meal"><div class="t"><b>Dinner</b><time>20:00</time></div><p>${m.dn[DIET]}</p><span class="p">Light. Finish 2–3 hours before bed.</span></div>
    <div class="meal"><div class="t"><b>Phase ${ph+1} diet rules</b></div><ul style="margin:0;padding-left:18px;font-size:14px">${DIETFOCUS[ph].map(x=>`<li>${x}</li>`).join('')}</ul></div>
   </div><p class="cue">Portions: 1 phulka is palm-sized without ghee. 1 cup of cooked rice is a fist. 1 bowl of dal is about 200 ml. Cook with 2–3 tsp of oil per person per day in total. Today's target is about ${Math.round(wt*1.6)} g protein.</p></section>`;
  $('day').insertAdjacentHTML('beforeend',mh);
  if(W===1&&D===0)$('day').insertAdjacentHTML('beforeend',testPanel('base','Starting stats · E-Rank',false));
  t0=performance.now();if(reduce)loop(t0-650);
}

/* ---------- events ---------- */
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.q){S.set(t.id,t.checked);renderNav();progress()}
  if(t.dataset.k){const key=t.id.split('-')[1];const o=S.get('test:'+key,{});const v=parseFloat(t.value);if(isNaN(v))delete o[t.dataset.k];else o[t.dataset.k]=v;S.set('test:'+key,o);if(key==='final')render()}
});
document.addEventListener('click',e=>{const b=e.target.closest('#diet button');if(b){DIET=+b.dataset.i;S.set('diet',DIET);render()}});

/* =====================================================================
   APP SHELL — tabs, start date, progress log, rest timer, backup
   ===================================================================== */

/* ---------- dates & "today" ---------- */
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseYmd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
if(!S.get('start',null))S.set('start',ymd(mondayOf(new Date())));
function todayPos(){
  const start=mondayOf(parseYmd(S.get('start'))),now=new Date();
  const days=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate())-start)/864e5);
  return {w:Math.max(1,Math.min(12,Math.floor(days/7)+1)),d:(now.getDay()+6)%7,days};
}
function goToday(){const t=todayPos();W=t.w;D=t.d;S.set('week',W);S.set('day',D);render();rankBadge()}

/* ---------- rank badge ---------- */
function rankBadge(){
  const fin=S.get('test:final',{});
  const passed=fin.push>=15&&fin.plank>=60&&fin.walk>0&&fin.walk<18;
  const t=todayPos();
  let r='E',sub=`Week ${t.w} of 12`;
  if(passed){r='D';sub='Rank up complete'}
  else if(t.days<0){sub='Starts '+S.get('start')}
  $('rank').textContent=r;$('ranksub').textContent=sub;
}

/* ---------- tabs ---------- */
const VIEWS=['today','progress','timer','settings'];
function showView(v){
  VIEWS.forEach(x=>{$('v-'+x).hidden=x!==v;$('tab-'+x).setAttribute('aria-current',x===v?'page':'false')});
  S.set('view',v);window.scrollTo(0,0);
  if(v==='progress')renderLog();
}
VIEWS.forEach(v=>$('tab-'+v).addEventListener('click',()=>showView(v)));
$('btn-today').addEventListener('click',goToday);

/* ---------- progress log ---------- */
const LOGKEY='log';
function getLog(){return S.get(LOGKEY,[]).sort((a,b)=>a.date<b.date?-1:1)}
function chart(el,rows,key,unit,color){
  const pts=rows.filter(r=>r[key]!=null);
  if(pts.length<2){el.innerHTML=`<p class="cue empty">Add at least 2 entries to see your ${key==='wt'?'weight':'waist'} trend.</p>`;return}
  const Wd=600,Ht=260,pl=64,pr=16,pt=34,pb=40;
  const t0=parseYmd(pts[0].date).getTime(),t1=parseYmd(pts[pts.length-1].date).getTime();
  let lo=Math.min(...pts.map(p=>p[key])),hi=Math.max(...pts.map(p=>p[key]));
  const pad=Math.max(1,(hi-lo)*0.15);lo=Math.floor(lo-pad);hi=Math.ceil(hi+pad);
  const X=t=>pl+(t1===t0?0.5:(t-t0)/(t1-t0))*(Wd-pl-pr),Y=v=>pt+(hi-v)/(hi-lo)*(Ht-pt-pb);
  const ticks=[lo,(lo+hi)/2,hi];
  const line=pts.map(p=>`${X(parseYmd(p.date).getTime()).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ');
  const last=pts[pts.length-1],first=pts[0],delta=(last[key]-first[key]).toFixed(1);
  el.innerHTML=`<div class="chart-head"><span class="k">${key==='wt'?'Weight':'Waist at navel'}</span><span class="delta ${delta<=0?'good':'bad'}">${delta>0?'+':''}${delta} ${unit} since start</span></div>
  <svg viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="${key} trend">
   ${ticks.map(v=>`<line x1="${pl}" x2="${Wd-pr}" y1="${Y(v)}" y2="${Y(v)}" class="grid-l"/><text x="${pl-10}" y="${Y(v)+7}" class="ax" text-anchor="end">${(+v).toFixed(v%1?1:0)}</text>`).join('')}
   <text x="${pl}" y="${Ht-10}" class="ax">${first.date.slice(5)}</text><text x="${Wd-pr}" y="${Ht-10}" class="ax" text-anchor="end">${last.date.slice(5)}</text>
   <polygon points="${X(t0)},${Ht-pb} ${line} ${X(t1)},${Ht-pb}" fill="${color}" fill-opacity=".12"/>
   <polyline points="${line}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
   ${pts.map(p=>`<circle cx="${X(parseYmd(p.date).getTime())}" cy="${Y(p[key])}" r="5" fill="${color}"/>`).join('')}
   <circle cx="${X(t1)}" cy="${Y(last[key])}" r="9" fill="var(--bg)" stroke="${color}" stroke-width="4"/>
   <text x="${Math.min(X(t1),Wd-pr-4)}" y="${Y(last[key])-18}" class="ax lastv" text-anchor="end">${last[key]} ${unit}</text>
  </svg>`;
}
function renderLog(){
  const rows=getLog();
  chart($('chart-wt'),rows,'wt','kg','var(--cyan)');
  chart($('chart-waist'),rows,'waist','cm','var(--gold)');
  $('log-list').innerHTML=rows.length?rows.slice().reverse().map(r=>`<tr><td>${r.date}</td><td>${r.wt??'–'}</td><td>${r.waist??'–'}</td><td><button type="button" class="del" data-date="${r.date}" aria-label="Delete ${r.date}">✕</button></td></tr>`).join('')
    :'<tr><td colspan="4" class="cue">No entries yet. Weigh yourself in the morning, before breakfast, once a week.</td></tr>';
}
$('log-date').value=ymd(new Date());
$('log-form').addEventListener('submit',e=>{
  e.preventDefault();
  const date=$('log-date').value,wt=parseFloat($('log-wt').value),waist=parseFloat($('log-waist').value);
  if(!date||(isNaN(wt)&&isNaN(waist))){$('log-msg').textContent='Enter a date and at least one measurement.';return}
  const rows=getLog().filter(r=>r.date!==date);
  rows.push({date,wt:isNaN(wt)?null:wt,waist:isNaN(waist)?null:waist});S.set(LOGKEY,rows);
  if(!isNaN(wt)){$('wt').value=wt;S.set('wt',wt);stats();render();progress()}
  $('log-wt').value='';$('log-waist').value='';$('log-msg').textContent=`Saved ${date}.`;renderLog();
});
$('log-list').addEventListener('click',e=>{const b=e.target.closest('.del');if(!b)return;
  if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Delete?';b.classList.add('arm');setTimeout(()=>{if(b.isConnected){b.dataset.confirm='';b.textContent='✕';b.classList.remove('arm')}},3000);return}
  S.set(LOGKEY,getLog().filter(r=>r.date!==b.dataset.date));renderLog()});

/* ---------- rest timer ---------- */
let tTotal=S.get('timer',90),tLeft=tTotal,tEnd=0,tRun=false,tInt=null,sets=0,actx=null,lock=null;
function fmt(s){s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function drawTimer(){
  $('t-time').textContent=fmt(tLeft);
  const f=tTotal?tLeft/tTotal:0;$('t-ring').style.strokeDashoffset=(1-f)*part;
  $('t-start').textContent=tRun?'Pause':(tLeft<tTotal&&tLeft>0?'Resume':'Start rest');
  $('t-sets').textContent=sets;
  document.querySelectorAll('#t-presets button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===tTotal));
}
const part=2*Math.PI*88;$('t-ring').style.strokeDasharray=part;
function beep(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();[0,.25,.5].forEach(o=>{const os=actx.createOscillator(),g=actx.createGain();os.frequency.value=880;os.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.25,actx.currentTime+o);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+o+.2);os.start(actx.currentTime+o);os.stop(actx.currentTime+o+.2)})}catch(e){}}
async function wake(on){try{if(on&&'wakeLock' in navigator)lock=await navigator.wakeLock.request('screen');else if(lock){lock.release();lock=null}}catch(e){}}
function tick(){tLeft=(tEnd-Date.now())/1000;if(tLeft<=0){tLeft=0;tRun=false;clearInterval(tInt);beep();navigator.vibrate&&navigator.vibrate([300,120,300,120,300]);$('t-done').hidden=false;wake(false)}drawTimer()}
$('t-start').addEventListener('click',()=>{
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}
  if(tRun){tRun=false;clearInterval(tInt);wake(false)}
  else{if(tLeft<=0)tLeft=tTotal;tEnd=Date.now()+tLeft*1000;tRun=true;$('t-done').hidden=true;tInt=setInterval(tick,200);wake(true)}
  drawTimer();
});
$('t-reset').addEventListener('click',()=>{tRun=false;clearInterval(tInt);tLeft=tTotal;$('t-done').hidden=true;wake(false);drawTimer()});
$('t-presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tTotal=+b.dataset.s;S.set('timer',tTotal);tRun=false;clearInterval(tInt);tLeft=tTotal;$('t-done').hidden=true;drawTimer()});
$('t-plus').addEventListener('click',()=>{sets++;drawTimer()});
$('t-minus').addEventListener('click',()=>{sets=Math.max(0,sets-1);drawTimer()});
$('t-setdone').addEventListener('click',()=>{sets++;tLeft=tTotal;tEnd=Date.now()+tLeft*1000;tRun=true;clearInterval(tInt);tInt=setInterval(tick,200);$('t-done').hidden=true;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}wake(true);drawTimer()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tRun)tick()});

/* ---------- settings & backup ---------- */
$('start').value=S.get('start');
$('start').addEventListener('change',()=>{if($('start').value){S.set('start',ymd(mondayOf(parseYmd($('start').value))));$('start').value=S.get('start');goToday()}});
function allData(){const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('erank:'))o[k]=localStorage.getItem(k)}}catch(e){}return o}
$('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({app:'erank',saved:new Date().toISOString(),data:allData()},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`erank-backup-${ymd(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();
  $('backup-msg').textContent='Backup file saved to your Downloads.';
});
$('import').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const j=JSON.parse(await f.text());if(j.app!=='erank'||!j.data)throw 0;
    Object.entries(j.data).forEach(([k,v])=>{if(k.startsWith('erank:'))localStorage.setItem(k,v)});
    $('backup-msg').textContent='Backup restored. Reloading…';setTimeout(()=>location.reload(),800);
  }catch(err){$('backup-msg').textContent='That file is not an E-Rank backup. Choose a file named erank-backup-….json.'}
});
$('reset').addEventListener('click',()=>{
  const b=$('reset');
  if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Tap again to erase everything';setTimeout(()=>{b.dataset.confirm='';b.textContent='Erase all progress'},4000);return}
  Object.keys(allData()).forEach(k=>localStorage.removeItem(k));location.reload();
});

/* ---------- install prompt ---------- */
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').hidden=false});
$('install').addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('install').hidden=true});

/* ---------- service worker (offline) ---------- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}

/* ---------- boot ---------- */
$('wt').value=S.get('wt',72);
$('wt').addEventListener('input',()=>{S.set('wt',$('wt').value);stats();});
$('wt').addEventListener('change',()=>{render();progress()});
stats();goToday();progress();drawTimer();showView(S.get('view','today'));
if(!reduce)requestAnimationFrame(loop);

})();
