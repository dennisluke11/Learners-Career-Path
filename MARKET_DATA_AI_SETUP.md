# Market Data AI Setup Guide

## Overview

This guide explains how to use AI (Gemini) to generate and store market data in Firestore, then update it monthly.

## What Gets Stored

Each market data entry in Firestore contains:

```json
{
  "careerName": "Software Engineer",
  "countryCode": "KE",
  "countryName": "Kenya",
  "totalJobCount": 1250,
  "jobCountsBySite": [
    {"site": "LinkedIn", "count": 450},
    {"site": "Indeed", "count": 380},
    {"site": "Glassdoor", "count": 200},
    {"site": "Monster", "count": 120}
  ],
  "salaryRangesByLevel": {
    "junior": {"min": 40000, "max": 60000, "currency": "KES", "period": "yearly"},
    "mid": {"min": 65000, "max": 90000, "currency": "KES", "period": "yearly"},
    "senior": {"min": 95000, "max": 140000, "currency": "KES", "period": "yearly"}
  },
  "marketTrend": "growing",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "source": "AI Generated (Gemini)",
  "aiGenerated": true
}
```

## Setup

### 1. Install Dependencies

The required packages are already in `package.json`:
- `@google/generative-ai` - For Gemini AI
- `firebase-admin` - For Firestore access
- `dotenv` - For environment variables

If not installed:
```bash
npm install
```

### 2. Configure API Key

Create a `.env` file in the project root:
```bash
GEMINI_API_KEY=your-api-key-here
```

**⚠️ Never commit `.env` to git!** It's already in `.gitignore`.

### 3. Ensure Service Account Key Exists

Make sure `serviceAccountKey.json` is in the project root (for Firestore access).

## Usage

### Initial Population (First Time)

Run the AI-powered populate script to generate market data for all careers and countries:

```bash
node scripts/populate-market-data-firestore-ai.js
```

**What it does:**
- Fetches all careers from Firestore
- For each career × country combination:
  - Uses Gemini AI to generate realistic market data
  - Stores it in Firestore collection `marketData`
- Respects rate limits (15 requests/minute)

**Estimated time:**
- ~50 careers × 6 countries = 300 entries
- At 15 requests/minute = ~20 minutes

**Output:**
```
🤖 Populating Market Data to Firestore using AI (Gemini)...
📋 Found 50 careers in Firestore
🌍 Generating data for 6 countries
⏱️  Estimated time: 20 minutes

   [1/300] Generating: Software Engineer (KE)...
   [2/300] Generating: Software Engineer (NG)...
   ...
✅ Successfully created 300 market data entries!
```

### Monthly Updates

Run the monthly update script to refresh all market data:

```bash
node scripts/update-market-data-monthly.js
```

**What it does:**
- Fetches all existing market data from Firestore
- For each entry:
  - Uses Gemini AI to generate updated market data
  - Updates the Firestore document
- Respects rate limits

**When to run:**
- Manually: Once per month
- Automated: Set up a cron job (see below)

## Automated Monthly Updates (Cron)

### Linux/macOS

1. Open crontab:
   ```bash
   crontab -e
   ```

2. Add this line (runs on 1st of every month at 2 AM):
   ```cron
   0 2 1 * * cd /Users/dennislukeowuor/Documents/CareerPath && node scripts/update-market-data-monthly.js >> logs/monthly-update.log 2>&1
   ```

3. Create logs directory:
   ```bash
   mkdir -p logs
   ```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Monthly, Day 1, Time: 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/update-market-data-monthly.js`
   - Start in: `C:\path\to\CareerPath`

### Cloud Functions (Firebase)

You can also deploy this as a Firebase Cloud Function with a scheduled trigger:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.updateMarketDataMonthly = onSchedule('0 2 1 * *', async (event) => {
  // Run the update script logic here
  // Or call the script as a child process
});
```

## Firestore Structure

**Collection:** `marketData`

**Document ID Format:** `{careerName}_{countryCode}`

**Example:** `Software Engineer_KE`

**Fields:**
- `careerName` (string) - Career name
- `countryCode` (string) - Country code (KE, NG, ZA, etc.)
- `countryName` (string) - Country name
- `totalJobCount` (number) - Total job openings
- `jobCountsBySite` (array) - Job counts by job site
- `salaryRangesByLevel` (object) - Salary ranges for junior/mid/senior
- `marketTrend` (string) - "growing", "stable", or "declining"
- `lastUpdated` (timestamp) - When data was last updated
- `source` (string) - "AI Generated (Gemini)"
- `aiGenerated` (boolean) - true

## Rate Limiting

The scripts automatically handle Gemini API rate limits:
- **15 requests per minute** (free tier)
- **1,000 requests per day** (free tier)

If you hit the daily limit, the script will stop and you'll need to wait until the next day.

## Cost Estimation

**Free Tier Limits:**
- 1,000 requests per day
- 15 requests per minute

**For 50 careers × 6 countries = 300 entries:**
- Initial population: 300 requests (within free tier ✅)
- Monthly update: 300 requests (within free tier ✅)

**If you exceed free tier:**
- ~$0.0005-0.001 per request (Flash-Lite model)
- 300 requests = ~$0.15-0.30 per month

## Troubleshooting

### Error: GEMINI_API_KEY not found
- Make sure `.env` file exists in project root
- Check that `GEMINI_API_KEY=your-key` is in `.env`
- Verify the key is correct (no extra spaces)

### Error: serviceAccountKey.json not found
- Make sure `serviceAccountKey.json` is in project root
- Download it from Firebase Console > Project Settings > Service Accounts

### Rate Limit Errors
- The script automatically handles rate limits
- If you hit daily limit (1,000), wait until next day
- Consider running updates in smaller batches

### API Key Leaked Error (403)
- Your API key was compromised
- Get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Delete the old key
- Update `.env` with new key

## Benefits of This Approach

✅ **Reduced API Calls**: Only monthly updates instead of per-request  
✅ **Faster App**: Data from Firestore (no AI wait time)  
✅ **Lower Costs**: Only ~300 requests/month vs thousands  
✅ **Works Without AI**: App works even if API key expires  
✅ **Always Fresh**: Monthly updates keep data current  
✅ **Scalable**: Can handle many users without hitting rate limits  

## Next Steps

1. ✅ Run initial population: `node scripts/populate-market-data-firestore-ai.js`
2. ✅ Verify data in Firebase Console
3. ✅ Set up monthly cron job
4. ✅ Test the app - market data should load from Firestore

## Related Files

- `scripts/populate-market-data-firestore-ai.js` - Initial population script
- `scripts/update-market-data-monthly.js` - Monthly update script
- `src/app/core/services/career-market.service.ts` - Service that reads from Firestore

