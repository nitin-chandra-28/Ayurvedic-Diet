import { json } from '../lib/respond.js';
import { generateAdvisory, generateQuickTip } from '../services/advisoryEngine.js';
import { z } from 'zod';

const advisoryRequestSchema = z.object({
  profile: z.object({
    dosha_result: z.string().optional(),
    age_years: z.number().optional(),
    health_goals: z.array(z.string()).optional(),
    activity_level: z.string().optional(),
    medical_conditions: z.array(z.string()).optional()
  }).optional(),
  context: z.object({
    hour: z.number().optional(),
    month: z.number().optional(),
    userId: z.string().optional()
  }).optional()
});

/**
 * POST /api/advisory/generate
 * Generate comprehensive AI-powered advisory
 */
export async function generate(req, res, body, user) {
  const parsed = advisoryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(res, 422, { error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { profile = {}, context = {} } = parsed.data;

  // Add user ID if authenticated
  if (user?.uid) {
    context.userId = user.uid;
  }

  try {
    const advisory = await generateAdvisory({ profile, context });
    return json(res, 200, { success: true, advisory });
  } catch (error) {
    console.error('Advisory generation error:', error);
    return json(res, 500, { error: 'Failed to generate advisory', message: error.message });
  }
}

/**
 * GET /api/advisory/quick?dosha=Pitta
 * Get quick tip (no auth required)
 */
export async function quick(req, res, query) {
  const dosha = query.dosha || 'Vata';
  try {
    const tip = generateQuickTip(dosha);
    return json(res, 200, { success: true, ...tip });
  } catch (error) {
    console.error('Quick tip error:', error);
    return json(res, 500, { error: 'Failed to generate tip' });
  }
}
