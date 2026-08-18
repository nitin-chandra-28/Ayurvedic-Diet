/**
 * Advisory Engine Test
 */

import { generateAdvisory, generateQuickTip } from '../services/advisoryEngine.js';

const sampleProfile = {
  dosha_result: 'Pitta',
  age_years: 30,
  health_goals: ['weight_loss', 'energy'],
  activity_level: 'moderate'
};

const sampleContext = {
  hour: 14, // 2 PM
  month: 11 // November
};

console.log('Test 1: Generate Full Advisory');
console.log('================================\n');

try {
  const advisory = await generateAdvisory({ 
    profile: sampleProfile, 
    context: sampleContext 
  });
  
  console.log('✓ Advisory generated successfully\n');
  console.log('Metadata:');
  console.log(`  - Dosha Target: ${advisory.dosha_target}`);
  console.log(`  - Season: ${advisory.season}`);
  console.log(`  - Time Slot: ${advisory.timeSlot}`);
  console.log(`  - Timestamp: ${advisory.timestamp}\n`);
  
  console.log('Recommendations:');
  advisory.recommendations.forEach((rec, idx) => {
    console.log(`\n  ${idx + 1}. ${rec.icon} ${rec.category} [${rec.priority}]`);
    console.log(`     ${rec.message}`);
  });
  
  console.log('\n✓ Test 1 PASSED\n');
} catch (error) {
  console.error('✗ Test 1 FAILED:', error.message);
  process.exit(1);
}

console.log('Test 2: Quick Tip Generation');
console.log('================================\n');

try {
  const tip = generateQuickTip('Vata');
  
  console.log('✓ Quick tip generated');
  console.log(`  - Dosha: ${tip.dosha}`);
  console.log(`  - Tip: ${tip.tip}`);
  console.log(`  - Wisdom: ${tip.wisdom}\n`);
  
  console.log('✓ Test 2 PASSED\n');
} catch (error) {
  console.error('✗ Test 2 FAILED:', error.message);
  process.exit(1);
}

console.log('ALL TESTS PASSED ✓');
