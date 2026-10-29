/* ARETE — the ONE Mission: Futurnyx → your own company by 38.
   Built for 8 hours a week: 5 weekday Money hours (8:45–9:45 pm) + a 3-hour Sunday block.
   Each step: [title, why, how (array), time estimate]. Do them in order. One at a time. */
(function(){
const PHASES=[
 {n:'Phase 1 · First rupee',months:'Months 1–3',target:'First 10 paying students',goal:5000,steps:[
  ['Get clarity from Cizmak','You are HOD with a revenue share. Teaching students is usually fine, but confirm in writing so nothing can hurt your job or your company later.',['Read the side-work, non-compete and IP clauses in your contract','If anything is unclear, ask HR or the directors in writing: "I plan to sell online engineering courses to students in my own time"','Save the reply'],'1 money hour'],
  ['Pick ONE product','Focus beats variety. Your CAESAR II course already has content and is the fastest to sell.',['Decide: relaunch the CAESAR II pipe stress course first','Pause everything else for 6 months (see the Parking lot)','Write one sentence: "I help ___ achieve ___ in ___ days"'],'1 money hour'],
  ['Quick cash: paid 1-on-1 sessions','The fastest money needs no product: sell your expertise by the hour while the course is being built. It also proves people will pay you.',['Offer on LinkedIn and engineering groups: CAESAR II doubt-solving, mock interviews and resume review for stress engineers','Price ₹1,000–2,000 per hour, paid in advance (UPI)','Run sessions only in the Sunday block, max 2 per Sunday','Note every question people ask. They become your course lessons'],'1 money hour to post, then Sundays'],
  ['Audit what you already have','You may be closer to launch than you think.',['List every recorded lesson, script and slide deck','Mark each module: ready / needs editing / missing','Count how many lessons are missing'],'Sunday block'],
  ['Write the offer and price','People pay for results, not hours of video.',['Outcome: e.g. "Job-ready in CAESAR II stress analysis in 60 days"','Include: lessons, 2 real project files, certificate, 1 live doubt session a month','Price it: early-bird ₹4,999, regular ₹9,999 (adjust after 10 sales)'],'2 money hours'],
  ['Set up selling','You need a page where people can pay you while you sleep.',['Choose a course platform with Indian payments (compare 2–3 options; pick one in 1 hour)','Upload the ready lessons','Write the sales page using your offer from the last step'],'Sunday block × 2'],
  ['Record the missing lessons','A few lessons per week is enough.',['2 short lessons per money hour (2–5 min each, your existing style)','Batch editing on Sunday','Keep it simple: screen recording + clear voice beats fancy editing'],'4–6 weeks of money hours'],
  ['Pre-sell to your network','Selling before finishing proves demand and funds the rest.',['Post on LinkedIn: a real stress-analysis mistake and what it cost (2 posts a week)','Share in engineering WhatsApp / Telegram groups and alumni groups','Message 20 junior engineers you know: early-bird offer for the first 10'],'Ongoing, 2 money hours a week'],
  ['Land 10 students','Your first 10 customers teach you what to fix and give you testimonials.',['Personally onboard each student','Ask for feedback after week 2','Collect 5 testimonials (text or 30-second video)'],'Until done']]},
 {n:'Phase 2 · Steady income',months:'Months 4–9',target:'₹50,000 a month',goal:50000,steps:[
  ['Build a content system','Content sells your course while you are at the office.',['Sunday: batch-write 2 LinkedIn posts + 1 short video script','Repost student wins','One topic per week from real project experience'],'1 h of Sunday block'],
  ['Monthly live doubt session','Live sessions build trust and justify a higher price.',['Last Sunday of the month, 60 min on Zoom / Google Meet','Record it and add it to the course'],'1 Sunday a month'],
  ['Second course: PV Elite','Same buyers, second product. You already have the content plan.',['Reuse the CAESAR II structure','Sell to existing students first at a bundle price'],'8–10 weeks of money hours'],
  ['Pitch colleges and training institutes','One B2B deal can equal 20 individual sales.',['List 15 mechanical engineering colleges and training institutes near Pune','Offer a 2-day CAESAR II workshop with certificates','Email 5 per week, follow up once'],'2 money hours a week'],
  ['Hire a part-time editor','Your time is the bottleneck. Buy it back.',['Freelance video editor for ₹3–5k a month','You record, they edit and upload'],'1 money hour'],
  ['Separate business money','Clean accounts from day one make the company easy later.',['Separate bank account for course income','Simple monthly sheet: revenue, costs, profit'],'1 money hour']]},
 {n:'Phase 3 · Real company',months:'Months 10–18',target:'₹2 lakh a month',goal:200000,steps:[
  ['Register Futurnyx','You become a company, not a side hustle.',['Meet a CA: LLP or Private Limited, GST, accounting','Trademark the Futurnyx name'],'2 money hours + CA visit'],
  ['Cohort program','Higher price, better results, word of mouth.',['8-week cohort with weekly Sunday live session','Placement or interview-prep support','Price 2–3× the self-paced course'],'Ongoing'],
  ['Corporate training','EPC companies need trained engineers fast.',['Package a 3-day in-house training','Pitch to 10 companies (avoid Cizmak competitors if your contract says so)'],'2 money hours a week'],
  ['First team members','You stop doing everything yourself.',['Part-time assistant for sales follow-ups and student support','A teaching assistant from your best students'],'Sunday block'],
  ['Third course and bundle','More products for the same customers.',['Pick from: piping design basics, ASME B31.3 code, FEA for piping','All-access membership bundle'],'10 weeks']]},
 {n:'Phase 4 · Replace the salary',months:'Months 19–30',target:'₹5–8 lakh a month',goal:500000,steps:[
  ['International students','Middle East and Southeast Asia pay more for the same skills.',['English course versions and USD pricing','Partner with 2 overseas training institutes'],'Ongoing'],
  ['Software tool MVP','Software sells many times with no extra hours.',['Pick the isometric checker or a stress-calculation helper','Build with a freelance developer; you define the engineering logic'],'3–6 months'],
  ['Team of 5','A company that runs without you every hour.',['Sales, operations, 2 trainers, editor','Written SOPs for each role'],'Ongoing'],
  ['Build your runway','Leave the job only when it is safe.',['Save 12 months of family expenses','Business income at least equal to your salary for 6 months in a row'],'Ongoing']]},
 {n:'Phase 5 · Full-time founder',months:'Months 31–36 (by 38)',target:'Business pays more than your job',goal:800000,steps:[
  ['Plan the exit','Leave well. Your Cizmak network may become your client base.',['Agree a notice period and handover plan','Keep relationships strong'],'3 months'],
  ['Go full-time','Your own company, before 38.',['Full days on sales, product and team','Set the next 3-year plan: ₹10 Cr revenue, then ₹100 Cr net worth'],'Day 1 of the rest of it']]}
];

/* Paused ideas: good ideas, wrong time. Revisit after Phase 2 target is hit. */
const PARKING=['The Night Adjuster horror channel','QA Esports relaunch','Train With Areto fitness shorts','Document scanner app','Stress analysis engine from scratch (comes back in Phase 4 as the software tool)','Freelance consulting (time + contract risk)'];

const WEEK=[
 ['Mon–Sat','5:45','Wake'],['Mon–Sat','6:15–7:30','Gym'],['Mon–Sat','9:00 / 19:00','Commute: audiobook + 5-min pelvic floor'],['Mon–Sat','13:30','Lunch + 10–15 min walk'],
 ['Mon–Fri','20:45–21:45','Money hour (Mission)'],['Saturday','20:45–21:45','Free night / family'],['Sunday','9:30–12:30','Sunday power block (Mission)'],['Sunday','18:00','Weekly review (20 min)'],['Daily','22:00 / 22:30','10 pages · sleep']
];

window.Mission={PHASES,PARKING,WEEK};
})();
