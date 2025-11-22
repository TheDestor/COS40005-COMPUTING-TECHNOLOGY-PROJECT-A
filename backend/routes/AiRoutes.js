import express from 'express';
import { aiChatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const SYSTEM_PROMPT = `
You are Sarawak Tourism Assistant.
- Only answer questions related to tourism: destinations, attractions, culture, events, food, hotels, transport, guides, itineraries, safety, weather, best times to visit, local tips in Sarawak and Malaysia.
- If the user asks anything outside tourism, politely refuse and ask them to rephrase a tourism-related question.
- Strictly refuse coding/programming requests; never output code blocks or fenced snippets.
- Keep answers concise and practical. When useful, suggest nearby places, travel logistics, or next steps.
- Use markdown headings and lists, bold for important information and no ###.
- Please do not output any code blocks or fenced snippets.
- Never use tables or code fences; use short paragraphs or bullet points.
`;

// Guardrail: detect code/programming requests and refuse
function shouldRefuse(content = '') {
  const s = String(content).toLowerCase();

  const codeTriggers = [
    'hello, world',
    'code',
    'program',
    'script',
    'algorithm',
    'compile',
    'run this',
    'snippet',
    'function',
    'class',
    'console.log',
    'system.out.println',
    'print(',
    '#include',
    'public class',
    'int main(',
    'fn main',
    'rust',
    'python',
    'javascript',
    'java',
    'c++',
    'c#',
  ];

  if (codeTriggers.some(k => s.includes(k))) return true;
  if (/```/.test(content)) return true;
  return false;
}

router.post('/chat', aiChatLimiter, async (req, res) => {
  try {
    const { messages, model } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Sanitize payload to avoid upstream 400 on bad shapes/empty content
    const sanitizeMessages = (msgs) =>
      msgs
        .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
        .map(m => ({ role: m.role.trim(), content: m.content.trim().slice(0, 4000) }))
        .filter(m => m.role && m.content);

    const safeMessages = sanitizeMessages(messages);
    if (safeMessages.length === 0) {
      return res.status(400).json({ error: 'No valid messages after sanitization' });
    }

    const lastUser = [...safeMessages].reverse().find(m => m.role === 'user')?.content || '';
    if (shouldRefuse(lastUser)) {
      const refusal =
        'I can help with tourism in Sarawak and Malaysia — attractions, itineraries, food, transport, culture, events, and tips. I’m not able to provide programming code. Please ask a tourism-related question.';
      return res.json({
        choices: [{ message: { role: 'assistant', content: refusal } }],
      });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY on server' });
    }

    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const forwardedHost = req.headers['x-forwarded-host'] ? `https://${req.headers['x-forwarded-host']}` : null;
    const originHeader = req.headers.origin || null;
    const siteUrl =
      process.env.SITE_PRODUCTION_URL ||
      process.env.SITE_URL ||
      originHeader ||
      forwardedHost ||
      'http://localhost:5050';
    const siteTitle = process.env.SITE_TITLE || 'Sarawak Explorer';

    const PRIMARY_MODEL = model || process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1-0528:free';
    const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || null;

    const makePayload = (mdl) => ({
      model: mdl,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...safeMessages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.3,
      top_p: 0.9
    });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const MAX_UPSTREAM_RETRIES = Number(process.env.OPENROUTER_MAX_RETRIES) || 2;

    const tryModel = async (mdl) => {
      for (let attempt = 0; attempt <= MAX_UPSTREAM_RETRIES; attempt++) {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': siteUrl,
            'X-Title': siteTitle,
            'Origin': siteUrl,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(makePayload(mdl))
        });

        const rawText = await r.text();
        if (!r.ok) {
          // Log upstream details to aid debugging
          console.error('AI upstream error', { status: r.status, body: rawText });
        }

        if (r.ok) {
          return { ok: true, text: rawText, headers: r.headers, status: r.status };
        }

        if (r.status === 429 && attempt < MAX_UPSTREAM_RETRIES) {
          const retryAfterHeader = r.headers.get('retry-after') || r.headers.get('Retry-After');
          const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : 15;
          await sleep(Math.max(1, retryAfterSec) * 1000);
          continue;
        }

        return { ok: false, text: rawText, headers: r.headers, status: r.status };
      }

      return { ok: false, text: 'Retry loop exhausted', headers: new Headers(), status: 500 };
    };

    const primaryRes = await tryModel(PRIMARY_MODEL);
    if (primaryRes.ok) {
      return res.type('application/json').send(primaryRes.text);
    }

    if (FALLBACK_MODEL) {
      const fallbackRes = await tryModel(FALLBACK_MODEL);
      if (fallbackRes.ok) {
        return res.type('application/json').send(fallbackRes.text);
      }

      const retryAfterHeader =
        fallbackRes.headers.get('retry-after') ||
        fallbackRes.headers.get('Retry-After') ||
        primaryRes.headers?.get?.('Retry-After');
      if (retryAfterHeader) res.set('Retry-After', retryAfterHeader);

      let asJson = null;
      try { asJson = JSON.parse(fallbackRes.text); } catch {}

      if (fallbackRes.status === 401) {
        return res.status(401).json({
          success: false,
          code: 'UPSTREAM_AUTH_ERROR',
          message: (asJson?.error?.message || asJson?.message || 'Upstream authentication error'),
          status: 401,
          hint: 'Verify OPENROUTER_API_KEY and account status on the backend.',
          source: 'UPSTREAM',
          metadata: asJson?.error?.metadata || asJson?.metadata
        });
      }

      if (fallbackRes.status === 400) {
        return res.status(400).json({
          success: false,
          code: 'UPSTREAM_BAD_REQUEST',
          message: (asJson?.error?.message || asJson?.message || 'Provider returned error'),
          status: 400,
          hint: 'Check model name, payload schema (messages[] with role/content), and attribution headers.',
          source: 'UPSTREAM',
          metadata: asJson?.error?.metadata || asJson?.metadata
        });
      }

      const payloadErr = asJson || {
        success: false,
        code: 'UPSTREAM_ERROR',
        message: fallbackRes.text || 'Upstream error',
        status: fallbackRes.status,
        source: 'UPSTREAM',
        modelTried: PRIMARY_MODEL,
        fallbackTried: FALLBACK_MODEL,
        retryAfterSeconds: retryAfterHeader ? Number(retryAfterHeader) : undefined,
      };
      return res.status(fallbackRes.status).json(payloadErr);
    }

    const retryAfterHeader = primaryRes.headers?.get?.('Retry-After');
    if (retryAfterHeader) res.set('Retry-After', retryAfterHeader);

    let asJson = null;
    try { asJson = JSON.parse(primaryRes.text); } catch {}

    if (primaryRes.status === 401) {
      return res.status(401).json({
        success: false,
        code: 'UPSTREAM_AUTH_ERROR',
        message: (asJson?.error?.message || asJson?.message || 'Upstream authentication error'),
        status: 401,
        hint: 'Verify OPENROUTER_API_KEY and account status on the backend.',
        source: 'UPSTREAM',
        metadata: asJson?.error?.metadata || asJson?.metadata
      });
    }

    if (primaryRes.status === 400) {
      return res.status(400).json({
        success: false,
        code: 'UPSTREAM_BAD_REQUEST',
        message: (asJson?.error?.message || asJson?.message || 'Provider returned error'),
        status: 400,
        hint: 'Check model name, payload schema (messages[] with role/content), and attribution headers.',
        source: 'UPSTREAM',
        metadata: asJson?.error?.metadata || asJson?.metadata
      });
    }

    const payloadErr = asJson || {
      success: false,
      code: 'UPSTREAM_ERROR',
      message: primaryRes.text || 'Upstream error',
      status: primaryRes.status,
      source: 'UPSTREAM',
      modelTried: PRIMARY_MODEL,
      retryAfterSeconds: retryAfterHeader ? Number(retryAfterHeader) : undefined,
    };
    return res.status(primaryRes.status).json(payloadErr);
  } catch (e) {
    console.error('AI proxy error:', e);
    res.status(500).json({ error: 'AI proxy failed' });
  }
});

export default router;