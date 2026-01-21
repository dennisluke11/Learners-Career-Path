#!/usr/bin/env node

/**
 * Update Lawyer and Judge Career Baselines in Firestore
 * 
 * This script updates Lawyer and Judge careers with corrected
 * language requirements for all 6 countries.
 * 
 * Fixes:
 * - South Africa: Kiswahili → Afrikaans (correct language)
 * - Kenya: French → Kiswahili (correct language)
 * - Nigeria: Afrikaans → Literature (correct subject)
 * - Zimbabwe: Arabic → Geography (correct subject)
 * - Ethiopia: French → Amharic (correct language)
 * - Egypt: Generic Language → Arabic (correct language)
 * 
 * Usage:
 * node scripts/update-law-careers-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  console.error('   Please create this file with your Firebase service account credentials.');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Corrected baseline updates for Lawyer and Judge
const LAW_CAREER_UPDATES = {
  'Lawyer': {
    'ZA': { English: 80, History: 75, Math: 65, Afrikaans: 60 }, // South Africa - Afrikaans
    'KE': { English: 75, History: 70, Math: 60, Kiswahili: 55 }, // Kenya - Kiswahili
    'NG': { English: 75, History: 70, Math: 60, Literature: 55 }, // Nigeria - Literature
    'ZW': { English: 75, History: 70, Math: 60, Geography: 55 }, // Zimbabwe - Geography
    'ET': { English: 75, History: 70, Math: 60, Amharic: 55 }, // Ethiopia - Amharic
    'EG': { English: 85, History: 80, Math: 70, Arabic: 70 }  // Egypt - Arabic
  },
  'Judge': {
    'ZA': { English: 85, History: 80, Math: 70, Afrikaans: 65 }, // South Africa - Afrikaans
    'KE': { English: 80, History: 75, Math: 65, Kiswahili: 60 }, // Kenya - Kiswahili
    'NG': { English: 80, History: 75, Math: 65, Literature: 60 }, // Nigeria - Literature
    'ZW': { English: 80, History: 75, Math: 65, Geography: 60 }, // Zimbabwe - Geography
    'ET': { English: 80, History: 75, Math: 65, Amharic: 60 }, // Ethiopia - Amharic
    'EG': { English: 90, History: 85, Math: 75, Arabic: 75 }  // Egypt - Arabic
  }
};

const countryNames = {
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'ZW': 'Zimbabwe',
  'ET': 'Ethiopia',
  'EG': 'Egypt'
};

async function updateLawCareers() {
  console.log('⚖️  Updating Lawyer and Judge careers with corrected language requirements...\n');
  
  const careersRef = db.collection('careers');
  const batch = db.batch();
  let updatedCount = 0;
  
  for (const [careerName, baselines] of Object.entries(LAW_CAREER_UPDATES)) {
    const docRef = careersRef.doc(careerName);
    
    try {
      const doc = await docRef.get();
      if (doc.exists) {
        const currentData = doc.data();
        const currentBaselines = currentData.countryBaselines || {};
        
        // Update each country's baseline
        const updatedBaselines = {
          ...currentBaselines
        };
        
        for (const [country, values] of Object.entries(baselines)) {
          updatedBaselines[country] = values;
        }
        
        batch.update(docRef, {
          countryBaselines: updatedBaselines
        });
        
        console.log(`  ✓ ${careerName}:`);
        for (const [country, values] of Object.entries(baselines)) {
          const subjects = Object.entries(values)
            .map(([subject, grade]) => `${subject}: ${grade}%`)
            .join(', ');
          console.log(`    - ${countryNames[country]} (${country}): ${subjects}`);
        }
        updatedCount++;
      } else {
        console.log(`  ⚠️  ${careerName}: Document not found in Firestore`);
        console.log(`      This career may need to be created first.`);
      }
    } catch (error) {
      console.error(`  ❌ ${careerName}: Error - ${error.message}`);
    }
  }
  
  if (updatedCount > 0) {
    await batch.commit();
    console.log(`\n✅ Successfully updated ${updatedCount} careers in Firestore!`);
    console.log('\n📋 Summary of fixes:');
    console.log('  • South Africa: Kiswahili → Afrikaans ✅');
    console.log('  • Kenya: French → Kiswahili ✅');
    console.log('  • Nigeria: Afrikaans → Literature ✅');
    console.log('  • Zimbabwe: Arabic → Geography ✅');
    console.log('  • Ethiopia: French → Amharic ✅');
    console.log('  • Egypt: Generic Language → Arabic ✅');
    console.log('\n✨ All 6 countries now have correct, curriculum-appropriate requirements!\n');
  } else {
    console.log('\n⚠️  No careers were updated.');
    console.log('   Check if Lawyer and Judge documents exist in Firestore.\n');
  }
}

// Run the update
updateLawCareers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });




