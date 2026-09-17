# Gemini AI backend setup

The GitHub Pages site is static. The Gemini API key must stay on a serverless backend.

## Vercel

1. Import this GitHub repository into Vercel.
2. Deploy the project.
3. In Vercel Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = a Gemini model available to your API account (optional)
   - `ALLOWED_ORIGIN` = `https://alengineer.github.io` (optional; this is the default)
4. Redeploy after adding the variables.
5. Your Vercel deployment will expose `POST /api/ai`.
6. Configure the GitHub Pages frontend with `window.MARKET_API_BASE` set to the Vercel deployment URL before loading `app.js`.

Never commit `GEMINI_API_KEY` to GitHub or put it in browser JavaScript.
