import { Users } from '../models/users.js';
import { json } from '../lib/respond.js';
import { signToken } from '../lib/auth.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  sex: z.enum(['M','F','O']).optional(),
  dob: z.string().optional()
});

export async function register(req, res, body) {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return json(res, 422, { error: parsed.error.flatten() });
  const user = parsed.data;
  const exists = await Users().findOne({ email: user.email });
  if (exists) return json(res, 409, { error: 'Email in use' });
  const password_hash = await bcrypt.hash(user.password, 10);
  const doc = { name: user.name, email: user.email, password_hash, created_at: new Date() };
  const { insertedId } = await Users().insertOne(doc);
  const token = signToken({ uid: insertedId.toString(), email: user.email });
  return json(res, 201, { user: { id: insertedId, name: user.name, email: user.email }, token });
}

export async function login(req, res, body) {
  const { email, password } = body || {};
  if (!email || !password) return json(res, 422, { error: 'email, password required' });
  const u = await Users().findOne({ email });
  if (!u) return json(res, 401, { error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return json(res, 401, { error: 'Invalid credentials' });
  const token = signToken({ uid: u._id.toString(), email: u.email });
  return json(res, 200, { token, user: { id: u._id, name: u.name, email: u.email } });
}
