# Market Analysis secure backend

This folder contains a Cloudflare Worker API for the GitHub Pages frontend.

## Endpoints

- `GET /api/quote?symbol=RELIANCE&exchange=NSE`
- `GET /api/history?symbol=RELIANCE&exchange=NSE&range=1y`
- `GET /api/news?symbol=RELIANCE&exchange=NSE`
- `POST /api/ai` with `{ "question": "...", "context": "..." }`

Market data is fetched server-side so provider credentials are never placed in the public GitHub Pages JavaScript.

## AI secret

Set `OPENAI_API_KEY` as a Cloudflare Worker secret. Optionally set `OPENAI_MODEL` as a Worker variable. The current worker defaults to `gpt-5.6-luna`.

## Deployment

Deploy `backend/worker.js` as a Cloudflare Worker. After deployment, set the GitHub Pages frontend's `window.MARKET_API_BASE` to the Worker URL. Do not commit API keys or other secrets to this repository.

The market endpoints currently use Yahoo Finance chart/search endpoints as the upstream source. Provider availability and terms can change, so a production deployment should verify the upstream provider's current terms and reliability.
