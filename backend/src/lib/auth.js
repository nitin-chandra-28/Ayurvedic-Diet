import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}
export function requireAuth(req) {
  const hdr = req.headers['authorization'] || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return { ok: false, error: 'Missing token' };
  try { return { ok: true, user: jwt.verify(token, process.env.JWT_SECRET) }; }
  catch { return { ok: false, error: 'Invalid token' }; }
}
