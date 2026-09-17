const ALLOWED_ORIGIN = "*";

function cors() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors() });
}

function yahooSymbol(symbol, exchange = "NSE") {
  const clean = String(symbol || "").trim().toUpperCase();
  if (!/^[A-Z0-9._-]{1,30}$/.test(clean)) throw new Error("Invalid symbol");
  return exchange.toUpperCase() === "BSE" ? `${clean}.BO` : `${clean}.NS`;
}

function rangeToInterval(range) {
  const allowed = {
    "1d": ["1d", "5m"],
    "5d": ["5d", "15m"],
    "1mo": ["1mo", "1d"],
    "3mo": ["3mo", "1d"],
    "6mo": ["6mo", "1d"],
    "1y": ["1y", "1d"],
    "5y": ["5y", "1wk"]
  };
  return allowed[range] || allowed["1y"];
}

async function yahooChart(symbol, range = "1y") {
  const [period1, interval] = rangeToInterval(range);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${period1}&interval=${interval}&events=div%2Csplits`;
  const r = await fetch(url, { headers: { "User-Agent": "MarketAnalysis/1.0" } });
  if (!r.ok) throw new Error(`Market provider returned ${r.status}`);
  const body = await r.json();
  const result = body?.chart?.result?.[0];
  if (!result) throw new Error("No market data returned");
  return result;
}

async function quote(url) {
  const symbol = yahooSymbol(url.searchParams.get("symbol"), url.searchParams.get("exchange") || "NSE");
  const result = await yahooChart(symbol, "1d");
  const meta = result.meta || {};
  const price = Number(meta.regularMarketPrice ?? meta.previousClose ?? 0);
  const previous = Number(meta.previousClose ?? 0);
  const change = previous ? price - previous : 0;
  const changePct = previous ? (change / previous) * 100 : 0;
  return json({ symbol, price, previousClose: previous, change, changePct, currency: meta.currency || "INR", exchange: meta.exchangeName || "" });
}

async function history(url) {
  const symbol = yahooSymbol(url.searchParams.get("symbol"), url.searchParams.get("exchange") || "NSE");
  const range = url.searchParams.get("range") || "1y";
  const result = await yahooChart(symbol, range);
  const timestamps = result.timestamp || [];
  const quoteData = result.indicators?.quote?.[0] || {};
  const rows = timestamps.map((timestamp, i) => ({
    time: timestamp * 1000,
    open: quoteData.open?.[i] ?? null,
    high: quoteData.high?.[i] ?? null,
    low: quoteData.low?.[i] ?? null,
    close: quoteData.close?.[i] ?? null,
    volume: quoteData.volume?.[i] ?? null
  })).filter(x => x.close != null);
  return json({ symbol, range, data: rows });
}

async function news(url) {
  const raw = String(url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!/^[A-Z0-9._-]{1,30}$/.test(raw)) throw new Error("Invalid symbol");
  const q = encodeURIComponent(raw);
  const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${q}&newsCount=10`, { headers: { "User-Agent": "MarketAnalysis/1.0" } });
  if (!r.ok) throw new Error(`News provider returned ${r.status}`);
  const body = await r.json();
  const items = (body.news || []).slice(0, 10).map(n => ({ title: n.title, publisher: n.publisher, link: n.link, publishedAt: n.providerPublishTime ? n.providerPublishTime * 1000 : null }));
  return json({ symbol: raw, items });
}

async function ai(request, env) {
  if (!env.OPENAI_API_KEY) return json({ error: "AI backend is not configured. Add OPENAI_API_KEY as a server secret." }, 503);
  const body = await request.json().catch(() => ({}));
  const question = String(body.question || "").trim();
  const context = String(body.context || "").slice(0, 12000);
  if (!question) return json({ error: "question is required" }, 400);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.6-luna",
      input: [
        { role: "system", content: "You are a neutral Indian stock-market research assistant. Explain data and risks clearly. Do not give personalized investment advice or tell the user what to buy or sell." },
        { role: "user", content: `Question: ${question}\n\nDashboard context:\n${context}` }
      ],
      max_output_tokens: 700
    })
  });
  const data = await response.json();
  if (!response.ok) return json({ error: data?.error?.message || "AI provider error" }, response.status);
  return json({ answer: data.output_text || "No answer returned." });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/quote") return await quote(url);
      if (url.pathname === "/api/history") return await history(url);
      if (url.pathname === "/api/news") return await news(url);
      if (url.pathname === "/api/ai" && request.method === "POST") return await ai(request, env);
      return json({ service: "Market Analysis API", status: "ok" });
    } catch (error) {
      return json({ error: error.message || "Request failed" }, 400);
    }
  }
};
