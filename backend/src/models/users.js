import { getDB } from '../lib/db.js';
export function Users() { return getDB().collection('users'); }
