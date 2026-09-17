/* Vercel serverless entry point for the Gemini AI assistant. */
const { handler } = require('../services/ai-chat-route');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://alengineer.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  return handler(req, res);
};
