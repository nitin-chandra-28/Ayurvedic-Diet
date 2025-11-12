/**
 * Database Seeding Script
 * Loads foods from foods_mapped.csv into MongoDB
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    console.log('Clearing existing foods...');
    await db.collection('foods').deleteMany({});
    
    // Read and parse CSV
    const csvPath = path.join(__dirname, '../../data/foods_mapped.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Parse header
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    // Parse foods
    const foods = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Parse CSV with quoted fields
      const values = parseCSVLine(line);
      if (values.length !== header.length) {
        console.warn(`Skipping malformed line ${i}: ${line.substring(0, 50)}...`);
        continue;
      }
      
      const food = {};
      header.forEach((key, idx) => {
        food[key] = values[idx];
      });
      
      // Transform to proper types
      const transformed = {
        food_id: food.food_id,
        name: food.name,
        common_names: food.common_names,
        dosha_impact: food.dosha_impact,
        tastes: food.tastes,
        qualities: food.qualities,
        energy: food.energy,
        season: food.season,
        calories_100g: parseFloat(food.calories_100g) || 0,
        carbs_100g: parseFloat(food.carbs_100g) || 0,
        protein_100g: parseFloat(food.protein_100g) || 0,
        fat_100g: parseFloat(food.fat_100g) || 0,
        notes: food.notes,
        source_id: food.source_id,
        type: inferType(food.food_id),
        created_at: new Date()
      };
      
      foods.push(transformed);
    }
    
    console.log(`Inserting ${foods.length} foods...`);
    const result = await db.collection('foods').insertMany(foods);
    console.log(`Successfully inserted ${result.insertedCount} foods`);
    
    // Create indexes
    console.log('Creating indexes...');
    await db.collection('foods').createIndex({ name: 'text', 'common_names': 'text' });
    await db.collection('foods').createIndex({ dosha_impact: 1 });
    await db.collection('foods').createIndex({ season: 1 });
    await db.collection('foods').createIndex({ type: 1 });
    
    console.log('Seeding complete!');
    
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

function inferType(food_id) {
  if (!food_id) return 'other';
  const prefix = food_id.charAt(0).toUpperCase();
  
  const typeMap = {
    'A': 'grain',
    'B': 'legume',
    'C': 'leafy_vegetable',
    'D': 'vegetable',
    'E': 'fruit',
    'F': 'nut_seed',
    'G': 'spice',
    'H': 'root_vegetable',
    'I': 'sweetener',
    'J': 'sweetener',
    'K': 'dairy',
    'L': 'protein'
  };
  
  return typeMap[prefix] || 'other';
}

seedDatabase();
