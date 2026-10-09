/* Hunter System — WEALTH system data: ranks to ₹100 Cr in 5 years, missions, categories.
   Not financial advice. Verify tax, legal and investment decisions with a qualified CA / adviser. */
(function(){
const CR=1e7,L=1e5;
/* month = target month from plan start. Criteria are checked against your logged data. */
const RANKS=[
 {r:'E',to:'D',month:6,name:'E-Rank · Foundation',goal:'Know your numbers, protect your family, stop leaks, earn your first side income.',
  crit:[['tracked','Months of money tracked','≥',3,''],['efund','Emergency fund (months of expenses)','≥',6,''],['baddebt','Credit card + personal loan debt','≤',0,'₹'],['srate','Savings rate, last 3 months','≥',30,'%'],['sideTotal','Total side income earned','≥',1,'₹'],['m_insure','Term + health insurance in place','done',1,'']]},
 {r:'D',to:'C',month:18,name:'D-Rank · Launch',goal:'Futurnyx relaunched as a real company. Side income becomes a second salary.',
  crit:[['side3','Side income, avg last 3 months','≥',2*L,'₹'],['customers','Paying customers (total)','≥',50,''],['m_register','Futurnyx registered as a company','done',1,''],['nw','Net worth','≥',50*L,'₹']]},
 {r:'C',to:'B',month:30,name:'C-Rank · Scale',goal:'₹1 Cr a year business with a team. You stop doing everything yourself.',
  crit:[['runrate','Business revenue run-rate (yearly)','≥',1*CR,'₹'],['team','Team size','≥',5,''],['nw','Net worth','≥',1*CR,'₹']]},
 {r:'B',to:'A',month:42,name:'B-Rank · Company',goal:'₹10 Cr revenue, profitable, products that sell without you.',
  crit:[['runrate','Business revenue run-rate (yearly)','≥',10*CR,'₹'],['margin','Profit margin, last 3 months','≥',20,'%'],['nw','Net worth incl. business stake','≥',10*CR,'₹']]},
 {r:'A',to:'S',month:60,name:'A-Rank · Empire',goal:'₹40 Cr+ revenue, leadership team, valuable equity. Final push to ₹100 Cr.',
  crit:[['runrate','Business revenue run-rate (yearly)','≥',40*CR,'₹'],['profit12','Profit, last 12 months','≥',8*CR,'₹'],['nw','Net worth incl. business stake','≥',100*CR,'₹']]}
];

/* Missions: one-off actions per rank. Keys starting m_ can be rank criteria. */
const MISSIONS={
 E:[['m_networth','Write down every asset and every loan (first net worth snapshot)'],
    ['m_track30','Log every expense for 30 days'],
    ['m_efund','Build an emergency fund of 6 months of expenses (savings / liquid fund / FD)'],
    ['m_insure','Term life cover and family health insurance in place'],
    ['m_debt','Clear any credit card or personal loan debt'],
    ['m_sip','Automate investing the day after salary credit'],
    ['m_contract','Read your Cizmak contract: side work, non-compete and IP clauses. Get written clarity before paid freelance in the same field'],
    ['m_offer','Write Futurnyx offer #1 as an outcome with a price (e.g. job-ready CAESAR II in 60 days)'],
    ['m_freelance','Write a fixed-price freelance package (e.g. stress analysis or PV design review)'],
    ['m_bank','Open a separate bank account for side income'],
    ['m_first','Get your first paying customer']],
 D:[['m_register','Register Futurnyx (LLP or Pvt Ltd: decide with a CA); GST when required'],
    ['m_platform','Website, payments and course platform live'],
    ['m_relaunch','Relaunch the CAESAR II and PV Elite courses'],
    ['m_content','Content engine: 3 LinkedIn posts + 1 video a week for 12 weeks'],
    ['m_testimonials','Collect 10 written or video testimonials'],
    ['m_b2b','Pitch corporate training to 10 EPC / engineering companies'],
    ['m_firsthire','Hire your first freelancer (video editing, admin)'],
    ['m_pipeline','Weekly sales pipeline review for 12 weeks'],
    ['m_unit','Know your cost per customer and profit per customer']],
 C:[['m_cohort','Launch a cohort program with placement support'],
    ['m_services','Start an engineering services arm (overflow work from EPCs), with legal clarity'],
    ['m_sops','Write SOPs for course delivery, sales and support'],
    ['m_team5','Team of 5 with clear roles'],
    ['m_tool','Ship the first software tool MVP (isometric checker or stress engine demo)'],
    ['m_global','Sell to one foreign market (Middle East or Southeast Asia)'],
    ['m_runway','Decide your full-time transition plan with 12 months of personal runway saved']],
 B:[['m_ca','Hire a CA / finance head; monthly P&L and audited books'],
    ['m_saas','Software product with paying subscribers'],
    ['m_partners','5 partnerships (colleges, software resellers, EPC firms)'],
    ['m_valuation','Get a professional valuation of the company'],
    ['m_capital','Decide: bootstrap or raise capital (with a strategic partner or investor)'],
    ['m_diversify','Move part of yearly profit into investments outside the business']],
 A:[['m_leaders','Leadership team running sales, delivery and product'],
    ['m_esop','ESOP pool to keep key people'],
    ['m_acquire','Acquire or merge with a smaller training or engineering firm'],
    ['m_brand','Recognised brand: conference talks, industry partnerships'],
    ['m_will','Will, nominations and estate plan done']],
 S:[['m_freedom','Business runs without you day to day'],['m_give','Give back: scholarships for engineering students']]
};

const INCOME=['Salary','Freelance','Futurnyx','Other income'];
const EXPENSE=['Food & groceries','Eating out','Rent / EMI','Bills & utilities','Transport','Shopping','Family','Health','Education','Fun','Business costs','Other'];
const INVEST=['SIP / mutual funds','Stocks','FD / RD','PPF / EPF / NPS','Gold','Plot fund','Into business'];
const ASSETS=[['bank','Bank + cash'],['fd','FD / RD / liquid funds'],['mf','Mutual funds'],['stocks','Stocks'],['retire','EPF / PPF / NPS'],['gold','Gold'],['property','Property / plot'],['business','Business stake (your share)'],['other','Other assets']];
const LIABS=[['home','Home loan'],['car','Vehicle loan'],['personal','Personal loan'],['card','Credit card dues'],['other','Other loans']];
const ACTIONS=[['outreach','Outreach message'],['call','Sales call'],['proposal','Proposal sent'],['content','Content published'],['product','Product / course work'],['delivery','Client delivery']];

window.Wealth={RANKS,MISSIONS,INCOME,EXPENSE,INVEST,ASSETS,LIABS,ACTIONS,CR,L};
})();
