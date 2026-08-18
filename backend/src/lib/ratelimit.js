const bucket = new Map(); // ip -> {count, ts}
export function limit(req, res, max=60, windowMs=60000) {
  const ip = req.socket.remoteAddress || 'x';
  const now = Date.now();
  const e = bucket.get(ip) || { count: 0, ts: now };
  if (now - e.ts > windowMs) { e.count = 0; e.ts = now; }
  e.count++; bucket.set(ip, e);
  return e.count <= max;
}
