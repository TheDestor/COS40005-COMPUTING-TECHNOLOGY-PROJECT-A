import express from 'express';
// ... existing code ...
const router = express.Router();

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter'
];

// Simple in-memory cache keyed by the final QL string
const cache = new Map();
const MAX_CACHE_ENTRIES = 200;

const evictIfNeeded = () => {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
};

const buildOverpassQL = ({ rules, center, radiusMeters, maxResults }) => {
  const { lat, lng } = center;
  const blocks = rules.flatMap(({ key, values }) =>
    values.map(v => `
      node["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
      way["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
      relation["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
    `)
  ).join('\n');

  const outCount = Math.max(1, Math.min(Number(maxResults) || 100, 100));
  return `
    [out:json][timeout:15];
    (
      ${blocks}
    );
    out center ${outCount};
  `;
};

router.post('/query', async (req, res) => {
  try {
    const { rules, center, radiusMeters = 10000, maxResults = 100 } = req.body || {};
    if (!rules || !center) {
      return res.status(400).json({ error: 'rules and center are required' });
    }

    const ql = buildOverpassQL({ rules, center, radiusMeters, maxResults });

    // Serve from cache on pressure
    if (cache.has(ql)) {
      return res.status(200).json(cache.get(ql));
    }

    const BASE_DELAY_MS = 1500;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const url of OVERPASS_URLS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept-Language': 'en',
              'User-Agent': 'MetaverseTrails/1.0 (+contact: your-email@example.com)'
            },
            body: new URLSearchParams({ data: ql }).toString(),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const json = await response.json();
            cache.set(ql, json);
            evictIfNeeded();
            return res.status(200).json(json);
          }

          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitMs = retryAfter ? Number(retryAfter) * 1000 : BASE_DELAY_MS * (attempt + 1);
            await sleep(waitMs);
            continue;
          }

          if (response.status >= 500 && response.status < 600) {
            const backoffMs = BASE_DELAY_MS * (attempt + 1) + Math.floor(Math.random() * 500);
            await sleep(backoffMs);
            continue;
          }

          // Non-retryable; try next mirror
          break;
        } catch (err) {
          const backoffMs = BASE_DELAY_MS * (attempt + 1) + Math.floor(Math.random() * 500);
          await sleep(backoffMs);
        }
      }
    }

    // Final fallback: cached response if available
    if (cache.has(ql)) {
      return res.status(200).json(cache.get(ql));
    }

    return res.status(503).json({ error: 'Overpass unavailable; try later' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;