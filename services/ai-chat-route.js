/* Generic serverless route handler for the Market Analysis AI Engine.
 * Adapt the exported handler to your deployment platform if required.
 */

const { runAI } = require('./ai-engine');
const provider = require('./ai-provider-openai');

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const answer = await runAI({
      question: body.question,
      context: body.context || {},
      provider
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ answer }));
  } catch (error) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message || 'AI request failed' }));
  }
}

module.exports = { handler };
