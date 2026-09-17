# Market data service contract

The frontend is hosted on GitHub Pages, so API secrets must never be stored in `app.js`, HTML, or other public browser files.

Configure a secure backend/proxy and set `window.MARKET_API_BASE` before loading `services/market-data-service.js`.

Required endpoints:

- `GET /api/quote?symbol=RELIANCE&exchange=NSE`
- `GET /api/history?symbol=RELIANCE&exchange=NSE&range=1y`
- `GET /api/news?symbol=RELIANCE&exchange=NSE`
- `GET /api/companies?query=tata`

Suggested response shapes:

```json
{ "symbol":"RELIANCE", "exchange":"NSE", "price":1423.8, "change":1.24, "timestamp":"2026-09-17T10:00:00Z" }
```

```json
{ "symbol":"RELIANCE", "exchange":"NSE", "range":"1y", "points":[{"time":"2026-01-02","open":1000,"high":1010,"low":990,"close":1005,"volume":1000000}] }
```

This keeps provider credentials on the server and lets the website switch market-data providers without rewriting the UI.
