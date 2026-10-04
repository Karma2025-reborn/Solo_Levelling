/* Hunter System — meals, daily timeline and diet rules.
   Variants are [pure veg, veg + egg, non-veg]. */
(function(){
const V=(a,b,c)=>[a,b??a,c??b??a];
const PG=[ // pre-gym (light, fast)
 V('1 banana + black coffee or black tea (no sugar)'),
 V('2 dates + 1 small banana + black coffee'),
 V('1 multigrain toast + 1 tsp peanut butter'),
 V('1 banana + 10 almonds'),
 V('1 apple + black coffee'),
 V('1 banana + black coffee'),
 V('1 small bowl poha (half portion)')];
const BF=[ // breakfast
 V('Besan chilla (2) stuffed with 60 g paneer + green chutney','3-egg vegetable omelette + 1 multigrain toast','3-egg vegetable omelette + 1 multigrain toast'),
 V('Moong dal chilla (2) + 1 bowl curd','Moong dal chilla (2) + 2 boiled eggs','Moong dal chilla (2) + 2 boiled eggs'),
 V('Vegetable poha + 1 bowl curd + 30 g roasted peanuts','Vegetable poha + 2 boiled eggs','Vegetable poha + 2 boiled eggs'),
 V('3 idli + sambar + 60 g paneer cubes','3 idli + sambar + 2 boiled eggs','3 idli + sambar + 2 boiled eggs'),
 V('Vegetable daliya + 1 bowl curd','Vegetable daliya + 2 boiled eggs','Vegetable daliya + 2 boiled eggs'),
 V('1 paneer paratha (little oil) + curd','1 paratha + 2-egg omelette','1 paratha + 2-egg omelette'),
 V('Vegetable upma + 1 bowl curd','Vegetable upma + 2 boiled eggs','Vegetable upma + 2 boiled eggs')];
const MM=[ // mid-morning
 V('1 guava or orange + 1 glass buttermilk'),
 V('Sprouts chaat (1 bowl)','Sprouts chaat + 1 boiled egg','Sprouts chaat + 1 boiled egg'),
 V('1 apple + 15 g peanuts'),
 V('1 bowl curd + 1 tsp chia seeds + fruit'),
 V('30 g roasted chana + green tea','30 g roasted chana + 1 boiled egg','30 g roasted chana + 1 boiled egg'),
 V('Papaya bowl + buttermilk'),
 V('1 fruit + 10 almonds')];
const LN=[
 V('2 phulka + dal + 75 g paneer sabzi + salad + curd','2 phulka + dal + 2 boiled eggs + sabzi + salad','2 phulka + 150 g chicken curry + sabzi + salad + curd'),
 V('1 cup rice + rajma + salad + curd','1 cup rice + rajma + 2 boiled eggs + salad','1 cup rice + 150 g fish curry + salad'),
 V('2 phulka + chole + salad + curd','2 phulka + chole + 2 boiled eggs + salad','2 phulka + 150 g chicken curry + salad + curd'),
 V('2 phulka + dal + palak paneer + salad','2 phulka + dal + egg bhurji (2) + salad','2 phulka + 150 g chicken + dal + salad'),
 V('1 cup rice + dal + soya sabzi + salad','1 cup rice + dal + egg curry (2) + salad','1 cup rice + 150 g chicken curry + salad'),
 V('2 phulka + dal + mixed sabzi + salad + curd','2 phulka + dal + 2 boiled eggs + sabzi','2 phulka + 150 g mutton or chicken + salad'),
 V('Home-style thali, normal portions. From week 9 this is your one weekly treat meal.')];
const SN=[
 V('30 g roasted chana + green tea','2 boiled eggs + green tea','2 boiled eggs + green tea'),
 V('Sprouts chaat + buttermilk'),
 V('1 glass milk (no sugar) + 1 fruit'),
 V('Makhana (1 cup, dry roasted) + green tea'),
 V('Buttermilk + 15 g peanuts','Buttermilk + 2 boiled eggs','Buttermilk + 2 boiled eggs'),
 V('Paneer tikka 50 g','2 boiled eggs + cucumber','2 boiled eggs + cucumber'),
 V('1 fruit + green tea')];
const DN=[
 V('100 g paneer bhurji + sautéed vegetables + 1 roti','3-egg bhurji + sautéed vegetables + 1 roti','150 g grilled chicken + sautéed vegetables + 1 roti'),
 V('Soya chunk sabzi (50 g dry) + 1 roti + salad','Egg curry (3 eggs) + 1 roti + salad','Chicken tikka 150 g + salad + 1 roti'),
 V('Moong dal khichdi (1 bowl) + curd + salad','Moong dal khichdi + 2-egg omelette','Moong dal khichdi + 100 g grilled chicken'),
 V('Paneer tikka 100 g + clear vegetable soup','Egg white bhurji (4 whites + 1 egg) + soup','150 g fish or chicken + clear soup'),
 V('100 g tofu or paneer stir-fry + 1 roti','3-egg bhurji + 1 roti + salad','150 g grilled chicken + 1 roti + salad'),
 V('Chana or rajma salad bowl + 75 g paneer','Egg and vegetable salad bowl (3 eggs)','Chicken salad bowl (150 g)'),
 V('Dal + sabzi + 1 roti + salad, light','2-egg omelette + sabzi + 1 roti','100 g chicken + sabzi + 1 roti')];

/* Timeline. type: water | meal | gym | supp | sleep. ml = share of the day's water. */
const MORNING=[
 ['06:00','wake','meal','Wake up','Warm water, then 5 soaked almonds + 2 walnuts',400],
 ['06:15','pg','meal','Pre-gym snack',null,0],
 ['06:45','gym','gym','Gym session','Take a 500 ml bottle and finish it by the end of the session',500],
 ['08:15','bf','meal','Breakfast (post-workout)','Protein first',250],
 ['09:30','w1','water','Water',null,300],
 ['11:00','mm','meal','Mid-morning snack',null,250],
 ['12:30','w2','water','Water',null,300],
 ['13:30','ln','meal','Lunch','Half the plate vegetables or salad',0],
 ['15:00','w3','water','Water',null,300],
 ['16:30','sn','meal','Evening snack',null,250],
 ['18:00','w4','water','Water',null,300],
 ['19:30','dn','meal','Dinner','Light. 2–3 hours before bed',0],
 ['20:00','ash','supp','Ashwagandha','1 tablet after dinner',0],
 ['20:30','w5','water','Water','Last big glass of the day',250],
 ['21:45','mag','supp','Magnesium glycinate','Check the label for the elemental dose',0],
 ['22:00','screens','sleep','Screens off','Dim lights, no phone in bed',0],
 ['22:30','sleep','sleep','Sleep','7–8 hours. Muscle grows tonight',0]];
const EVENING=[
 ['06:00','wake','meal','Wake up','Warm water, then 5 soaked almonds + 2 walnuts',400],
 ['08:00','bf','meal','Breakfast',null,250],
 ['09:30','w1','water','Water',null,300],
 ['11:00','mm','meal','Mid-morning snack',null,250],
 ['12:30','w2','water','Water',null,300],
 ['13:30','ln','meal','Lunch','Half the plate vegetables or salad',0],
 ['15:00','w3','water','Water',null,300],
 ['16:45','pg','meal','Pre-gym snack',null,250],
 ['17:30','gym','gym','Gym session','Take a 500 ml bottle and finish it by the end of the session',500],
 ['19:15','dn','meal','Dinner (post-workout)','Protein first, 2–3 hours before bed',250],
 ['20:00','ash','supp','Ashwagandha','1 tablet after dinner',0],
 ['20:30','w5','water','Water','Last big glass of the day',300],
 ['21:45','mag','supp','Magnesium glycinate','Check the label for the elemental dose',0],
 ['22:00','screens','sleep','Screens off','Dim lights, no phone in bed',0],
 ['22:30','sleep','sleep','Sleep','7–8 hours. Muscle grows tonight',0]];
const MEALMAP={pg:PG,bf:BF,mm:MM,ln:LN,sn:SN,dn:DN};

function timeline(gym,dayIdx,diet,isRest,waterL,supps){
  const base=gym==='evening'?EVENING:MORNING;
  const total=base.reduce((a,r)=>a+r[5],0),scale=waterL*1000/total;
  return base.filter(r=>!(isRest&&(r[1]==='gym'||r[1]==='pg'))&&(supps||r[2]!=='supp')).map(([time,id,type,title,note,ml])=>{
    const meal=MEALMAP[id]?MEALMAP[id][dayIdx][diet]:null;
    const water=ml?Math.round(ml*scale/50)*50:0;
    return {time,id,type,title,detail:meal||note||'',note:meal?note:'',ml:water};
  });
}

const RULES={
 E0:['Week 1: chai with half the sugar. Week 2 onward: no sugar at all.','Stop fried snacks, cold drinks, biscuits and namkeen completely.','Protein in every meal, even if portions are small at first.','Finish dinner by 8:30 pm.'],
 E1:['Hit your protein target every day. Short? 1 scoop whey in water covers about 24 g.','Dinner: drop to 1 roti and double the sabzi or salad.','Curd or buttermilk with lunch daily.','Eat the pre-gym snack 30–45 min before training.'],
 E2:['Most carbs (rice, roti, fruit) at breakfast and lunch.','Dinner: protein + vegetables, 1 roti at most.','One treat meal per week, Sunday lunch. Not a whole treat day.','Hungry at night? 1 glass warm milk with haldi, no sugar.'],
 D:['Eat at maintenance: same food quantity as weeks 9–12, but never skip protein.','Protein 1.8 g per kg every day.','Carbs around training: pre-gym snack and breakfast carry most of your rice, roti and fruit.','Optional: creatine monohydrate 3–5 g daily with breakfast. Safe, cheap and helps strength.'],
 C:['Lean build: on training days add about 200 kcal (1 extra roti + 1 bowl curd).','Protein 1.8–2 g per kg.','Waist must not grow more than 1 cm a month. If it does, remove the extra roti.','Sleep 7.5–8 hours. Strength gains stop without it.'],
 B:['Cut: eat about 300–400 kcal below maintenance. Lunch: 1 roti or ½ cup rice. Dinner: no roti or rice.','Protein 2 g per kg to protect muscle.','No treat meal. One refeed (normal thali) every second Sunday instead.','Expect to lose 0.3–0.5 kg per week. Faster means you are losing muscle, so eat a little more.'],
 A:['Recomp: eat at maintenance on most days, a little more on Mon / Tue power days.','Protein 1.8 g per kg.','Keep sugar and fried food out. This is what keeps the cuts visible.','Hydrate well on long run days: add 500 ml extra.'],
 S:['Maintain: stay within 1–2 kg of your rank-up weight.','Protein 1.6–1.8 g per kg.','80 / 20: clean meals 80% of the time, enjoy the rest.','Re-test every 3 months to keep the S-Rank.']
};
function rulesFor(rank,w){if(rank==='E')return RULES['E'+(w<=4?0:w<=8?1:2)];return RULES[rank]}

window.Diet={timeline,rulesFor,DIETS:['Pure veg','Veg + egg','Non-veg']};
})();
