#!/usr/bin/env node

/**
 * Monthly Market Data Update Script
 * 
 * This script updates all market data in Firestore using AI (Gemini).
 * Designed to be run monthly via cron job or scheduled task.
 * 
 * Usage:
 *   node scripts/update-market-data-monthly.js
 * 
 * Cron example (runs on 1st of every month at 2 AM):
 *   0 2 1 * * cd /path/to/project && node scripts/update-market-data-monthly.js >> logs/monthly-update.log 2>&1
 * 
 * Requires:
 *   - GEMINI_API_KEY in .env file or environment variable
 *   - serviceAccountKey.json for Firestore access
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

// Check for Gemini API key
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('❌ Error: GEMINI_API_KEY not found in .env file!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Country codes and currencies
const countries = [
  { code: 'KE', currency: 'KES', name: 'Kenya' },
  { code: 'NG', currency: 'NGN', name: 'Nigeria' },
  { code: 'ZA', currency: 'ZAR', name: 'South Africa' },
  { code: 'ZW', currency: 'USD', name: 'Zimbabwe' },
  { code: 'ET', currency: 'ETB', name: 'Ethiopia' },
  { code: 'EG', currency: 'EGP', name: 'Egypt' }
];

// Rate limiting: 15 requests per minute, 1000 per day (free tier)
let requestCount = 0;
let lastRequestTime = Date.now();
const REQUESTS_PER_MINUTE = 15;
const MINUTE_MS = 60 * 1000;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitCheck() {
  const now = Date.now();
  if (now - lastRequestTime < MINUTE_MS) {
    if (requestCount >= REQUESTS_PER_MINUTE) {
      const waitTime = MINUTE_MS - (now - lastRequestTime);
      console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await delay(waitTime);
      requestCount = 0;
      lastRequestTime = Date.now();
    }
  } else {
    requestCount = 0;
    lastRequestTime = Date.now();
  }
  requestCount++;
}

function buildMarketDataPrompt(careerName, countryCode, countryName, currency) {
  return `Market data for "${careerName}" in ${countryName} (${countryCode}).

Generate realistic CURRENT market data (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}). Return JSON only, no markdown:

{
  "totalJobCount": 1250,
  "jobCountsBySite": [
    {"site": "LinkedIn", "count": 450},
    {"site": "Indeed", "count": 380},
    {"site": "Glassdoor", "count": 200},
    {"site": "Monster", "count": 120}
  ],
  "salaryRangesByLevel": {
    "junior": {"min": 40000, "max": 60000, "currency": "${currency}", "period": "yearly"},
    "mid": {"min": 65000, "max": 90000, "currency": "${currency}", "period": "yearly"},
    "senior": {"min": 95000, "max": 140000, "currency": "${currency}", "period": "yearly"}
  },
  "marketTrend": "growing"
}

Requirements:
- Job counts from major sites (LinkedIn, Indeed, Glassdoor, Monster)
- Salary ranges: junior (0-2yrs), mid (3-7yrs), senior (8+yrs)
- Use ${currency} currency
- Market trend: "growing", "stable", or "declining"
- Make data realistic for ${countryName} market in ${new Date().getFullYear()}
- Return valid JSON only`;
}

async function generateMarketDataWithAI(careerName, countryCode, countryName, currency) {
  await rateLimitCheck();
  
  const prompt = buildMarketDataPrompt(careerName, countryCode, countryName, currency);
  
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const data = JSON.parse(jsonText);
    
    return {
      careerName: careerName,
      countryCode: countryCode,
      countryName: countryName,
      totalJobCount: data.totalJobCount || 0,
      jobCountsBySite: data.jobCountsBySite || [],
      salaryRangesByLevel: data.salaryRangesByLevel || null,
      marketTrend: data.marketTrend || 'unknown',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      source: 'AI Generated (Gemini)',
      aiGenerated: true,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`   ❌ Error generating data for ${careerName} (${countryCode}):`, error.message);
    return null;
  }
}

async function updateMarketData() {
  const startTime = Date.now();
  console.log(`\n🔄 Monthly Market Data Update - ${new Date().toISOString()}\n`);

  // Get all existing market data from Firestore
  const marketDataSnapshot = await db.collection('marketData').get();
  
  if (marketDataSnapshot.empty) {
    console.log('⚠️  No market data found in Firestore.');
    console.log('   Run populate-market-data-firestore-ai.js first to create initial data.\n');
    process.exit(1);
  }

  console.log(`📋 Found ${marketDataSnapshot.size} market data entries to update\n`);

  let successCount = 0;
  let failCount = 0;
  const batch = db.batch();
  const batchSize = 500; // Firestore batch limit
  let currentBatchSize = 0;

  for (const doc of marketDataSnapshot.docs) {
    const data = doc.data();
    const careerName = data.careerName;
    const countryCode = data.countryCode;
    const country = countries.find(c => c.code === countryCode);
    
    if (!country) {
      console.log(`   ⚠️  Skipping ${careerName} (${countryCode}) - country not found`);
      continue;
    }

    console.log(`   [${successCount + failCount + 1}/${marketDataSnapshot.size}] Updating: ${careerName} (${countryCode})...`);
    
    const marketData = await generateMarketDataWithAI(
      careerName,
      countryCode,
      country.name,
      country.currency
    );

    if (marketData) {
      batch.set(doc.ref, marketData, { merge: true });
      successCount++;
      currentBatchSize++;
      
      // Commit batch if it reaches the limit
      if (currentBatchSize >= batchSize) {
        console.log(`   💾 Committing batch of ${currentBatchSize} entries...`);
        await batch.commit();
        currentBatchSize = 0;
      }
    } else {
      failCount++;
    }
    
    // Small delay to avoid hitting rate limits
    await delay(100);
  }

  // Commit remaining entries
  if (currentBatchSize > 0) {
    console.log(`\n💾 Committing final batch of ${currentBatchSize} entries...`);
    await batch.commit();
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  console.log(`\n✅ Update completed in ${duration} minutes`);
  console.log(`   ✅ Successfully updated: ${successCount} entries`);
  if (failCount > 0) {
    console.log(`   ⚠️  Failed to update: ${failCount} entries`);
  }
  console.log(`\n📊 Next update: Run this script again next month\n`);
}

// Run
updateMarketData()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

