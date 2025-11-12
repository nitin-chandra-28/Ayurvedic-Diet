// Simple frontend API client
const API_BASE = localStorage.getItem('apiBase') || 'http://localhost:3000';

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  
  try {
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
      throw new Error(errorMsg);
    }
    
    return res.json();
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure the server is running with: npm run dev`);
    }
    throw error;
  }
}

export async function health() { return api('/health'); }
export async function register(user) { return api('/users/register', { method: 'POST', body: user }); }
export async function login(creds) { return api('/auth/login', { method: 'POST', body: creds }); }
export async function listFoods(query, page = 1, limit = 30) {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('page', page);
  params.append('limit', limit);
  return api('/foods?' + params.toString());
}
export async function generatePlan(payload) { return api('/dietplan/generate', { method: 'POST', body: payload }); }
export async function listPlans() { return api('/dietplan/list'); }
export async function getAdvisory(payload) { return api('/api/advisory/generate', { method: 'POST', body: payload }); }
export async function getQuickTip(dosha) { return api('/api/advisory/quick?dosha=' + (dosha || 'Vata')); }

window.AyurAPI = { health, register, login, listFoods, generatePlan, listPlans, getAdvisory, getQuickTip };
