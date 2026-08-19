const ALLOWED_ORIGINS = [
  'https://ayurvedic-diet.vercel.app', // Your deployed frontend URL (no trailing slash)
  'http://localhost:5173',                   // Local Vite dev server
  'http://localhost:3000',                   // Local React dev server
];

export function applyCORS(req, res) {
  const origin = req.headers.origin;

  // If the incoming request origin is in our allowed list, reflect it back
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}
