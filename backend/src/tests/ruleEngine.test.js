/**
 * Rule Engine Tests
 * Tests the Ayurvedic scoring and meal planning logic
 */

import { buildPlan } from '../services/ruleEngine.js';
import { calculateTargetCalories, getMacroTargets } from '../services/nutrition.js';

// Sample test data
const sampleFoods = [
  {
    food_id: 'f_035',
    name: 'Moong Dal',
    dosha_impact: 'Vata,Pitta,Kapha,Balancing',
    tastes: 'sweet, astringent',
    qualities: 'light, dry',
    energy: 'cooling',
    season: 'all',
    calories_100g: 326,
    carbs_100g: 52.59,
    protein_100g: 23.88,
    fat_100g: 1.35,
    type: 'legume'
  },
  {
    food_id: 'f_016',
    name: 'Basmati Rice',
    dosha_impact: 'Vata,Pitta,Kapha',
    tastes: 'sweet',
    qualities: 'heavy, unctuous',
    energy: 'cooling',
    season: 'all',
    calories_100g: 356,
    carbs_100g: 78.24,
    protein_100g: 7.94,
    fat_100g: 0.52,
    type: 'grain'
  },
  {
    food_id: 'd_091',
    name: 'Bottle Gourd',
    dosha_impact: 'Pitta',
    tastes: 'sweet',
    qualities: 'light, unctuous',
    energy: 'cooling',
    season: 'summer',
    calories_100g: 14,
    carbs_100g: 2.53,
    protein_100g: 0.42,
    fat_100g: 0.12,
    type: 'vegetable'
  },
  {
    food_id: 'e_171',
    name: 'Banana',
    dosha_impact: 'Vata,Pitta',
    tastes: 'sweet',
    qualities: 'heavy, unctuous',
    energy: 'cooling',
    season: 'all',
    calories_100g: 111,
    carbs_100g: 24.95,
    protein_100g: 1.25,
    fat_100g: 0.32,
    type: 'fruit'
  },
  {
    food_id: 'f_223',
    name: 'Almond',
    dosha_impact: 'Vata,Pitta',
    tastes: 'sweet',
    qualities: 'heavy, unctuous',
    energy: 'heating',
    season: 'all',
    calories_100g: 655,
    carbs_100g: 6.93,
    protein_100g: 20.80,
    fat_100g: 58.93,
    type: 'nut'
  }
];

const sampleProfile = {
  dosha_result: 'Pitta',
  age_years: 30,
  sex: 'M',
  height_cm: 175,
  weight_kg: 75,
  activity_level: 'moderate',
  health_goals: ['maintain_health'],
  preferences: {
    liked: ['rice', 'dal'],
    disliked: []
  },
  allergies: []
};

// Test 1: Plan Generation
console.log('Test 1: Basic Plan Generation');
console.log('================================');
try {
  const plan = buildPlan({
    profile: sampleProfile,
    foods: sampleFoods,
    plan_type: 'daily',
    targetCalories: 2000
  });
  
  console.log('✓ Plan generated successfully');
  console.log(`  - Meals: ${plan.meals.length}`);
  console.log(`  - Target Calories: ${plan.target_calories}`);
  console.log(`  - Actual Calories: ${plan.total_calories}`);
  console.log(`  - Dosha Target: ${plan.dosha_target}`);
  console.log(`  - Season: ${plan.season}`);
  
  plan.meals.forEach((meal) => {
    console.log(`  - ${meal.meal_type}: ${meal.items.length} items, ${meal.total_calories} kcal`);
    meal.items.forEach(item => {
      console.log(`    * ${item.name} (${item.portion})`);
    });
  });
  
  if (plan.meals.length < 3) {
    throw new Error('Expected at least 3 meals');
  }
  
  console.log('\n✓ Test 1 PASSED\n');
} catch (error) {
  console.error('✗ Test 1 FAILED:', error.message);
  process.exit(1);
}

console.log('ALL TESTS PASSED ✓');
