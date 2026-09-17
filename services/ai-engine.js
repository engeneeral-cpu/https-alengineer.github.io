/* Market Analysis AI Engine
 * Server-side orchestration layer. Keep provider credentials in deployment secrets.
 */

const SYSTEM_PROMPT = `You are Market Analysis AI Engine, a research assistant for Indian NSE and BSE companies.\n\nRules:\n- Use supplied market/company/news data as the factual context.\n- Clearly distinguish facts, calculations, and interpretation.\n- Do not invent prices, financial figures, news, or company facts.\n- If data is missing or stale, say so.\n- Do not present personalized investment advice or guaranteed outcomes.\n- Return concise structured research with: Summary, Key Data, Drivers/Risks, and What to Check Next.`;

function buildPrompt(question, context = {}) {
  return `${SYSTEM_PROMPT}\n\nUSER QUESTION:\n${question}\n\nRESEARCH CONTEXT:\n${JSON.stringify(context, null, 2)}`;
}

async function runAI({ question, context, provider }) {
  if (!question || typeof question !== 'string') throw new Error('Question is required');
  if (!provider || typeof provider.chat !== 'function') throw new Error('AI provider is not configured');
  return provider.chat({ system: SYSTEM_PROMPT, prompt: buildPrompt(question, context) });
}

module.exports = { SYSTEM_PROMPT, buildPrompt, runAI };
