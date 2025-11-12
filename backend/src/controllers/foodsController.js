import { Foods } from '../models/foods.js';
import { json } from '../lib/respond.js';
import url from 'url';

export async function list(req, res) {
  const { query } = url.parse(req.url, true);
  const { dosha, season, q, type, page='1', limit='20' } = query;
  const filter = {};
  if (dosha) filter['dosha_tags'] = dosha; // array match
  if (season) filter['season'] = season;
  if (type) filter['type'] = type;
  let cursor = Foods().find(filter);
  if (q) cursor = Foods().find({ $text: { $search: q }, ...filter });
  const skip = (parseInt(page)-1) * parseInt(limit);
  const items = await cursor.skip(skip).limit(parseInt(limit)).toArray();
  return json(res, 200, { items, page: Number(page) });
}
