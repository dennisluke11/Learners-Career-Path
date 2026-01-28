#!/usr/bin/env node

/**
 * Check Timestamp Values in Firestore
 * 
 * This script reads analytics events and displays the actual timestamp values
 * to verify that serverTimestamp() is working correctly.
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

async function checkTimestamps() {
  console.log('🔍 Checking timestamp values in userEvents collection...\n');
  
  try {
    const userEventsRef = db.collection('userEvents');
    
    // Get the most recent event
    const snapshot = await userEventsRef
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    if (snapshot.empty) {
      console.log('⚠️  No events found in userEvents collection.\n');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} recent events\n`);
    console.log('='.repeat(80));
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const timestamp = data.timestamp;
      
      console.log(`\n📄 Document ${index + 1} (ID: ${doc.id}):`);
      console.log(`   Event: ${data.eventName || 'N/A'}`);
      console.log(`   Component: ${data.componentName || 'N/A'}`);
      
      if (!timestamp) {
        console.log('   ⚠️  Timestamp field is missing or null');
      } else if (timestamp._methodName === 'serverTimestamp') {
        console.log('   ⚠️  Timestamp is still a sentinel (not processed yet)');
        console.log('   This means the document write may not have completed.');
      } else if (timestamp.toDate) {
        // It's a Firestore Timestamp
        const date = timestamp.toDate();
        const seconds = timestamp.seconds;
        const nanoseconds = timestamp.nanoseconds;
        
        console.log('   ✅ Timestamp is a valid Firestore Timestamp:');
        console.log(`      Date: ${date.toISOString()}`);
        console.log(`      Local: ${date.toLocaleString()}`);
        console.log(`      Seconds: ${seconds}`);
        console.log(`      Nanoseconds: ${nanoseconds}`);
        console.log(`      Unix Timestamp (ms): ${date.getTime()}`);
      } else {
        console.log('   ⚠️  Timestamp format is unexpected:');
        console.log(`      Type: ${typeof timestamp}`);
        console.log(`      Value: ${JSON.stringify(timestamp, null, 2)}`);
      }
      
      console.log('-'.repeat(80));
    });
    
    console.log('\n✅ Timestamp check complete!\n');
    
  } catch (error) {
    console.error('❌ Error checking timestamps:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Please check Firestore security rules.');
    }
    
    process.exit(1);
  }
}

// Run check
checkTimestamps()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


