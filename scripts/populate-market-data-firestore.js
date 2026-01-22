#!/usr/bin/env node

/**
 * Populate Market Data to Firestore
 * 
 * This script creates the marketData collection and populates it with
 * salary ranges and job market data for all careers and countries.
 * 
 * Usage: node scripts/populate-market-data-firestore.js
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

// Salary ranges from hardcoded defaults
const salaryRanges = {
  'Doctor': { min: 180000, max: 250000 },
  'Nurse': { min: 55000, max: 75000 },
  'Dentist': { min: 120000, max: 180000 },
  'Pharmacist': { min: 100000, max: 130000 },
  'Engineer': { min: 65000, max: 90000 },
  'Software Engineer': { min: 70000, max: 100000 },
  'Lawyer': { min: 60000, max: 85000 },
  'Teacher': { min: 40000, max: 55000 },
  'Accountant': { min: 50000, max: 70000 },
  'Business Manager': { min: 55000, max: 80000 },
  'IT Specialist': { min: 60000, max: 85000 },
  'Data Scientist': { min: 80000, max: 120000 },
  'Scientist': { min: 60000, max: 85000 },
  'Architect': { min: 55000, max: 75000 },
  'Journalist': { min: 35000, max: 50000 },
  'Social Worker': { min: 40000, max: 55000 },
  'Psychologist': { min: 50000, max: 70000 }
};

// Country codes and currencies
const countries = [
  { code: 'KE', currency: 'KES', name: 'Kenya' },
  { code: 'NG', currency: 'NGN', name: 'Nigeria' },
  { code: 'ZA', currency: 'ZAR', name: 'South Africa' },
  { code: 'ZW', currency: 'USD', name: 'Zimbabwe' },
  { code: 'ET', currency: 'ETB', name: 'Ethiopia' },
  { code: 'EG', currency: 'EGP', name: 'Egypt' }
];

// Currency conversion rates (approximate, should be updated regularly)
const currencyRates = {
  'KES': 0.007,  // 1 KES = 0.007 USD
  'NGN': 0.0012, // 1 NGN = 0.0012 USD
  'ZAR': 0.055,  // 1 ZAR = 0.055 USD
  'ETB': 0.018,  // 1 ETB = 0.018 USD
  'EGP': 0.032   // 1 EGP = 0.032 USD
};

function calculateSalaryRangesByLevel(baseMin, baseMax, currency) {
  const juniorMin = baseMin;
  const juniorMax = baseMin + (baseMax - baseMin) * 0.4;
  const midMin = baseMin + (baseMax - baseMin) * 0.4;
  const midMax = baseMin + (baseMax - baseMin) * 0.75;
  const seniorMin = baseMin + (baseMax - baseMin) * 0.75;
  const seniorMax = baseMax * 1.5;

  return {
    junior: {
      min: Math.round(juniorMin),
      max: Math.round(juniorMax),
      currency: currency,
      period: 'yearly'
    },
    mid: {
      min: Math.round(midMin),
      max: Math.round(midMax),
      currency: currency,
      period: 'yearly'
    },
    senior: {
      min: Math.round(seniorMin),
      max: Math.round(seniorMax),
      currency: currency,
      period: 'yearly'
    }
  };
}

function estimateJobCounts(careerName) {
  const careerHash = careerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseJobCount = 500 + (careerHash % 1500);
  
  return {
    totalJobCount: baseJobCount,
    jobCountsBySite: [
      { site: 'LinkedIn', count: Math.floor(baseJobCount * 0.35) },
      { site: 'Indeed', count: Math.floor(baseJobCount * 0.30) },
      { site: 'Glassdoor', count: Math.floor(baseJobCount * 0.20) },
      { site: 'Monster', count: Math.floor(baseJobCount * 0.15) }
    ]
  };
}

async function populateMarketData() {
  console.log('💰 Populating Market Data to Firestore...\n');

  // Get all careers from Firestore
  const careersSnapshot = await db.collection('careers').get();
  const careers = careersSnapshot.docs.map(doc => doc.data().name);

  if (careers.length === 0) {
    console.log('⚠️  No careers found in Firestore. Please run populate-all-careers-firestore.js first.\n');
    process.exit(1);
  }

  console.log(`📋 Found ${careers.length} careers in Firestore\n`);
  console.log('📤 Creating market data for all careers and countries...\n');

  const batch = db.batch();
  const marketDataRef = db.collection('marketData');
  let count = 0;

  for (const careerName of careers) {
    for (const country of countries) {
      const docId = `${careerName}_${country.code}`;
      const docRef = marketDataRef.doc(docId);

      // Get base salary range (default if not in hardcoded list)
      const baseRange = salaryRanges[careerName] || { min: 40000, max: 60000 };
      
      // Convert to local currency
      const localMin = country.currency === 'USD' 
        ? baseRange.min 
        : Math.round(baseRange.min / (currencyRates[country.currency] || 1));
      const localMax = country.currency === 'USD'
        ? baseRange.max
        : Math.round(baseRange.max / (currencyRates[country.currency] || 1));

      // Calculate salary ranges by level
      const salaryRangesByLevel = calculateSalaryRangesByLevel(localMin, localMax, country.currency);

      // Estimate job counts
      const jobData = estimateJobCounts(careerName);

      // Create market data document
      batch.set(docRef, {
        careerName: careerName,
        countryCode: country.code,
        countryName: country.name,
        salaryRangesByLevel: salaryRangesByLevel,
        totalJobCount: jobData.totalJobCount,
        jobCountsBySite: jobData.jobCountsBySite,
        marketTrend: 'stable', // Default trend
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        source: 'Firestore Database'
      }, { merge: true });

      count++;
      if (count % 20 === 0) {
        console.log(`   ✓ Processed ${count} market data entries...`);
      }
    }
  }

  console.log(`\n💾 Committing ${count} market data entries to Firestore...`);
  await batch.commit();

  console.log(`\n✅ Successfully created ${count} market data entries!`);
  console.log(`   (${careers.length} careers × ${countries.length} countries)\n`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Verify in Firebase Console > Firestore > marketData collection`);
  console.log(`   2. Update career-market.service.ts to use Firestore instead of hardcoded\n`);
}

// Run
populateMarketData()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

