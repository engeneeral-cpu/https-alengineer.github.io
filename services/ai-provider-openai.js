/* OpenAI provider adapter.
 * Requires OPENAI_API_KEY in the server deployment environment.
 * Never put this key in GitHub Pages/browser JavaScript.
 */

async function chat({ system, prompt, model = process.env.OPENAI_MODEL || 'gpt-5.4-mini' }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      instructions: system,
      input: prompt,
      max_output_tokens: 900
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.output_text || '';
}

module.exports = { chat };
