/**
 * Nutrition calculation and meal balancing utilities
 */

// Calculate BMR using Mifflin-St Jeor equation
export function calculateBMR(profile) {
  const { sex = 'M', height_cm = 170, weight_kg = 70, age_years, dob } = profile;
  const age = age_years ?? (dob ? Math.floor((Date.now() - Date.parse(dob)) / 31557600000) : 25);
  const s = sex === 'M' ? 5 : -161;
  return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + s;
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(profile) {
  const { activity_level = 'moderate' } = profile;
  const bmr = calculateBMR(profile);
  const factors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return Math.round(bmr * (factors[activity_level] ?? 1.55));
}

// Calculate target calories based on goals
export function calculateTargetCalories(profile) {
  const tdee = calculateTDEE(profile);
  const goals = profile.health_goals || [];
  
  if (goals.includes('weight_loss') || goals.includes('Weight Loss')) {
    return Math.round(tdee * 0.8); // 20% deficit
  }
  if (goals.includes('weight_gain') || goals.includes('Weight Gain')) {
    return Math.round(tdee * 1.15); // 15% surplus
  }
  if (goals.includes('muscle_gain')) {
    return Math.round(tdee * 1.1); // 10% surplus
  }
  return tdee; // maintenance
}

// Get macro distribution based on goals and dosha
export function getMacroTargets(profile) {
  const goals = profile.health_goals || [];
  const dosha = profile.dosha_result || 'Vata';
  
  // Base macros by goal
  if (goals.includes('weight_loss')) {
    return { protein: 30, carbs: 40, fats: 30 };
  }
  if (goals.includes('muscle_gain')) {
    return { protein: 25, carbs: 50, fats: 25 };
  }
  
  // Ayurvedic-adjusted macros by dosha
  if (dosha.includes('Vata')) {
    return { protein: 20, carbs: 50, fats: 30 }; // More grounding, warming fats
  }
  if (dosha.includes('Pitta')) {
    return { protein: 20, carbs: 55, fats: 25 }; // Cooling, balanced
  }
  if (dosha.includes('Kapha')) {
    return { protein: 25, carbs: 45, fats: 30 }; // Lighter, more protein
  }
  
  return { protein: 20, carbs: 55, fats: 25 }; // default
}

// Calculate macros for a food item
export function calculateFoodMacros(food, grams = 100) {
  const scale = grams / 100;
  return {
    calories: Math.round((food.calories_100g || 0) * scale),
    protein: Math.round((food.protein_100g || 0) * scale * 10) / 10,
    carbs: Math.round((food.carbs_100g || 0) * scale * 10) / 10,
    fats: Math.round((food.fat_100g || 0) * scale * 10) / 10
  };
}

// Calculate total macros for a meal
export function calculateMealMacros(items) {
  return items.reduce((total, item) => {
    const macros = calculateFoodMacros(item.food, item.grams);
    return {
      calories: total.calories + macros.calories,
      protein: total.protein + macros.protein,
      carbs: total.carbs + macros.carbs,
      fats: total.fats + macros.fats
    };
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

// Distribute calories across meals
export function distributeMealCalories(totalCalories, mealCount = 3) {
  // Typical distribution: breakfast 25%, lunch 35%, dinner 30%, snacks 10%
  const distributions = {
    3: [0.30, 0.40, 0.30],
    4: [0.25, 0.35, 0.10, 0.30],
    5: [0.20, 0.30, 0.10, 0.30, 0.10]
  };
  
  const dist = distributions[mealCount] || distributions[3];
  return dist.map(pct => Math.round(totalCalories * pct));
}
