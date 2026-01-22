/**
 * Script to populate either/or rules in Firestore countrySubjects collection
 * 
 * Usage: node scripts/populate-either-or-rules.js
 * 
 * This script adds eitherOrGroups to countrySubjects documents in Firestore
 * to make the eligibility logic fully backend-driven.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('📝 Please download your service account key from Firebase Console');
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   2. Click "Generate New Private Key"');
    console.log('   3. Save as "serviceAccountKey.json" in project root');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Either/or groups for each country
 * This defines which subjects can satisfy requirements for each other
 */
const EITHER_OR_RULES = {
  'ZA': [
    {
      subjects: ['Math', 'MathLiteracy'],
      description: 'Mathematics OR Mathematical Literacy',
      minRequired: 1,
      maxAllowed: 1
    },
    {
      subjects: ['English', 'EnglishFAL'],
      description: 'English (Home Language) OR English (First Additional Language)',
      minRequired: 1,
      maxAllowed: 1
    }
  ],
  // Add other countries as needed
  // Example for a country with Physics OR Chemistry:
  // 'KE': [
  //   {
  //     subjects: ['Physics', 'Chemistry'],
  //     description: 'Physics OR Chemistry',
  //     minRequired: 1,
  //     maxAllowed: 1
  //   }
  // ]
};

/**
 * Update countrySubjects documents with either/or groups
 */
async function populateEitherOrRules() {
  console.log('\n📋 Populating either/or rules in Firestore...\n');

  const batch = db.batch();
  let updatedCount = 0;

  for (const [countryCode, groups] of Object.entries(EITHER_OR_RULES)) {
    try {
      const countrySubjectsRef = db.collection('countrySubjects').doc(countryCode);
      const doc = await countrySubjectsRef.get();

      if (!doc.exists) {
        console.warn(`⚠️  Country ${countryCode} not found in Firestore. Skipping...`);
        continue;
      }

      const currentData = doc.data();
      const currentGroups = currentData.eitherOrGroups || [];

      // Check if groups already exist and are the same
      const groupsMatch = JSON.stringify(currentGroups.sort((a, b) => 
        a.subjects.join(',') > b.subjects.join(',') ? 1 : -1
      )) === JSON.stringify(groups.sort((a, b) => 
        a.subjects.join(',') > b.subjects.join(',') ? 1 : -1
      ));

      if (groupsMatch) {
        console.log(`  ✓ ${countryCode}: Either/or groups already up to date`);
        continue;
      }

      // Update with either/or groups
      batch.update(countrySubjectsRef, {
        eitherOrGroups: groups
      });

      console.log(`  ✅ ${countryCode}: Added ${groups.length} either/or group(s):`);
      groups.forEach(group => {
        console.log(`     - ${group.description} (${group.subjects.join(', ')})`);
      });

      updatedCount++;
    } catch (error) {
      console.error(`  ❌ Error updating ${countryCode}:`, error.message);
    }
  }

  if (updatedCount > 0) {
    try {
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updatedCount} country document(s) with either/or rules!`);
      console.log('\n🎯 Next steps:');
      console.log('  1. Verify in Firebase Console → Firestore → countrySubjects collection');
      console.log('  2. Test the eligibility logic with different countries');
      console.log('  3. Add more either/or rules for other countries as needed');
    } catch (error) {
      console.error('\n❌ Error committing batch:', error);
      process.exit(1);
    }
  } else {
    console.log('\n✅ All either/or rules are already up to date!');
  }
}

// Run the script
populateEitherOrRules()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

