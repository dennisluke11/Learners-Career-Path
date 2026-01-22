#!/usr/bin/env node

/**
 * Set Only South Africa as Active Country
 * 
 * This script updates the Firestore 'countries' collection to set:
 * - South Africa (ZA) - active: true
 * - All other countries - active: false
 * 
 * This makes country visibility backend-driven. To enable other countries later,
 * simply update the 'active' field to true in Firestore.
 * 
 * Usage:
 * node scripts/set-only-south-africa-active.js
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

async function setOnlySouthAfricaActive() {
  console.log('🌍 Setting only South Africa as active country...\n');
  
  const countriesRef = db.collection('countries');
  
  // Get all existing countries
  const snapshot = await countriesRef.get();
  
  if (snapshot.empty) {
    console.log('⚠️  No countries found in Firestore. Creating South Africa...');
    await countriesRef.doc('ZA').set({
      code: 'ZA',
      name: 'South Africa',
      flag: '🇿🇦',
      active: true
    });
    console.log('✅ Created South Africa (ZA) with active: true\n');
    process.exit(0);
  }
  
  console.log(`📋 Found ${snapshot.size} countries in Firestore\n`);
  
  const batch = db.batch();
  let activatedCount = 0;
  let deactivatedCount = 0;
  
  // Process each country
  snapshot.forEach(doc => {
    const data = doc.data();
    const countryCode = doc.id;
    const isSouthAfrica = countryCode === 'ZA';
    
    if (isSouthAfrica) {
      // Activate South Africa
      batch.set(doc.ref, {
        code: 'ZA',
        name: 'South Africa',
        flag: '🇿🇦',
        active: true
      }, { merge: true });
      console.log(`  ✅ ${data.flag || '🇿🇦'} ${data.name || 'South Africa'} (${countryCode}) - active: true`);
      activatedCount++;
    } else {
      // Deactivate all other countries
      batch.set(doc.ref, {
        ...data,
        active: false
      }, { merge: true });
      console.log(`  🚫 ${data.flag || ''} ${data.name || countryCode} (${countryCode}) - active: false`);
      deactivatedCount++;
    }
  });
  
  // If South Africa doesn't exist, create it
  const zaDoc = snapshot.docs.find(doc => doc.id === 'ZA');
  if (!zaDoc) {
    const zaRef = countriesRef.doc('ZA');
    batch.set(zaRef, {
      code: 'ZA',
      name: 'South Africa',
      flag: '🇿🇦',
      active: true
    }, { merge: true });
    console.log(`  ✅ 🇿🇦 South Africa (ZA) - active: true (created)`);
    activatedCount++;
  }
  
  // Commit all changes
  await batch.commit();
  
  console.log(`\n✅ Countries updated successfully!`);
  console.log(`   - Activated: ${activatedCount} country(ies)`);
  console.log(`   - Deactivated: ${deactivatedCount} countries`);
  console.log(`\n📝 To enable other countries later, update the 'active' field to true in Firestore.`);
  console.log(`   Example: countries/ZM -> { active: true }`);
  
  process.exit(0);
}

setOnlySouthAfricaActive().catch(error => {
  console.error('❌ Error updating countries:', error);
  process.exit(1);
});

