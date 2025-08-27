export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', 'https://anomie128.github.io');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') return res.status(200).end();
if (req.method === "GET") return res.status(200).json({ ok: true });
if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST requests allowed' });
  

try {
const body = req.body && typeof req.body === "object" ? req.body : await readJson(req);
const message = typeof body?.message === "string" ? body.message.trim() : "";
  
if (!message) return res.status(400).json({ error: "Missing 'message' in body" });
    
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
return res.status(500).json({ error: "OpenAI error", details: await openaiRes.text() });
const data = await openaiRes.json();
const reply = data.choices?.[0]?.message?.content || '응답을 받지 못했습니다.';
return res.status(200).json({ reply });
} catch (err) {
console.error('Server error', err);
return res.status(500).json({ error: 'Server error', details: err.message });
}
}
async function readJson(req) {
return new Promise((resolve, reject) => {
let data = '';
req.on('data', chunk => { data += chunk; });
req.on('end', () => {
try { resolve(JSON.parse(data || '{}')); } 
catch (e) { resolve({}); }
});
req.on('error', (e) => reject(e));
});
}
