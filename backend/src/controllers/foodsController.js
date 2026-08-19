import { Foods } from '../models/foods.js';
import { json } from '../lib/respond.js';
export async function list(req, res) {
  const searchParams = new URLSearchParams(req.url.split('?')[1] || '');
  const { dosha, season, q, type, page = '1', limit = '20' } = Object.fromEntries(searchParams);
  
  const filter = {};
  if (dosha) filter['dosha_tags'] = dosha;
  if (season) filter['season'] = season;
  if (type) filter['type'] = type;
  
  let cursor = Foods().find(filter);
  if (q) cursor = Foods().find({ $text: { $search: q }, ...filter });
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const items = await cursor.skip(skip).limit(parseInt(limit)).toArray();
  return json(res, 200, { items, page: Number(page) });
}
