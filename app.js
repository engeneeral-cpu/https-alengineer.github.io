const companies=[
{name:'Reliance Industries',ticker:'RELIANCE',price:'₹1,423.80',change:'+1.24%',sector:'Energy & Conglomerates',pe:'24.8x',roe:'9.8%',growth:'12.4%'},
{name:'Tata Motors',ticker:'TATAMOTORS',price:'₹1,021.40',change:'+0.86%',sector:'Automobiles',pe:'11.6x',roe:'19.4%',growth:'18.7%'},
{name:'HDFC Bank',ticker:'HDFCBANK',price:'₹1,961.25',change:'−0.31%',sector:'Banking',pe:'18.2x',roe:'16.1%',growth:'10.9%'},
{name:'Infosys',ticker:'INFY',price:'₹1,482.60',change:'+0.47%',sector:'IT Services',pe:'22.4x',roe:'31.2%',growth:'8.1%'},
{name:'ITC',ticker:'ITC',price:'₹412.15',change:'+0.29%',sector:'FMCG',pe:'27.1x',roe:'28.4%',growth:'7.3%'},
{name:'ICICI Bank',ticker:'ICICIBANK',price:'₹1,438.70',change:'+0.72%',sector:'Banking',pe:'19.5x',roe:'17.8%',growth:'14.2%'},
{name:'Bharti Airtel',ticker:'BHARTIARTL',price:'₹1,792.35',change:'+1.08%',sector:'Telecom',pe:'31.2x',roe:'18.5%',growth:'15.8%'},
{name:'Larsen & Toubro',ticker:'LT',price:'₹3,621.50',change:'+0.41%',sector:'Infrastructure',pe:'32.5x',roe:'14.7%',growth:'16.3%'}
];
let watch=JSON.parse(localStorage.getItem('marketWatch')||'[]');
const grid=document.getElementById('companyGrid');
function render(list=companies){grid.innerHTML=list.map(c=>`<article class="company"><div class="company-top"><span class="ticker">NSE · ${c.ticker}</span><button class="star ${watch.includes(c.ticker)?'on':''}" onclick="toggleWatch('${c.ticker}')">★</button></div><h3>${c.name}</h3><small>${c.sector}</small><div class="price">${c.price}</div><small class="${c.change.includes('−')?'down':'up'}">${c.change} today</small></article>`).join('')}
window.toggleWatch=t=>{watch=watch.includes(t)?watch.filter(x=>x!==t):[...watch,t];localStorage.setItem('marketWatch',JSON.stringify(watch));render();renderWatch()};
render();
const search=document.getElementById('search'),suggestions=document.getElementById('suggestions');
search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();if(!q){suggestions.style.display='none';render();return}const found=companies.filter(c=>(c.name+' '+c.ticker+' '+c.sector).toLowerCase().includes(q));suggestions.innerHTML=found.slice(0,5).map(c=>`<div onclick="pick('${c.ticker}')"><b>${c.name}</b> <span class="ticker">${c.ticker}</span></div>`).join('')||'<div>No company found</div>';suggestions.style.display='block';render(found)});
window.pick=t=>{const c=companies.find(x=>x.ticker===t);search.value=c.name;suggestions.style.display='none';render([c]);document.getElementById('companies').scrollIntoView({behavior:'smooth'})};
document.getElementById('searchBtn').onclick=()=>{const q=search.value.toLowerCase();render(companies.filter(c=>(c.name+c.ticker+c.sector).toLowerCase().includes(q)));suggestions.style.display='none'};
document.getElementById('allBtn').onclick=()=>{search.value='';render()};
const c1=document.getElementById('c1'),c2=document.getElementById('c2');[c1,c2].forEach(s=>s.innerHTML=companies.map(c=>`<option value="${c.ticker}">${c.name}</option>`).join(''));c2.selectedIndex=1;
document.getElementById('compareBtn').onclick=()=>{const a=companies.find(c=>c.ticker===c1.value),b=companies.find(c=>c.ticker===c2.value);document.getElementById('compareResult').innerHTML=`<table class="compare-table"><tr><td>Metric</td><td><b>${a.name}</b></td><td><b>${b.name}</b></td></tr><tr><td>P/E</td><td>${a.pe}</td><td>${b.pe}</td></tr><tr><td>ROE</td><td>${a.roe}</td><td>${b.roe}</td></tr><tr><td>Growth</td><td>${a.growth}</td><td>${b.growth}</td></tr><tr><td>Sector</td><td>${a.sector}</td><td>${b.sector}</td></tr></table>`};
document.getElementById('askBtn').onclick=()=>{const q=document.getElementById('question').value.trim();const box=document.getElementById('aiAnswer');if(!q){box.textContent='Ask a question about a company to begin.';return}const found=companies.find(c=>q.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])||q.toLowerCase().includes(c.ticker.toLowerCase()));box.innerHTML=found?`<b>${found.name}</b> is shown here at ${found.price}, with a displayed P/E of ${found.pe}, ROE of ${found.roe}, and growth figure of ${found.growth}. Use these figures as research inputs, not as a recommendation.`:'Try a listed company such as Reliance, Tata Motors, HDFC Bank or Infosys. This demo assistant uses the dashboard dataset.'};
function renderWatch(){const box=document.getElementById('watchlistBox');const rows=companies.filter(c=>watch.includes(c.ticker));box.innerHTML=rows.length?rows.map(c=>`<div class="watch-row"><b>${c.name}</b><span>${c.ticker}</span><span class="${c.change.includes('−')?'down':'up'}">${c.change}</span><button class="star on" onclick="toggleWatch('${c.ticker}')">★</button></div>`).join(''):'<div class="empty">Your watchlist is empty. Tap ★ on a company to add it.</div>'};renderWatch();
document.getElementById('themeBtn').onclick=()=>{document.body.classList.toggle('light');document.getElementById('themeBtn').textContent=document.body.classList.contains('light')?'☾':'☼';};
