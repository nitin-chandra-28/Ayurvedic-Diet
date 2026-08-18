import { json } from './lib/respond.js';
import { parseJSON } from './lib/parseBody.js';
import { requireAuth } from './lib/auth.js';
import * as Auth from './controllers/authController.js';
import * as Quiz from './controllers/quizController.js';
import * as Foods from './controllers/foodsController.js';
import * as Plan from './controllers/planController.js';
import * as Advisory from './controllers/advisoryController.js';

export async function route(req, res) {
  // CORS handled in server.js

  try {
    const { method, url } = req;

    // Public routes
    if (method === 'POST' && url === '/users/register') return Auth.register(req, res, await parseJSON(req));
    if (method === 'POST' && url === '/auth/login')     return Auth.login(req, res, await parseJSON(req));
    if (method === 'POST' && url === '/quiz/prakriti')  return Quiz.score(req, res, await parseJSON(req));
    if (method === 'GET'  && url.startsWith('/foods'))  return Foods.list(req, res);

    // Advisory routes (public)
    if (method === 'GET' && url.startsWith('/api/advisory/quick')) {
      const query = new URL(url, 'http://localhost').searchParams;
      return Advisory.quick(req, res, Object.fromEntries(query));
    }
    if (method === 'POST' && url === '/api/advisory/generate') {
      const body = await parseJSON(req);
      return Advisory.generate(req, res, body, null);
    }

    // Diet Plans (now public - no auth required)
    if (url === '/dietplan/generate' && method === 'POST') {
      return Plan.generate(req, res, await parseJSON(req), null);
    }
    
    if (url === '/dietplan/list' && method === 'GET') {
      return Plan.listUserPlans(req, res, null);
    }
    
    if (url.startsWith('/dietplan/') && method === 'GET') {
      const id = url.split('/')[2]; 
      return Plan.getOne(req, res, id, null);
    }

    // Health check
    if (url === '/health' && method === 'GET') {
      return json(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    }

    // AI Chat endpoint (proxy to InferFlow)
    if (url === '/api/chat' && method === 'POST') {
      const body = await parseJSON(req);
      const { message } = body;
      
      if (!message) {
        return json(res, 400, { error: 'Message is required' });
      }

      try {
        const axios = await import('axios');
        const response = await axios.default.post('http://localhost:3001/chat', { message });
        return json(res, 200, { reply: response.data.reply });
      } catch (error) {
        console.error('InferFlow API error:', error.message);
        return json(res, 500, { error: 'Failed to get response from AI chat' });
      }
    }

    return json(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('Route error:', e);
    return json(res, 400, { error: e.message || 'Bad Request' });
  }
}
