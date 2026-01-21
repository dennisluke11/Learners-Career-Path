#!/usr/bin/env node

/**
 * Verify Lawyer and Judge Career Requirements in Firestore
 * 
 * This script checks the Lawyer and Judge careers in Firestore
 * and displays the requirements for all 6 countries.
 * 
 * Usage:
 * node scripts/verify-law-careers-firestore.js
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

const countryNames = {
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'ZW': 'Zimbabwe',
  'ET': 'Ethiopia',
  'EG': 'Egypt'
};

const expectedRequirements = {
  'Lawyer': {
    'ZA': { English: 80, History: 75, Math: 65, Afrikaans: 60 },
    'KE': { English: 75, History: 70, Math: 60, Kiswahili: 55 },
    'NG': { English: 75, History: 70, Math: 60, Literature: 55 },
    'ZW': { English: 75, History: 70, Math: 60, Geography: 55 },
    'ET': { English: 75, History: 70, Math: 60, Amharic: 55 },
    'EG': { English: 85, History: 80, Math: 70, Arabic: 70 }
  },
  'Judge': {
    'ZA': { English: 85, History: 80, Math: 70, Afrikaans: 65 },
    'KE': { English: 80, History: 75, Math: 65, Kiswahili: 60 },
    'NG': { English: 80, History: 75, Math: 65, Literature: 60 },
    'ZW': { English: 80, History: 75, Math: 65, Geography: 60 },
    'ET': { English: 80, History: 75, Math: 65, Amharic: 60 },
    'EG': { English: 90, History: 85, Math: 75, Arabic: 75 }
  }
};

async function verifyLawCareers() {
  console.log('🔍 Verifying Lawyer and Judge careers in Firestore...\n');
  
  const careersRef = db.collection('careers');
  const careersToCheck = ['Lawyer', 'Judge'];
  
  let allCorrect = true;
  
  for (const careerName of careersToCheck) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${careerName}`);
    console.log('='.repeat(60));
    
    try {
      const doc = await careersRef.doc(careerName).get();
      
      if (!doc.exists) {
        console.log(`  ❌ Document not found in Firestore`);
        allCorrect = false;
        continue;
      }
      
      const data = doc.data();
      const countryBaselines = data.countryBaselines || {};
      const expected = expectedRequirements[careerName];
      
      if (!expected) {
        console.log(`  ⚠️  No expected requirements defined for ${careerName}`);
        continue;
      }
      
      // Check each country
      for (const countryCode of ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG']) {
        const countryName = countryNames[countryCode];
        const actual = countryBaselines[countryCode] || {};
        const expectedForCountry = expected[countryCode] || {};
        
        console.log(`\n  🌍 ${countryName} (${countryCode}):`);
        
        if (Object.keys(actual).length === 0) {
          console.log(`     ❌ No requirements found`);
          allCorrect = false;
          continue;
        }
        
        // Check each subject
        let countryCorrect = true;
        for (const [subject, expectedGrade] of Object.entries(expectedForCountry)) {
          const actualGrade = actual[subject];
          
          if (actualGrade === undefined) {
            console.log(`     ⚠️  ${subject}: Missing (expected ${expectedGrade}%)`);
            countryCorrect = false;
          } else if (actualGrade === expectedGrade) {
            console.log(`     ✅ ${subject}: ${actualGrade}%`);
          } else {
            console.log(`     ❌ ${subject}: ${actualGrade}% (expected ${expectedGrade}%)`);
            countryCorrect = false;
          }
        }
        
        // Check for unexpected subjects
        for (const subject of Object.keys(actual)) {
          if (!expectedForCountry[subject]) {
            console.log(`     ⚠️  ${subject}: ${actual[subject]}% (not in expected requirements)`);
          }
        }
        
        if (!countryCorrect) {
          allCorrect = false;
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error reading ${careerName}: ${error.message}`);
      allCorrect = false;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  if (allCorrect) {
    console.log('✅ All requirements are correct!');
  } else {
    console.log('⚠️  Some requirements need updating.');
    console.log('   Run: node scripts/update-law-careers-firestore.js');
  }
  console.log('='.repeat(60));
  console.log('');
}

// Run the verification
verifyLawCareers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });



