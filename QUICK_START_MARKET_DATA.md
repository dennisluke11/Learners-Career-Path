# Quick Start: Market Data with AI

## One-Time Setup

1. **Get Gemini API Key**
   ```bash
   # Get from: https://aistudio.google.com/app/apikey
   # Add to .env file:
   echo "GEMINI_API_KEY=your-key-here" > .env
   ```

2. **Populate Market Data (First Time)**
   ```bash
   node scripts/populate-market-data-firestore-ai.js
   ```
   This generates market data for all careers × countries and stores in Firestore.

## Monthly Updates

**Option 1: Manual**
```bash
node scripts/update-market-data-monthly.js
```

**Option 2: Automated (Cron)**
```bash
# Edit crontab
crontab -e

# Add this line (runs 1st of every month at 2 AM):
0 2 1 * * cd /path/to/CareerPath && node scripts/update-market-data-monthly.js >> logs/monthly-update.log 2>&1
```

## What Gets Stored

Each document in `marketData` collection:
- Document ID: `{careerName}_{countryCode}` (e.g., `Software Engineer_KE`)
- Contains: job counts, salary ranges, market trends
- Updated: Monthly via AI

## Benefits

✅ App loads data from Firestore (fast, no AI wait)  
✅ Only ~300 AI requests/month (vs thousands per-request)  
✅ Always fresh data (monthly updates)  
✅ Works even if API key expires (data already in DB)

See `MARKET_DATA_AI_SETUP.md` for full details.

