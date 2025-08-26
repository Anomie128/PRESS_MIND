// Place this file in your repository at /api/chat.js (Vercel will deploy it automatically).
// It expects an environment variable OPENAI_API_KEY to be set in Vercel Project Settings.
//
// CORS is set to '*' for simplicity — for production, restrict to your domains.

export default async function handler(req, res) {
  // Basic CORS handling so the GitHub Pages front-end can call this endpoint.
  res.setHeader('Access-Control-Allow-Origin', 'https://anomie128.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const body = req.body || (await readJson(req));
    const message = body.message;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Prepare request to OpenAI Chat Completions endpoint.
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '너는 한국어로 답하는 짧은 감정 코치다. 항상 3단계 루프를 유지한다: ①한 줄 공감 ②패턴 라벨링 ③60초 미션. 답변은 120자 이내, 이모지 1개만 사용. 위험 신호가 보이면 즉시 도움을 권유한다.' },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.6
      })
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res.status(500).json({ error: 'OpenAI API error', details: text });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || '응답을 받지 못했습니다.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server error', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Helper: some Vercel runtimes may not parse JSON automatically for non-framework projects.
// This helper tries to parse the incoming body if needed.
async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', (e) => reject(e));
  });
}
