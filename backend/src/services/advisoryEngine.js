/**
 * InferFlow Advisory Engine
 * Context-aware Ayurvedic wellness recommendations
 */

import { Foods } from '../models/foods.js';
import { Plans } from '../models/plans.js';

// Knowledge base of Ayurvedic wisdom
const ADVISORY_RULES = {
  // Time-based recommendations
  timeOfDay: {
    morning: [
      { priority: 'high', tip: 'Start your day with warm water and lemon to kindle Agni (digestive fire).' },
      { priority: 'medium', tip: 'Practice oil pulling with sesame or coconut oil for oral health.' },
      { priority: 'low', tip: 'Gentle yoga or stretching helps balance morning Vata energy.' }
    ],
    afternoon: [
      { priority: 'high', tip: 'Lunch should be your largest meal when Agni is strongest (12-2 PM).' },
      { priority: 'medium', tip: 'Take a short walk after eating to aid digestion.' },
      { priority: 'low', tip: 'Avoid cold drinks with meals—they dampen digestive fire.' }
    ],
    evening: [
      { priority: 'high', tip: 'Eat dinner before sunset for optimal digestion and sleep.' },
      { priority: 'medium', tip: 'Wind down with calming herbal tea like chamomile or brahmi.' },
      { priority: 'low', tip: 'Light evening walks support digestion without overstimulation.' }
    ],
    night: [
      { priority: 'high', tip: 'Avoid eating 2-3 hours before bed to prevent Ama formation.' },
      { priority: 'medium', tip: 'Warm milk with nutmeg or ashwagandha promotes restful sleep.' },
      { priority: 'low', tip: 'Practice deep breathing or meditation before sleep.' }
    ]
  },

  // Dosha-specific guidance
  dosha: {
    Vata: [
      { context: 'general', tip: 'Favor warm, moist, grounding foods to balance Vata\'s cold, dry nature.' },
      { context: 'stress', tip: 'Vata types need regular routines—eat meals at consistent times.' },
      { context: 'digestion', tip: 'Cook all foods for Vata; raw foods can aggravate delicate digestion.' },
      { context: 'energy', tip: 'Combat Vata fatigue with nourishing fats like ghee and sesame oil.' }
    ],
    Pitta: [
      { context: 'general', tip: 'Choose cooling, bitter, and astringent foods to calm Pitta heat.' },
      { context: 'stress', tip: 'Avoid spicy, acidic foods when feeling irritable or overheated.' },
      { context: 'digestion', tip: 'Pitta\'s strong Agni can handle raw foods but needs moderation.' },
      { context: 'energy', tip: 'Take breaks to avoid burnout—Pitta types tend to overwork.' }
    ],
    Kapha: [
      { context: 'general', tip: 'Light, dry, warming foods help counter Kapha heaviness.' },
      { context: 'stress', tip: 'Kapha benefits from pungent spices like ginger, black pepper, turmeric.' },
      { context: 'digestion', tip: 'Skip breakfast if not hungry—Kapha digestion is slowest in morning.' },
      { context: 'energy', tip: 'Regular vigorous exercise is essential to stimulate Kapha metabolism.' }
    ]
  },

  // Seasonal wisdom
  seasonal: {
    spring: [
      'Spring aggravates Kapha—favor light, bitter greens and reduce heavy, oily foods.',
      'Enjoy seasonal sprouts, berries, and fresh herbs to cleanse winter accumulation.',
      'Dry brushing and invigorating exercise help move stagnant Kapha energy.'
    ],
    summer: [
      'Summer increases Pitta—stay cool with cucumber, coconut, mint, and avoid heating spices.',
      'Favor sweet, bitter, astringent tastes and hydrate with cooling infusions.',
      'Avoid midday sun; practice moon bathing or evening walks for balance.'
    ],
    monsoon: [
      'Monsoon weakens Agni—use warming spices and avoid raw salads.',
      'Boost digestion with ginger, cumin, and hing in every meal.',
      'Keep feet dry and avoid damp environments to prevent fungal issues.'
    ],
    autumn: [
      'Autumn aggravates Vata—ground with warm soups, root vegetables, and healthy fats.',
      'Oil massage (Abhyanga) with sesame oil calms Vata\'s dry, mobile nature.',
      'Favor sweet, sour, salty tastes; establish consistent daily routines.'
    ],
    winter: [
      'Winter supports Agni—this is the best time for heavier, nourishing foods.',
      'Build strength with nutrient-dense foods: ghee, nuts, dates, and grains.',
      'Stay warm, sleep early, and enjoy warming spices like cinnamon and cardamom.'
    ]
  },

  // Goal-specific advice
  goals: {
    weight_loss: [
      'Drink warm water throughout the day to boost metabolism and flush toxins.',
      'Favor high-protein, low-calorie foods and reduce sweet, oily items.',
      'Practice mindful eating—chew thoroughly and stop at 75% full.'
    ],
    weight_gain: [
      'Include healthy fats like ghee, nuts, and avocado in every meal.',
      'Eat calorie-dense foods with sweet, sour, and salty tastes.',
      'Rest after meals to support absorption and weight gain.'
    ],
    muscle_gain: [
      'Prioritize protein-rich foods like lentils, paneer, and almonds.',
      'Combine strength training with nourishing, building foods.',
      'Ensure adequate rest and recovery between workouts.'
    ],
    digestion: [
      'Eat only when truly hungry—respect your body\'s signals.',
      'Include digestive spices: cumin, coriander, fennel in cooking.',
      'Avoid eating when stressed or emotionally upset.'
    ],
    energy: [
      'Balance macros and avoid blood sugar spikes with complex carbs.',
      'Stay hydrated but avoid excessive caffeine dependency.',
      'Align meals with your circadian rhythm for sustained energy.'
    ]
  }
};

/**
 * Analyze user context and generate personalized recommendations
 */
export async function generateAdvisory({ profile, context = {} }) {
  const dosha = profile?.dosha_result || 'Vata';
  const goals = profile?.health_goals || [];
  const hour = context.hour ?? new Date().getHours();
  const month = context.month ?? new Date().getMonth() + 1;
  
  const recommendations = [];

  // 1. Time-based advice
  const timeSlot = getTimeSlot(hour);
  const timeAdvice = ADVISORY_RULES.timeOfDay[timeSlot];
  if (timeAdvice) {
    const selected = timeAdvice[Math.floor(Math.random() * timeAdvice.length)];
    recommendations.push({
      category: 'Time-Based',
      priority: selected.priority === 'high' ? 'high' : 'medium',
      message: selected.tip,
      icon: '🕐'
    });
  }

  // 2. Dosha-specific guidance
  const doshaAdvice = ADVISORY_RULES.dosha[dosha];
  if (doshaAdvice) {
    const doshaRec = doshaAdvice[Math.floor(Math.random() * doshaAdvice.length)];
    recommendations.push({
      category: `${dosha} Balance`,
      priority: 'high',
      message: doshaRec.tip,
      icon: '⚖️'
    });
  }

  // 3. Seasonal guidance
  const season = getSeasonFromMonth(month);
  const seasonalTips = ADVISORY_RULES.seasonal[season];
  if (seasonalTips && seasonalTips.length > 0) {
    const seasonalTip = seasonalTips[Math.floor(Math.random() * seasonalTips.length)];
    recommendations.push({
      category: 'Seasonal Wisdom',
      priority: 'medium',
      message: seasonalTip,
      icon: '🌿'
    });
  }

  // 4. Goal-specific advice
  const primaryGoal = goals[0];
  if (primaryGoal && ADVISORY_RULES.goals[primaryGoal]) {
    const goalTips = ADVISORY_RULES.goals[primaryGoal];
    const randomTip = goalTips[Math.floor(Math.random() * goalTips.length)];
    recommendations.push({
      category: `${formatGoal(primaryGoal)} Support`,
      priority: 'high',
      message: randomTip,
      icon: '🎯'
    });
  }

  // 5. Food-based insights (if user has recent plans)
  if (context.userId) {
    const foodInsight = await analyzeDietPattern(context.userId, dosha);
    if (foodInsight) {
      recommendations.push(foodInsight);
    }
  }

  // 6. General Ayurvedic wisdom
  recommendations.push({
    category: 'Ayurvedic Principle',
    priority: 'low',
    message: getRandomWisdom(),
    icon: '📿'
  });

  return {
    timestamp: new Date().toISOString(),
    dosha,
    season,
    timeSlot,
    recommendations: recommendations.slice(0, 5), // Top 5 tips
    profile_summary: {
      dosha,
      goals,
      activity: profile?.activity_level || 'moderate'
    }
  };
}

/**
 * Analyze user's diet patterns from saved plans
 */
async function analyzeDietPattern(userId, dosha) {
  try {
    const recentPlans = await Plans()
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(3)
      .toArray();

    if (!recentPlans.length) return null;

    // Analyze food diversity
    const allFoods = new Set();
    recentPlans.forEach(plan => {
      plan.meals?.forEach(meal => {
        meal.items?.forEach(item => allFoods.add(item.name));
      });
    });

    if (allFoods.size < 10) {
      return {
        category: 'Diet Diversity',
        priority: 'medium',
        message: `You've been eating ${allFoods.size} unique foods. Try adding more variety—aim for 20-30 different foods weekly for optimal nutrition.`,
        icon: '🌈'
      };
    }

    // Check for dosha-aggravating patterns
    const doshaAggravating = {
      Vata: ['cold', 'raw', 'dry'],
      Pitta: ['spicy', 'sour', 'heating'],
      Kapha: ['heavy', 'sweet', 'oily']
    };

    const warnings = doshaAggravating[dosha] || [];
    const warningMsg = warnings.length > 0 
      ? `Your recent plans look balanced. Continue avoiding excessive ${warnings.join(', ')} foods for ${dosha}.`
      : 'Your diet pattern is well-balanced!';

    return {
      category: 'Pattern Analysis',
      priority: 'medium',
      message: warningMsg,
      icon: '📊'
    };

  } catch (error) {
    console.error('Diet pattern analysis error:', error);
    return null;
  }
}

/**
 * Helper: Get time slot based on hour
 */
function getTimeSlot(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Helper: Get season from month
 */
function getSeasonFromMonth(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Helper: Format goal name
 */
function formatGoal(goal) {
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Helper: Get random Ayurvedic wisdom
 */
function getRandomWisdom() {
  const wisdom = [
    'When diet is wrong, medicine is of no use. When diet is correct, medicine is of no need.',
    'One who is established in a proper routine becomes healthy, happy, and strong.',
    'The key to health is maintaining proper Agni (digestive fire).',
    'Like increases like, opposites balance—the fundamental principle of Ayurveda.',
    'Food should be eaten with full attention and gratitude for maximum benefit.',
    'Your body is precious. It is your vehicle for awakening. Treat it with care.',
    'Prevention is better than cure—align with nature\'s rhythms for optimal health.'
  ];
  return wisdom[Math.floor(Math.random() * wisdom.length)];
}

/**
 * Generate quick tip (lighter version for quick fetches)
 */
export function generateQuickTip(dosha = 'Vata') {
  const tips = ADVISORY_RULES.dosha[dosha] || ADVISORY_RULES.dosha.Vata;
  const selected = tips[Math.floor(Math.random() * tips.length)];
  return {
    tip: selected.tip,
    dosha,
    wisdom: getRandomWisdom()
  };
}
