#!/usr/bin/env node

/**
 * Verify Analytics Recording
 * 
 * This script checks if analytics events are being recorded in Firestore.
 * 
 * Usage:
 *   node scripts/verify-analytics.js
 *   node scripts/verify-analytics.js --last-hour
 *   node scripts/verify-analytics.js --last-day
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('   Please add your Firebase service account key to the project root.');
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

/**
 * Get time range based on command line arguments
 */
function getTimeRange() {
  const args = process.argv.slice(2);
  const now = new Date();
  
  if (args.includes('--last-hour')) {
    return {
      start: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      end: now
    };
  } else if (args.includes('--last-day')) {
    return {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: now
    };
  } else {
    // Default: last 7 days
    return {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: now
    };
  }
}

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Main verification function
 */
async function verifyAnalytics() {
  console.log('🔍 Verifying Analytics Recording...\n');
  
  try {
    // Check if userEvents collection exists and has data
    const userEventsRef = db.collection('userEvents');
    const snapshot = await userEventsRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log('⚠️  No analytics events found in Firestore.');
      console.log('   This could mean:');
      console.log('   1. Analytics are not being recorded yet');
      console.log('   2. Events are queued but not flushed');
      console.log('   3. Firestore security rules are blocking writes');
      console.log('   4. Firebase service is not properly initialized\n');
      return;
    }
    
    console.log('✅ Analytics collection exists and has data!\n');
    
    // Get time range
    const timeRange = getTimeRange();
    console.log(`📅 Checking events from ${formatDate(timeRange.start)} to ${formatDate(timeRange.end)}\n`);
    
    // Query events in time range
    const eventsQuery = userEventsRef
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(timeRange.start))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(timeRange.end))
      .orderBy('timestamp', 'desc')
      .limit(100);
    
    const eventsSnapshot = await eventsQuery.get();
    
    if (eventsSnapshot.empty) {
      console.log('⚠️  No events found in the specified time range.\n');
      return;
    }
    
    console.log(`📊 Found ${eventsSnapshot.size} events in time range\n`);
    
    // Analyze events
    const eventTypes = {};
    const eventNames = {};
    const countries = {};
    const components = {};
    let totalEvents = 0;
    
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      totalEvents++;
      
      // Count event types
      const eventType = data.eventType || 'unknown';
      eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
      
      // Count event names
      const eventName = data.eventName || 'unknown';
      eventNames[eventName] = (eventNames[eventName] || 0) + 1;
      
      // Count countries
      if (data.country) {
        countries[data.country] = (countries[data.country] || 0) + 1;
      }
      
      // Count components
      if (data.componentName) {
        components[data.componentName] = (components[data.componentName] || 0) + 1;
      }
    });
    
    // Display summary
    console.log('📈 Event Summary:\n');
    console.log(`   Total Events: ${totalEvents}`);
    console.log(`   Unique Sessions: ${new Set(eventsSnapshot.docs.map(d => d.data().sessionId)).size}`);
    console.log();
    
    // Event types breakdown
    console.log('📋 Event Types:');
    Object.entries(eventTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / totalEvents) * 100).toFixed(1);
        console.log(`   ${type.padEnd(15)} ${count.toString().padStart(4)} (${percentage}%)`);
      });
    console.log();
    
    // Event names breakdown
    console.log('🎯 Top Event Names:');
    Object.entries(eventNames)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([name, count]) => {
        const percentage = ((count / totalEvents) * 100).toFixed(1);
        console.log(`   ${name.padEnd(30)} ${count.toString().padStart(4)} (${percentage}%)`);
      });
    console.log();
    
    // Countries breakdown
    if (Object.keys(countries).length > 0) {
      console.log('🌍 Countries:');
      Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .forEach(([country, count]) => {
          const percentage = ((count / totalEvents) * 100).toFixed(1);
          console.log(`   ${country.padEnd(10)} ${count.toString().padStart(4)} (${percentage}%)`);
        });
      console.log();
    }
    
    // Components breakdown
    if (Object.keys(components).length > 0) {
      console.log('🧩 Components:');
      Object.entries(components)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([component, count]) => {
          const percentage = ((count / totalEvents) * 100).toFixed(1);
          console.log(`   ${component.padEnd(30)} ${count.toString().padStart(4)} (${percentage}%)`);
        });
      console.log();
    }
    
    // Show recent events
    console.log('🕐 Recent Events (last 5):');
    eventsSnapshot.docs.slice(0, 5).forEach((doc, index) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      console.log(`   ${index + 1}. [${formatDate(timestamp)}] ${data.eventType || 'unknown'} - ${data.eventName || 'unknown'}`);
      if (data.country) {
        console.log(`      Country: ${data.country}`);
      }
      if (data.componentName) {
        console.log(`      Component: ${data.componentName}`);
      }
    });
    console.log();
    
    // Check for errors
    const errorEvents = eventsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.eventName?.includes('error') || data.eventName?.includes('Error');
    });
    
    if (errorEvents.length > 0) {
      console.log(`⚠️  Found ${errorEvents.length} error-related events\n`);
    }
    
    console.log('✅ Analytics are being recorded successfully!\n');
    
    // Recommendations
    console.log('💡 Recommendations:');
    console.log('   1. Check Firebase Console > Firestore > userEvents collection for full data');
    console.log('   2. Set up Firebase Analytics dashboard for visual insights');
    console.log('   3. Monitor event volume to ensure proper batching');
    console.log('   4. Review security rules to ensure events can be written\n');
    
  } catch (error) {
    console.error('❌ Error verifying analytics:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  Permission denied. Please check:');
      console.error('   1. Firestore security rules allow create on userEvents collection');
      console.error('   2. Service account has proper permissions');
    }
    
    process.exit(1);
  }
}

// Run verification
verifyAnalytics()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


