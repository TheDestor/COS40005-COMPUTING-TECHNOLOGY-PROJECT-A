import express from 'express';

const router = express.Router();

const SYSTEM_PROMPT = `
You are Sarawak Tourism Assistant.
- Only answer questions related to tourism: destinations, attractions, culture, events, food, hotels, transport, guides, itineraries, safety, weather, best times to visit, local tips in Sarawak and Malaysia.
- If the user asks anything outside tourism, politely refuse and ask them to rephrase a tourism-related question.
- Keep answers concise and practical. When useful, suggest nearby places, travel logistics, or next steps.
- Use markdown headings and lists, bold for important information and no ###.
`;

router.post('/chat', async (req, res) => {
	try {
		const { messages, model } = req.body || {};
		if (!Array.isArray(messages) || messages.length === 0) {
			return res.status(400).json({ error: 'messages array is required' });
		}

		const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
		if (!OPENROUTER_API_KEY) {
			return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY on server' });
		}

		const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
		const siteUrl = process.env.SITE_URL || req.headers.origin || 'http://localhost:5050';
		const siteTitle = process.env.SITE_TITLE || 'Sarawak Explorer';

		const payload = {
			model: model || 'deepseek/deepseek-chat-v3.1:free',
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				...messages.map(m => ({ role: m.role, content: m.content }))
			],
			temperature: 0.3,
			top_p: 0.9
		};

		const r = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'HTTP-Referer': siteUrl,
				'X-Title': siteTitle,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const text = await r.text();
		if (!r.ok) {
			return res.status(r.status).send(text);
		}

		res.type('application/json').send(text);
	} catch (e) {
		console.error('AI proxy error:', e);
		res.status(500).json({ error: 'AI proxy failed' });
	}
});

export default router;