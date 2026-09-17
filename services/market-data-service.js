/* Market Analysis — provider-agnostic market data adapter.
 * GitHub Pages is static, so secrets must NOT be placed in this browser file.
 * Point API_BASE at your own secure backend/proxy when ready.
 */
(function () {
  const API_BASE = (window.MARKET_API_BASE || '').replace(/\/$/, '');

  async function request(path, options) {
    if (!API_BASE) return null;
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...(options && options.headers) }
    });
    if (!response.ok) throw new Error(`Market API ${response.status}`);
    return response.json();
  }

  window.MarketData = {
    enabled: Boolean(API_BASE),
    async quote(symbol, exchange = 'NSE') {
      return request(`/api/quote?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
    },
    async history(symbol, exchange = 'NSE', range = '1y') {
      return request(`/api/history?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}&range=${encodeURIComponent(range)}`);
    },
    async news(symbol, exchange = 'NSE') {
      return request(`/api/news?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
    },
    async search(query) {
      return request(`/api/companies?query=${encodeURIComponent(query)}`);
    }
  };
})();
