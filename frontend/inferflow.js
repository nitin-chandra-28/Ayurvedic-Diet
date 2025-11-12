// InferFlow Smart Advisory - Real AI Integration
// Calls backend advisory engine for context-aware recommendations

import * as AyurAPI from './api.js';

export async function getAdvisory(profile = {}) {
  try {
    const context = {
      hour: new Date().getHours(),
      month: new Date().getMonth() + 1
    };
    
    const response = await AyurAPI.getAdvisory({ profile, context });
    return response.advisory;
  } catch (error) {
    console.error('Advisory fetch error:', error);
    // Fallback to quick tip
    return getQuickTipFallback(profile.dosha_result || 'Vata');
  }
}

export async function getQuickTip(dosha = 'Vata') {
  try {
    return await AyurAPI.getQuickTip(dosha);
  } catch (error) {
    console.error('Quick tip error:', error);
    return getQuickTipFallback(dosha);
  }
}

function getQuickTipFallback(dosha) {
  const fallbacks = {
    Vata: 'Ground yourself with warm, moist meals and healthy fats.',
    Pitta: 'Favor cooling herbs like mint and fennel.',
    Kapha: 'Add gentle spices (ginger, black pepper) to stimulate metabolism.'
  };
  return {
    tip: fallbacks[dosha] || fallbacks.Vata,
    dosha,
    wisdom: 'When diet is correct, medicine is of no need.'
  };
}

export async function renderAdvisory(container, profile) {
  container.innerHTML = '<div class="text-sm text-center py-4">Loading AI recommendations...</div>';
  
  try {
    const advisory = await getAdvisory(profile);
    
    let html = `
      <div class="flex flex-col gap-4">
        <div class="text-xs opacity-70 flex justify-between">
          <span>🧘 ${advisory.dosha_target || advisory.profile_summary?.dosha || 'Balanced'} Focus</span>
          <span>🌿 ${advisory.season || 'Current'} Season</span>
          <span>🕐 ${advisory.timeSlot || 'Now'}</span>
        </div>
    `;
    
    if (advisory.recommendations && advisory.recommendations.length > 0) {
      advisory.recommendations.forEach(rec => {
        const priorityColor = rec.priority === 'high' ? 'text-primary font-semibold' : 'text-text-light dark:text-text-dark';
        html += `
          <div class="border-l-2 border-primary pl-3 py-2">
            <div class="flex items-start gap-2">
              <span class="text-lg">${rec.icon || '💡'}</span>
              <div class="flex-1">
                <h4 class="text-sm font-bold ${priorityColor}">${rec.category}</h4>
                <p class="text-sm mt-1">${rec.message}</p>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      html += '<p class="text-sm">No specific recommendations at this time.</p>';
    }
    
    html += `
        <div class="text-xs italic opacity-60 pt-2 border-t border-border-light dark:border-border-dark">
          Generated: ${new Date(advisory.timestamp).toLocaleString()}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `
      <div class="text-sm text-red-600 dark:text-red-400">
        Unable to load advisory. Please try again.
      </div>
    `;
  }
}

window.InferFlow = { getAdvisory, getQuickTip, renderAdvisory };
