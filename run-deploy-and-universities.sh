#!/bin/bash
echo "🔐 Step 1: Deploying Firestore Rules..."
firebase use learner-s-career-path || firebase use --add
npm run deploy:firestore

echo ""
echo "📚 Step 2: Uploading University Data..."
node scripts/populate-all-sa-universities.js

echo ""
echo "✅ Done!"
