import { getDB } from '../lib/db.js';
export function Plans() { return getDB().collection('diet_plans'); }
