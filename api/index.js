// Vercel Serverless Function — API Proxy
// Proxies API requests for the VibraCode mobile app (chat, e2b, providers, etc.)

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check
  if (req.url === '/health' || req.url === '/') {
    return res.status(200).json({
      status: 'ok',
      service: 'vibracode-api-proxy',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(404).json({ error: 'Not found' });
};
