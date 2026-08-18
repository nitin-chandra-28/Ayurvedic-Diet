import { z } from 'zod';

// User Profile Schema
export const profileSchema = z.object({
  dosha_result: z.enum(['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha']).optional(),
  age_years: z.number().min(1).max(120).optional(),
  dob: z.string().optional(),
  sex: z.enum(['M', 'F', 'O']).optional(),
  height_cm: z.number().min(50).max(300).optional(),
  weight_kg: z.number().min(20).max(300).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active']).optional(),
  health_goals: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferences: z.object({
    liked: z.array(z.string()).optional(),
    disliked: z.array(z.string()).optional()
  }).optional(),
  medical_conditions: z.array(z.string()).optional()
});

// Diet Plan Request Schema
export const planRequestSchema = z.object({
  user_id: z.string().optional(),
  profile: profileSchema,
  plan_type: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  target_calories: z.number().min(800).max(5000).optional()
});

// Quiz Answer Schema
export const quizAnswerSchema = z.object({
  answers: z.array(z.object({
    qId: z.string(),
    vata: z.number().min(0).max(5).default(0),
    pitta: z.number().min(0).max(5).default(0),
    kapha: z.number().min(0).max(5).default(0)
  })).min(1)
});

// Food Query Schema
export const foodQuerySchema = z.object({
  dosha: z.enum(['Vata', 'Pitta', 'Kapha', 'Balancing']).optional(),
  season: z.enum(['spring', 'summer', 'autumn', 'winter', 'monsoon', 'all']).optional(),
  type: z.enum(['grain', 'legume', 'vegetable', 'fruit', 'nut', 'spice', 'root', 'dairy', 'protein', 'sweetener']).optional(),
  q: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20')
});

export function validate(schema) {
  return (data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten()));
    }
    return result.data;
  };
}
