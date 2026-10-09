/* Hunter System — MIND (INT) system data: ranks, library, skill tracks, 52-week money curriculum. */
(function(){
/* Rank-up requirements are cumulative totals. */
const RANKS=[
 {r:'E',to:'D',name:'E-Rank · Awakened Mind',goal:'Build the daily habit: read, focus, learn money basics.',req:{books:3,deep:30,lessons:8,notes:20,courses:0,teach:0}},
 {r:'D',to:'C',name:'D-Rank · Apprentice',goal:'Steady reading, first course finished, money basics mastered.',req:{books:10,deep:150,lessons:20,notes:60,courses:1,teach:0}},
 {r:'C',to:'B',name:'C-Rank · Specialist',goal:'Deep expertise in your field and in business. Start teaching.',req:{books:25,deep:400,lessons:36,notes:150,courses:3,teach:10}},
 {r:'B',to:'A',name:'B-Rank · Strategist',goal:'Think like a CEO: strategy, finance, people.',req:{books:45,deep:800,lessons:52,notes:300,courses:5,teach:40}},
 {r:'A',to:'S',name:'A-Rank · Sage',goal:'Recognised authority. Your knowledge earns money while you sleep.',req:{books:70,deep:1500,lessons:52,notes:500,courses:8,teach:100}}
];
const REQLABEL={books:'Books finished',deep:'Deep-work hours',lessons:'Money lessons done',notes:'Insights written',courses:'Courses / certifications',teach:'Lessons or talks published'};

/* Curated reading list. Real books; pick what fits the current rank. */
const LIBRARY=[
 ['Habits & focus','Atomic Habits','James Clear',320],
 ['Habits & focus','Deep Work','Cal Newport',300],
 ['Habits & focus','Make It Stick','Brown, Roediger & McDaniel',330],
 ['Money','The Psychology of Money','Morgan Housel',250],
 ['Money','Let\'s Talk Money','Monika Halan',290],
 ['Money','Coffee Can Investing','Saurabh Mukherjea et al.',260],
 ['Money','The Richest Man in Babylon','George S. Clason',150],
 ['Money','The Intelligent Investor','Benjamin Graham',620],
 ['Business','The E-Myth Revisited','Michael E. Gerber',270],
 ['Business','$100M Offers','Alex Hormozi',200],
 ['Business','The Lean Startup','Eric Ries',300],
 ['Business','Built to Sell','John Warrillow',200],
 ['Business','Zero to One','Peter Thiel',220],
 ['Business','Company of One','Paul Jarvis',260],
 ['Leadership','The Effective Executive','Peter F. Drucker',210],
 ['Leadership','High Output Management','Andrew S. Grove',270],
 ['Leadership','Extreme Ownership','Jocko Willink & Leif Babin',320],
 ['Leadership','The Five Dysfunctions of a Team','Patrick Lencioni',230],
 ['Sales & marketing','Influence','Robert Cialdini',330],
 ['Sales & marketing','Building a StoryBrand','Donald Miller',240],
 ['Sales & marketing','Never Split the Difference','Chris Voss',270],
 ['AI & future','Co-Intelligence','Ethan Mollick',250],
 ['AI & future','Prediction Machines','Agrawal, Gans & Goldfarb',250],
 ['Thinking','Thinking, Fast and Slow','Daniel Kahneman',500],
 ['Thinking','The Almanack of Naval Ravikant','Eric Jorgenson',240]
];

/* Career skill tracks: 8 milestones each, ticked when done. */
const SKILLS=[
 {k:'lead',n:'Leadership (HOD role)',steps:['Write a one-page vision for your 5 departments','Hold weekly 1:1s with every project lead for 4 weeks','Set 3 measurable goals per department','Learn to delegate: hand off 3 tasks you still do yourself','Run a monthly review meeting with numbers, not opinions','Give structured feedback (situation, behaviour, impact) 10 times','Build a hiring scorecard and use it for every hire','Train a successor for your current technical work']},
 {k:'ai',n:'AI for engineering work',steps:['Use an AI assistant daily for 2 weeks on real tasks','Automate one repetitive report or checklist','Write 10 reusable prompts for proposals, reports and emails','Learn Python basics (variables, loops, files) in 20 hours','Automate a calculation you do in Excel with Python','Build a small tool your team uses every week','Teach your team one AI workflow','Prototype the piping isometric checker idea']},
 {k:'biz',n:'Business & sales',steps:['Write your offer: who, problem, result, price','Talk to 10 potential customers before building more','Get your first paying customer','Build a simple sales pipeline (lead → call → proposal → paid)','Learn pricing: anchor, packages, guarantees','Write 20 LinkedIn posts that teach engineering','Close your first B2B (company) deal','Read a profit and loss statement and a balance sheet without help']},
 {k:'tech',n:'Technical depth (stress engine)',steps:['Finish the pipe stress analysis curriculum module 1','Hand-calculate a simple thermal expansion problem','Code a beam stiffness matrix in Python','Code a 3D pipe element with thermal load','Validate results against CAESAR II for 3 cases','Add supports and boundary conditions','Write the code-check (B31.3 stress) module','Package it as a demo for Futurnyx students']}
];

/* 52-week money & business curriculum. India-focused basics. Rules change, so verify tax specifics each year. */
const LESSONS=[
 ['Net worth','Net worth = everything you own minus everything you owe. It is the only score that matters in the Wealth system.','Enter your first net worth snapshot in Wealth.'],
 ['Track every rupee','You cannot cut what you cannot see. Most people underestimate spending by 20–30%.','Log every expense for 7 days straight.'],
 ['Savings rate','Savings rate = (income − expenses) ÷ income. It matters more than investment returns in the early years.','Calculate last month\'s savings rate in Wealth.'],
 ['Emergency fund','Keep 6 months of expenses in a savings account, liquid fund or FD so a crisis never forces you to sell investments or borrow.','Set the target amount and start a monthly transfer.'],
 ['Insurance first','Term life insurance protects your family; health insurance protects your savings. Investment-linked insurance policies usually do neither well.','List your current policies and their cover amounts.'],
 ['Bad debt','Credit card and personal loan interest (often 15–40% a year) beats any investment return. Kill it first.','List every loan with its interest rate, highest first.'],
 ['Compounding','Money grows on its gains. At 12% a year, money roughly doubles every 6 years. Time matters more than amount.','Use the reality check in Wealth to see your own curve.'],
 ['Inflation','At 6% inflation, ₹1 lakh today buys about ₹55,000 worth of goods in 10 years. Cash in a savings account slowly loses value.','Check what your bank savings rate is versus inflation.'],
 ['Asset classes','Equity (growth, volatile), debt (stable, lower return), gold (hedge), real estate (illiquid, leveraged). Each has a job.','Write which asset classes you own today.'],
 ['Mutual funds','A mutual fund pools money and is run by a manager. Direct plans have lower costs than regular plans sold through distributors.','Check whether your funds are direct or regular plans.'],
 ['Index funds','An index fund simply copies an index like the Nifty 50. Low cost, and over long periods most active funds fail to beat it.','Compare the expense ratio of your funds with a Nifty 50 index fund.'],
 ['SIP','A SIP invests a fixed amount every month, so you buy more units when prices fall. It removes timing and emotion.','Set your SIP date to the day after salary credit.'],
 ['Asset allocation','Decide a split, for example 70% equity and 30% debt, and rebalance once a year. Allocation drives most of your long-term result.','Write your target allocation.'],
 ['Tax basics','India has an old and a new income tax regime. Which saves more depends on your deductions. Rules change in each budget.','Ask your CA or use the official calculator to compare both regimes for this year.'],
 ['Tax-saving investments','ELSS, PPF, EPF and NPS have different lock-ins, returns and tax treatment. Do not buy products only to save tax.','Review your ELSS SIP: is it right for your goals?'],
 ['Capital gains','Profits on selling investments are taxed differently for short and long holding periods. Holding longer is usually cheaper.','Note the purchase dates of your investments.'],
 ['Goal planning','Every goal needs an amount, a date and a matching investment. Short goals (under 3 years) do not belong in equity.','Write the cost and date for your plot purchase goal.'],
 ['Property decisions','A plot or house is a big, illiquid bet. Compare total cost (stamp duty, interest, maintenance) against renting and investing.','Make a buy-vs-wait sheet for the plot.'],
 ['Lifestyle inflation','When income rises, spending quietly rises with it. Lock in half of every raise into investments before you feel it.','Decide what % of your next raise goes to SIP.'],
 ['Behaviour','Panic selling in a crash and buying after a rally destroy returns. A written plan stops emotional decisions.','Write one rule you will follow in a market crash.'],
 ['Business vs job','A salary is capped by your hours. A business can scale beyond your time, but only if it runs without you doing everything.','List 3 ways your knowledge can earn without your time.'],
 ['Offers','People buy outcomes, not courses. "Pass a stress-analysis job interview in 60 days" sells better than "CAESAR II course".','Rewrite your Futurnyx course as an outcome.'],
 ['Pricing','Price on value, not hours. Offer 3 packages; most buyers choose the middle one.','Draft 3 price tiers for one course or service.'],
 ['Customer acquisition','Cost to acquire a customer (CAC) must be much lower than what a customer pays you over time (LTV). Aim for LTV at least 3× CAC.','Estimate CAC and LTV for your first offer.'],
 ['Sales pipeline','Sales is a numbers game: leads → conversations → proposals → payments. Track each stage weekly.','Count your leads and conversations this month.'],
 ['Content engine','Teaching in public builds trust at scale. One deep piece a week beats daily low-value posts.','Plan 4 weeks of LinkedIn or YouTube topics.'],
 ['B2B vs B2C','Selling to companies means fewer, bigger deals and longer sales cycles. Selling to individuals means many small payments and more marketing.','Decide which comes first for Futurnyx.'],
 ['Company structure','Sole proprietor, LLP and private limited company differ in liability, compliance cost, tax and ability to raise money.','Book a 30-minute call with a CA to choose.'],
 ['GST basics','Above certain turnover limits, or for some services, GST registration is required. Training and engineering services have specific rules.','Ask your CA when Futurnyx needs GST.'],
 ['Employment rules','Many employment contracts restrict side work, competing services or IP ownership. Breaking them can cost far more than the side income.','Read your Cizmak contract and get written clarity if needed.'],
 ['Profit and loss','Revenue − costs = profit. Revenue is vanity, profit is sanity, cash is reality.','Make a monthly P&L for your side business.'],
 ['Cash flow','A profitable business can still die if cash comes in late. Collect advances; pay suppliers on time but not early.','Add payment terms to every proposal.'],
 ['Unit economics','Know the profit on each unit sold (course seat, consulting day, project). Scaling a loss-making unit only scales losses.','Calculate profit per student or per project.'],
 ['Hiring','Hire to remove you from low-value work first: editing, admin, scheduling. Then hire for delivery.','List tasks you would hand off first.'],
 ['Systems & SOPs','A business that depends on you is a job. Write how each repeated task is done so others can do it.','Write one SOP this week.'],
 ['Margins','Services firms often run at 10–25% profit margin; software and online courses can be much higher. Margin decides how fast you can grow.','Find your current margin.'],
 ['Recurring revenue','Monthly subscriptions and retainers make income predictable and businesses more valuable.','Design one recurring offer (membership, retainer).'],
 ['Valuation','Businesses are valued on a multiple of profit or revenue. Predictable, growing, owner-independent businesses get higher multiples.','Estimate your business value using profit × a conservative multiple.'],
 ['Equity & dilution','Raising money means selling part of the company. Owning 60% of something big can beat 100% of something small.','Learn what a cap table is.'],
 ['Fundraising','Bootstrapping keeps control; investors bring money and pressure. Most businesses should prove profit before raising.','Write when, if ever, you would raise money.'],
 ['Negotiation','Prepare your walk-away point, listen more than you speak, and trade, do not give, concessions.','Use one technique from "Never Split the Difference" this week.'],
 ['Personal brand','Your name is a business asset. People buy from experts they already know.','Update your LinkedIn headline to the outcome you deliver.'],
 ['Partnerships','Partner with companies that already have your customers: EPC firms, colleges, software resellers.','List 5 possible partners.'],
 ['Going global','Engineering skills sell worldwide. Middle East and Southeast Asia have large EPC sectors.','Research one foreign market for your courses.'],
 ['Software products','Software can be sold many times with little extra cost. A small tool solving a painful problem can become a big business.','Validate the isometric checker idea with 5 engineers.'],
 ['Risk management','Never risk money you cannot afford to lose. Keep personal and business money separate.','Check that business money is in a separate account.'],
 ['Diversification','As wealth grows, do not keep it all in your own company. Move some profit into other assets every year.','Decide what % of profits you will take out yearly.'],
 ['Estate planning','A will and correct nominations protect your family and avoid legal trouble.','Check nominations on every account and investment.'],
 ['Wealth mindset','Spend on what grows you (skills, health, tools); cut what only signals status.','List 3 status expenses you can drop.'],
 ['Review rhythm','Wealth is built with routines: weekly money check, monthly P&L, quarterly goal review, yearly rebalancing.','Put these reviews in your calendar.'],
 ['Your annual plan','Set next year\'s targets for income, savings rate, business revenue and net worth.','Write next year\'s 4 numbers.'],
 ['Graduation','You now know more about money than most people. Keep reviewing these lessons every year.','Teach one lesson to someone else.']
];

window.Mind={RANKS,REQLABEL,LIBRARY,SKILLS,LESSONS};
})();
