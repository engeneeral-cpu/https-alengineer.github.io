/* Tara AI multilingual intent + reply engine.
 * Supports 15 Indian languages and automatic script-based language detection.
 * This module does not provide live market data; live values must come from a verified backend feed.
 */

const ALIASES = new Map([
  ['TATA MOTORS','TATAMOTORS'], ['TATA MOTOR','TATAMOTORS'],
  ['RELIANCE INDUSTRIES','RELIANCE'], ['RELIANCE','RELIANCE'],
  ['INFOSYS','INFY'], ['HDFC BANK','HDFCBANK'], ['ICICI BANK','ICICIBANK'],
  ['STATE BANK OF INDIA','SBIN'], ['SBI','SBIN'],
  ['LARSEN AND TOUBRO','LT'], ['L&T','LT'], ['M AND M','M&M'],
  ['MAHINDRA AND MAHINDRA','M&M'], ['BANK NIFTY','BANKNIFTY'],
  ['NIFTY 50','NIFTY50'], ['SENSEX','SENSEX']
]);

const LANGS = new Set(['en','hi','te','mr','ta','bn','gu','kn','ml','pa','or','as','ur','gom','ne']);
const STOP_WORDS = new Set(['HI','HELLO','HEY','HO','TARA','AI','OK','OKAY','YES','NO','NAMASTE']);

function normalizeLanguage(value){
  const x = String(value || 'en').toLowerCase().trim();
  return LANGS.has(x) ? x : 'en';
}

function detectLanguage(text=''){
  const s = String(text || '');
  if (!s.trim()) return 'en';
  if (/[ఀ-౿]/.test(s)) return 'te'; // Telugu
  if (/[ऀ-ॿ]/.test(s)) return 'hi'; // Hindi/Devanagari
  if (/[஀-௿]/.test(s)) return 'ta'; // Tamil
  if (/[ಀ-೿]/.test(s)) return 'kn'; // Kannada
  if (/[ഀ-ൿ]/.test(s)) return 'ml'; // Malayalam
  if (/[଀-୿]/.test(s)) return 'or'; // Odia
  if (/[ঀ-৿]/.test(s)) return 'bn'; // Bengali/Assamese
  if (/[઀-૿]/.test(s)) return 'gu'; // Gujarati
  if (/[਀-੿]/.test(s)) return 'pa'; // Punjabi
  if (/[؀-ۿ]/.test(s)) return 'ur'; // Urdu

  // Roman-script detection for common Telugu/Hindi/Maharashtrian mixed chat.
  const q = s.toLowerCase();
  if (/\b(naku|naaku|mee|meeru|nuvvu|cheppu|cheppandi|ela|enduku|entha|undi|kavali|kavala|ivvu|ivvandi|chesavu|chesav|chestundi|market lo|share price entha)\b/.test(q)) return 'te';
  if (/\b(mujhe|mera|meri|aap|aapka|kya|kaise|kitna|hai|batao|chahiye|share price kya)\b/.test(q)) return 'hi';
  if (/\b(mala|majha|maza|tumhi|kay|kasa|kiti|aahe|sanga|pahije)\b/.test(q)) return 'mr';
  if (/\b(namaste|hello|hi|hey|what|how|price|stock|share|market|tell|show)\b/.test(q)) return 'en';
  return 'en';
}

function extractSymbol(text=''){
  const raw = String(text).toUpperCase().replace(/[’']/g,"'").replace(/[^-A-Z0-9&. ]+/g,' ');
  for (const [alias,symbol] of ALIASES) {
    const pattern='\\b'+alias.replace(/[&]/g,'\\&').replace(/ /g,'\\s+')+'\\b';
    if (new RegExp(pattern,'i').test(raw)) return symbol;
  }
  const tokens = raw.split(/\s+/).filter(Boolean);
  const candidates = tokens.filter(t=>!STOP_WORDS.has(t) && (/^[A-Z]{2,15}$/.test(t) || /^[A-Z0-9&.-]{2,15}$/.test(t)));
  return candidates.length === 1 ? candidates[0] : (candidates.find(t=>/^[A-Z]{2,15}$/.test(t)) || '');
}

function detectIntent(query=''){
  const q=String(query).toLowerCase().trim();
  if(!q)return'GENERAL_MARKET';
  if(/^(hi|hello|hey|ho|namaste|good morning|good afternoon|good evening|నమస్తే|హాయ్|హలో|నమస్కారం|नमस्ते|हाय|नमस्कार|வணக்கம்|ಕನ್ನಡ|ನಮಸ್ಕಾರ|നമസ്കാരം|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|নমস্কার)[!,. ]*$/.test(q))return'GREETING';
  if(/\b(who are you|what are you|are you an? ai|are you ai|tell me about yourself)\b/.test(q)||/(మీరు|నువ్వు|నువ్).*(ai|కృత్రిమ మేధస్సు)/.test(q)||/(tum kaun|aap kaun|tu kon|nuvvu evaru).*(ai)?/.test(q))return'IDENTITY';
  if(/\b(tomorrow|today|now|open|close|opening|closing|market hours|market open|market closed|trading session|pre[- ]?open|market timing|market time|రేపు|ఈరోజు|మార్కెట్|कल|आज|बाज़ार|उद्या|बाजार|നാളെ|ഇന്ന്|ಮಾರುಕಟ್ಟೆ|ನಾಳೆ|ਕੱਲ੍ਹ|ਅੱਜ|বাজার|କାଲି|ଆଜି|কালি|کل|بازار)\b/.test(q))return'MARKET_STATUS';
  if(/\b(price|share price|stock price|ltp|quote|cmp|current value|current price|ధర|షేర్ ధర|விலை|பங்கு விலை|कीमत|शेयर भाव|किंमत|মূল্য|দাম|দর|ભાવ|ಬೆಲೆ|ಷೇರು ಬೆಲೆ|വില|ഓഹരി വില|ਕੀਮਤ|ਸ਼ੇਅਰ ਕੀਮਤ|ମୂଲ୍ୟ|قیمت|شیئر قیمت)\b/.test(q))return'QUOTE';
  if(/\b(rsi|macd|sma|ema|vwap|technical|trend|support|resistance|breakout|candlestick|moving average|chart|technical analysis)\b/.test(q))return'TECHNICAL_ANALYSIS';
  if(/\b(financial|fundamental|pe|p\/e|profit|revenue|eps|debt|cash flow|balance sheet|valuation|growth|margin)\b/.test(q))return'FUNDAMENTAL_ANALYSIS';
  if(/\b(risk|volatility|drawdown|safe|danger|downside)\b/.test(q))return'RISK_ANALYSIS';
  if(/\b(portfolio|sip|allocation|diversif|holdings)\b/.test(q))return'PORTFOLIO';
  if(/\b(stock|share|company|nse|bse|symbol|listed)\b/.test(q)||extractSymbol(q))return'MARKET_SEARCH';
  return'GENERAL_MARKET';
}

const GREETINGS = {
 en:"Hi! I'm Tara AI. I'm ready to help with market intelligence, company research and finance education.",
 hi:'नमस्ते! मैं Tara AI हूँ। मैं मार्केट इंटेलिजेंस, कंपनी रिसर्च और वित्तीय शिक्षा में मदद करने के लिए तैयार हूँ।',
 te:'నమస్తే! నేను Tara AI. Market intelligence, company research మరియు finance educationలో సహాయం చేయడానికి సిద్ధంగా ఉన్నాను.',
 mr:'नमस्कार! मी Tara AI आहे. मार्केट इंटेलिजन्स, कंपनी रिसर्च आणि आर्थिक शिक्षणात मदत करण्यासाठी तयार आहे.',
 ta:'வணக்கம்! நான் Tara AI. சந்தை நுண்ணறிவு, நிறுவன ஆய்வு மற்றும் நிதிக் கல்வியில் உதவ தயாராக இருக்கிறேன்.',
 bn:'নমস্কার! আমি Tara AI। মার্কেট ইন্টেলিজেন্স, কোম্পানি রিসার্চ এবং আর্থিক শিক্ষায় সাহায্য করতে প্রস্তুত।',
 gu:'નમસ્તે! હું Tara AI છું. માર્કેટ ઇન્ટેલિજન્સ, કંપની રિસર્ચ અને નાણાકીય શિક્ષણમાં મદદ કરવા તૈયાર છું.',
 kn:'ನಮಸ್ಕಾರ! ನಾನು Tara AI. ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ, ಕಂಪನಿ ಸಂಶೋಧನೆ ಮತ್ತು ಹಣಕಾಸು ಶಿಕ್ಷಣದಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ.',
 ml:'നമസ്കാരം! ഞാൻ Tara AI. മാർക്കറ്റ് ഇന്റലിജൻസ്, കമ്പനി റിസർച്ച്, സാമ്പത്തിക വിദ്യാഭ്യാസം എന്നിവയിൽ സഹായിക്കാൻ തയ്യാറാണ്.',
 pa:'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Tara AI ਹਾਂ। ਮਾਰਕੀਟ ਇੰਟੈਲੀਜੈਂਸ, ਕੰਪਨੀ ਰਿਸਰਚ ਅਤੇ ਵਿੱਤੀ ਸਿੱਖਿਆ ਵਿੱਚ ਮਦਦ ਲਈ ਤਿਆਰ ਹਾਂ।',
 or:'ନମସ୍କାର! ମୁଁ Tara AI। ମାର୍କେଟ ଇଣ୍ଟେଲିଜେନ୍ସ, କମ୍ପାନୀ ରିସର୍ଚ୍ଚ ଏବଂ ଆର୍ଥିକ ଶିକ୍ଷାରେ ସହାୟତା ପାଇଁ ପ୍ରସ୍ତୁତ।',
 as:'নমস্কাৰ! মই Tara AI। মাৰ্কেট ইণ্টেলিজেন্স, কোম্পানী ৰিচাৰ্চ আৰু বিত্তীয় শিক্ষাত সহায় কৰিবলৈ সাজু।',
 ur:'السلام علیکم! میں Tara AI ہوں۔ مارکیٹ انٹیلیجنس، کمپنی ریسرچ اور مالی تعلیم میں مدد کے لیے تیار ہوں۔',
 gom:'नमस्कार! हांव Tara AI. मार्केट इंटेलिजन्स, कंपनी रिसर्च आनी फायनान्स शिक्षणाक मदत करपाक तयार आसा.',
 ne:'नमस्ते! म Tara AI हुँ। बजार बुद्धिमत्ता, कम्पनी अनुसन्धान र वित्तीय शिक्षामा सहयोग गर्न तयार छु।'
};

const IDENTITY_REPLIES = {
 en:"I'm Tara AI, your intelligent market companion. I can help with Indian market intelligence, company research, finance education and verified-data analysis. I do not invent live prices or facts.",
 hi:'मैं Tara AI हूँ — आपका intelligent market companion। मैं भारतीय मार्केट इंटेलिजेंस, कंपनी रिसर्च, वित्तीय शिक्षा और सत्यापित डेटा विश्लेषण में मदद करती हूँ। मैं लाइव कीमतें या तथ्य गढ़ती नहीं हूँ।',
 te:'నేను Tara AI — మీ intelligent market companion. భారతీయ మార్కెట్ ఇంటెలిజెన్స్, కంపెనీ రీసెర్చ్, finance education మరియు verified-data analysisలో సహాయం చేస్తాను. నేను live prices లేదా facts ఊహించి చెప్పను.',
 mr:'मी Tara AI — तुमची intelligent market companion आहे. भारतीय मार्केट इंटेलिजन्स, कंपनी रिसर्च, आर्थिक शिक्षण आणि सत्यापित डेटा विश्लेषणात मदत करते. मी लाइव्ह किंमती किंवा तथ्ये बनवत नाही.',
 ta:'நான் Tara AI — உங்கள் intelligent market companion. இந்திய சந்தை நுண்ணறிவு, நிறுவன ஆய்வு, நிதிக் கல்வி மற்றும் verified-data analysis-ல் உதவுகிறேன். நான் live prices அல்லது facts உருவாக்கமாட்டேன்.',
 bn:'আমি Tara AI — আপনার intelligent market companion। ভারতীয় বাজারের তথ্য, কোম্পানি গবেষণা, আর্থিক শিক্ষা এবং যাচাইকৃত ডেটা বিশ্লেষণে সাহায্য করি। আমি লাইভ দাম বা তথ্য বানিয়ে বলি না।',
 gu:'હું Tara AI — તમારું intelligent market companion. ભારતીય માર્કેટ ઇન્ટેલિજન્સ, કંપની રિસર્ચ, નાણાકીય શિક્ષણ અને ચકાસાયેલ ડેટા વિશ્લેષણમાં મદદ કરું છું. હું લાઇવ કિંમતો અથવા તથ્યો બનાવતી નથી.',
 kn:'ನಾನು Tara AI — ನಿಮ್ಮ intelligent market companion. ಭಾರತೀಯ ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ, ಕಂಪನಿ ಸಂಶೋಧನೆ, ಹಣಕಾಸು ಶಿಕ್ಷಣ ಮತ್ತು ಪರಿಶೀಲಿತ ಡೇಟಾ ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನಾನು ಲೈವ್ ಬೆಲೆ ಅಥವಾ ಮಾಹಿತಿಯನ್ನು ಕಲ್ಪಿಸಿ ಹೇಳುವುದಿಲ್ಲ.',
 ml:'ഞാൻ Tara AI — നിങ്ങളുടെ intelligent market companion. ഇന്ത്യൻ മാർക്കറ്റ് ഇന്റലിജൻസ്, കമ്പനി റിസർച്ച്, സാമ്പത്തിക വിദ്യാഭ്യാസം, പരിശോധിച്ച ഡാറ്റാ വിശകലനം എന്നിവയിൽ സഹായിക്കുന്നു. ഞാൻ live prices അല്ലെങ്കിൽ facts കെട്ടിച്ചമയ്ക്കില്ല.',
 pa:'ਮੈਂ Tara AI ਹਾਂ — ਤੁਹਾਡਾ intelligent market companion. ਭਾਰਤੀ ਮਾਰਕੀਟ ਇੰਟੈਲੀਜੈਂਸ, ਕੰਪਨੀ ਰਿਸਰਚ, ਵਿੱਤੀ ਸਿੱਖਿਆ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਡਾਟਾ ਵਿਸ਼ਲੇਸ਼ਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹਾਂ। ਮੈਂ ਲਾਈਵ ਕੀਮਤਾਂ ਜਾਂ ਤੱਥ ਨਹੀਂ ਘੜਦੀ।',
 or:'ମୁଁ Tara AI — ଆପଣଙ୍କର intelligent market companion। ଭାରତୀୟ ମାର୍କେଟ ଇଣ୍ଟେଲିଜେନ୍ସ, କମ୍ପାନୀ ରିସର୍ଚ୍ଚ, ଆର୍ଥିକ ଶିକ୍ଷା ଏବଂ ଯାଞ୍ଚିତ ଡାଟା ବିଶ୍ଳେଷଣରେ ସହାୟତା କରେ। ମୁଁ ଲାଇଭ ମୂଲ୍ୟ କିମ୍ବା ତଥ୍ୟ ଗଢ଼େ ନାହିଁ।',
 as:'মই Tara AI — আপোনাৰ intelligent market companion। ভাৰতীয় মাৰ্কেট ইণ্টেলিজেন্স, কোম্পানী ৰিচাৰ্চ, বিত্তীয় শিক্ষা আৰু যাচাইকৃত ডাটা বিশ্লেষণত সহায় কৰোঁ। মই লাইভ মূল্য বা তথ্য বনাই নকওঁ।',
 ur:'میں Tara AI ہوں — آپ کی intelligent market companion۔ میں بھارتی مارکیٹ انٹیلیجنس، کمپنی ریسرچ، مالی تعلیم اور تصدیق شدہ ڈیٹا تجزیے میں مدد کرتی ہوں۔ میں لائیو قیمتیں یا حقائق گھڑ کر نہیں بتاتی۔',
 gom:'हांव Tara AI — तुमची intelligent market companion. भारतीय मार्केट इंटेलिजन्स, कंपनी रिसर्च, फायनान्स शिक्षण आनी खात्री केल्ल्या डेटा विश्लेषणांत हांव मदत करता. हांव लाईव्ह किंमती वा तथ्यां घडयना.',
 ne:'म Tara AI हुँ — तपाईंको intelligent market companion। भारतीय बजार बुद्धिमत्ता, कम्पनी अनुसन्धान, वित्तीय शिक्षा र प्रमाणित डेटा विश्लेषणमा सहयोग गर्छु। म लाइभ मूल्य वा तथ्य बनाउँदिन।'
};

function nativeReply(intent, symbol='', language){
  const lang = normalizeLanguage(language || detectLanguage(''));
  if(intent === 'GREETING') return GREETINGS[lang];
  if(intent === 'IDENTITY') return IDENTITY_REPLIES[lang];
  if(intent === 'MARKET_STATUS') return lang==='te'
    ? 'NSE/BSE regular equity trading సాధారణంగా trading daysలో 09:15–15:30 IST. నిజమైన live status కోసం verified market-status feed అవసరం.'
    : 'NSE/BSE regular equity trading is normally 09:15–15:30 IST on trading days. Holidays and special sessions can differ. Live status requires a verified market-status feed.';
  if(['QUOTE','MARKET_SEARCH','TECHNICAL_ANALYSIS','FUNDAMENTAL_ANALYSIS','RISK_ANALYSIS'].includes(intent)){
    if(!symbol) return lang==='te'
      ? 'Company name లేదా NSE/BSE symbol ఇవ్వండి. ఉదాహరణ: TCS, TATAMOTORS, RELIANCE, INFY.'
      : 'Please provide a company name or NSE/BSE symbol, such as TCS, TATAMOTORS, RELIANCE or INFY.';
    return lang==='te'
      ? `${symbol} ను గుర్తించాను. నిజమైన current data కోసం verified live market-data feed అవసరం. నేను ధరను ఊహించి చెప్పను.`
      : `I recognized ${symbol}. Verified live market data is required for current figures. I will not invent or estimate the price.`;
  }
  return lang==='te'
    ? 'మీ market question ను అర్థం చేసుకున్నాను. Company-specific analysis కోసం symbol లేదా company name ఇవ్వండి.'
    : 'I understood your market question. Tara can answer general market concepts and can switch to company-specific analysis when you provide a symbol or company name.';
}

function replyTo(query, options={}){
  const language = normalizeLanguage(options.language || detectLanguage(query));
  const intent = detectIntent(query);
  const symbol = extractSymbol(query);
  return { language, intent, symbol, reply: nativeReply(intent, symbol, language) };
}

module.exports={normalizeLanguage,detectLanguage,extractSymbol,detectIntent,nativeReply,replyTo,GREETINGS,IDENTITY_REPLIES};
