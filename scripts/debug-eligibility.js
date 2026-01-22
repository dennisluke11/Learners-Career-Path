#!/usr/bin/env node

/**
 * Debug Eligibility Check
 * 
 * Tests eligibility with sample grades to see what's happening
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample grades matching user input
const sampleGrades = {
  'Math': 80,
  'English': 80,
  'LifeOrientation': 80,
  'CAT': 80
};

async function debugEligibility() {
  console.log('🔍 Debugging Eligibility Check\n');
  console.log('Sample Grades:');
  console.log(JSON.stringify(sampleGrades, null, 2));
  console.log();

  try {
    // Get a few careers
    const careers = ['IT Specialist', 'Software Engineer', 'Computer Scientist', 'Cybersecurity Analyst'];
    
    for (const careerName of careers) {
      console.log(`\n📋 Checking: ${careerName}`);
      const doc = await db.collection('careers').doc(careerName).get();
      
      if (!doc.exists) {
        console.log(`   ❌ Career not found`);
        continue;
      }

      const career = { id: doc.id, ...doc.data() };
      
      // Check qualificationLevels
      if (career.qualificationLevels && career.qualificationLevels.ZA) {
        const qualLevels = career.qualificationLevels.ZA;
        console.log(`   Qualification Levels: ${qualLevels.length}`);
        
        qualLevels.forEach((level, index) => {
          console.log(`\n   Level ${index + 1}: ${level.level} (NQF ${level.nqfLevel})`);
          console.log(`   Requirements:`);
          
          const requirements = level.minGrades || {};
          Object.entries(requirements).forEach(([subject, grade]) => {
            const userGrade = sampleGrades[subject] || 0;
            const match = userGrade >= grade ? '✅' : '❌';
            console.log(`      ${match} ${subject}: Required ${grade}%, User has ${userGrade}%`);
          });
        });
      } else {
        console.log(`   ⚠️  No qualificationLevels[ZA] found`);
      }

      // Check what getCareersForCountry would return
      if (career.qualificationLevels && career.qualificationLevels.ZA && career.qualificationLevels.ZA.length > 0) {
        const firstLevel = career.qualificationLevels.ZA[0];
        const requirements = firstLevel.minGrades || {};
        console.log(`\n   Extracted Requirements (for eligibility check):`);
        console.log(JSON.stringify(requirements, null, 2));
        
        // Check each requirement
        let metCount = 0;
        let totalCount = 0;
        Object.entries(requirements).forEach(([subject, required]) => {
          totalCount++;
          const userGrade = sampleGrades[subject] || 0;
          if (userGrade >= required) {
            metCount++;
            console.log(`      ✅ ${subject}: ${userGrade}% >= ${required}%`);
          } else {
            console.log(`      ❌ ${subject}: ${userGrade}% < ${required}% (missing ${required - userGrade}%)`);
          }
        });
        
        console.log(`\n   Result: ${metCount}/${totalCount} requirements met`);
        if (metCount === totalCount && totalCount > 0) {
          console.log(`   Status: ✅ QUALIFIED`);
        } else if (metCount > 0) {
          console.log(`   Status: ⚠️  CLOSE or NEEDS IMPROVEMENT`);
        } else {
          console.log(`   Status: ❌ NOT QUALIFIED`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugEligibility()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });


