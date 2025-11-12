import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let client, db;
export async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db();
  // Create indexes once
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('foods').createIndex({ name: 'text', 'tags.dosha': 1, season: 1 });
  await db.collection('diet_plans').createIndex({ user_id: 1, date_generated: -1 });
  return db;
}
export function getDB() { if (!db) throw new Error('DB not connected'); return db; }
export async function closeDB() { await client?.close(); }
