const ANCHOR_URL = process.env.ANCHOR_URL || 'https://example.com/ada4wm/anchor';
const ANCHOR_API_KEY = process.env.ANCHOR_API_KEY || '';

export default async function handler(req, res) {
  const commit = req.query.commit || 'latest';
  const url = `${ANCHOR_URL}?commit=${encodeURIComponent(commit)}`;
  const headers = {};
  if (ANCHOR_API_KEY) headers['Authorization'] = `Bearer ${ANCHOR_API_KEY}`;

  try {
    const r = await fetch(url, { method: 'GET', headers });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Cache at the edge for short duration to reduce latency on repeated lookups
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(r.status).json({ ok: true, source: 'anchor', data });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}
