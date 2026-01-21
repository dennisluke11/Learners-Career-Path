#!/usr/bin/env node

/**
 * Populate Market Data to Firestore using AI (Gemini)
 * 
 * This script uses Google Gemini AI to generate realistic market data
 * (job counts, salary ranges, market trends) for all careers and countries,
 * then stores it in Firestore.
 * 
 * Usage: 
 *   node scripts/populate-market-data-firestore-ai.js
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
  console.error('   Please add GEMINI_API_KEY=your-key-here to .env file');
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

Generate realistic 2024-2025 market data. Return JSON only, no markdown:

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
- Make data realistic for ${countryName} market
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
      aiGenerated: true
    };
  } catch (error) {
    console.error(`   ❌ Error generating data for ${careerName} (${countryCode}):`, error.message);
    return null;
  }
}

async function populateMarketData() {
  console.log('🤖 Populating Market Data to Firestore using AI (Gemini)...\n');

  // Get all careers from Firestore
  const careersSnapshot = await db.collection('careers').get();
  const careers = careersSnapshot.docs.map(doc => doc.data().name);

  if (careers.length === 0) {
    console.log('⚠️  No careers found in Firestore. Please run populate-all-careers-firestore.js first.\n');
    process.exit(1);
  }

  console.log(`📋 Found ${careers.length} careers in Firestore`);
  console.log(`🌍 Generating data for ${countries.length} countries\n`);
  console.log(`⏱️  Estimated time: ${Math.ceil((careers.length * countries.length) / REQUESTS_PER_MINUTE)} minutes\n`);

  const totalEntries = careers.length * countries.length;
  let successCount = 0;
  let failCount = 0;
  const batch = db.batch();
  const batchSize = 500; // Firestore batch limit
  let currentBatchSize = 0;

  for (let i = 0; i < careers.length; i++) {
    const careerName = careers[i];
    
    for (const country of countries) {
      const docId = `${careerName}_${country.code}`;
      const docRef = db.collection('marketData').doc(docId);
      
      console.log(`   [${successCount + failCount + 1}/${totalEntries}] Generating: ${careerName} (${country.code})...`);
      
      const marketData = await generateMarketDataWithAI(
        careerName,
        country.code,
        country.name,
        country.currency
      );

      if (marketData) {
        batch.set(docRef, marketData, { merge: true });
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
  }

  // Commit remaining entries
  if (currentBatchSize > 0) {
    console.log(`\n💾 Committing final batch of ${currentBatchSize} entries...`);
    await batch.commit();
  }

  console.log(`\n✅ Successfully created ${successCount} market data entries!`);
  if (failCount > 0) {
    console.log(`⚠️  Failed to generate ${failCount} entries (check errors above)`);
  }
  console.log(`   (${careers.length} careers × ${countries.length} countries)\n`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Verify in Firebase Console > Firestore > marketData collection`);
  console.log(`   2. Run monthly update: node scripts/update-market-data-monthly.js\n`);
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

