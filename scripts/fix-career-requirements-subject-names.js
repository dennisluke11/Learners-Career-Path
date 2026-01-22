#!/usr/bin/env node

/**
 * Fix Career Requirements Subject Names
 * 
 * Updates all career requirements to use standard subject names
 * instead of display names for better matching with grades.
 * 
 * Usage:
 *   node scripts/fix-career-requirements-subject-names.js
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

// Mapping from display names to standard names
const SUBJECT_NAME_MAP = {
  'Mathematics': 'Math',
  'Maths': 'Math',
  'Mathematical Literacy': 'MathLiteracy',
  'Math Literacy': 'MathLiteracy',
  'English Home Language': 'English',
  'English (Home Language)': 'English',
  'English HL': 'English',
  'English First Additional Language': 'EnglishFAL',
  'English (First Additional Language)': 'EnglishFAL',
  'English FAL': 'EnglishFAL',
  'Life Orientation': 'LifeOrientation',
  'Physical Sciences': 'Physics',
  'Physical Science': 'Physics',
  'Life Sciences': 'Biology',
  'Life Science': 'Biology',
  'Computer Applications Technology': 'CAT',
  'Computer Applications Tech': 'CAT',
  'Information Technology': 'IT',
  'Computer': 'IT',
  'Computers': 'IT'
};

/**
 * Normalize subject names in requirements object
 */
function normalizeRequirements(requirements) {
  if (!requirements || typeof requirements !== 'object') {
    return requirements;
  }

  const normalized = {};
  for (const [key, value] of Object.entries(requirements)) {
    const normalizedKey = SUBJECT_NAME_MAP[key] || key;
    normalized[normalizedKey] = value;
  }
  return normalized;
}

/**
 * Fix career requirements
 */
async function fixCareerRequirements() {
  console.log('🔧 Fixing career requirements subject names...\n');

  try {
    const snapshot = await db.collection('careers').get();
    const careers = [];
    snapshot.forEach(doc => {
      careers.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📋 Found ${careers.length} careers to check\n`);

    let updatedCount = 0;
    const batch = db.batch();

    for (const career of careers) {
      let needsUpdate = false;
      const updateData = {};

      // Fix qualificationLevels
      if (career.qualificationLevels) {
        const fixedLevels = {};
        for (const [countryCode, levels] of Object.entries(career.qualificationLevels)) {
          if (Array.isArray(levels)) {
            const fixedLevelsArray = levels.map(level => {
              if (level.minGrades) {
                const normalized = normalizeRequirements(level.minGrades);
                if (JSON.stringify(normalized) !== JSON.stringify(level.minGrades)) {
                  needsUpdate = true;
                  return { ...level, minGrades: normalized };
                }
              }
              return level;
            });
            fixedLevels[countryCode] = fixedLevelsArray;
          }
        }
        if (needsUpdate) {
          updateData.qualificationLevels = fixedLevels;
        }
      }

      // Fix countryBaselines (legacy)
      if (career.countryBaselines) {
        const fixedBaselines = {};
        for (const [countryCode, requirements] of Object.entries(career.countryBaselines)) {
          const normalized = normalizeRequirements(requirements);
          if (JSON.stringify(normalized) !== JSON.stringify(requirements)) {
            needsUpdate = true;
            fixedBaselines[countryCode] = normalized;
          } else {
            fixedBaselines[countryCode] = requirements;
          }
        }
        if (needsUpdate) {
          updateData.countryBaselines = fixedBaselines;
        }
      }

      // Fix minGrades (default)
      if (career.minGrades) {
        const normalized = normalizeRequirements(career.minGrades);
        if (JSON.stringify(normalized) !== JSON.stringify(career.minGrades)) {
          needsUpdate = true;
          updateData.minGrades = normalized;
        }
      }

      if (needsUpdate) {
        const careerRef = db.collection('careers').doc(career.id);
        batch.update(careerRef, updateData);
        console.log(`   ✅ Fixed: ${career.name}`);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`\n💾 Committing ${updatedCount} updates...`);
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updatedCount} careers!\n`);
    } else {
      console.log('\n✅ All careers already use standard subject names.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run
fixCareerRequirements()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });


