import { getDB } from '../lib/db.js';

export function Rules() { 
  return getDB().collection('rules'); 
}

// Load rules from rule_matrix.csv into MongoDB
export async function loadRulesFromCSV() {
  const fs = require('fs');
  const path = require('path');
  const csvPath = path.join(__dirname, '../../../data/rule_matrix.csv');
  
  // This is a stub - in production, parse CSV and insert
  // For now, return hardcoded rules matching the Python implementation
  return [
    { rule_id: 1, priority: 1, category: 'dosha', attribute: 'dosha_tags', operator: 'contains', value: 'Vata', score_adjustment: -1 },
    { rule_id: 2, priority: 1, category: 'dosha', attribute: 'dosha_tags', operator: 'contains', value: 'Pitta', score_adjustment: -1 },
    { rule_id: 3, priority: 1, category: 'dosha', attribute: 'dosha_tags', operator: 'contains', value: 'Kapha', score_adjustment: -1 },
    { rule_id: 4, priority: 1, category: 'dosha', attribute: 'dosha_tags', operator: 'contains', value: 'Balancing', score_adjustment: 1 }
  ];
}
