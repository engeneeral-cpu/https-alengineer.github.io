/* Gemini provider adapter for the Market Analysis AI Engine.
 * Requires GEMINI_API_KEY in the server deployment environment.
 * Never put this key in GitHub Pages/browser JavaScript.
 */
async function chat({ system, prompt, model = process.env.GEMINI_MODEL || 'gemini-3.7-flash' }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 900 }
    })
  });
  if (!response.ok) throw new Error(`Gemini API ${response.status}`);
  const data = await response.json();
  return (data.candidates || []).flatMap(c => c.content?.parts || []).map(p => p.text || '').join('').trim();
}
module.exports = { chat };
