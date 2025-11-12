import { getDB } from '../lib/db.js';
export function Foods() { return getDB().collection('foods'); }
