/* Serverless route handler for the Market Analysis AI Engine using Gemini. */

const { runAI } = require('./ai-engine');
const provider = require('./ai-provider-gemini');

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

    const answer = await runAI({
      question: body.question,
      context: body.context || {},
      provider
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ answer }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message || 'AI request failed' }));
  }
}

module.exports = { handler };
