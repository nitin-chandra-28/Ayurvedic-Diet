/**
 * AyurBalance - Main Application Script
 * 
 * This file contains all JavaScript functionality for the AyurBalance application.
 * Includes: PDF generation, modals, quiz logic, meal planning, community features, and more.
 * 
 * @file script.js
 * @description Main application logic extracted from index.html
 * @requires api.js - Backend API communication
 * @requires inferflow.js - AI advisory engine
 */

import * as AyurAPI from './api.js';
import * as InferFlow from './inferflow.js';

// Make available globally
window.AyurAPI = AyurAPI;
window.InferFlow = InferFlow;

// Simple logging utility
function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

// Professional PDF Generation Function
function generateProfessionalPDF(plan, profile) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Color palette based on dosha
  const colors = {
    primary: [85, 107, 47],      // #556B2F
    secondary: [218, 165, 32],    // #DAA520
    accent: [139, 115, 85],       // #8B7355
    text: [65, 72, 51],           // #414833
    lightBg: [250, 249, 245],     // #FAF9F5
    success: [107, 142, 35]       // #6B8E23
  };
  
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo/Icon area
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 25, 8, 'F');
  doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.circle(25, 25, 6, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AyurBalance', 40, 22);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Personalized Ayurvedic Diet Plan', 40, 30);
  
  // Date
  doc.setFontSize(9);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(today, pageWidth - margin, 25, { align: 'right' });
  
  yPos = 60;
  
  // Profile Summary Card
  doc.setFillColor(colors.lightBg[0], colors.lightBg[1], colors.lightBg[2]);
  doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Ayurvedic Profile', margin + 5, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Profile details in two columns
  const col1X = margin + 5;
  const col2X = pageWidth / 2 + 5;
  let detailY = yPos + 16;
  
  // Dosha with emoji representation
  doc.setFont('helvetica', 'bold');
  doc.text('Dosha Constitution:', col1X, detailY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(plan.dosha_target || 'N/A', col1X + 45, detailY);
  
  // Target calories
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Target Calories:', col2X, detailY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text(`${plan.target_calories} kcal/day`, col2X + 35, detailY);
  
  detailY += 8;
  
  // Season
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Season:', col1X, detailY);
  doc.setFont('helvetica', 'normal');
  doc.text((plan.season || 'All Seasons'), col1X + 45, detailY);
  
  // Health Goals
  if (profile.health_goals && profile.health_goals.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Goals:', col2X, detailY);
    doc.setFont('helvetica', 'normal');
    const goals = profile.health_goals.join(', ').replace(/_/g, ' ');
    doc.text(goals.substring(0, 35), col2X + 35, detailY);
  }
  
  yPos += 45;
  
  // Macronutrient Breakdown
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Daily Macronutrient Distribution', margin, yPos);
  yPos += 8;
  
  if (plan.macro_targets) {
    const macros = [
      { name: 'Carbohydrates', value: plan.macro_targets.carbs_g, color: [245, 158, 11], unit: 'g' },
      { name: 'Protein', value: plan.macro_targets.protein_g, color: [5, 150, 105], unit: 'g' },
      { name: 'Fat', value: plan.macro_targets.fat_g, color: [220, 38, 38], unit: 'g' }
    ];
    
    const barWidth = contentWidth - 60;
    const totalMacros = macros.reduce((sum, m) => sum + (m.value || 0), 0);
    
    macros.forEach((macro, idx) => {
      const barY = yPos + (idx * 12);
      const percentage = totalMacros > 0 ? (macro.value / totalMacros) * 100 : 0;
      const filledWidth = (barWidth * percentage) / 100;
      
      // Macro name
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(macro.name, margin, barY + 5);
      
      // Background bar
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin + 35, barY, barWidth, 6, 1, 1, 'F');
      
      // Filled bar
      doc.setFillColor(macro.color[0], macro.color[1], macro.color[2]);
      doc.roundedRect(margin + 35, barY, filledWidth, 6, 1, 1, 'F');
      
      // Value label
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(macro.value)}${macro.unit}`, margin + 35 + barWidth + 3, barY + 5);
    });
    
    yPos += 40;
  }
  
  // Meals Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Your Daily Meal Plan', margin, yPos);
  yPos += 8;
  
  const mealIcons = {
    'breakfast': '☀',
    'lunch': '☼',
    'dinner': '☾',
    'snack': '●'
  };
  
  plan.meals.forEach((meal, mealIdx) => {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    // Meal header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const mealIcon = mealIcons[meal.meal_type.toLowerCase()] || '○';
    doc.text(`${mealIcon} ${meal.meal_type.toUpperCase()}`, margin + 3, yPos + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${meal.total_calories} kcal`, pageWidth - margin - 3, yPos + 7, { align: 'right' });
    
    yPos += 14;
    
    // Meal items
    meal.items.forEach((item, itemIdx) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternating background for items
      if (itemIdx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos - 3, contentWidth, 14, 'F');
      }
      
      // Item bullet
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.circle(margin + 3, yPos + 1, 1.5, 'F');
      
      // Item name and portion
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(item.name, margin + 7, yPos + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`(${item.portion})`, margin + 7 + doc.getTextWidth(item.name) + 2, yPos + 2);
      
      // Macros
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const macroText = `${Math.round(item.macros?.calories || 0)} kcal | C:${Math.round(item.macros?.carbs || 0)}g P:${Math.round(item.macros?.protein || 0)}g F:${Math.round(item.macros?.fat || 0)}g`;
      doc.text(macroText, pageWidth - margin - 3, yPos + 2, { align: 'right' });
      
      // Why info (benefit)
      if (item.why) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        const whyText = doc.splitTextToSize(item.why, contentWidth - 15);
        doc.text(whyText, margin + 7, yPos + 7);
        yPos += 4 + (whyText.length * 3);
      }
      
      yPos += 12;
    });
    
    yPos += 5;
  });
  
  // Footer on last page
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos = pageHeight - 25;
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('This diet plan is personalized based on Ayurvedic principles. Consult with a healthcare professional before making significant dietary changes.', margin, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('AyurBalance - Ancient Wisdom, Modern Science', pageWidth / 2, yPos, { align: 'center' });
  
  // Save the PDF
  const fileName = `AyurBalance-DietPlan-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
  
  showNotification('PDF downloaded successfully!', 'success');
  log(`PDF generated: ${fileName}`);
}

// Notification helper
function showNotification(message, type = 'info') {
  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg z-[100] animate-slide-up`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Create modal container for all features
function createModal(id, title, content, footerButtons = '') {
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'hidden fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto';
  modal.innerHTML = `
    <div class='w-full max-w-2xl rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 my-8 max-h-[90vh] overflow-y-auto'>
      <div class='flex justify-between items-center sticky top-0 bg-card-light dark:bg-card-dark z-10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-xl'>
        <h2 class='text-xl font-bold'>${title}</h2>
        <button class='closeModal text-sm px-3 py-1 rounded-md bg-primary text-white hover:bg-opacity-90'>Close</button>
      </div>
      <div class='modalContent text-sm flex flex-col gap-2'>${content}</div>
      ${footerButtons}
    </div>`;
  
  modal.querySelector('.closeModal').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  document.body.appendChild(modal);
  return modal;
}

// Advisory modal
const advisoryModal = createModal('inferflowModal', '🧠 Smart Advisory', 
  `<div class='space-y-4'>
    <div class='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20'>
      <p class='text-sm leading-relaxed'>Get personalized Ayurvedic insights powered by AI to support your wellness journey.</p>
    </div>
    <div id='advisoryContent' class='min-h-[200px]'></div>
  </div>`,
  `<div class='flex gap-2'>
    <button id='refreshAdvisory' class='px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center gap-2'>
      <span>🔄</span>
      <span>Get New Tip</span>
    </button>
  </div>`
);

// Prakriti Quiz modal - Ayurvedic redesign with one-question-per-screen
const prakritiModal = createModal('prakritiModal', '', 
  `<div class='parchment-texture'>
    <div class='text-center mb-6'>
      <div class='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ayur-green to-ayur-brown mb-3'>
        <svg class='w-10 h-10 text-white' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M12 2C10.5 4 9 6.5 9 9.5 9 12.5 10.5 15 12 17 13.5 15 15 12.5 15 9.5 15 6.5 13.5 4 12 2z'/>
          <path d='M5 12C6.5 10 9 9 11.5 9 14 9 16 10 17.5 12 16 14 14 15 11.5 15 9 15 6.5 14 5 12z'/>
          <path d='M19 12C17.5 10 15 9 12.5 9 10 9 8 10 6.5 12 8 14 10 15 12.5 15 15 15 17.5 14 19 12z'/>
        </svg>
      </div>
      <h2 class='font-serif text-3xl font-bold text-ayur-darkGreen mb-1'>Prakriti Quiz</h2>
      <p class='text-ayur-earth'>Discover Your Ayurvedic Constitution</p>
    </div>
    
    <div class='mb-6'>
      <div class='flex justify-between items-center mb-2'>
        <span class='text-xs font-medium text-ayur-earth'>Question <span id='quizCurrentQ'>1</span> of <span id='quizTotalQ'>15</span></span>
        <span class='text-xs font-medium text-ayur-green'><span id='quizProgressPercent'>7</span>%</span>
      </div>
      <div class='h-2.5 bg-ayur-beige rounded-full overflow-hidden'>
        <div id='quizProgress' class='h-full bg-gradient-to-r from-ayur-green to-ayur-brown transition-all duration-500 rounded-full' style='width: 7%'></div>
      </div>
    </div>
    
    <div id='quizQuestionContent' class='mb-6 quiz-fade-enter'></div>
    
    <div class='flex gap-3'>
      <button id='quizBackBtn' class='flex-1 px-6 py-3 border-2 border-ayur-green text-ayur-green rounded-xl font-semibold hover:bg-ayur-green hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed' disabled>
        ← Back
      </button>
      <button id='quizNextBtn' class='flex-1 px-6 py-3 bg-gradient-to-r from-ayur-green to-ayur-brown text-white rounded-xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed' disabled>
        Next →
      </button>
    </div>
    
    <div id='quizResult' class='hidden'></div>
  </div>`
);

// Generate Plan modal
const planModal = createModal('planModal', '✨ Generate Diet Plan', 
  `<div class='space-y-6'>
    <div class='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20'>
      <p class='text-sm leading-relaxed'>Create your personalized Ayurvedic diet plan based on your dosha, health goals, and lifestyle.</p>
    </div>
    <div id='planForm' class='space-y-6'>
      <div>
        <label class='block text-base font-semibold mb-3 flex items-center gap-2'>
          <span class='text-2xl'>🧘</span>
          Select Your Dosha
        </label>
        <div class='grid grid-cols-3 gap-3'>
          <label class='group relative cursor-pointer'>
            <input type='radio' name='planDoshaRadio' value='Vata' class='peer sr-only' checked/>
            <div class='glass-effect rounded-xl p-4 border-2 border-transparent peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 hover:border-blue-300 transition-all duration-200 text-center'>
              <div class='text-3xl mb-2'>🌬️</div>
              <div class='font-semibold text-sm'>Vata</div>
              <div class='text-xs text-gray-500 dark:text-gray-400'>Air + Space</div>
            </div>
          </label>
          <label class='group relative cursor-pointer'>
            <input type='radio' name='planDoshaRadio' value='Pitta' class='peer sr-only'/>
            <div class='glass-effect rounded-xl p-4 border-2 border-transparent peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/20 hover:border-red-300 transition-all duration-200 text-center'>
              <div class='text-3xl mb-2'>🔥</div>
              <div class='font-semibold text-sm'>Pitta</div>
              <div class='text-xs text-gray-500 dark:text-gray-400'>Fire + Water</div>
            </div>
          </label>
          <label class='group relative cursor-pointer'>
            <input type='radio' name='planDoshaRadio' value='Kapha' class='peer sr-only'/>
            <div class='glass-effect rounded-xl p-4 border-2 border-transparent peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/20 hover:border-green-300 transition-all duration-200 text-center'>
              <div class='text-3xl mb-2'>🌿</div>
              <div class='font-semibold text-sm'>Kapha</div>
              <div class='text-xs text-gray-500 dark:text-gray-400'>Earth + Water</div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <label class='block text-base font-semibold mb-3 flex items-center gap-2'>
          <span class='text-2xl'>🎯</span>
          Health Goals <span class='text-xs font-normal text-gray-500'>(Select multiple)</span>
        </label>
        <div class='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <label class='group cursor-pointer'>
            <input type='checkbox' name='planGoalCheck' value='weight_loss' class='peer sr-only'/>
            <div class='glass-effect rounded-lg p-3 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200 flex items-center gap-3'>
              <div class='text-2xl'>⚖️</div>
              <div class='flex-1'>
                <div class='font-medium text-sm'>Weight Loss</div>
                <div class='text-xs text-gray-500 dark:text-gray-400'>Shed extra pounds</div>
              </div>
              <div class='w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center'>
                <svg class='w-3 h-3 text-white hidden peer-checked:block' fill='currentColor' viewBox='0 0 20 20'><path d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'/></svg>
              </div>
            </div>
          </label>
          <label class='group cursor-pointer'>
            <input type='checkbox' name='planGoalCheck' value='weight_gain' class='peer sr-only'/>
            <div class='glass-effect rounded-lg p-3 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200 flex items-center gap-3'>
              <div class='text-2xl'>📈</div>
              <div class='flex-1'>
                <div class='font-medium text-sm'>Weight Gain</div>
                <div class='text-xs text-gray-500 dark:text-gray-400'>Build healthy mass</div>
              </div>
              <div class='w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary'></div>
            </div>
          </label>
          <label class='group cursor-pointer'>
            <input type='checkbox' name='planGoalCheck' value='muscle_gain' class='peer sr-only'/>
            <div class='glass-effect rounded-lg p-3 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200 flex items-center gap-3'>
              <div class='text-2xl'>💪</div>
              <div class='flex-1'>
                <div class='font-medium text-sm'>Muscle Gain</div>
                <div class='text-xs text-gray-500 dark:text-gray-400'>Increase strength</div>
              </div>
              <div class='w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary'></div>
            </div>
          </label>
          <label class='group cursor-pointer'>
            <input type='checkbox' name='planGoalCheck' value='digestion' class='peer sr-only'/>
            <div class='glass-effect rounded-lg p-3 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200 flex items-center gap-3'>
              <div class='text-2xl'>🍃</div>
              <div class='flex-1'>
                <div class='font-medium text-sm'>Improve Digestion</div>
                <div class='text-xs text-gray-500 dark:text-gray-400'>Boost gut health</div>
              </div>
              <div class='w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary'></div>
            </div>
          </label>
          <label class='group cursor-pointer'>
            <input type='checkbox' name='planGoalCheck' value='energy' class='peer sr-only'/>
            <div class='glass-effect rounded-lg p-3 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200 flex items-center gap-3'>
              <div class='text-2xl'>⚡</div>
              <div class='flex-1'>
                <div class='font-medium text-sm'>Boost Energy</div>
                <div class='text-xs text-gray-500 dark:text-gray-400'>Feel more vital</div>
              </div>
              <div class='w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary'></div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <label class='block text-base font-semibold mb-3 flex items-center gap-2'>
          <span class='text-2xl'>📋</span>
          Personal Details
        </label>
        <div class='grid grid-cols-2 gap-4'>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Age (years)</label>
            <input id='planAge' type='number' value='30' min='1' max='120' class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'/>
          </div>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Weight (kg)</label>
            <input id='planWeight' type='number' value='70' min='20' max='300' class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'/>
          </div>
        </div>
      </div>
      
      <button id='generatePlanBtn' class='w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2'>
        <span>✨</span>
        <span>Generate My Personalized Plan</span>
      </button>
    </div>
    <div id='planResult' class='hidden'></div>
  </div>`
);

// My Plans modal
const myPlansModal = createModal('myPlansModal', '📋 My Diet Plans', 
  `<div class='space-y-4'>
    <div class='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20'>
      <p class='text-sm leading-relaxed'>View and manage all your personalized Ayurvedic diet plans in one place.</p>
    </div>
    <div id='plansListContent' class='space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar'></div>
  </div>`
);

// Explore Herbs modal
const herbsModal = createModal('herbsModal', '🌿 Ayurvedic Foods Database', 
  `<div class='space-y-5'>
    <div class='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20'>
      <p class='text-sm leading-relaxed'>Explore our comprehensive database of 300+ Ayurvedic foods, herbs, and their healing properties.</p>
    </div>
    <div class='relative'>
      <input id='herbSearch' type='text' placeholder='Search for foods, herbs, spices...' class='w-full p-4 pl-12 rounded-xl border-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base'/>
      <span class='absolute left-4 top-1/2 -translate-y-1/2 text-2xl'>🔍</span>
    </div>
    <div id='herbsResults' class='space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar'></div>
  </div>`
);

// Doctor Consultation modal
const doctorModal = createModal('doctorModal', '🩺 Book Ayurvedic Doctor Consultation', 
  `<div class='space-y-6'>
    <div class='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20'>
      <p class='text-sm leading-relaxed'><strong>Connect with certified Ayurvedic practitioners</strong> for personalized health consultations, treatment plans, and holistic wellness guidance.</p>
    </div>
    
    <div id='appointmentForm' class='space-y-5'>
      <!-- Consultation Type Selection -->
      <div>
        <label class='block text-base font-semibold mb-3 flex items-center gap-2'>
          <span class='text-2xl'>📋</span>
          Consultation Type
        </label>
        <div class='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <label class='group cursor-pointer'>
            <input type='radio' name='consultationType' value='online' class='peer sr-only' checked/>
            <div class='glass-effect rounded-xl p-4 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200'>
              <div class='flex items-center gap-3'>
                <div class='text-3xl'>💻</div>
                <div class='flex-1'>
                  <div class='font-semibold text-base'>Online Video Call</div>
                  <div class='text-xs text-gray-500 dark:text-gray-400'>Consult from home</div>
                </div>
              </div>
            </div>
          </label>
          <label class='group cursor-pointer'>
            <input type='radio' name='consultationType' value='in-person' class='peer sr-only'/>
            <div class='glass-effect rounded-xl p-4 border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 transition-all duration-200'>
              <div class='flex items-center gap-3'>
                <div class='text-3xl'>🏥</div>
                <div class='flex-1'>
                  <div class='font-semibold text-base'>In-Person Visit</div>
                  <div class='text-xs text-gray-500 dark:text-gray-400'>Visit clinic</div>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
      
      <!-- Specialization Selection -->
      <div>
        <label class='block text-base font-semibold mb-3 flex items-center gap-2'>
          <span class='text-2xl'>🌿</span>
          Select Specialization
        </label>
        <select id='doctorSpecialization' class='w-full p-3 rounded-xl border-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'>
          <option value=''>Choose a specialization...</option>
          <option value='general'>General Ayurvedic Consultation</option>
          <option value='panchakarma'>Panchakarma Therapy</option>
          <option value='nutrition'>Ayurvedic Nutrition & Diet</option>
          <option value='chronic'>Chronic Disease Management</option>
          <option value='women'>Women's Health & Fertility</option>
          <option value='skin'>Skin & Beauty Treatments</option>
          <option value='mental'>Mental Health & Stress</option>
          <option value='digestive'>Digestive Disorders</option>
          <option value='joint'>Joint & Musculoskeletal</option>
        </select>
      </div>
      
      <!-- Patient Information -->
      <div class='glass-effect rounded-xl p-5 border border-border-light dark:border-border-dark'>
        <h4 class='font-semibold text-base mb-4 flex items-center gap-2'>
          <span class='text-xl'>👤</span>
          Patient Information
        </h4>
        <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Full Name *</label>
            <input id='patientName' type='text' required class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all' placeholder='Enter full name'/>
          </div>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Phone Number *</label>
            <input id='patientPhone' type='tel' required class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all' placeholder='+91 '/>
          </div>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Email Address *</label>
            <input id='patientEmail' type='email' required class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all' placeholder='your@email.com'/>
          </div>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Age</label>
            <input id='patientAge' type='number' min='1' max='120' class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all' placeholder='Age'/>
          </div>
        </div>
      </div>
      
      <!-- Date & Time Selection -->
      <div class='glass-effect rounded-xl p-5 border border-border-light dark:border-border-dark'>
        <h4 class='font-semibold text-base mb-4 flex items-center gap-2'>
          <span class='text-xl'>📅</span>
          Preferred Date & Time
        </h4>
        <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Select Date *</label>
            <input id='appointmentDate' type='date' required class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'/>
          </div>
          <div>
            <label class='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>Select Time *</label>
            <select id='appointmentTime' required class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'>
              <option value=''>Choose time slot...</option>
              <option value='09:00'>09:00 AM</option>
              <option value='09:30'>09:30 AM</option>
              <option value='10:00'>10:00 AM</option>
              <option value='10:30'>10:30 AM</option>
              <option value='11:00'>11:00 AM</option>
              <option value='11:30'>11:30 AM</option>
              <option value='14:00'>02:00 PM</option>
              <option value='14:30'>02:30 PM</option>
              <option value='15:00'>03:00 PM</option>
              <option value='15:30'>03:30 PM</option>
              <option value='16:00'>04:00 PM</option>
              <option value='16:30'>04:30 PM</option>
              <option value='17:00'>05:00 PM</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Chief Complaints -->
      <div>
        <label class='block text-base font-semibold mb-3 flex items-center gap-2'>
          <span class='text-2xl'>📝</span>
          Chief Complaints / Reason for Visit
        </label>
        <textarea id='patientComplaints' rows='4' class='w-full p-3 rounded-lg border-2 border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none' placeholder='Describe your health concerns, symptoms, or reason for consultation...'></textarea>
      </div>
      
      <!-- Submit Button -->
      <button id='bookAppointmentBtn' class='w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2'>
        <span>📅</span>
        <span>Book Appointment</span>
      </button>
      
      <div class='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
        <p class='text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2'>
          <span class='text-base'>ℹ️</span>
          <span>You will receive a confirmation email and SMS with doctor details and meeting link (for online) or clinic address (for in-person visit) within 24 hours.</span>
        </p>
      </div>
    </div>
    
    <div id='appointmentConfirmation' class='hidden'></div>
  </div>`
);

// Learn Ayurveda modal
const learnModal = createModal('learnModal', '📚 Learn Ayurveda - Ancient Wisdom for Modern Life', 
  `<div class='space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
    <div class='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20'>
      <p class='text-sm leading-relaxed'><strong>Ayurveda</strong>, meaning "Science of Life", is a 5,000-year-old holistic healing system from India. It emphasizes balance between mind, body, and spirit through personalized diet, lifestyle, and herbal remedies.</p>
    </div>
    
    <section>
      <h3 class='text-lg font-bold text-primary mb-4 flex items-center gap-2'>
        <span class='text-2xl'>🧘</span>
        The Three Doshas - Your Bio-Energy
      </h3>
      <div class='grid md:grid-cols-3 gap-4'>
        <div class='glass-effect rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300'>
          <div class='text-4xl mb-3 text-center'>🌬️</div>
          <h4 class='font-bold text-lg mb-2 text-blue-600 dark:text-blue-400'>Vata</h4>
          <p class='text-xs text-gray-500 dark:text-gray-400 mb-3'>Air + Space (Ether)</p>
          <div class='space-y-2 text-sm'>
            <p><strong>Governs:</strong> Movement, breathing, circulation, nervous system</p>
            <p><strong>Qualities:</strong> Cold, light, dry, rough, mobile</p>
            <p class='text-green-600 dark:text-green-400'><strong>✔ Balanced:</strong> Creative, enthusiastic, flexible, energetic</p>
            <p class='text-red-600 dark:text-red-400'><strong>✖ Imbalanced:</strong> Anxiety, insomnia, dry skin, constipation, fear</p>
            <p class='text-xs mt-2 italic'><strong>Season:</strong> Fall & Early Winter</p>
          </div>
        </div>
        
        <div class='glass-effect rounded-xl p-5 border-2 border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300'>
          <div class='text-4xl mb-3 text-center'>🔥</div>
          <h4 class='font-bold text-lg mb-2 text-red-600 dark:text-red-400'>Pitta</h4>
          <p class='text-xs text-gray-500 dark:text-gray-400 mb-3'>Fire + Water</p>
          <div class='space-y-2 text-sm'>
            <p><strong>Governs:</strong> Digestion, metabolism, body temperature, intelligence</p>
            <p><strong>Qualities:</strong> Hot, sharp, light, liquid, spreading</p>
            <p class='text-green-600 dark:text-green-400'><strong>✔ Balanced:</strong> Intelligent, focused, confident, courageous</p>
            <p class='text-red-600 dark:text-red-400'><strong>✖ Imbalanced:</strong> Anger, inflammation, heartburn, rashes, irritability</p>
            <p class='text-xs mt-2 italic'><strong>Season:</strong> Summer & Late Spring</p>
          </div>
        </div>
        
        <div class='glass-effect rounded-xl p-5 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300'>
          <div class='text-4xl mb-3 text-center'>🌿</div>
          <h4 class='font-bold text-lg mb-2 text-green-600 dark:text-green-400'>Kapha</h4>
          <p class='text-xs text-gray-500 dark:text-gray-400 mb-3'>Earth + Water</p>
          <div class='space-y-2 text-sm'>
            <p><strong>Governs:</strong> Structure, stability, lubrication, immunity</p>
            <p><strong>Qualities:</strong> Heavy, slow, steady, solid, cold, soft</p>
            <p class='text-green-600 dark:text-green-400'><strong>✔ Balanced:</strong> Calm, loving, patient, strong, grounded</p>
            <p class='text-red-600 dark:text-red-400'><strong>✖ Imbalanced:</strong> Weight gain, lethargy, depression, congestion</p>
            <p class='text-xs mt-2 italic'><strong>Season:</strong> Late Winter & Spring</p>
          </div>
        </div>
      </div>
    </section>
    
    <section>
      <h3 class='text-lg font-bold text-primary mb-4 flex items-center gap-2'>
        <span class='text-2xl'>🍽️</span>
        Six Tastes (Rasa) - Therapeutic Effects
      </h3>
      <div class='grid md:grid-cols-2 gap-3'>
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-center gap-3 mb-2'>
            <span class='text-2xl'>🍯</span>
            <strong class='text-base'>Sweet (Madhura)</strong>
          </div>
          <p class='text-sm text-gray-700 dark:text-gray-300 mb-1'>Builds tissues, strength, nourishes • ↓ Vata & Pitta • ↑ Kapha</p>
          <p class='text-xs text-gray-500 dark:text-gray-400'><em>Examples: Rice, milk, wheat, ghee, dates, honey</em></p>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-center gap-3 mb-2'>
            <span class='text-2xl'>🍋</span>
            <strong class='text-base'>Sour (Amla)</strong>
          </div>
          <p class='text-sm text-gray-700 dark:text-gray-300 mb-1'>Stimulates digestion, increases appetite • ↓ Vata • ↑ Pitta & Kapha</p>
          <p class='text-xs text-gray-500 dark:text-gray-400'><em>Examples: Lemon, yogurt, tamarind, fermented foods</em></p>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-center gap-3 mb-2'>
            <span class='text-2xl'>🧂</span>
            <strong class='text-base'>Salty (Lavana)</strong>
          </div>
          <p class='text-sm text-gray-700 dark:text-gray-300 mb-1'>Improves taste, aids digestion, mineral balance • ↓ Vata • ↑ Pitta & Kapha</p>
          <p class='text-xs text-gray-500 dark:text-gray-400'><em>Examples: Sea salt, rock salt, seaweed, celery</em></p>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-center gap-3 mb-2'>
            <span class='text-2xl'>🌶️</span>
            <strong class='text-base'>Pungent (Katu)</strong>
          </div>
          <p class='text-sm text-gray-700 dark:text-gray-300 mb-1'>Clears sinuses, stimulates metabolism, circulation • ↓ Kapha • ↑ Vata & Pitta</p>
          <p class='text-xs text-gray-500 dark:text-gray-400'><em>Examples: Ginger, chili, black pepper, garlic, onion</em></p>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-center gap-3 mb-2'>
            <span class='text-2xl'>🍃</span>
            <strong class='text-base'>Bitter (Tikta)</strong>
          </div>
          <p class='text-sm text-gray-700 dark:text-gray-300 mb-1'>Detoxifies, reduces fever, anti-inflammatory • ↓ Pitta & Kapha • ↑ Vata</p>
          <p class='text-xs text-gray-500 dark:text-gray-400'><em>Examples: Turmeric, fenugreek, bitter gourd, kale, neem</em></p>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-center gap-3 mb-2'>
            <span class='text-2xl'>🍵</span>
            <strong class='text-base'>Astringent (Kashaya)</strong>
          </div>
          <p class='text-sm text-gray-700 dark:text-gray-300 mb-1'>Tones tissues, stops bleeding, drying • ↓ Pitta & Kapha • ↑ Vata</p>
          <p class='text-xs text-gray-500 dark:text-gray-400'><em>Examples: Beans, lentils, pomegranate, tea, green banana</em></p>
        </div>
      </div>
    </section>
    
    <section>
      <h3 class='text-lg font-bold text-primary mb-4 flex items-center gap-2'>
        <span class='text-2xl'>✨</span>
        Core Ayurvedic Principles
      </h3>
      <div class='space-y-3'>
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🔥</span>
            <div>
              <strong class='text-base block mb-1'>Agni (Digestive Fire)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300'>The cornerstone of health. Strong Agni ensures proper digestion, absorption, and elimination. Weak Agni leads to ama (toxins) accumulation.</p>
              <p class='text-xs text-gray-500 dark:text-gray-400 mt-1'><strong>Build Agni:</strong> Eat at regular times, avoid cold drinks with meals, use ginger & spices</p>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>⚠️</span>
            <div>
              <strong class='text-base block mb-1'>Ama (Toxins)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300'>Undigested food waste that accumulates in the body, blocking channels (srotas) and causing disease. Appears as white coating on tongue.</p>
              <p class='text-xs text-gray-500 dark:text-gray-400 mt-1'><strong>Prevent Ama:</strong> Eat fresh foods, don't overeat, fast occasionally, drink warm water</p>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>💎</span>
            <div>
              <strong class='text-base block mb-1'>Ojas (Vital Essence)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300'>The finest product of digestion - responsible for immunity, vitality, luster, and spiritual awareness. The essence of all tissues.</p>
              <p class='text-xs text-gray-500 dark:text-gray-400 mt-1'><strong>Build Ojas:</strong> Quality sleep, meditation, ghee, dates, almonds, saffron, love & joy</p>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🌊</span>
            <div>
              <strong class='text-base block mb-1'>Sapta Dhatu (Seven Tissues)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300'>Seven layers nourished sequentially: Rasa (plasma), Rakta (blood), Mamsa (muscle), Meda (fat), Asthi (bone), Majja (marrow), Shukra (reproductive).</p>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-primary/20 bg-primary/5'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>⚖️</span>
            <div>
              <strong class='text-base block mb-1 text-primary'>Universal Laws</strong>
              <p class='text-sm mb-1'><strong>Like increases like:</strong> Similar qualities reinforce each other</p>
              <p class='text-sm'><strong>Opposites balance:</strong> Use opposite qualities to restore equilibrium</p>
              <p class='text-xs text-gray-600 dark:text-gray-400 mt-2 italic'>Example: Cold Vata → warm foods • Hot Pitta → cooling foods</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <section>
      <h3 class='text-lg font-bold text-primary mb-4 flex items-center gap-2'>
        <span class='text-2xl'>🌅</span>
        Dinacharya (Daily Routine for Optimal Health)
      </h3>
      <div class='glass-effect rounded-xl p-5 border border-border-light dark:border-border-dark'>
        <div class='space-y-3 text-sm'>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>☀️</span>
            <div>
              <strong>Wake before sunrise</strong> (Brahma Muhurta - 4:30-6 AM, Vata time) for clarity, lightness, and spiritual connection
            </div>
          </div>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>💧</span>
            <div>
              <strong>Tongue scraping & oil pulling</strong> - Remove ama from tongue, detoxify, stimulate organs
            </div>
          </div>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>🧘</span>
            <div>
              <strong>Morning meditation, pranayama, & yoga</strong> - Connect mind-body-spirit, build prana (life force)
            </div>
          </div>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>🚿</span>
            <div>
              <strong>Self-massage (Abhyanga)</strong> - Oil massage before bath nourishes skin, calms nervous system
            </div>
          </div>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>🍽️</span>
            <div>
              <strong>Main meal at midday</strong> (12-1 PM, Pitta time) - Digestive fire strongest, can handle largest meal
            </div>
          </div>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>🌙</span>
            <div>
              <strong>Light dinner before sunset</strong> (6-7 PM) - Allow 3-4 hours for digestion before sleep
            </div>
          </div>
          <div class='flex gap-3 items-start'>
            <span class='text-xl flex-shrink-0'>😴</span>
            <div>
              <strong>Sleep by 10 PM</strong> (before Pitta time 10 PM-2 AM) - Deep restorative rest, body repairs
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <section>
      <h3 class='text-lg font-bold text-primary mb-4 flex items-center gap-2'>
        <span class='text-2xl'>🌡️</span>
        Seasonal Living (Ritucharya)
      </h3>
      <div class='glass-effect rounded-xl p-4 border border-border-light dark:border-border-dark'>
        <p class='text-sm text-gray-700 dark:text-gray-300 mb-3'>Ayurveda teaches us to align our diet and lifestyle with seasonal changes to maintain dosha balance.</p>
        <div class='grid md:grid-cols-2 gap-3 text-xs'>
          <div class='p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20'>
            <strong>🍂 Fall/Winter (Vata Season):</strong> Warm, grounding, oily foods • Regular routine • Stay warm
          </div>
          <div class='p-3 rounded-lg bg-red-50 dark:bg-red-900/20'>
            <strong>☀️ Summer (Pitta Season):</strong> Cooling, sweet foods • Avoid excessive heat • Stay hydrated
          </div>
          <div class='p-3 rounded-lg bg-green-50 dark:bg-green-900/20'>
            <strong>🌸 Spring (Kapha Season):</strong> Light, bitter, pungent foods • Exercise • Detoxify
          </div>
          <div class='p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20'>
            <strong>🍁 Late Summer:</strong> Transition time • Gentle cleansing • Build digestive strength
          </div>
        </div>
      </div>
    </section>
    
    <section>
      <h3 class='text-lg font-bold text-primary mb-4 flex items-center gap-2'>
        <span class='text-2xl'>📖</span>
        Trusted Resources & Further Learning
      </h3>
      <div class='space-y-3'>
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🏛️</span>
            <div>
              <strong class='text-base block mb-1'>National Center for Complementary and Integrative Health (NCCIH)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Official U.S. government resource on Ayurvedic medicine research, safety, and evidence-based information.</p>
              <a href='https://www.nccih.nih.gov/health/ayurvedic-medicine-in-depth' target='_blank' rel='noopener noreferrer' class='text-xs text-primary hover:text-secondary underline flex items-center gap-1'>
                Visit NCCIH Ayurveda Guide 
                <svg class='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'><path d='M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z'/><path d='M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z'/></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🌍</span>
            <div>
              <strong class='text-base block mb-1'>World Health Organization (WHO)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Global health standards and documentation on traditional, complementary, and integrative medicine systems.</p>
              <a href='https://www.who.int/health-topics/traditional-complementary-and-integrative-medicine' target='_blank' rel='noopener noreferrer' class='text-xs text-primary hover:text-secondary underline flex items-center gap-1'>
                Visit WHO Traditional Medicine 
                <svg class='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'><path d='M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z'/><path d='M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z'/></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🎓</span>
            <div>
              <strong class='text-base block mb-1'>National Ayurvedic Medical Association (NAMA)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Professional organization for Ayurvedic practitioners in North America. Find certified practitioners and educational resources.</p>
              <a href='https://www.ayurvedanama.org/' target='_blank' rel='noopener noreferrer' class='text-xs text-primary hover:text-secondary underline flex items-center gap-1'>
                Visit NAMA 
                <svg class='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'><path d='M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z'/><path d='M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z'/></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>📚</span>
            <div>
              <strong class='text-base block mb-1'>Classical Ayurvedic Texts (Brihat Trayi)</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Ancient foundational texts written thousands of years ago:</p>
              <ul class='text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc'>
                <li><strong>Charaka Samhita</strong> - Internal medicine, diagnosis, & therapeutics</li>
                <li><strong>Sushruta Samhita</strong> - Surgery, anatomy, & surgical instruments</li>
                <li><strong>Ashtanga Hridaya</strong> - Comprehensive practical guide</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🔬</span>
            <div>
              <strong class='text-base block mb-1'>PubMed Central - Ayurveda Research Database</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Access peer-reviewed scientific studies, clinical trials, and research papers on Ayurvedic medicine and herbs.</p>
              <a href='https://www.ncbi.nlm.nih.gov/pmc/?term=ayurveda' target='_blank' rel='noopener noreferrer' class='text-xs text-primary hover:text-secondary underline flex items-center gap-1'>
                Browse Research Papers 
                <svg class='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'><path d='M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z'/><path d='M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z'/></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🇮🇳</span>
            <div>
              <strong class='text-base block mb-1'>Ministry of AYUSH, Government of India</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Official Ayurveda education standards, quality control, regulations, and research programs from India's Ministry of Ayurveda, Yoga, Unani, Siddha, and Homeopathy.</p>
              <a href='https://ayush.gov.in/' target='_blank' rel='noopener noreferrer' class='text-xs text-primary hover:text-secondary underline flex items-center gap-1'>
                Visit Ministry of AYUSH 
                <svg class='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'><path d='M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z'/><path d='M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z'/></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>🎬</span>
            <div>
              <strong class='text-base block mb-1'>Ayurveda Educational Resources</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300 mb-2'>Learn through courses, videos, and documentaries:</p>
              <ul class='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
                <li>• <strong>The Ayurvedic Institute</strong> - Founded by Dr. Vasant Lad</li>
                <li>• <strong>Chopra Center</strong> - Dr. Deepak Chopra's integrative wellness</li>
                <li>• <strong>Kripalu Center</strong> - Yoga & Ayurveda education</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class='glass-effect rounded-lg p-4 border border-primary/30 bg-yellow-50 dark:bg-yellow-900/10'>
          <div class='flex items-start gap-3'>
            <span class='text-2xl'>⚠️</span>
            <div>
              <strong class='text-base block mb-1 text-orange-700 dark:text-orange-400'>Important Medical Disclaimer</strong>
              <p class='text-sm text-gray-700 dark:text-gray-300'>Ayurveda is a complementary and traditional medicine system. Always consult qualified healthcare professionals before making significant dietary or lifestyle changes, especially if you have medical conditions, are pregnant/nursing, or take medications. Some Ayurvedic herbs may interact with pharmaceuticals. This app provides educational information only and is not a substitute for professional medical advice.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <section class='bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-5 border border-primary/20'>
      <h3 class='text-base font-bold text-primary mb-3 flex items-center gap-2'>
        <span class='text-xl'>🌟</span>
        Begin Your Ayurvedic Journey Today
      </h3>
      <p class='text-sm text-gray-700 dark:text-gray-300 mb-4'>Ready to experience personalized wellness? Take our comprehensive Prakriti quiz to discover your unique dosha constitution and receive custom dietary recommendations aligned with ancient Ayurvedic wisdom.</p>
      <button onclick='document.getElementById("learnModal").classList.add("hidden"); document.getElementById("btnPrakriti").click()' class='w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2'>
        <span>🧘</span>
        <span>Discover My Dosha Constitution</span>
        <svg class='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><path fill-rule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clip-rule='evenodd'/></svg>
      </button>
    </section>
  </div>`
);

// Community Forum Modal
const communityModal = createModal('communityModal', '💬 Community Forum', 
  `<div id='communityContent' class='space-y-4'>
    <!-- Forum will be rendered here -->
  </div>`
);

// Community Forum Data & Functions
let currentUser = localStorage.getItem('communityUser') || null;
let forumDiscussions = JSON.parse(localStorage.getItem('forumDiscussions') || '[]');
let currentView = 'list'; // 'list' or 'detail'
let currentDiscussionId = null;

// Initialize with sample discussions if empty
if (forumDiscussions.length === 0) {
  forumDiscussions = [
    {
      id: 1,
      title: 'Best morning routine for Vata imbalance?',
      author: 'Anjali K',
      avatar: 'AK',
      category: 'Vata',
      excerpt: "I've been experiencing anxiety and restlessness lately. Looking for suggestions on morning rituals that can help ground my Vata energy...",
      content: "I've been experiencing anxiety and restlessness lately, especially in the mornings. Looking for suggestions on morning rituals that can help ground my Vata energy. What has worked for you?",
      replies: [
        { author: 'Priya M', avatar: 'PM', content: 'Start with warm sesame oil massage (abhyanga) before shower. Game changer for me!', timestamp: '2h ago' },
        { author: 'Raj S', avatar: 'RS', content: 'Warm ginger tea first thing in the morning helps a lot. Also try tongue scraping.', timestamp: '1h ago' }
      ],
      views: 245,
      timestamp: '2h ago',
      likes: 12
    },
    {
      id: 2,
      title: 'Cooling foods for Pitta during summer?',
      author: 'Priya M',
      avatar: 'PM',
      category: 'Pitta',
      excerpt: 'Looking for recipe ideas and food suggestions to keep my Pitta balanced during the hot summer months. What works for you?',
      content: 'Looking for recipe ideas and food suggestions to keep my Pitta balanced during the hot summer months. What works for you?',
      replies: [
        { author: 'Maya D', avatar: 'MD', content: 'Coconut water, cucumber salads, mint chutney - all great cooling options!', timestamp: '3h ago' }
      ],
      views: 189,
      timestamp: '5h ago',
      likes: 8
    },
    {
      id: 3,
      title: 'Success story: 3 months on Kapha-balancing diet',
      author: 'Rahul S',
      avatar: 'RS',
      category: 'Success Story',
      excerpt: 'Wanted to share my journey! Lost 15 pounds and feeling more energetic than ever. Here is what worked for me...',
      content: "Wanted to share my journey! Lost 15 pounds and feeling more energetic than ever. Started with:\n- Spicy foods (ginger, black pepper)\n- Light dinner before 7pm\n- Morning exercise\n- Reduced dairy and sweets\n\nThe transformation has been amazing!",
      replies: [
        { author: 'Anjali K', avatar: 'AK', content: 'Congratulations! This is so inspiring! How did you deal with cravings?', timestamp: '12h ago' },
        { author: 'Priya M', avatar: 'PM', content: 'Amazing progress! What time do you exercise?', timestamp: '10h ago' }
      ],
      views: 512,
      timestamp: '1d ago',
      likes: 24
    }
  ];
  localStorage.setItem('forumDiscussions', JSON.stringify(forumDiscussions));
}

function renderForumList() {
  const container = document.getElementById('communityContent');
  const userSection = currentUser ? 
    `<div class='flex items-center justify-between mb-4 p-3 bg-primary/5 rounded-lg'>
      <div class='flex items-center gap-2'>
        <div class='w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold'>
          ${currentUser.substring(0, 2).toUpperCase()}
        </div>
        <span class='font-semibold'>${currentUser}</span>
      </div>
      <button onclick='logoutCommunity()' class='text-sm text-red-600 hover:text-red-700 font-medium'>Logout</button>
    </div>` : '';
  
  const discussions = forumDiscussions.map(d => `
    <div onclick='viewDiscussion(${d.id})' class='flex gap-4 rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group'>
      <div class='flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg'>
        ${d.avatar}
      </div>
      <div class='flex-1 min-w-0'>
        <div class='flex items-start justify-between gap-2 mb-2'>
          <h4 class='text-text-light dark:text-text-dark font-semibold text-base group-hover:text-primary transition-colors line-clamp-1'>
            ${d.title}
          </h4>
          <span class='flex-shrink-0 text-xs text-text-light/60 dark:text-text-dark/60'>${d.timestamp}</span>
        </div>
        <p class='text-text-light/70 dark:text-text-dark/70 text-sm line-clamp-2 mb-3'>
          ${d.excerpt}
        </p>
        <div class='flex items-center gap-4 text-xs text-text-light/60 dark:text-text-dark/60'>
          <span class='flex items-center gap-1'>
            <span class='material-symbols-outlined' style='font-size: 16px;'>chat_bubble</span>
            <span>${d.replies.length} replies</span>
          </span>
          <span class='flex items-center gap-1'>
            <span class='material-symbols-outlined' style='font-size: 16px;'>visibility</span>
            <span>${d.views} views</span>
          </span>
          <span class='flex items-center gap-1'>
            <span class='material-symbols-outlined' style='font-size: 16px;'>favorite</span>
            <span>${d.likes}</span>
          </span>
          <span class='px-2 py-1 rounded-full bg-primary/10 text-primary font-medium'>${d.category}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = `
    ${userSection}
    <div class='flex items-center justify-between mb-4'>
      <h3 class='text-lg font-bold'>Recent Discussions</h3>
      ${currentUser ? 
        `<button onclick='showNewDiscussionForm()' class='px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2'>
          <span class='material-symbols-outlined' style='font-size: 18px;'>add</span>
          <span>New Post</span>
        </button>` : 
        `<button onclick='showLoginPrompt()' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all'>
          Login to Post
        </button>`
      }
    </div>
    <div class='space-y-3'>
      ${discussions}
    </div>
  `;
}

function viewDiscussion(id) {
  currentDiscussionId = id;
  currentView = 'detail';
  const discussion = forumDiscussions.find(d => d.id === id);
  if (!discussion) return;
  
  // Increment views
  discussion.views++;
  localStorage.setItem('forumDiscussions', JSON.stringify(forumDiscussions));
  
  const container = document.getElementById('communityContent');
  const replies = discussion.replies.map(r => `
    <div class='flex gap-3 p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark'>
      <div class='flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold'>
        ${r.avatar}
      </div>
      <div class='flex-1'>
        <div class='flex items-center gap-2 mb-1'>
          <span class='font-semibold text-sm'>${r.author}</span>
          <span class='text-xs text-gray-500'>${r.timestamp}</span>
        </div>
        <p class='text-sm text-text-light/80 dark:text-text-dark/80'>${r.content}</p>
      </div>
    </div>
  `).join('');
  
  const replyForm = currentUser ? `
    <div class='mt-4 p-4 bg-primary/5 rounded-lg'>
      <h4 class='font-semibold mb-3'>Add Your Reply</h4>
      <textarea id='replyContent' rows='3' placeholder='Share your thoughts...' class='w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none'></textarea>
      <button onclick='submitReply()' class='mt-2 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all'>
        Post Reply
      </button>
    </div>
  ` : `
    <div class='mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center'>
      <p class='text-sm text-gray-600 dark:text-gray-400 mb-2'>Login to reply to this discussion</p>
      <button onclick='showLoginPrompt()' class='px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all'>
        Login
      </button>
    </div>
  `;
  
  container.innerHTML = `
    <button onclick='backToList()' class='flex items-center gap-2 text-primary hover:text-secondary transition-colors mb-4 font-medium'>
      <span class='material-symbols-outlined' style='font-size: 20px;'>arrow_back</span>
      <span>Back to Discussions</span>
    </button>
    
    <div class='bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6'>
      <div class='flex items-start gap-4 mb-4'>
        <div class='flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl'>
          ${discussion.avatar}
        </div>
        <div class='flex-1'>
          <h2 class='text-2xl font-bold text-text-light dark:text-text-dark mb-2'>${discussion.title}</h2>
          <div class='flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400'>
            <span class='font-medium'>${discussion.author}</span>
            <span>•</span>
            <span>${discussion.timestamp}</span>
            <span class='px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium'>${discussion.category}</span>
          </div>
        </div>
      </div>
      
      <p class='text-text-light/80 dark:text-text-dark/80 text-base leading-relaxed whitespace-pre-line mb-4'>
        ${discussion.content}
      </p>
      
      <div class='flex items-center gap-4 pt-4 border-t border-border-light dark:border-border-dark'>
        <button onclick='likeDiscussion()' class='flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors'>
          <span class='material-symbols-outlined' style='font-size: 20px;'>favorite</span>
          <span class='text-sm font-medium'>${discussion.likes}</span>
        </button>
        <span class='flex items-center gap-1 text-gray-600'>
          <span class='material-symbols-outlined' style='font-size: 20px;'>visibility</span>
          <span class='text-sm'>${discussion.views} views</span>
        </span>
      </div>
    </div>
    
    <div class='mt-6'>
      <h3 class='text-lg font-bold mb-4'>${discussion.replies.length} Replies</h3>
      <div class='space-y-3'>
        ${replies}
      </div>
      ${replyForm}
    </div>
  `;
}

function showNewDiscussionForm() {
  const container = document.getElementById('communityContent');
  container.innerHTML = `
    <button onclick='backToList()' class='flex items-center gap-2 text-primary hover:text-secondary transition-colors mb-4 font-medium'>
      <span class='material-symbols-outlined' style='font-size: 20px;'>arrow_back</span>
      <span>Back to Discussions</span>
    </button>
    
    <div class='bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6'>
      <h2 class='text-2xl font-bold mb-6'>Start New Discussion</h2>
      
      <div class='space-y-4'>
        <div>
          <label class='block text-sm font-semibold mb-2'>Title</label>
          <input type='text' id='newDiscussionTitle' placeholder='What would you like to discuss?' class='w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'>
        </div>
        
        <div>
          <label class='block text-sm font-semibold mb-2'>Category</label>
          <select id='newDiscussionCategory' class='w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'>
            <option value='Vata'>Vata</option>
            <option value='Pitta'>Pitta</option>
            <option value='Kapha'>Kapha</option>
            <option value='General'>General Discussion</option>
            <option value='Recipes'>Recipes & Cooking</option>
            <option value='Success Story'>Success Story</option>
          </select>
        </div>
        
        <div>
          <label class='block text-sm font-semibold mb-2'>Content</label>
          <textarea id='newDiscussionContent' rows='8' placeholder='Share your thoughts, questions, or experiences...' class='w-full px-4 py-3 border-2 border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none'></textarea>
        </div>
        
        <div class='flex gap-3'>
          <button onclick='submitNewDiscussion()' class='flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all'>
            Post Discussion
          </button>
          <button onclick='backToList()' class='px-6 py-3 border-2 border-border-light dark:border-border-dark rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
}

function submitNewDiscussion() {
  const title = document.getElementById('newDiscussionTitle').value.trim();
  const category = document.getElementById('newDiscussionCategory').value;
  const content = document.getElementById('newDiscussionContent').value.trim();
  
  if (!title || !content) {
    showNotification('Please fill in all fields', 'warning');
    return;
  }
  
  const newDiscussion = {
    id: Date.now(),
    title,
    author: currentUser,
    avatar: currentUser.substring(0, 2).toUpperCase(),
    category,
    excerpt: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
    content,
    replies: [],
    views: 0,
    timestamp: 'Just now',
    likes: 0
  };
  
  forumDiscussions.unshift(newDiscussion);
  localStorage.setItem('forumDiscussions', JSON.stringify(forumDiscussions));
  showNotification('Discussion posted successfully!', 'success');
  backToList();
}

function submitReply() {
  const content = document.getElementById('replyContent').value.trim();
  if (!content) {
    showNotification('Please enter a reply', 'warning');
    return;
  }
  
  const discussion = forumDiscussions.find(d => d.id === currentDiscussionId);
  if (!discussion) return;
  
  discussion.replies.push({
    author: currentUser,
    avatar: currentUser.substring(0, 2).toUpperCase(),
    content,
    timestamp: 'Just now'
  });
  
  localStorage.setItem('forumDiscussions', JSON.stringify(forumDiscussions));
  showNotification('Reply posted!', 'success');
  viewDiscussion(currentDiscussionId);
}

function likeDiscussion() {
  const discussion = forumDiscussions.find(d => d.id === currentDiscussionId);
  if (discussion) {
    discussion.likes++;
    localStorage.setItem('forumDiscussions', JSON.stringify(forumDiscussions));
    viewDiscussion(currentDiscussionId);
  }
}

function backToList() {
  currentView = 'list';
  currentDiscussionId = null;
  renderForumList();
}

function showLoginPrompt() {
  const name = prompt('Enter your name to join the community:');
  if (name && name.trim()) {
    currentUser = name.trim();
    localStorage.setItem('communityUser', currentUser);
    showNotification('Welcome to the community!', 'success');
    renderForumList();
  }
}

function logoutCommunity() {
  if (confirm('Are you sure you want to logout?')) {
    currentUser = null;
    localStorage.removeItem('communityUser');
    showNotification('Logged out successfully', 'info');
    backToList();
  }
}

// Make functions globally accessible
window.viewDiscussion = viewDiscussion;
window.showNewDiscussionForm = showNewDiscussionForm;
window.submitNewDiscussion = submitNewDiscussion;
window.submitReply = submitReply;
window.likeDiscussion = likeDiscussion;
window.backToList = backToList;
window.showLoginPrompt = showLoginPrompt;
window.logoutCommunity = logoutCommunity;

// ===== Modal Handlers =====

function openAdvisory(profile={}) {
  InferFlow.renderAdvisory(document.getElementById('advisoryContent'), profile);
  advisoryModal.classList.remove('hidden');
}

// 1. PRAKRITI QUIZ - Enhanced with 15 questions
const quizQuestions = [
  { q: 'What best describes your body frame?', 
    vata: {emoji: '🌬️', title: 'Vata (Air + Space)', desc: 'Thin, light frame with prominent bones'}, 
    pitta: {emoji: '🔥', title: 'Pitta (Fire + Water)', desc: 'Medium build with good muscle tone'}, 
    kapha: {emoji: '🌿', title: 'Kapha (Earth + Water)', desc: 'Larger, solid frame with good strength'} },
  
  { q: 'How would you describe your skin?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Dry, rough, cool to touch, ages with fine wrinkles'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Warm, oily, prone to redness and inflammation'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Smooth, moist, cool, thick, ages slowly'} },
  
  { q: 'What describes your hair best?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Dry, thin, brittle, dark or brown'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Fine, soft, oily, light colored, premature gray'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Thick, oily, wavy, lustrous, healthy'} },
  
  { q: 'How is your appetite?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Variable - sometimes ravenous, other times not hungry'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Strong, sharp - get irritable if meals are skipped'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Steady, low - can skip meals easily'} },
  
  { q: 'What is your sleep pattern like?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Light sleeper, interrupted, 5-7 hours'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Moderate, sound sleep, 6-8 hours'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Deep, long sleeper, 8-10 hours, hard to wake'} },
  
  { q: 'Which personality traits resonate with you?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Creative, enthusiastic, anxious when stressed'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Intense, focused, competitive, occasionally irritable'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Calm, steady, compassionate, sometimes stubborn'} },
  
  { q: 'How would you describe your energy levels?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Bursts of high energy followed by fatigue'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Moderate, steady energy throughout the day'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Enduring stamina, slow to start but consistent'} },
  
  { q: 'What best describes your mental state?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Quick thinking, restless mind, creative but scattered'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Sharp, focused, analytical, sometimes critical'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Calm, methodical, slow but steady learner'} },
  
  { q: 'How do you handle stress?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Become anxious, worried, overwhelmed'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Get angry, frustrated, argumentative'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Withdraw, become lethargic, avoid confrontation'} },
  
  { q: 'What is your digestion like?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Irregular, prone to gas and bloating'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Strong, efficient, prone to heartburn'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Slow, steady, heavy after meals'} },
  
  { q: 'How do you respond to weather?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Dislike cold, dry, windy weather'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Dislike heat and humidity'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Dislike cold, damp weather'} },
  
  { q: 'What is your speaking style?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Fast, talkative, enthusiastic, sometimes rambling'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Sharp, articulate, convincing, direct'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Slow, melodious, soothing, thoughtful'} },
  
  { q: 'How do you make decisions?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Quickly, impulsively, may change mind often'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Logically, decisively, stick to decisions'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Slowly, methodically, resistant to change'} },
  
  { q: 'What describes your memory?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Quick to learn, quick to forget'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Sharp, accurate recall'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Slow to learn but never forgets'} },
  
  { q: 'How do you approach physical activity?', 
    vata: {emoji: '🌬️', title: 'Vata', desc: 'Enjoy variety, get bored easily, inconsistent'}, 
    pitta: {emoji: '🔥', title: 'Pitta', desc: 'Competitive, intense workouts, goal-oriented'}, 
    kapha: {emoji: '🌿', title: 'Kapha', desc: 'Prefer gentle, steady exercise, need motivation'} }
];

let currentQuizQuestion = 0;
let quizAnswers = {};

// Quiz progress persistence
function saveQuizProgress() {
  try {
    localStorage.setItem('quizProgress', JSON.stringify({
      currentQuestion: currentQuizQuestion,
      answers: quizAnswers,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Could not save quiz progress:', e);
  }
}

function restoreQuizProgress() {
  try {
    const saved = localStorage.getItem('quizProgress');
    if (saved) {
      const data = JSON.parse(saved);
      // Check if less than 24 hours old
      if (Date.now() - data.timestamp < 86400000) {
        currentQuizQuestion = data.currentQuestion || 0;
        quizAnswers = data.answers || {};
        return true;
      }
    }
  } catch (e) {
    console.warn('Could not restore quiz progress:', e);
  }
  return false;
}

function clearQuizProgress() {
  try {
    localStorage.removeItem('quizProgress');
  } catch (e) {
    console.warn('Could not clear quiz progress:', e);
  }
}

// Render single quiz question
function renderQuizQuestion() {
  const question = quizQuestions[currentQuizQuestion];
  const content = document.getElementById('quizQuestionContent');
  
  content.style.opacity = '0';
  setTimeout(() => {
    content.innerHTML = `
      <h2 class='font-serif text-xl md:text-2xl font-semibold text-ayur-darkGreen mb-5 text-center'>${question.q}</h2>
      <div class='space-y-3'>
        <div class='option-card-ayur cursor-pointer p-4 border-2 border-ayur-beige rounded-xl transition-all duration-300 ${quizAnswers[currentQuizQuestion] === 'vata' ? 'selected' : ''}' onclick='selectQuizOption(this, "vata")'>
          <div class='flex items-start gap-3'>
            <div class='flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl'>
              ${question.vata.emoji}
            </div>
            <div class='flex-1'>
              <h3 class='font-semibold text-base text-gray-800 dark:text-gray-200 mb-1'>${question.vata.title}</h3>
              <p class='text-sm text-gray-600 dark:text-gray-400'>${question.vata.desc}</p>
            </div>
          </div>
        </div>
        
        <div class='option-card-ayur cursor-pointer p-4 border-2 border-ayur-beige rounded-xl transition-all duration-300 ${quizAnswers[currentQuizQuestion] === 'pitta' ? 'selected' : ''}' onclick='selectQuizOption(this, "pitta")'>
          <div class='flex items-start gap-3'>
            <div class='flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl'>
              ${question.pitta.emoji}
            </div>
            <div class='flex-1'>
              <h3 class='font-semibold text-base text-gray-800 dark:text-gray-200 mb-1'>${question.pitta.title}</h3>
              <p class='text-sm text-gray-600 dark:text-gray-400'>${question.pitta.desc}</p>
            </div>
          </div>
        </div>
        
        <div class='option-card-ayur cursor-pointer p-4 border-2 border-ayur-beige rounded-xl transition-all duration-300 ${quizAnswers[currentQuizQuestion] === 'kapha' ? 'selected' : ''}' onclick='selectQuizOption(this, "kapha")'>
          <div class='flex items-start gap-3'>
            <div class='flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl'>
              ${question.kapha.emoji}
            </div>
            <div class='flex-1'>
              <h3 class='font-semibold text-base text-gray-800 dark:text-gray-200 mb-1'>${question.kapha.title}</h3>
              <p class='text-sm text-gray-600 dark:text-gray-400'>${question.kapha.desc}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    content.style.opacity = '1';
    content.classList.add('quiz-fade-enter');
    updateQuizProgress();
    updateQuizButtons();
  }, 300);
}

function selectQuizOption(element, value) {
  document.querySelectorAll('.option-card-ayur').forEach(card => card.classList.remove('selected'));
  element.classList.add('selected');
  quizAnswers[currentQuizQuestion] = value;
  document.getElementById('quizNextBtn').disabled = false;
  saveQuizProgress(); // Auto-save progress
}

function updateQuizProgress() {
  const progress = ((currentQuizQuestion + 1) / quizQuestions.length) * 100;
  document.getElementById('quizCurrentQ').textContent = currentQuizQuestion + 1;
  document.getElementById('quizTotalQ').textContent = quizQuestions.length;
  document.getElementById('quizProgressPercent').textContent = Math.round(progress);
  document.getElementById('quizProgress').style.width = progress + '%';
}

function updateQuizButtons() {
  document.getElementById('quizBackBtn').disabled = currentQuizQuestion === 0;
  document.getElementById('quizNextBtn').disabled = !quizAnswers[currentQuizQuestion];
  document.getElementById('quizNextBtn').textContent = currentQuizQuestion === quizQuestions.length - 1 ? 'See Results →' : 'Next →';
}

function goQuizBack() {
  if (currentQuizQuestion > 0) {
    currentQuizQuestion--;
    renderQuizQuestion();
  }
}

function goQuizNext() {
  if (currentQuizQuestion < quizQuestions.length - 1) {
    currentQuizQuestion++;
    saveQuizProgress();
    renderQuizQuestion();
  } else {
    // Show answer review before final submission
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      showNotification(`Please answer all ${quizQuestions.length} questions`, 'warning');
      return;
    }
    showAnswerReview();
  }
}

// Answer review before final submission
function showAnswerReview() {
  const content = document.getElementById('quizQuestionContent');
  const reviewHTML = `
    <div class="space-y-4">
      <h2 class='font-serif text-xl md:text-2xl font-semibold text-ayur-darkGreen mb-5 text-center'>Review Your Answers</h2>
      <div class='max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar'>
        ${quizQuestions.map((q, i) => {
          const answer = quizAnswers[i];
          const answerDisplay = answer ? answer.charAt(0).toUpperCase() + answer.slice(1) : 'Not answered';
          const icon = answer === 'vata' ? '🌬️' : answer === 'pitta' ? '🔥' : answer === 'kapha' ? '🌿' : '❓';
          return `
            <div class='p-3 bg-white dark:bg-gray-800 rounded-lg border border-ayur-beige hover:border-ayur-green transition-all cursor-pointer' onclick='goToQuestion(${i})'>
              <div class='flex items-center justify-between'>
                <div class='flex-1'>
                  <p class='text-sm font-medium mb-1'>${i + 1}. ${q.q}</p>
                  <div class='flex items-center gap-2'>
                    <span class='text-lg'>${icon}</span>
                    <p class='text-xs text-gray-600 dark:text-gray-400'>${answerDisplay}</p>
                  </div>
                </div>
                <button class='text-ayur-green hover:text-ayur-brown text-sm font-medium'>Edit</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class='bg-ayur-lightBeige rounded-xl p-4 border border-ayur-beige text-center'>
        <p class='text-sm text-ayur-earth'>✓ All ${quizQuestions.length} questions answered</p>
      </div>
      <div class='flex gap-3'>
        <button onclick='goQuizBack()' class='flex-1 px-6 py-3 border-2 border-ayur-green text-ayur-green rounded-xl font-semibold hover:bg-ayur-green hover:text-white transition-all duration-300'>
          ← Back
        </button>
        <button onclick='confirmAndShowResults()' class='flex-1 px-6 py-3 bg-gradient-to-r from-ayur-green to-ayur-brown text-white rounded-xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-300'>
          See My Results →
        </button>
      </div>
    </div>
  `;
  
  content.innerHTML = reviewHTML;
}

function goToQuestion(index) {
  currentQuizQuestion = index;
  renderQuizQuestion();
}

function confirmAndShowResults() {
  showQuizResults();
}

async function showQuizResults() {
  // Show loading state
  const content = document.getElementById('quizQuestionContent');
  content.innerHTML = `
    <div class='flex flex-col items-center justify-center py-12 space-y-4'>
      <div class='relative'>
        <div class='w-20 h-20 rounded-full border-4 border-ayur-green/20 border-t-ayur-green animate-spin'></div>
        <div class='absolute inset-0 flex items-center justify-center text-3xl animate-pulse-soft'>🧘</div>
      </div>
      <div class='text-center'>
        <p class='text-lg font-semibold text-ayur-green mb-2'>Analyzing Your Constitution</p>
        <p class='text-sm text-gray-600 dark:text-gray-400'>Calculating your unique dosha balance...</p>
      </div>
    </div>
  `;
  
  try {
    // Prepare answers for backend
    const answers = Object.entries(quizAnswers).map(([index, dosha]) => ({
      questionId: parseInt(index),
      vata: dosha === 'vata' ? 1 : 0,
      pitta: dosha === 'pitta' ? 1 : 0,
      kapha: dosha === 'kapha' ? 1 : 0,
      weight: 1 // Can be customized per question
    }));
    
    // Call backend API
    const response = await fetch('http://localhost:3000/quiz/prakriti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    
    if (!response.ok) {
      throw new Error('Failed to calculate dosha');
    }
    
    const result = await response.json();
    const dosha = result.primary_dosha || result.dosha_result;
    const secondary = result.secondary_dosha;
    const percentages = result.percentages || {};
    const recommendations = result.recommendations || [];
    
    // Clear quiz progress
    clearQuizProgress();
  
    const doshaInfo = {
      Vata: {
        emoji: '🌬️',
        desc: 'Vata types are creative, energetic, and quick-thinking individuals governed by the elements of Air and Space. You thrive on movement and change, with a natural enthusiasm for life. Focus on warm, grounding foods, maintain regular routines, and practice calming activities like yoga and meditation.'
      },
      Pitta: {
        emoji: '🔥',
        desc: 'Pitta types are passionate, intelligent, and driven individuals governed by Fire and Water. You have a sharp mind and strong digestion, with natural leadership qualities. Focus on cooling, calming foods, avoid excessive heat, and practice patience and compassion.'
      },
      Kapha: {
        emoji: '🌿',
        desc: 'Kapha types are stable, compassionate, and strong individuals governed by Earth and Water. You have natural endurance and a calm demeanor, with excellent physical strength. Focus on light, warming foods, stay active, and embrace change and stimulation.'
      }
    };
  
    document.getElementById('quizQuestionContent').classList.add('hidden');
    document.getElementById('quizBackBtn').classList.add('hidden');
    document.getElementById('quizNextBtn').classList.add('hidden');
    
    const resultDiv = document.getElementById('quizResult');
    resultDiv.innerHTML = `
      <div class='text-center animate-fade-in'>
        <div class='inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-ayur-green to-ayur-brown mb-4 animate-pulse-soft'>
          <span class='text-4xl'>${doshaInfo[dosha].emoji}</span>
        </div>
        
        <h3 class='font-serif text-3xl font-bold text-ayur-darkGreen mb-2'>Your ${secondary ? 'Dual ' : ''}Constitution</h3>
        <p class='font-serif text-5xl font-bold bg-gradient-to-r from-ayur-green to-ayur-brown bg-clip-text text-transparent mb-5'>
          ${dosha}${secondary ? `-${secondary}` : ''}
        </p>
        
        ${secondary ? `
          <div class='bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-5 border border-amber-200 dark:border-amber-800'>
            <p class='text-sm text-amber-800 dark:text-amber-300'>
              <strong>🌟 Dual Constitution:</strong> You have a balanced blend of ${dosha} and ${secondary} doshas. This means you'll benefit from practices that balance both constitutions.
            </p>
          </div>
        ` : ''}
        
        <div class='bg-ayur-lightBeige rounded-xl p-5 mb-5 border border-ayur-beige text-left'>
          <p class='text-ayur-earth leading-relaxed'>
            ${doshaInfo[dosha].emoji} ${doshaInfo[dosha].desc}
          </p>
        </div>
        
        <div class='grid grid-cols-3 gap-3 mb-5'>
          <div class='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border-2 border-blue-200 dark:border-blue-800'>
            <div class='text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1'>${percentages.vata || 0}%</div>
            <div class='text-xs text-gray-600 dark:text-gray-400'>Vata</div>
          </div>
          <div class='bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border-2 border-red-200 dark:border-red-800'>
            <div class='text-2xl font-bold text-red-600 dark:text-red-400 mb-1'>${percentages.pitta || 0}%</div>
            <div class='text-xs text-gray-600 dark:text-gray-400'>Pitta</div>
          </div>
          <div class='bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border-2 border-green-200 dark:border-green-800'>
            <div class='text-2xl font-bold text-green-600 dark:text-green-400 mb-1'>${percentages.kapha || 0}%</div>
            <div class='text-xs text-gray-600 dark:text-gray-400'>Kapha</div>
          </div>
        </div>
        
        ${recommendations.length > 0 ? `
          <div class='bg-white dark:bg-gray-800 rounded-xl p-5 mb-5 border border-ayur-beige text-left'>
            <h4 class='font-semibold text-ayur-darkGreen mb-3 flex items-center gap-2'>
              <span class='text-xl'>💡</span>
              Personalized Recommendations
            </h4>
            <ul class='space-y-2'>
              ${recommendations.map(rec => `
                <li class='flex items-start gap-2'>
                  <span class='text-ayur-green mt-1'>✓</span>
                  <span class='text-sm text-gray-700 dark:text-gray-300'>${rec}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <button id='saveDosha' class='w-full px-6 py-4 bg-gradient-to-r from-ayur-green to-ayur-brown text-white rounded-xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-300 mb-3'>
          ✨ Generate My Personalized Diet Plan
        </button>
        
        <button id='retakeQuiz' class='text-ayur-green hover:text-ayur-brown transition-colors text-sm font-medium'>
          ← Retake Quiz
        </button>
      </div>
    `;
    resultDiv.classList.remove('hidden');
    
    document.getElementById('saveDosha').addEventListener('click', () => {
      const constitutionType = secondary ? `${dosha}-${secondary}` : dosha;
      setDemoProfile(constitutionType, []);
      log(`Dosha ${constitutionType} saved to profile`);
      prakritiModal.classList.add('hidden');
      planModal.classList.remove('hidden');
    });
    
    document.getElementById('retakeQuiz').addEventListener('click', () => {
      currentQuizQuestion = 0;
      quizAnswers = {};
      clearQuizProgress();
      document.getElementById('quizQuestionContent').classList.remove('hidden');
      document.getElementById('quizBackBtn').classList.remove('hidden');
      document.getElementById('quizNextBtn').classList.remove('hidden');
      resultDiv.classList.add('hidden');
      renderQuizQuestion();
    });
    
    log(`Quiz completed: ${dosha}${secondary ? `-${secondary}` : ''} (${percentages.vata}% / ${percentages.pitta}% / ${percentages.kapha}%)`);
    
  } catch (error) {
    console.error('Quiz results error:', error);
    content.innerHTML = `
      <div class='text-center py-12'>
        <div class='text-6xl mb-4'>⚠️</div>
        <p class='text-lg font-semibold text-red-600 dark:text-red-400 mb-2'>Could Not Calculate Results</p>
        <p class='text-sm text-gray-600 dark:text-gray-400 mb-4'>${error.message}</p>
        <button onclick='location.reload()' class='px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-all'>
          Try Again
        </button>
      </div>
    `;
    showNotification('Failed to calculate dosha', 'error');
  }
}

// Initialize quiz button handlers
document.getElementById('btnPrakriti').addEventListener('click', () => {
  // Check if there's saved progress
  const hasProgress = restoreQuizProgress();
  if (hasProgress && Object.keys(quizAnswers).length > 0) {
    if (confirm(`You have saved progress from a previous session (Question ${currentQuizQuestion + 1}). Do you want to continue where you left off?`)) {
      prakritiModal.classList.remove('hidden');
      renderQuizQuestion();
      showNotification('Restored previous quiz progress', 'success');
      return;
    }
  }
  
  // Start fresh
  currentQuizQuestion = 0;
  quizAnswers = {};
  clearQuizProgress();
  prakritiModal.classList.remove('hidden');
  renderQuizQuestion();
});

// Start Your Journey button (from How It Works section)
document.getElementById('btnStartJourney').addEventListener('click', () => {
  currentQuizQuestion = 0;
  quizAnswers = {};
  prakritiModal.classList.remove('hidden');
  renderQuizQuestion();
  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// How It Works Step connections
document.getElementById('howItWorksStep1').addEventListener('click', () => {
  currentQuizQuestion = 0;
  quizAnswers = {};
  prakritiModal.classList.remove('hidden');
  renderQuizQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('howItWorksStep2').addEventListener('click', () => {
  planModal.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('howItWorksStep3').addEventListener('click', () => {
  myPlansModal.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('quizBackBtn').addEventListener('click', goQuizBack);
document.getElementById('quizNextBtn').addEventListener('click', goQuizNext);

// Make functions globally accessible
window.selectQuizOption = selectQuizOption;
window.goQuizBack = goQuizBack;
window.goQuizNext = goQuizNext;
window.goToQuestion = goToQuestion;
window.confirmAndShowResults = confirmAndShowResults;

// Keyboard navigation for quiz
document.addEventListener('keydown', (e) => {
  if (prakritiModal.classList.contains('hidden')) return;
  if (document.getElementById('quizResult').classList.contains('hidden') === false) return;
  
  // Arrow left/right for navigation
  if (e.key === 'ArrowLeft' && !document.getElementById('quizBackBtn').disabled) {
    e.preventDefault();
    goQuizBack();
  }
  if (e.key === 'ArrowRight' && !document.getElementById('quizNextBtn').disabled) {
    e.preventDefault();
    goQuizNext();
  }
  
  // Number keys 1-3 for quick selection
  if (e.key >= '1' && e.key <= '3') {
    e.preventDefault();
    const options = document.querySelectorAll('.option-card-ayur');
    const index = parseInt(e.key) - 1;
    if (options[index]) {
      const doshaTypes = ['vata', 'pitta', 'kapha'];
      selectQuizOption(options[index], doshaTypes[index]);
    }
  }
});

// 2. GENERATE PLAN
document.getElementById('btnGeneratePlan').addEventListener('click', () => {
  planModal.classList.remove('hidden');
  log('Opened Generate Plan');
});

document.getElementById('generatePlanBtn').addEventListener('click', async () => {
  const dosha = document.querySelector('input[name="planDoshaRadio"]:checked').value;
  const goalCheckboxes = document.querySelectorAll('input[name="planGoalCheck"]:checked');
  const goals = Array.from(goalCheckboxes).map(cb => cb.value);
  const age = parseInt(document.getElementById('planAge').value);
  const weight = parseInt(document.getElementById('planWeight').value);
  
  if (goals.length === 0) {
    showNotification('Please select at least one health goal', 'warning');
    return;
  }
  
  const profile = {
    dosha_result: dosha,
    age_years: age,
    sex: 'M',
    height_cm: 170,
    weight_kg: weight,
    activity_level: 'moderate',
    health_goals: goals,
    preferences: { liked: [], disliked: [] },
    allergies: []
  };
  
  document.getElementById('planForm').innerHTML = `
    <div class='flex flex-col items-center justify-center py-12 space-y-4'>
      <div class='relative'>
        <div class='w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin'></div>
        <div class='absolute inset-0 flex items-center justify-center text-3xl animate-pulse-soft'>✨</div>
      </div>
      <div class='text-center'>
        <p class='text-lg font-semibold text-primary mb-2'>Creating Your Personalized Plan</p>
        <p class='text-sm text-gray-600 dark:text-gray-400'>Analyzing your dosha and health goals...</p>
      </div>
    </div>
  `;
  
  try {
    const plan = await AyurAPI.generatePlan({ profile, plan_type: 'daily' });
    
    document.getElementById('planForm').classList.add('hidden');
    const resultDiv = document.getElementById('planResult');
    
    const mealIcons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🥤'
    };
    const macroRow = (label, grams, color) => `
      <div class='flex items-center justify-between text-xs'>
        <span class='font-medium text-gray-700 dark:text-gray-300'>${label}</span>
        <span class='font-semibold text-ayur-earth'>${grams}g</span>
      </div>
      <div class='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2'>
        <div class='h-full ${color} rounded-full' style='width: ${Math.min(100, Math.round((grams || 0) / 2))}%'></div>
      </div>`;

    resultDiv.innerHTML = `
      <div class='animate-fade-in'>
        <div class='text-center mb-6'>
          <div class='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-3xl mb-3 animate-pulse-soft'>🎉</div>
          <h3 class='text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2'>Your Diet Plan is Ready!</h3>
          <p class='text-sm text-gray-600 dark:text-gray-400'>Personalized for your Ayurvedic constitution</p>
        </div>
        
        <div class='grid md:grid-cols-2 gap-4 mb-6'>
          <div class='glass-effect rounded-xl p-5 border border-primary/20'>
            <div class='grid grid-cols-3 gap-4 text-center'>
              <div>
                <div class='text-2xl font-bold text-primary'>${plan.target_calories}</div>
                <div class='text-xs text-gray-600 dark:text-gray-400'>Calories/Day</div>
              </div>
              <div>
                <div class='text-2xl font-bold text-secondary'>${plan.dosha_target}</div>
                <div class='text-xs text-gray-600 dark:text-gray-400'>Your Dosha</div>
              </div>
              <div>
                <div class='text-2xl font-bold text-accent capitalize'>${plan.season || 'All'}</div>
                <div class='text-xs text-gray-600 dark:text-gray-400'>Season</div>
              </div>
            </div>
          </div>
          <div class='glass-effect rounded-xl p-5 border border-primary/20'>
            <p class='text-sm font-semibold mb-3 text-primary text-center'>Macro Distribution</p>
            <div class='flex items-center justify-center mb-4'>
              <svg viewBox='0 0 120 120' class='w-32 h-32'>
                ${(() => {
                  const carbs = plan.macro_targets?.carbs_g || 0;
                  const protein = plan.macro_targets?.protein_g || 0;
                  const fat = plan.macro_targets?.fat_g || 0;
                  const total = carbs + protein + fat;
                  if (total === 0) return '';
                  
                  const carbPct = (carbs / total) * 100;
                  const proteinPct = (protein / total) * 100;
                  const fatPct = (fat / total) * 100;
                  
                  let cumulativeAngle = 0;
                  const radius = 50;
                  const cx = 60, cy = 60;
                  
                  const createSlice = (percent, color, startAngle) => {
                    if (percent === 0) return '';
                    const angle = (percent / 100) * 360;
                    const endAngle = startAngle + angle;
                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;
                    const x1 = cx + radius * Math.cos(startRad);
                    const y1 = cy + radius * Math.sin(startRad);
                    const x2 = cx + radius * Math.cos(endRad);
                    const y2 = cy + radius * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;
                    return `<path d='M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z' fill='${color}' stroke='white' stroke-width='2'/>`;
                  };
                  
                  const carbSlice = createSlice(carbPct, '#F59E0B', cumulativeAngle);
                  cumulativeAngle += (carbPct / 100) * 360;
                  const proteinSlice = createSlice(proteinPct, '#059669', cumulativeAngle);
                  cumulativeAngle += (proteinPct / 100) * 360;
                  const fatSlice = createSlice(fatPct, '#DC2626', cumulativeAngle);
                  
                  return carbSlice + proteinSlice + fatSlice;
                })()}
                <circle cx='60' cy='60' r='25' fill='white' class='dark:fill-gray-800'/>
                <text x='60' y='58' text-anchor='middle' class='text-xs font-bold fill-primary'>${plan.target_calories}</text>
                <text x='60' y='68' text-anchor='middle' class='text-[8px] fill-gray-600'>kcal</text>
              </svg>
            </div>
            <div class='space-y-2 text-xs'>
              <div class='flex items-center justify-between'>
                <div class='flex items-center gap-2'>
                  <div class='w-3 h-3 rounded-full bg-amber-500'></div>
                  <span class='font-medium'>Carbs</span>
                </div>
                <span class='font-semibold text-ayur-earth'>${plan.macro_targets?.carbs_g || 0}g</span>
              </div>
              <div class='flex items-center justify-between'>
                <div class='flex items-center gap-2'>
                  <div class='w-3 h-3 rounded-full bg-green-600'></div>
                  <span class='font-medium'>Protein</span>
                </div>
                <span class='font-semibold text-ayur-earth'>${plan.macro_targets?.protein_g || 0}g</span>
              </div>
              <div class='flex items-center justify-between'>
                <div class='flex items-center gap-2'>
                  <div class='w-3 h-3 rounded-full bg-red-600'></div>
                  <span class='font-medium'>Fat</span>
                </div>
                <span class='font-semibold text-ayur-earth'>${plan.macro_targets?.fat_g || 0}g</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class='space-y-4 mb-6'>
          ${plan.meals.map((meal, idx) => `
            <div class='glass-effect rounded-xl p-5 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-300 animate-fade-in' style='animation-delay: ${idx * 100}ms'>
              <div class='flex items-center gap-3 mb-3 pb-3 border-b border-border-light dark:border-border-dark'>
                <span class='text-3xl'>${mealIcons[meal.meal_type.toLowerCase()] || '🍽️'}</span>
                <div class='flex-1'>
                  <h4 class='font-bold text-lg capitalize'>${meal.meal_type}</h4>
                  <p class='text-xs text-gray-600 dark:text-gray-400'>${meal.total_calories} kcal</p>
                </div>
                <div class='px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold'>
                  ${meal.items.length} items
                </div>
              </div>
              <ul class='space-y-3'>
                ${meal.items.map(item => `
                  <li class='p-3 rounded-lg border border-border-light dark:border-border-dark bg-white/50 dark:bg-white/5'>
                    <div class='flex items-start justify-between gap-3'>
                      <div class='flex-1'>
                        <div class='font-semibold text-sm'>${item.name} <span class='text-xs font-normal text-gray-600 dark:text-gray-400'>(${item.portion})</span></div>
                        ${item.why ? `<div class='text-xs text-ayur-earth mt-1'>${item.why}</div>` : ''}
                      </div>
                      <div class='text-right text-xs text-gray-600 dark:text-gray-400'>
                        <div>${Math.round(item.macros?.calories || 0)} kcal</div>
                        <div>${Math.round(item.macros?.carbs || 0)}C • ${Math.round(item.macros?.protein || 0)}P • ${Math.round(item.macros?.fat || 0)}F</div>
                      </div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class='flex gap-3'>
          <button id='backToPlanForm' class='flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300'>
            ← Generate Another
          </button>
          <button id='regeneratePlan' class='flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all duration-300'>
            🔄 Regenerate
          </button>
          <button id='downloadPlan' class='flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300'>
            📄 Download PDF
          </button>
        </div>
      </div>
    `;
    resultDiv.classList.remove('hidden');
    
    document.getElementById('backToPlanForm').addEventListener('click', () => {
      location.reload(); // Simple reset
    });
    document.getElementById('regeneratePlan').addEventListener('click', async () => {
      // Simple regenerate: show spinner and call again
      resultDiv.innerHTML = `
        <div class='flex flex-col items-center justify-center py-12 space-y-4'>
          <div class='relative'>
            <div class='w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin'></div>
            <div class='absolute inset-0 flex items-center justify-center text-3xl animate-pulse-soft'>✨</div>
          </div>
          <div class='text-center'>
            <p class='text-lg font-semibold text-primary mb-2'>Regenerating Plan</p>
            <p class='text-sm text-gray-600 dark:text-gray-400'>Re-evaluating foods and balancing doshas...</p>
          </div>
        </div>`;
      const newPlan = await AyurAPI.generatePlan({ profile, plan_type: 'daily' });
      // naive rerender by resetting variables then triggering the same code path
      plan.meals = newPlan.meals; plan.total_calories = newPlan.total_calories; plan.target_calories = newPlan.target_calories; plan.season = newPlan.season; plan.macro_targets = newPlan.macro_targets; 
      // trigger click again to rebuild UI
      document.getElementById('backToPlanForm').click();
      setTimeout(() => document.getElementById('generatePlanBtn').click(), 50);
    });
    document.getElementById('downloadPlan').addEventListener('click', () => {
      generateProfessionalPDF(plan, profile);
    });
    
    log(`Plan generated: ${plan.total_calories} kcal, ${plan.meals.length} meals`);
  } catch (error) {
    document.getElementById('planForm').innerHTML = `
      <div class='glass-effect rounded-xl p-6 border-2 border-red-200 dark:border-red-800 animate-fade-in'>
        <div class='text-center mb-4'>
          <div class='inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-3xl mb-3'>❌</div>
          <h3 class='text-xl font-bold text-red-600 dark:text-red-400 mb-2'>Plan Generation Failed</h3>
          <p class='text-sm text-gray-600 dark:text-gray-400'>${error.message}</p>
        </div>
        
        <div class='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800'>
          <p class='font-semibold text-sm mb-3 flex items-center gap-2'>
            <span>💡</span>
            <span>Troubleshooting Steps:</span>
          </p>
          <ol class='space-y-2 text-sm text-gray-700 dark:text-gray-300'>
            <li class='flex items-start gap-2'>
              <span class='font-semibold'>1.</span>
              <span>Ensure backend is running: <code class='bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs'>cd backend && npm run dev</code></span>
            </li>
            <li class='flex items-start gap-2'>
              <span class='font-semibold'>2.</span>
              <span>Backend should be accessible at: <code class='bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs'>http://localhost:3000</code></span>
            </li>
            <li class='flex items-start gap-2'>
              <span class='font-semibold'>3.</span>
              <span>Check the terminal for error messages</span>
            </li>
            <li class='flex items-start gap-2'>
              <span class='font-semibold'>4.</span>
              <span>Try the health check button on the homepage</span>
            </li>
          </ol>
        </div>
        
        <button onclick='location.reload()' class='w-full mt-4 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300'>
          🔄 Try Again
        </button>
      </div>
    `;
    showNotification('Failed to generate plan', 'error');
    log('Plan generation failed: ' + error.message, 'error');
  }
});

// 3. MY PLANS
document.getElementById('btnMyPlans').addEventListener('click', async () => {
  myPlansModal.classList.remove('hidden');
  const container = document.getElementById('plansListContent');
  
  container.innerHTML = `
    <div class='flex items-center justify-center py-12'>
      <div class='animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full'></div>
    </div>
  `;
  
  try {
    const { plans } = await AyurAPI.listPlans();
    if (!plans || plans.length === 0) {
      container.innerHTML = `
        <div class='text-center py-12'>
          <div class='text-6xl mb-4'>📝</div>
          <p class='text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2'>No Plans Yet</p>
          <p class='text-sm text-gray-500 dark:text-gray-500 mb-4'>Create your first personalized diet plan to get started!</p>
          <button onclick='document.getElementById("myPlansModal").classList.add("hidden"); document.getElementById("btnGeneratePlan").click()' class='px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300'>
            ✨ Generate Your First Plan
          </button>
        </div>
      `;
    } else {
      container.innerHTML = plans.map((plan, idx) => `
        <div class='glass-effect rounded-xl p-5 border border-border-light dark:border-border-dark hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in' style='animation-delay: ${idx * 50}ms'>
          <div class='flex items-center justify-between mb-3'>
            <div class='flex items-center gap-3'>
              <div class='w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold'>
                ${idx + 1}
              </div>
              <div>
                <h4 class='font-bold text-base'>${new Date(plan.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                <p class='text-xs text-gray-500 dark:text-gray-400'>${new Date(plan.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div class='text-right'>
              <div class='text-xl font-bold text-primary'>${plan.total_calories}</div>
              <div class='text-xs text-gray-500 dark:text-gray-400'>calories</div>
            </div>
          </div>
          <div class='flex items-center gap-4 text-sm'>
            <div class='flex items-center gap-2'>
              <span class='text-lg'>🧘</span>
              <span class='font-medium'>${plan.dosha_target}</span>
            </div>
            <div class='flex items-center gap-2'>
              <span class='text-lg'>🍽️</span>
              <span>${plan.meals?.length || 0} meals</span>
            </div>
            <div class='flex-1'></div>
            <button class='px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-all duration-200'>
              View Details
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    container.innerHTML = `
      <div class='text-center py-12'>
        <div class='text-6xl mb-4'></div>
        <p class='text-lg font-semibold text-red-600 dark:text-red-400 mb-2'>No plans added yet</p>
        <p class='text-sm text-gray-500 dark:text-gray-400'>${error.message}</p>
      </div>
    `;
  }
});

// 4. EXPLORE HERBS - Enhanced with Load More and Full Search
let currentPage = 1;
let currentQuery = '';
let allLoadedItems = [];
let isLoading = false;
let hasMore = true;

document.getElementById('btnExploreHerbs').addEventListener('click', async () => {
  herbsModal.classList.remove('hidden');
  const searchInput = document.getElementById('herbSearch');
  const resultsDiv = document.getElementById('herbsResults');
  
  // Reset state when modal opens
  currentPage = 1;
  currentQuery = '';
  allLoadedItems = [];
  hasMore = true;
  
  async function loadFoods(query = '', page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;
    
    if (!append) {
      resultsDiv.innerHTML = `
        <div class='flex items-center justify-center py-12'>
          <div class='animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full'></div>
        </div>
      `;
    } else {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loadingMore';
      loadingDiv.className = 'flex items-center justify-center py-6';
      loadingDiv.innerHTML = `
        <div class='animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full'></div>
      `;
      resultsDiv.appendChild(loadingDiv);
    }
    
    try {
      const { items } = await AyurAPI.listFoods(query, page, 30);
      
      if (!append) {
        allLoadedItems = items;
      } else {
        allLoadedItems = [...allLoadedItems, ...items];
        document.getElementById('loadingMore')?.remove();
      }
      
      hasMore = items.length === 30;
      
      if (allLoadedItems.length === 0) {
        resultsDiv.innerHTML = `
          <div class='text-center py-12'>
            <div class='text-6xl mb-4'>🔍</div>
            <p class='text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2'>No Results Found</p>
            <p class='text-sm text-gray-500 dark:text-gray-500'>Try searching with different keywords</p>
          </div>
        `;
      } else {
        const foodsHTML = allLoadedItems.map((food, idx) => `
          <div class='glass-effect rounded-xl p-4 border border-border-light dark:border-border-dark hover:shadow-lg transition-all duration-300 animate-fade-in' style='animation-delay: ${(idx % 30) * 20}ms'>
            <div class='flex items-start gap-3'>
              <div class='w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl flex-shrink-0'>
                🌿
              </div>
              <div class='flex-1'>
                <h4 class='font-bold text-base mb-2'>${food.name}</h4>
                <div class='grid grid-cols-2 gap-2 text-xs'>
                  <div class='flex items-center gap-1'>
                    <span class='text-base'>🧘</span>
                    <span class='text-gray-700 dark:text-gray-300'><strong>Dosha:</strong> ${food.dosha_impact || 'Neutral'}</span>
                  </div>
                  <div class='flex items-center gap-1'>
                    <span class='text-base'>🔥</span>
                    <span class='text-gray-700 dark:text-gray-300'><strong>Energy:</strong> ${food.energy || 'Balanced'}</span>
                  </div>
                  <div class='flex items-center gap-1'>
                    <span class='text-base'>👅</span>
                    <span class='text-gray-700 dark:text-gray-300'><strong>Tastes:</strong> ${food.tastes || 'Various'}</span>
                  </div>
                  <div class='flex items-center gap-1'>
                    <span class='text-base'>⚡</span>
                    <span class='text-gray-700 dark:text-gray-300'><strong>Calories:</strong> ${food.calories_100g || 0}/100g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('');
        
        resultsDiv.innerHTML = foodsHTML;
        
        if (hasMore) {
          const loadMoreBtn = document.createElement('div');
          loadMoreBtn.className = 'flex justify-center pt-4';
          loadMoreBtn.innerHTML = `
            <button id='loadMoreBtn' class='px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center gap-2'>
              <span>📦</span>
              <span>Load More Foods</span>
              <span class='text-xs opacity-80'>(${allLoadedItems.length} of many)</span>
            </button>
          `;
          resultsDiv.appendChild(loadMoreBtn);
          
          document.getElementById('loadMoreBtn').addEventListener('click', () => {
            currentPage++;
            loadFoods(currentQuery, currentPage, true);
          });
        } else if (allLoadedItems.length > 0) {
          const endMsg = document.createElement('div');
          endMsg.className = 'text-center py-4';
          endMsg.innerHTML = `
            <p class='text-sm text-gray-500 dark:text-gray-400'>
              ✅ All ${allLoadedItems.length} items loaded
            </p>
          `;
          resultsDiv.appendChild(endMsg);
        }
      }
    } catch (error) {
      resultsDiv.innerHTML = `
        <div class='text-center py-12'>
          <div class='text-6xl mb-4'>⚠️</div>
          <p class='text-lg font-semibold text-red-600 dark:text-red-400 mb-2'>Error Loading Foods</p>
          <p class='text-sm text-gray-500 dark:text-gray-400'>${error.message}</p>
        </div>
      `;
    } finally {
      isLoading = false;
    }
  }
  
  loadFoods();
  
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentQuery = e.target.value;
      currentPage = 1;
      allLoadedItems = [];
      hasMore = true;
      loadFoods(currentQuery, 1, false);
    }, 300);
  });
  
  log('Opened Explore Herbs');
});

// 5. LEARN AYURVEDA
document.getElementById('btnLearnAyurveda').addEventListener('click', () => {
  learnModal.classList.remove('hidden');
});

// Header Learn Ayurveda link
document.getElementById('headerLearnAyurveda').addEventListener('click', () => {
  learnModal.classList.remove('hidden');
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;
const darkModeIcon = darkModeToggle.querySelector('.dark-mode-icon');

// Check for saved dark mode preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  htmlElement.classList.add('dark');
  darkModeIcon.textContent = 'dark_mode';
} else {
  htmlElement.classList.remove('dark');
  darkModeIcon.textContent = 'light_mode';
}

// Toggle dark mode on button click
darkModeToggle.addEventListener('click', () => {
  htmlElement.classList.toggle('dark');
  
  if (htmlElement.classList.contains('dark')) {
    darkModeIcon.textContent = 'dark_mode';
    localStorage.setItem('theme', 'dark');
    showNotification('Dark mode enabled', 'info');
  } else {
    darkModeIcon.textContent = 'light_mode';
    localStorage.setItem('theme', 'light');
    showNotification('Light mode enabled', 'info');
  }
});

// 6. COMMUNITY FORUM
document.getElementById('btnViewAllDiscussions').addEventListener('click', () => {
  communityModal.classList.remove('hidden');
  renderForumList();
});

document.getElementById('btnStartDiscussion').addEventListener('click', () => {
  if (!currentUser) {
    showLoginPrompt();
  } else {
    communityModal.classList.remove('hidden');
    renderForumList();
    setTimeout(() => showNewDiscussionForm(), 100);
  }
});

document.getElementById('btnConnectExpert').addEventListener('click', () => {
  doctorModal.classList.remove('hidden');
});

// 7. DOCTOR CONSULTATION (FAB)
document.getElementById('fabDoctor').addEventListener('click', () => {
  doctorModal.classList.remove('hidden');
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointmentDate').setAttribute('min', today);
  log('Opened Doctor Consultation');
});

document.getElementById('bookAppointmentBtn').addEventListener('click', () => {
  // Get form values
  const consultationType = document.querySelector('input[name="consultationType"]:checked').value;
  const specialization = document.getElementById('doctorSpecialization').value;
  const name = document.getElementById('patientName').value.trim();
  const phone = document.getElementById('patientPhone').value.trim();
  const email = document.getElementById('patientEmail').value.trim();
  const age = document.getElementById('patientAge').value;
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('appointmentTime').value;
  const complaints = document.getElementById('patientComplaints').value.trim();
  
  // Validation
  if (!name || !phone || !email || !date || !time) {
    showNotification('Please fill in all required fields (*)', 'warning');
    return;
  }
  
  if (!specialization) {
    showNotification('Please select a specialization', 'warning');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address', 'warning');
    return;
  }
  
  // Show loading state
  const formDiv = document.getElementById('appointmentForm');
  formDiv.innerHTML = `
    <div class='flex flex-col items-center justify-center py-12 space-y-4'>
      <div class='relative'>
        <div class='w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin'></div>
        <div class='absolute inset-0 flex items-center justify-center text-3xl animate-pulse-soft'>📅</div>
      </div>
      <div class='text-center'>
        <p class='text-lg font-semibold text-primary mb-2'>Booking Your Appointment</p>
        <p class='text-sm text-gray-600 dark:text-gray-400'>Please wait while we process your request...</p>
      </div>
    </div>
  `;
  
  // Simulate API call (replace with actual backend call)
  setTimeout(() => {
    const appointmentData = {
      id: 'APT' + Date.now(),
      consultationType,
      specialization,
      patientName: name,
      patientPhone: phone,
      patientEmail: email,
      patientAge: age || 'Not specified',
      appointmentDate: date,
      appointmentTime: time,
      complaints: complaints || 'General consultation',
      status: 'pending',
      bookedAt: new Date().toISOString()
    };
    
    // Store in localStorage (in production, send to backend)
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointmentData);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Show confirmation
    formDiv.classList.add('hidden');
    const confirmDiv = document.getElementById('appointmentConfirmation');
    confirmDiv.innerHTML = `
      <div class='animate-fade-in'>
        <div class='text-center mb-6'>
          <div class='inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-4xl mb-4 animate-pulse-soft'>✅</div>
          <h3 class='text-2xl font-bold text-green-600 dark:text-green-400 mb-2'>Appointment Booked Successfully!</h3>
          <p class='text-sm text-gray-600 dark:text-gray-400'>Your consultation has been scheduled</p>
        </div>
        
        <div class='glass-effect rounded-xl p-6 border border-primary/20 mb-6'>
          <div class='space-y-3 text-sm'>
            <div class='flex justify-between items-center pb-3 border-b border-border-light dark:border-border-dark'>
              <span class='font-semibold text-gray-700 dark:text-gray-300'>Appointment ID:</span>
              <span class='font-mono text-primary font-bold'>${appointmentData.id}</span>
            </div>
            <div class='flex justify-between items-center'>
              <span class='text-gray-600 dark:text-gray-400'>Patient Name:</span>
              <span class='font-medium'>${name}</span>
            </div>
            <div class='flex justify-between items-center'>
              <span class='text-gray-600 dark:text-gray-400'>Consultation Type:</span>
              <span class='font-medium capitalize'>${consultationType === 'online' ? '💻 Online Video Call' : '🏥 In-Person Visit'}</span>
            </div>
            <div class='flex justify-between items-center'>
              <span class='text-gray-600 dark:text-gray-400'>Specialization:</span>
              <span class='font-medium'>${document.getElementById('doctorSpecialization').selectedOptions[0].text}</span>
            </div>
            <div class='flex justify-between items-center'>
              <span class='text-gray-600 dark:text-gray-400'>Date & Time:</span>
              <span class='font-medium'>${new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${time}</span>
            </div>
            <div class='flex justify-between items-center'>
              <span class='text-gray-600 dark:text-gray-400'>Contact:</span>
              <span class='font-medium text-xs'>${email}</span>
            </div>
          </div>
        </div>
        
        <div class='bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800 mb-6'>
          <h4 class='font-semibold text-base mb-3 flex items-center gap-2 text-green-700 dark:text-green-400'>
            <span class='text-xl'>📧</span>
            Next Steps
          </h4>
          <ul class='space-y-2 text-sm text-gray-700 dark:text-gray-300'>
            <li class='flex items-start gap-2'>
              <span class='text-green-600 dark:text-green-400'>✓</span>
              <span>Confirmation email sent to <strong>${email}</strong></span>
            </li>
            <li class='flex items-start gap-2'>
              <span class='text-green-600 dark:text-green-400'>✓</span>
              <span>SMS notification sent to <strong>${phone}</strong></span>
            </li>
            <li class='flex items-start gap-2'>
              <span class='text-green-600 dark:text-green-400'>✓</span>
              <span>Doctor will be assigned within 24 hours</span>
            </li>
            ${consultationType === 'online' ? `
              <li class='flex items-start gap-2'>
                <span class='text-green-600 dark:text-green-400'>✓</span>
                <span>Video call link will be sent 1 hour before appointment</span>
              </li>
            ` : `
              <li class='flex items-start gap-2'>
                <span class='text-green-600 dark:text-green-400'>✓</span>
                <span>Clinic address will be sent in confirmation email</span>
              </li>
            `}
          </ul>
        </div>
        
        <div class='grid grid-cols-2 gap-3'>
          <button onclick='window.print()' class='px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2'>
            <span>🖨️</span>
            <span>Print</span>
          </button>
          <button onclick='document.getElementById("doctorModal").classList.add("hidden")' class='px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300'>
            Done
          </button>
        </div>
      </div>
    `;
    confirmDiv.classList.remove('hidden');
    
    showNotification('Appointment booked successfully! Check your email for confirmation.', 'success');
    log(`Appointment booked: ${appointmentData.id} for ${date} at ${time}`);
  }, 2000);
});

// Advisory handlers
document.getElementById('btnAdvisory').addEventListener('click', () => {
  const storedProfile = JSON.parse(localStorage.getItem('profile') || '{}');
  openAdvisory(storedProfile);
  log('Opened advisory modal');
});

document.getElementById('refreshAdvisory').addEventListener('click', () => {
  const storedProfile = JSON.parse(localStorage.getItem('profile') || '{}');
  InferFlow.renderAdvisory(document.getElementById('advisoryContent'), storedProfile);
  log('Refreshed advisory');
});

// Profile quick-set helper for demo
window.setDemoProfile = (dosha, goals = []) => {
  const profile = {
    dosha_result: dosha,
    age_years: 30,
    health_goals: goals,
    activity_level: 'moderate'
  };
  localStorage.setItem('profile', JSON.stringify(profile));
  log(`Demo profile set: ${dosha} with goals ${goals.join(', ')}`);
  return profile;
};

// Show quick instructions
log('💡 Tip: Use setDemoProfile("Pitta", ["weight_loss"]) in console to test', 'info');

// Auto-test foods fetch
setTimeout(async () => {
  try {
    const foods = await AyurAPI.listFoods('rice');
    log(`Foods sample loaded (${foods.items?.length || foods.length})`);
  } catch (e) {
    log('Foods fetch failed: ' + e.message, 'error');
  }
}, 1500);


// ============================================
// AI Chat Functionality
// ============================================

// Configurable AI API base (override via localStorage 'aiApiBase')
const AI_API_BASE = (typeof localStorage !== 'undefined' && localStorage.getItem('aiApiBase')) || 'http://localhost:3001';

const chatModal = document.getElementById('chatModal');
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const fabChat = document.getElementById('fabChat');
const closeChatModal = document.getElementById('closeChatModal');

// Open chat modal
fabChat?.addEventListener('click', () => {
  chatModal.style.display = 'flex';
  chatInput.focus();
  console.log('💬 Opened AI chat modal');
});

// Close chat modal
closeChatModal?.addEventListener('click', () => {
  chatModal.style.display = 'none';
  console.log('💬 Closed AI chat modal');
});

// Close on outside click
chatModal?.addEventListener('click', (e) => {
  if (e.target === chatModal) {
    chatModal.style.display = 'none';
  }
});

// Auto-resize textarea
function autoResizeChatInput() {
  if (chatInput) {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }
}

chatInput?.addEventListener('input', autoResizeChatInput);

// Helper to get current time
function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Create message element
function createChatMessage(role = 'bot', text = '', isTyping = false) {
  const messageRow = document.createElement('div');
  messageRow.className = `message-row ${role === 'user' ? 'user' : ''}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? '🙂' : '🧠';
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  
  if (isTyping) {
    bubble.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  } else {
    bubble.innerHTML = `
      <div class="message-text">${escapeHtml(text)}</div>
      <div class="message-meta">
        <time class="ts">${getCurrentTime()}</time>
      </div>
    `;
  }
  
  messageRow.appendChild(avatar);
  messageRow.appendChild(bubble);
  
  return messageRow;
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Replace typing indicator with actual message
function replaceTypingWithMessage(typingElement, text) {
  const bubble = typingElement.querySelector('.message-bubble');
  bubble.innerHTML = `
    <div class="message-text">${escapeHtml(text)}</div>
    <div class="message-meta">
      <time class="ts">${getCurrentTime()}</time>
    </div>
  `;
}

// Handle chat form submission
async function handleChatSubmit(e) {
  console.log('🔍 Chat submit called', e);
  if (e) e.preventDefault();
  
  const message = chatInput?.value.trim();
  console.log('📝 Message:', message);
  console.log('🎯 Elements:', { chatInput, chatContainer, sendChatBtn });
  if (!message) {
    console.warn('⚠️ No message to send');
    return false;
  }
  
  // Lock UI
  if (sendChatBtn) sendChatBtn.disabled = true;
  if (chatInput) chatInput.disabled = true;
  
  // Remove welcome message if present
  const welcome = chatContainer?.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  
  // Add user message
  const userMsg = createChatMessage('user', message);
  chatContainer?.appendChild(userMsg);
  
  // Clear input
  if (chatInput) chatInput.value = '';
  autoResizeChatInput();
  
  // Scroll to bottom
  if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // Add typing indicator
  const typingMsg = createChatMessage('bot', '', true);
  chatContainer?.appendChild(typingMsg);
  if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  
  try {
    console.log('🌐 Sending to backend...');
    // Send to backend (AI API)
    const response = await fetch(`${AI_API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('💬 Bot reply:', data);
    const reply = data.reply || "Sorry, I couldn't get a response.";
    
    // Replace typing indicator with actual response
    replaceTypingWithMessage(typingMsg, reply);
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    
    console.log(`✅ Chat: User -> "${message.substring(0, 30)}...", Bot replied`);
  } catch (error) {
    console.error('❌ Chat error:', error);
    replaceTypingWithMessage(typingMsg, `❌ Sorry, there was an error connecting to the chat service at ${AI_API_BASE}. Make sure the AI API is running.`);
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  } finally {
    // Unlock UI
    if (sendChatBtn) sendChatBtn.disabled = false;
    if (chatInput) chatInput.disabled = false;
    if (chatInput) chatInput.focus();
  }
  
  return false; // Prevent form submission
}

// Bind submit listener and expose fallback handler for inline HTML
chatForm?.addEventListener('submit', handleChatSubmit);
window.chatSubmitHandler = handleChatSubmit;

// Handle Enter key (send) and Shift+Enter (new line)
chatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm?.dispatchEvent(new Event('submit'));
  }
});

console.log('💬 AI Chat initialized. Click the chat button to start!');

