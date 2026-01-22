#!/usr/bin/env node

/**
 * Populate All Careers to Firestore
 * 
 * This script uploads ALL careers from the hardcoded helper to Firestore.
 * This ensures Firebase has the complete set of careers.
 * 
 * Usage: node scripts/populate-all-careers-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save as "serviceAccountKey.json" in project root\n');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Import careers from helper (we'll need to convert TypeScript to JSON)
// For now, read from careers.json if it exists, otherwise we'll create it
async function populateAllCareers() {
  console.log('📦 Populating ALL careers to Firestore...\n');

  // Try to read from careers.json first
  const careersJsonPath = path.join(__dirname, '..', 'firestore-data', 'careers.json');
  let careers = [];

  if (fs.existsSync(careersJsonPath)) {
    console.log('📄 Reading careers from careers.json...');
    careers = JSON.parse(fs.readFileSync(careersJsonPath, 'utf8'));
    console.log(`   Found ${careers.length} careers in JSON file\n`);
  } else {
    console.log('⚠️  careers.json not found. You need to run this after careers.json is created.\n');
    console.log('   The careers.json should contain all careers from careers-data.helper.ts\n');
    process.exit(1);
  }

  if (careers.length === 0) {
    console.error('❌ No careers found in careers.json!');
    process.exit(1);
  }

  const batch = db.batch();
  const careersRef = db.collection('careers');
  let count = 0;

  console.log('📤 Uploading careers to Firestore...\n');

  for (const career of careers) {
    const docRef = careersRef.doc(career.name);
    batch.set(docRef, {
      name: career.name,
      minGrades: career.minGrades || {},
      countryBaselines: career.countryBaselines || {},
      category: career.category || undefined
    }, { merge: true }); // Use merge to avoid overwriting existing data
    
    count++;
    if (count % 10 === 0) {
      console.log(`   ✓ Processed ${count}/${careers.length} careers...`);
    }
  }

  console.log(`\n💾 Committing ${careers.length} careers to Firestore...`);
  await batch.commit();
  
  console.log(`\n✅ Successfully uploaded ${careers.length} careers to Firestore!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Verify in Firebase Console > Firestore > careers collection`);
  console.log(`   2. Update careers.service.ts to remove hardcoded fallbacks`);
  console.log(`   3. Test your app to ensure it loads careers from Firestore\n`);
}

// Run
populateAllCareers()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });


