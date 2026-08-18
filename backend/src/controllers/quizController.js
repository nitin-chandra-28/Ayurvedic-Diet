import { json } from '../lib/respond.js';

/**
 * Enhanced Prakriti Quiz Scoring Controller
 * Implements weighted scoring, secondary dosha detection, and comprehensive validation
 */
export async function score(req, res, body) {
  const { answers = [] } = body || {};
  
  // Validation
  if (!Array.isArray(answers) || !answers.length) {
    return json(res, 422, { 
      error: 'answers[] required',
      message: 'Please provide an array of answers to calculate your dosha' 
    });
  }

  // Validate answer format
  const invalidAnswers = answers.filter(a => 
    typeof a !== 'object' || 
    (a.vata === undefined && a.pitta === undefined && a.kapha === undefined)
  );
  
  if (invalidAnswers.length > 0) {
    return json(res, 422, { 
      error: 'Invalid answer format',
      message: 'Each answer must contain vata, pitta, or kapha scores',
      invalidCount: invalidAnswers.length
    });
  }

  try {
    // Weighted scoring with question importance
    let scores = { vata: 0, pitta: 0, kapha: 0 };
    let totalWeight = 0;
    
    answers.forEach((answer, index) => {
      // Default weight is 1, but can be customized per question
      const weight = answer.weight || 1;
      totalWeight += weight;
      
      scores.vata += (answer.vata || 0) * weight;
      scores.pitta += (answer.pitta || 0) * weight;
      scores.kapha += (answer.kapha || 0) * weight;
    });

    // Calculate percentages
    const total = scores.vata + scores.pitta + scores.kapha;
    const percentages = {
      vata: total > 0 ? parseFloat(((scores.vata / total) * 100).toFixed(1)) : 0,
      pitta: total > 0 ? parseFloat(((scores.pitta / total) * 100).toFixed(1)) : 0,
      kapha: total > 0 ? parseFloat(((scores.kapha / total) * 100).toFixed(1)) : 0
    };

    // Determine dominant and secondary doshas
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0][0];
    const dominantScore = sorted[0][1];
    const secondaryScore = sorted[1][1];
    
    // Secondary dosha if it's within 70% of dominant (indicates dual constitution)
    const secondary = secondaryScore > dominantScore * 0.7 ? sorted[1][0] : null;
    
    // Constitution type
    let constitution = dominant.charAt(0).toUpperCase() + dominant.slice(1);
    if (secondary) {
      const secCap = secondary.charAt(0).toUpperCase() + secondary.slice(1);
      constitution = `${constitution}-${secCap}`;
    }
    
    // Balance status
    const dominantPct = percentages[dominant];
    let balance = 'balanced';
    if (dominantPct > 60) balance = 'strongly_dominant';
    else if (dominantPct > 45) balance = 'dominant';
    else if (dominantPct < 40 && secondary) balance = 'dual_constitution';

    // Return comprehensive result
    return json(res, 200, { 
      dosha_result: constitution,
      primary_dosha: dominant.charAt(0).toUpperCase() + dominant.slice(1),
      secondary_dosha: secondary ? secondary.charAt(0).toUpperCase() + secondary.slice(1) : null,
      score: scores,
      percentages,
      balance,
      constitution_type: constitution,
      total_questions: answers.length,
      weighted_total: totalWeight,
      timestamp: new Date().toISOString(),
      recommendations: generateQuickRecommendations(dominant, secondary)
    });
  } catch (error) {
    console.error('Quiz scoring error:', error);
    return json(res, 500, { 
      error: 'Scoring calculation failed',
      message: error.message 
    });
  }
}

/**
 * Generate quick recommendations based on dosha result
 */
function generateQuickRecommendations(primary, secondary) {
  const recommendations = {
    vata: [
      'Eat warm, cooked, and grounding foods',
      'Maintain regular meal times and sleep schedule',
      'Practice calming activities like yoga and meditation',
      'Stay warm and avoid excessive cold exposure'
    ],
    pitta: [
      'Choose cooling foods and avoid spicy, fried items',
      'Practice patience and avoid overworking',
      'Engage in moderate exercise, avoid extreme heat',
      'Include sweet, bitter, and astringent tastes'
    ],
    kapha: [
      'Favor light, warm, and stimulating foods',
      'Stay active with regular vigorous exercise',
      'Reduce heavy, oily, and sweet foods',
      'Wake early and avoid daytime naps'
    ]
  };
  
  const tips = [...recommendations[primary]];
  if (secondary && recommendations[secondary]) {
    tips.push(...recommendations[secondary].slice(0, 2));
  }
  
  return tips.slice(0, 5);
}
