'use strict';

const ENGINE_VERSION = '2.2.0-native-evidence-multilingual';

const LANGS = Object.freeze(['en','hi','te','mr','ta','bn','gu','kn','ml','pa','or','as','ur','gom','ne']);

const ALIASES = Object.freeze({
  'TATA MOTORS':'TATAMOTORS','TATA MOTOR':'TATAMOTORS','RELIANCE INDUSTRIES':'RELIANCE','RELIANCE':'RELIANCE',
  'INFOSYS':'INFY','HDFC BANK':'HDFCBANK','ICICI BANK':'ICICIBANK','STATE BANK OF INDIA':'SBIN','SBI':'SBIN',
  'LARSEN AND TOUBRO':'LT','L&T':'LT','MAHINDRA AND MAHINDRA':'M&M','M AND M':'M&M',
  'BANK NIFTY':'BANKNIFTY','NIFTY 50':'NIFTY50','SENSEX':'SENSEX'
});

const TARGETS = Object.freeze({
  marketData:'live market data', financialData:'verified financial data', history:'historical market data',
  realtime:'real-time streaming', news:'news and sentiment', fundamentals:'fundamental analysis', risk:'risk intelligence',
  portfolio:'portfolio intelligence', decision:'decision and reasoning', knowledge:'finance knowledge engine', ownModel:'Tara own model',
  scale:'large-scale architecture', security:'security and compliance', languages:'multilingual intelligence'
});

const KNOWLEDGE = Object.freeze({
  pe:{title:'P/E ratio',answer:'P/E compares share price with earnings per share. Interpret it with growth, sector context and earnings quality.'},
  eps:{title:'EPS',answer:'EPS means earnings per share: profit attributable to equity shareholders divided by the relevant share count. Check whether the basis is standalone or consolidated.'},
  dividend:{title:'Dividend',answer:'A dividend is a distribution declared by a company to eligible shareholders. Verify the amount, record date and ex-date from the corporate filing.'},
  market_cap:{title:'Market capitalisation',answer:'Market capitalisation is generally share price multiplied by the relevant outstanding share count.'},
  fii:{title:'FII/FPI holding',answer:'FII/FPI holding represents ownership reported by foreign portfolio investors. Changes are context, not a standalone price-direction signal.'},
  delivery:{title:'Delivery percentage',answer:'Delivery percentage measures the portion of traded quantity reported as delivery rather than intraday trading, subject to source methodology.'},
  support:{title:'Support',answer:'Technical support is a price area where historical demand has appeared. It is an analytical concept, not a guarantee.'},
  resistance:{title:'Resistance',answer:'Technical resistance is a price area where historical supply has appeared. Evaluate breaks with volume, confirmation and broader market context.'}
});

function configured(name, required=true){ const value=String(process.env[name]||'').trim(); return {configured:Boolean(value),provider:value||null,required}; }
function providerStatus(){ return {
  marketData:configured('MARKET_DATA_PROVIDER_NAME'), financialData:configured('FINANCIAL_DATA_PROVIDER_NAME'),
  history:configured('MARKET_HISTORY_PROVIDER_NAME'), realtime:configured('MARKET_DATA_STREAM_PROVIDER_NAME'),
  news:configured('NEWS_PROVIDER_NAME'), ownModel:{configured:true,provider:'native-rule-engine',required:false}
}; }
function normalizeLanguage(value=''){ const v=String(value).toLowerCase().trim(); return LANGS.includes(v)?v:'en'; }
function detectLanguage(query=''){
  const q=String(query||'').toLowerCase();
  if(/[\u0c00-\u0c7f]/.test(q)) return 'te';
  if(/[\u0900-\u097f]/.test(q)) return 'hi';
  if(/[\u0b80-\u0bff]/.test(q)) return 'ta';
  if(/[\u0980-\u09ff]/.test(q)) return 'bn';
  if(/[\u0a80-\u0aff]/.test(q)) return 'gu';
  if(/[\u0c80-\u0cff]/.test(q)) return 'kn';
  if(/[\u0d00-\u0d7f]/.test(q)) return 'ml';
  if(/[\u0a00-\u0a7f]/.test(q)) return 'pa';
  if(/[\u0b00-\u0b7f]/.test(q)) return 'or';
  if(/[\u0980-\u09ff]/.test(q) && /(অসম|নমস্কাৰ)/.test(q)) return 'as';
  if(/[\u0600-\u06ff]/.test(q)) return 'ur';
  if(/\b(namaste|kasa|kay|marathi|majha)\b/.test(q)) return 'mr';
  if(/\b(namaskar|kite|konkani)\b/.test(q)) return 'gom';
  if(/\b(namaste|nepali|mero|ke cha)\b/.test(q)) return 'ne';
  return 'en';
}
function extractSymbol(query=''){
  const q=String(query||'').toUpperCase();
  for(const [name,symbol] of Object.entries(ALIASES)) if(q.includes(name)) return symbol;
  const m=q.match(/\b[A-Z]{2,15}\b/); return m?m[0]:null;
}
function detectIntent(query=''){
  const q=String(query).toLowerCase().trim();
  if(/\b(hi|hello|hey|namaste|who are you|what are you)\b|నమస్తే|హాయ్|హలో/.test(q)) return 'GREETING';
  if(/\b(rsi|macd|sma|ema|vwap|technical|trend|support|resistance|breakout|candlestick|buy|sell)\b|టెక్నికల్|సపోర్ట్|రెసిస్టెన్స్/.test(q)) return 'TECHNICAL_ANALYSIS';
  if(/\b(financial|fundamental|pe|p\/e|profit|revenue|eps|debt|cash flow|balance sheet|valuation)\b|ఫండమెంటల్|లాభం|ఆదాయం|డెట్/.test(q)) return 'FUNDAMENTAL_ANALYSIS';
  if(/\b(risk|volatility|drawdown|safe|danger)\b|రిస్క్/.test(q)) return 'RISK_ANALYSIS';
  if(/\b(portfolio|sip|allocation|diversif|holdings)\b|పోర్ట్‌ఫోలియో/.test(q)) return 'PORTFOLIO';
  if(/\b(company|stock|share|market|nse|bse|tcs|reliance|infy)\b|షేర్|స్టాక్|మార్కెట్/.test(q)) return 'MARKET_SEARCH';
  return 'GENERAL_MARKET';
}
function num(v){ const n=Number(v); return Number.isFinite(n)?n:null; }
function validateMetrics(data){
  const errors=[]; if(!data||typeof data!=='object') return {isValid:false,errors:['Missing market data payload']};
  for(const key of ['currentPrice','sma20','sma50']){const n=num(data[key]);if(n===null||n<=0)errors.push(`Invalid ${key}: must be a positive finite number`);}
  const rsi=num(data.rsi); if(rsi===null||rsi<0||rsi>100)errors.push('Invalid RSI: must be between 0 and 100');
  const pe=num(data.pe); if(pe===null||pe<0)errors.push('Invalid P/E ratio: must be zero or positive');
  const de=num(data.debtToEquity); if(de===null||de<0)errors.push('Invalid debt-to-equity ratio: must be zero or positive');
  if(!data.dataSource||data.dataSource.isVerified!==true)errors.push('Unverified market data: verified source evidence is required');
  if(!data.dataSource||!String(data.dataSource.name||'').trim())errors.push('Missing data source name');
  if(!data.dataSource||!String(data.dataSource.retrievedAt||'').trim())errors.push('Missing source retrieval timestamp');
  return {isValid:errors.length===0,errors};
}
function calculateMultiFactorScore(data={}){
  let score=50; const factors=[]; const rsi=num(data.rsi),price=num(data.currentPrice),sma20=num(data.sma20),sma50=num(data.sma50),pe=num(data.pe),de=num(data.debtToEquity);
  if(rsi<30){score+=15;factors.push('RSI indicates oversold conditions');} else if(rsi>70){score-=15;factors.push('RSI indicates overbought conditions');} else if(rsi>=40&&rsi<=60){score+=8;factors.push('RSI is in a balanced momentum zone');} else factors.push('RSI is moderate');
  if(price>sma20&&sma20>sma50){score+=18;factors.push('Price > SMA20 > SMA50: positive trend alignment');} else if(price<sma20&&sma20<sma50){score-=18;factors.push('Price < SMA20 < SMA50: negative trend alignment');} else if(price>sma50){score+=8;factors.push('Price is above SMA50');} else {score-=8;factors.push('Price is below SMA50');}
  if(pe>0&&pe<=22){score+=12;factors.push('P/E is within the configured lower valuation band');} else if(pe>22&&pe<=45){score+=4;factors.push('P/E is within the configured middle valuation band');} else {score-=10;factors.push('P/E is in an elevated valuation band');}
  if(de===0){score+=12;factors.push('Debt-to-equity is zero');} else if(de<0.8){score+=8;factors.push('Debt-to-equity is below 0.8');} else if(de<=1.5){factors.push('Debt-to-equity is in a moderate leverage band');} else {score-=14;factors.push('Debt-to-equity is above 1.5');}
  score=Math.max(5,Math.min(95,score));
  let interpretation='Mixed/neutral evidence'; if(score>=70)interpretation='Positive evidence across several configured factors'; else if(score<=40)interpretation='Negative evidence across several configured factors';
  return {score,interpretation,factors};
}
function evidence(item){ if(!item||item.value===undefined||item.value===null||item.value==='') return null; return {value:item.value,source:item.source||null,retrievedAt:item.retrievedAt||null,verified:item.verified===true}; }
function analyze(input={}){
  const symbol=String(input.symbol||'').trim().toUpperCase(); if(!symbol) throw new Error('A valid company symbol is required.');
  const verified=[],missing=[]; const add=(name,item)=>{const e=evidence(item);if(e&&e.verified&&e.source&&e.retrievedAt)verified.push({name,...e});else missing.push(name);};
  ['price','previousClose','volume','revenue','profit','eps','debt','cashFlow','pe','rsi','sma20','sma50','debtToEquity'].forEach(k=>add(k,input[k]));
  const core={currentPrice:input.price?.value,rsi:input.rsi?.value,sma20:input.sma20?.value,sma50:input.sma50?.value,pe:input.pe?.value,debtToEquity:input.debtToEquity?.value,dataSource:{name:input.price?.source||input.dataSource?.name,retrievedAt:input.price?.retrievedAt||input.dataSource?.retrievedAt,isVerified:['price','rsi','sma20','sma50','pe','debtToEquity'].every(k=>verified.some(v=>v.name===k))}};
  const gate=validateMetrics(core),completeness=Math.round(verified.length/14*100);
  if(!gate.isValid)return {success:true,engine:'Tara Intelligence Engine',version:ENGINE_VERSION,symbol,mode:'native-evidence-first',decision:'insufficient_verified_evidence',status:'EVIDENCE_GATEKEEPER_BLOCKED',confidence:0,completeness,verifiedEvidence:verified,missingEvidence:missing,blockedReasons:gate.errors,technicalScore:null,technicalFactors:[],warnings:['Tara never invents market or financial values.','A configured source does not by itself prove licensing or authorization.'],nextRequired:missing,generatedAt:new Date().toISOString()};
  const technical=calculateMultiFactorScore(core);
  return {success:true,engine:'Tara Intelligence Engine',version:ENGINE_VERSION,symbol,mode:'native-evidence-first',decision:'scenario_only',status:'ANALYSIS_COMPLETE',confidence:Math.min(technical.score===50?70:90,completeness),completeness,verifiedEvidence:verified,missingEvidence:missing,technicalScore:technical.score,technicalInterpretation:technical.interpretation,technicalFactors:technical.factors,warnings:['Tara analysis is evidence-based and does not guarantee returns.'],nextRequired:missing,generatedAt:new Date().toISOString()};
}
function knowledgeAnswer(query=''){
  const q=String(query).toLowerCase(); const hit=Object.entries(KNOWLEDGE).find(([key,v])=>q.includes(key.replace('_',' '))||q.includes(v.title.toLowerCase()));
  return hit?{found:true,topic:hit[1].title,answer:hit[1].answer,source:'Tara Finance Knowledge Engine',educational:true}:{found:false};
}
const GREETINGS={en:'Hello! I am Tara AI — your market intelligence assistant.',te:'నమస్తే! నేను Tara AI — మీ market intelligence assistant ని.',hi:'नमस्ते! मैं Tara AI हूँ — आपका market intelligence assistant.',mr:'नमस्कार! मी Tara AI — तुमचा market intelligence assistant आहे.',ta:'வணக்கம்! நான் Tara AI — உங்கள் market intelligence assistant.',bn:'নমস্কার! আমি Tara AI — আপনার market intelligence assistant.',gu:'નમસ્તે! હું Tara AI — તમારો market intelligence assistant છું.',kn:'ನಮಸ್ಕಾರ! ನಾನು Tara AI — ನಿಮ್ಮ market intelligence assistant.',ml:'നമസ്കാരം! ഞാൻ Tara AI — നിങ്ങളുടെ market intelligence assistant ആണ്.',pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Tara AI — ਤੁਹਾਡਾ market intelligence assistant ਹਾਂ.',or:'ନମସ୍କାର! ମୁଁ Tara AI — ଆପଣଙ୍କ market intelligence assistant.',as:'নমস্কাৰ! মই Tara AI — আপোনাৰ market intelligence assistant.',ur:'سلام! میں Tara AI ہوں — آپ کا market intelligence assistant.',gom:'नमस्कार! हांव Tara AI — तुमचो market intelligence assistant.',ne:'नमस्ते! म Tara AI हुँ — तपाईंको market intelligence assistant।'};
function processQuery(userQuery,stockContext={}){
  const language=detectLanguage(userQuery),intent=detectIntent(userQuery),symbol=String(stockContext.symbol||extractSymbol(userQuery)||'').toUpperCase();
  if(intent==='GREETING')return {intent,language,text:GREETINGS[language]||GREETINGS.en};
  const knowledge=knowledgeAnswer(userQuery); if(knowledge.found)return {...knowledge,intent,language};
  if(!symbol&&['TECHNICAL_ANALYSIS','FUNDAMENTAL_ANALYSIS','RISK_ANALYSIS','MARKET_SEARCH'].includes(intent))return {intent,language,text:language==='te'?'మీరు విశ్లేషించాలనుకుంటున్న company name లేదా NSE/BSE symbol ఇవ్వండి. ఉదాహరణ: TCS, RELIANCE, INFY.':'Please provide the company name or NSE/BSE symbol, for example TCS, RELIANCE or INFY.'};
  if(intent==='TECHNICAL_ANALYSIS'){const validation=validateMetrics(stockContext);if(!validation.isValid)return {intent,language,status:'EVIDENCE_GATEKEEPER_BLOCKED',score:null,confidence:0,factors:[],blockedReasons:validation.errors,text:language==='te'?`Tara Technical Evaluation — ${symbol}\nVerified market evidence లేకుండా score/conclusion ఇవ్వను.`:`Tara Technical Evaluation — ${symbol}\nI will not produce a score or conclusion without verified market evidence.`};const a=calculateMultiFactorScore(stockContext);return {intent,language,status:'ANALYSIS_COMPLETE',score:a.score,confidence:Math.min(95,60+a.factors.length*7),interpretation:a.interpretation,factors:a.factors,text:`Tara Technical Evaluation — ${symbol}\nTara Market Score: ${a.score}/100\n${a.factors.map(x=>'• '+x).join('\n')}`};}
  if(intent==='FUNDAMENTAL_ANALYSIS')return {intent,language,text:`Tara Fundamental Engine — ${symbol}\nVerified revenue, profit, EPS, debt, cash-flow, P/E and balance-sheet inputs are required before a conclusion.`};
  if(intent==='RISK_ANALYSIS')return {intent,language,text:`Tara Risk Engine — ${symbol}\nVolatility, drawdown, leverage, liquidity and verified financial risk inputs are required. I will not guess a risk level.`};
  if(intent==='PORTFOLIO')return {intent,language,text:`Tara Portfolio Engine\nPortfolio holdings, allocation and risk inputs are required for evidence-based analysis.`};
  return {intent,language,text:`Tara AI native engine request received for ${symbol||'the market'}. Verified company/market evidence ఆధారంగా మాత్రమే analysis చేస్తాను.`};
}
function targetStatus(){const providers=providerStatus();return Object.entries(TARGETS).map(([id,name])=>({id,name,status:['scale','security','languages','decision','knowledge'].includes(id)?'foundation':(providers[id]?.configured?'connected':'ready_for_provider'),provider:providers[id]?.provider||null}));}
module.exports={ENGINE_VERSION,TARGETS,LANGS,ALIASES,providerStatus,targetStatus,normalizeLanguage,detectLanguage,extractSymbol,detectIntent,validateMetrics,calculateMultiFactorScore,knowledgeAnswer,processQuery,analyze};
