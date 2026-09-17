/* Serverless route handler for the Market Analysis AI Engine using Tara Intelligence Engine + Gemini. */

const { runAI } = require('./ai-engine');
const provider = require('./ai-provider-gemini');
const tara = require('./tara-intelligence-engine');

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body.question || typeof body.question !== 'string') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'A question is required' }));
    }

    const question = body.question.trim();
    const context = body.context || {};
    const native = tara.processQuery(question, context.stockContext || context);

    // Native Tara responses handle greetings, intent routing and evidence-gated analysis.
    if (native && native.text && native.intent !== 'GENERAL_MARKET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ answer: native.text, native: true, intent: native.intent, tara: native }));
    }

    // Gemini is used only as the language/research fallback; credentials remain server-side.
    const answer = await runAI({
      question,
      context: {
        ...context,
        taraIntent: native?.intent || null,
        taraEngine: tara.ENGINE_VERSION,
        evidenceFirst: true
      },
      provider
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ answer, native: false, intent: native?.intent || 'GENERAL_MARKET', tara: native }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message || 'AI request failed' }));
  }
}

module.exports = { handler };
