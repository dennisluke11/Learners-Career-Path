# Deployment Guide

## Quick Start Deployment

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase account and project created
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

## Step 1: Set Up Firebase Functions API Key

The Gemini API key is stored securely in Firebase Functions environment variables.

```bash
# Set the Gemini API key (replace YOUR_KEY with your actual key)
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Verify it was set
firebase functions:config:get
```

**Important:** Never commit your API key to git. It's stored securely in Firebase.

---

## Step 2: Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

---

## Step 3: Build Production Bundle

```bash
# Build Angular app for production
npm run build:prod
```

This will:
- Use production configuration
- Replace `environment.ts` with `environment.prod.ts`
- Enable production optimizations
- Output to `dist/career-path-planner`

---

## Step 4: Test Locally (Optional but Recommended)

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, serve the built app
cd dist/career-path-planner
python3 -m http.server 8080
# Or use any static file server
```

Visit `http://localhost:8080` to test.

---

## Step 5: Deploy to Firebase

### Option A: Deploy Everything
```bash
firebase deploy
```

### Option B: Deploy Step by Step

```bash
# 1. Deploy Firestore rules and indexes
npm run deploy:firestore

# 2. Deploy Firebase Functions (with API key)
npm run deploy:functions

# 3. Deploy hosting (Angular app)
npm run deploy:hosting
```

---

## Step 6: Verify Deployment

1. Visit your Firebase hosting URL (shown after deployment)
2. Test core features:
   - Grade input
   - Career selection
   - Eligibility checking
   - Study resources (should use Functions)
   - Market data (should use Functions)

---

## Environment Configuration

### Development (`environment.ts`)
```typescript
export const environment = {
  production: false,
  geminiApiKey: '', // Can be set via .env file
  useFirebaseFunctions: false, // Use direct API calls in dev
  firebaseConfig: { /* your config */ }
};
```

### Production (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  geminiApiKey: '', // Not used - Functions handle it
  useFirebaseFunctions: true, // Use Functions for security
  firebaseConfig: { /* your config */ }
};
```

---

## Troubleshooting

### Functions Not Working

**Error:** "Gemini API key not configured"

**Solution:**
```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
firebase deploy --only functions
```

### Build Fails

**Error:** TypeScript compilation errors

**Solution:**
```bash
# Check for errors
npm run build:prod

# Fix any TypeScript errors
# Then rebuild
```

### Firestore Permission Errors

**Error:** "Missing or insufficient permissions"

**Solution:**
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Verify rules in Firebase Console
```

### CORS Errors

**Error:** CORS policy blocking requests

**Solution:**
- Functions already have CORS enabled
- Check Firebase Console → Functions → Logs for errors

---

## Security Checklist

- [x] API key stored in Firebase Functions (not in client code)
- [x] Firestore rules deployed and tested
- [x] Production environment uses Functions
- [x] No sensitive data in client bundle
- [x] HTTPS enabled (automatic with Firebase Hosting)

---

## Post-Deployment

### Monitor Functions
```bash
# View function logs
firebase functions:log

# View specific function
firebase functions:log --only getCareerMarketData
```

### Monitor Firestore
- Check Firebase Console → Firestore → Usage
- Monitor read/write operations
- Check for permission errors

### Monitor Hosting
- Check Firebase Console → Hosting
- View analytics
- Check for errors

---

## Updating Deployment

### Update Code
```bash
# Make your changes
git add .
git commit -m "Your changes"
git push

# Build and deploy
npm run build:prod
firebase deploy
```

### Update Functions Only
```bash
# After changing functions/index.js
npm run deploy:functions
```

### Update Hosting Only
```bash
# After changing Angular code
npm run build:prod
npm run deploy:hosting
```

---

## CI/CD Setup (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:prod
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: learner-s-career-path
```

---

## Cost Considerations

### Firebase Free Tier Limits
- **Hosting:** 10 GB storage, 360 MB/day transfer
- **Functions:** 2 million invocations/month
- **Firestore:** 1 GB storage, 50K reads/day, 20K writes/day

### Gemini API Costs
- Free tier: 15 RPM, 1000 RPD
- Paid tier: Pay per use
- Functions help manage rate limiting

---

## Support

For issues:
1. Check Firebase Console logs
2. Check browser console for errors
3. Verify API key is set: `firebase functions:config:get`
4. Test locally with emulators

---

*Last Updated: Based on current deployment setup*

