#!/usr/bin/env node

/**
 * Update Firestore with Only 6 Countries
 * 
 * This script updates the Firestore 'countries' collection to only include:
 * - South Africa (ZA)
 * - Kenya (KE)
 * - Nigeria (NG)
 * - Zimbabwe (ZW)
 * - Ethiopia (ET)
 * - Egypt (EG)
 * 
 * All other countries will be set to active: false
 * 
 * Usage:
 * node scripts/update-countries.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the JSON file as "firebase-service-account.json" in project root');
  console.log('4. Run this script again\n');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The 6 countries we want to keep active
const ACTIVE_COUNTRIES = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', active: true },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', active: true },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', active: true },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', active: true },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', active: true },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', active: true }
];

async function updateCountries() {
  console.log('🌍 Updating countries collection...\n');
  
  const countriesRef = db.collection('countries');
  const batch = db.batch();
  
  // Get all existing countries
  const snapshot = await countriesRef.get();
  const existingCodes = new Set();
  
  console.log(`📋 Found ${snapshot.size} existing countries in Firestore\n`);
  
  // First, update/add the 6 active countries
  console.log('✅ Setting up 6 active countries:');
  for (const country of ACTIVE_COUNTRIES) {
    const docRef = countriesRef.doc(country.code);
    batch.set(docRef, {
      code: country.code,
      name: country.name,
      flag: country.flag,
      active: true
    }, { merge: true });
    existingCodes.add(country.code);
    console.log(`  ✓ ${country.flag} ${country.name} (${country.code}) - active: true`);
  }
  
  // Deactivate all other countries
  console.log('\n🚫 Deactivating other countries:');
  let deactivatedCount = 0;
  snapshot.forEach(doc => {
    const countryCode = doc.id;
    if (!existingCodes.has(countryCode)) {
      const data = doc.data();
      batch.set(doc.ref, {
        ...data,
        active: false
      }, { merge: true });
      console.log(`  ✗ ${data.flag || ''} ${data.name || countryCode} (${countryCode}) - active: false`);
      deactivatedCount++;
    }
  });
  
  if (deactivatedCount === 0) {
    console.log('  (No other countries to deactivate)');
  }
  
  // Commit all changes
  await batch.commit();
  
  console.log('\n✅ Countries collection updated successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   • ${ACTIVE_COUNTRIES.length} countries set to active: true`);
  console.log(`   • ${deactivatedCount} countries set to active: false`);
  console.log(`   • Total countries in database: ${snapshot.size}`);
  console.log('\n🎉 Done! The app will now only show the 6 active countries.\n');
}

// Run the update
updateCountries()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error updating countries:', error);
    process.exit(1);
  });




