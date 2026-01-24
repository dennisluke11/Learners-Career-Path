#!/usr/bin/env node

/**
 * Update Career Baselines in Firestore with Research-Based Values
 * 
 * This script updates career baselines for all 6 countries based on
 * real-world university admission requirements.
 * 
 * Based on research:
 * - South Africa: APS system, Level 6 (70%+) for competitive programs
 * - Kenya: C+ mean grade, B+ for competitive programs
 * - Nigeria: 5 Credits (C6), B3 for competitive programs
 * - Zimbabwe: O-Level C, A-Level points system
 * - Ethiopia: Annual cut-off points (varies)
 * - Egypt: Percentage-based, 90%+ for Medicine/Engineering
 * 
 * Usage:
 * node scripts/update-baselines-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Research-based baseline updates for key careers
// These are more accurate based on real-world requirements
const BASELINE_UPDATES = {
  'Doctor': {
    'ZA': { Biology: 80, Chemistry: 80, Math: 75, Physics: 70 }, // APS Level 6+ for Medicine
    'KE': { Biology: 80, Chemistry: 80, Math: 75, Physics: 70 }, // B+ cluster for Medicine
    'NG': { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, // B3 for Medicine
    'ZW': { Biology: 80, Chemistry: 80, Math: 75, Physics: 70 }, // A-Level points
    'ET': { Biology: 80, Chemistry: 80, Math: 75, Physics: 70 }, // High cut-off
    'EG': { Biology: 90, Chemistry: 90, Math: 85, Physics: 85 }  // 90%+ for Medicine
  },
  'Engineer': {
    'ZA': { Math: 75, Physics: 75, Chemistry: 70, English: 60 }, // APS Level 6 for Engineering
    'KE': { Math: 75, Physics: 75, Chemistry: 70, English: 60 }, // B+ Math & Physics
    'NG': { Math: 70, Physics: 70, Chemistry: 65, English: 60 }, // B3 Math & Physics
    'ZW': { Math: 75, Physics: 75, Chemistry: 70, English: 60 },
    'ET': { Math: 75, Physics: 75, Chemistry: 70, English: 60 },
    'EG': { Math: 85, Physics: 85, Chemistry: 80, English: 70 }  // 85%+ for Engineering
  },
  'Software Engineer': {
    'ZA': { Math: 70, Physics: 65, English: 65, IT: 60 },
    'KE': { Math: 70, Physics: 65, English: 65, ComputerStudies: 60 },
    'NG': { Math: 70, Physics: 65, English: 65, DataProcessing: 60 },
    'ZW': { Math: 70, Physics: 65, English: 65, ComputerStudies: 60 },
    'ET': { Math: 70, Physics: 65, English: 65, IT: 60 },
    'EG': { Math: 80, Physics: 75, English: 75, IT: 70 }
  }
};

async function updateBaselines() {
  console.log('📊 Updating career baselines with research-based values...\n');
  
  const careersRef = db.collection('careers');
  const batch = db.batch();
  let updatedCount = 0;
  
  for (const [careerName, baselines] of Object.entries(BASELINE_UPDATES)) {
    const docRef = careersRef.doc(careerName);
    
    try {
      const doc = await docRef.get();
      if (doc.exists) {
        const currentData = doc.data();
        const currentBaselines = currentData.countryBaselines || {};
        
        // Merge new baselines with existing
        const updatedBaselines = {
          ...currentBaselines,
          ...baselines
        };
        
        batch.update(docRef, {
          countryBaselines: updatedBaselines
        });
        
        console.log(`  ✓ ${careerName}:`);
        for (const [country, values] of Object.entries(baselines)) {
          const countryNames = {
            'ZA': 'South Africa',
            'KE': 'Kenya',
            'NG': 'Nigeria',
            'ZW': 'Zimbabwe',
            'ET': 'Ethiopia',
            'EG': 'Egypt'
          };
          console.log(`    - ${countryNames[country]} (${country}): ${Object.keys(values).join(', ')}`);
        }
        updatedCount++;
      } else {
        console.log(`  ⚠️  ${careerName}: Document not found, skipping`);
      }
    } catch (error) {
      console.error(`  ❌ ${careerName}: Error - ${error.message}`);
    }
  }
  
  if (updatedCount > 0) {
    await batch.commit();
    console.log(`\n✅ Successfully updated ${updatedCount} careers with research-based baselines!`);
    console.log('\n📝 Note: These are sample updates for key careers.');
    console.log('   All other careers can be updated manually in Firestore Console.');
    console.log('   Or extend this script to update all 53 careers.\n');
  } else {
    console.log('\n⚠️  No careers were updated. Check if documents exist in Firestore.\n');
  }
}

// Run the update
updateBaselines()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });







