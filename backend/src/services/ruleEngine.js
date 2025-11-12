import { calculateTargetCalories, getMacroTargets, calculateFoodMacros, distributeMealCalories } from './nutrition.js';

/**
 * Advanced Rule Engine based on Ayurvedic principles
 * Mirrors the Python implementation from rule_engine.py
 */

// Inputs: profile, foods[], plan_type, targetCalories
// Output: { meals[], macros, dosha_target, explanation_logs[] }
export function buildPlan({ profile, foods, plan_type = 'daily', targetCalories }) {
  const dosha = profile.dosha_result || inferDosha(profile);
  const month = new Date().getMonth() + 1; // 1..12
  const season = getSeasonFromMonth(month);

  // Calculate target if not provided
  const target = targetCalories ?? calculateTargetCalories(profile);

  // Weights
  const W = { dosha: 3, seasonal: 1.0, nutrition: 1.0, prefPenalty: 2.0 };

  // 1) filter contraindications and preferences
  const banned = new Set((profile.preferences?.disliked || []).map((s) => s.toLowerCase()));
  const allergies = new Set((profile.allergies || []).map((s) => s.toLowerCase()));
  const allowedFoods = (foods || []).filter(
    (f) =>
      !banned.has((f.name || '').toLowerCase()) &&
      !allergies.has((f.name || '').toLowerCase()) &&
      !isContra(profile, f)
  );

  // 2) score using comprehensive Ayurvedic rules
  const scored = allowedFoods
    .map((f) => {
      const sDosha = scoreDoshaComprehensive(dosha, f);
      const sSeason = scoreSeasonMatch(season, f);
      const sNut = scoreNutrition(profile, f);
      const penalty = banned.has((f.name || '').toLowerCase()) ? W.prefPenalty : 0;
      const score = sDosha * W.dosha + sSeason * W.seasonal + sNut * W.nutrition - penalty;
      return { f, score, reasons: { sDosha, sSeason, sNut, season } };
    })
    .sort((a, b) => b.score - a.score);

  // 3) assemble meals to match targetCalories using greedy packer
  const macroTargets = getMacroTargets(profile);
  const mealTypes = plan_type === 'daily' ? ['breakfast', 'lunch', 'snack', 'dinner'] : ['breakfast', 'lunch', 'dinner'];

  const mealCalories = distributeMealCalories(target, mealTypes.length);
  const meals = [];
  let totalCals = 0;

  mealTypes.forEach((mt, idx) => {
    const targetMealCal = mealCalories[idx];
    const pick = pickFoodForMeal(scored, targetMealCal, mt, dosha);
    const items = pick.items.map(({ f, grams, portion, macros, why }) => ({
      food_id: f.food_id || f.id || (f._id ? String(f._id) : undefined),
      name: f.name,
      portion,
      grams,
      macros,
      why
    }));
    const mealTotal = items.reduce((sum, it) => sum + (it.macros?.calories || 0), 0);
    totalCals += mealTotal;
    meals.push({
      meal_type: mt,
      items,
      total_calories: mealTotal,
      explanations: items.map((it) => it.why).filter(Boolean)
    });
  });

  return {
    season,
    dosha_target: dosha,
    target_calories: target,
    total_calories: totalCals,
    macro_targets: macroTargets,
    meals,
    explanation_logs: []
  };
}

// ---------------------- Helper Functions ----------------------

function inferDosha(profile) {
  // Simple fallback inference; production should use quiz
  return profile?.dosha_result || 'Vata';
}

function isContra(profile, food) {
  const conditions = profile.medical_conditions || [];
  // Example contraindications
  if (conditions.includes('diabetes') && (food.food_id || '').toLowerCase().startsWith('i')) return true; // sweeteners
  if (conditions.includes('hypertension') && (food.tastes || '').includes('salty')) return true;
  return false;
}

function getSeasonFromMonth(month) {
  // Simple mapping
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'monsoon';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function scoreDoshaComprehensive(userDosha, food) {
  let score = 0;

  const impact = (food.dosha_impact || food.dosha_tags || '').toString();
  if (/balancing|tridosha/i.test(impact)) score += 1;
  if (impact && impact.includes(userDosha)) score -= 0.5; // may aggravate

  // 2. Rasa (taste)
  const rasas = typeof food.tastes === 'string' ? food.tastes.split(',').map((s) => s.trim().toLowerCase()) : [];
  rasas.forEach((rasa) => {
    if (userDosha === 'Pitta') {
      if (['pungent', 'sour', 'salty'].includes(rasa)) score -= 1;
      if (['sweet', 'bitter', 'astringent'].includes(rasa)) score += 1;
    } else if (userDosha === 'Kapha') {
      if (['sweet', 'sour', 'salty'].includes(rasa)) score -= 1;
      if (['pungent', 'bitter', 'astringent'].includes(rasa)) score += 1;
    } else if (userDosha === 'Vata') {
      if (['sweet', 'sour', 'salty'].includes(rasa)) score += 1;
      if (['pungent', 'bitter', 'astringent'].includes(rasa)) score -= 1;
    }
  });

  // 3. Guna (qualities)
  const gunas = typeof food.qualities === 'string' ? food.qualities.split(',').map((s) => s.trim().toLowerCase()) : [];
  gunas.forEach((guna) => {
    if (userDosha === 'Vata') {
      if (['dry', 'light'].includes(guna)) score -= 1;
      if (['heavy', 'unctuous'].includes(guna)) score += 1;
    } else if (userDosha === 'Kapha') {
      if (['heavy', 'unctuous'].includes(guna)) score -= 1;
      if (['light', 'dry'].includes(guna)) score += 1;
    }
  });

  // 4. Virya (energy)
  const virya = (food.energy || food.virya || '').toLowerCase();
  if (virya) {
    if (userDosha === 'Pitta' && virya === 'heating') score -= 1;
    if (userDosha === 'Pitta' && virya === 'cooling') score += 1;
    if (userDosha === 'Vata' && virya === 'cooling') score -= 0.5;
    if (userDosha === 'Kapha' && virya === 'cooling') score -= 0.5;
  }

  return score;
}

function scoreSeasonMatch(season, food) {
  const s = (food.season || '').toString().toLowerCase();
  if (!s) return 0;
  if (s.includes('all')) return 0.5;
  return s.includes(season) ? 0.5 : 0;
}

function scoreNutrition(profile, food) {
  const goals = profile.health_goals || [];
  let score = 0;

  const protein = Number(food.protein_100g || food.protein || 0);
  const calories = Number(food.calories_100g || food.calories || 0);

  // Weight loss - favor high protein, lower calorie density
  if (goals.includes('weight_loss') || goals.includes('Weight Loss')) {
    if (protein >= 10) score += 1;
    if (calories < 150) score += 0.5;
  }

  // Muscle gain - favor high protein
  if (goals.includes('muscle_gain') || goals.includes('Weight Gain')) {
    if (protein >= 15) score += 1.5;
    if (calories > 200) score += 0.5;
  }

  // General nutrition quality
  if (protein >= 8) score += 0.5;

  return score;
}

function pickFoodForMeal(scored, targetCal, mealType, dosha) {
  const maxItems = mealType === 'snack' ? 2 : 3;
  const items = [];
  let kcal = 0;
  const used = new Set();

  // Meal type preferences
  const mealPrefs = {
    breakfast: ['grain', 'fruit', 'dairy', 'nut'],
    lunch: ['grain', 'legume', 'vegetable', 'protein'],
    snack: ['fruit', 'nut', 'dairy'],
    dinner: ['grain', 'legume', 'vegetable', 'protein']
  };

  const preferred = mealPrefs[mealType] || [];

  // First pass: pick preferred types
  for (const s of scored) {
    if (items.length >= maxItems || kcal >= targetCal * 1.1) break;

    const f = s.f;
    const foodType = f.type || inferFoodType(f);

    if (used.has(f.food_id || f.name)) continue;
    if (preferred.length && !preferred.includes(foodType)) continue;

    const kPer100 = Number(f.calories_100g || f.calories_per_100g || 100);
    const grams = calculatePortionSize(f, targetCal - kcal, mealType);
    const k = Math.round((kPer100 * grams) / 100);

    if (kcal + k <= targetCal * 1.15) {
      const macros = calculateFoodMacros(f, grams);
      items.push({ f, grams, portion: `${grams}g`, macros, why: explainChoice(f, dosha, s.score) });
      kcal += k;
      used.add(f.food_id || f.name);
    }
  }

  // Second pass: fill remaining calories
  if (items.length === 0 || kcal < targetCal * 0.7) {
    for (const s of scored) {
      if (items.length >= maxItems || kcal >= targetCal * 1.1) break;

      const f = s.f;
      if (used.has(f.food_id || f.name)) continue;

      const kPer100 = Number(f.calories_100g || f.calories_per_100g || 100);
      const grams = calculatePortionSize(f, targetCal - kcal, mealType);
      const k = Math.round((kPer100 * grams) / 100);

      const macros = calculateFoodMacros(f, grams);
      items.push({ f, grams, portion: `${grams}g`, macros, why: explainChoice(f, dosha, s.score) });
      kcal += k;
      used.add(f.food_id || f.name);

      if (kcal >= targetCal * 0.9) break;
    }
  }

  return { items, kcal };
}

function calculatePortionSize(food, remainingCal, mealType) {
  const kPer100 = Number(food.calories_100g || food.calories_per_100g || 100);

  // Base portions by meal type
  const baseSizes = { breakfast: 120, lunch: 150, snack: 80, dinner: 130 };
  const base = baseSizes[mealType] || 120;

  // Adjust based on remaining calories
  const calculated = Math.round((remainingCal / Math.max(kPer100, 1)) * 100);
  return Math.max(50, Math.min(calculated, Math.round(base * 1.5)));
}

function inferFoodType(food) {
  const name = (food.name || '').toLowerCase();
  const notes = (food.notes || '').toLowerCase();

  if (name.includes('rice') || name.includes('wheat') || name.includes('millet')) return 'grain';
  if (name.includes('dal') || name.includes('bean') || name.includes('lentil')) return 'legume';
  if (notes.includes('vegetable') || (food.food_id || '').toUpperCase().startsWith('D')) return 'vegetable';
  if (notes.includes('fruit') || (food.food_id || '').toUpperCase().startsWith('E')) return 'fruit';
  if (name.includes('nut') || name.includes('seed')) return 'nut';
  if ((food.food_id || '').toUpperCase().startsWith('K')) return 'dairy';
  if ((food.food_id || '').toUpperCase().startsWith('L')) return 'protein';
  return 'other';
}

function explainChoice(food, dosha, score) {
  const parts = [];

  // Dosha alignment
  const doshaTags = (food.dosha_impact || food.dosha_tags || '').toString();
  if (/balancing/i.test(doshaTags)) parts.push('Tridoshic');
  else if (doshaTags.includes(dosha)) parts.push(`May aggravate ${dosha}`);
  else parts.push(`Balances ${dosha}`);

  // Tastes
  const tastes = food.tastes || food.rasa || '';
  if (tastes) parts.push(`Tastes: ${tastes}`);

  // Energy
  const energy = food.energy || food.virya;
  if (energy) parts.push(`${String(energy).charAt(0).toUpperCase() + String(energy).slice(1)} energy`);

  // Score
  if (typeof score === 'number') parts.push(`Score: ${score.toFixed(1)}`);

  return parts.join(' • ');
}
