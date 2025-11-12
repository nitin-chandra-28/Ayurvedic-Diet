import { Plans } from '../models/plans.js';
import { Foods } from '../models/foods.js';
import { json } from '../lib/respond.js';
import { buildPlan } from '../services/ruleEngine.js';
import { calculateTargetCalories } from '../services/nutrition.js';
import { planRequestSchema } from '../lib/validate.js';
import { ObjectId } from 'mongodb';

export async function generate(req, res, body, authUser) {
  try {
    // Validate request
    const validated = planRequestSchema.parse(body);
    const { user_id, profile, plan_type, target_calories } = validated;

    // 1) compute target calories if missing
    const kcal = target_calories ?? calculateTargetCalories(profile);

    // 2) load candidate foods from database
    const foods = await Foods().find({}).toArray();
    
    if (foods.length === 0) {
      return json(res, 500, { error: 'No foods available in database. Please seed the database first.' });
    }

    // 3) generate plan using rule engine
    const planData = buildPlan({ 
      profile, 
      foods, 
      plan_type, 
      targetCalories: kcal 
    });

    // 4) save to database
    const doc = {
      user_id: user_id ?? authUser?.uid,
      date_generated: new Date().toISOString().slice(0, 10),
      plan_type,
      profile_snapshot: profile,
      ...planData,
      created_at: new Date()
    };
    
    const { insertedId } = await Plans().insertOne(doc);
    
    return json(res, 201, { 
      id: insertedId, 
      ...doc,
      _id: undefined 
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    return json(res, 400, { 
      error: error.message || 'Failed to generate diet plan',
      details: error.issues || null
    });
  }
}

export async function getOne(req, res, id, authUser) {
  try {
    const plan = await Plans().findOne({ 
      _id: new ObjectId(id), 
      user_id: authUser.uid 
    });
    
    if (!plan) {
      return json(res, 404, { error: 'Plan not found or access denied' });
    }
    
    return json(res, 200, plan);
  } catch (error) {
    return json(res, 400, { error: 'Invalid plan ID' });
  }
}

export async function listUserPlans(req, res, authUser) {
  try {
    const plans = await Plans()
      .find({ user_id: authUser.uid })
      .sort({ date_generated: -1 })
      .limit(20)
      .toArray();
    
    return json(res, 200, { plans });
  } catch (error) {
    return json(res, 500, { error: 'Failed to retrieve plans' });
  }
}
