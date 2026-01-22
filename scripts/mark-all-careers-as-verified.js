#!/usr/bin/env node

/**
 * Mark All Careers as Verified
 * 
 * This script updates all careers in Firestore to have verificationStatus: 'verified'
 * and sets lastVerified to today's date.
 * 
 * ⚠️  WARNING: Only run this if you have verified all career requirements manually.
 * This script does NOT verify the data - it only marks it as verified.
 * 
 * Usage: 
 *   node scripts/mark-all-careers-as-verified.js
 *   node scripts/mark-all-careers-as-verified.js --dry-run (preview changes)
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
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const TODAY = new Date().toISOString().split('T')[0];
const DRY_RUN = process.argv.includes('--dry-run');

async function markAllAsVerified() {
  console.log('🔍 Finding all careers in Firestore...\n');
  
  const careersSnapshot = await db.collection('careers').get();
  const careers = [];
  
  for (const doc of careersSnapshot.docs) {
    const data = doc.data();
    const careerName = data.name || doc.id;
    const currentStatus = data.verificationStatus || 'estimated';
    
    careers.push({
      id: doc.id,
      name: careerName,
      currentStatus,
      hasQualificationLevels: !!data.qualificationLevels
    });
  }
  
  console.log(`📋 Found ${careers.length} careers\n`);
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN - Preview of changes:\n');
    careers.forEach(career => {
      if (career.currentStatus !== 'verified') {
        console.log(`   ${career.name}: ${career.currentStatus} → verified`);
      }
    });
    console.log(`\n   Would update ${careers.filter(c => c.currentStatus !== 'verified').length} careers\n`);
    return;
  }
  
  console.log('⚠️  WARNING: This will mark ALL careers as verified.');
  console.log('   Make sure you have manually verified all requirements first!\n');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('📝 Updating careers...\n');
  
  const batch = db.batch();
  let updateCount = 0;
  
  for (const career of careers) {
    if (career.currentStatus !== 'verified') {
      const docRef = db.collection('careers').doc(career.id);
      batch.update(docRef, {
        verificationStatus: 'verified',
        lastVerified: TODAY
      });
      updateCount++;
      
      if (updateCount % 10 === 0) {
        console.log(`   ✓ Updated ${updateCount} careers...`);
      }
    }
  }
  
  // Also update careers that are verified but missing lastVerified
  for (const career of careers) {
    const docRef = db.collection('careers').doc(career.id);
    const doc = await docRef.get();
    const data = doc.data();
    
    if (data.verificationStatus === 'verified' && !data.lastVerified) {
      batch.update(docRef, {
        lastVerified: TODAY
      });
    }
  }
  
  console.log(`\n💾 Committing ${updateCount} updates...`);
  await batch.commit();
  
  console.log(`\n✅ Successfully marked ${updateCount} careers as verified!`);
  console.log(`   All careers now have verificationStatus: 'verified'`);
  console.log(`   All careers now have lastVerified: ${TODAY}\n`);
}

markAllAsVerified()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

