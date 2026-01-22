#!/bin/bash
echo "🔧 Deploying Firestore Security Rules..."
echo ""
echo "Step 1: Checking Firebase login..."
if ! firebase projects:list &>/dev/null; then
  echo "❌ Not logged in. Please run: firebase login"
  exit 1
fi
echo "✅ Logged in"
echo ""
echo "Step 2: Setting active project..."
firebase use learner-s-career-path || firebase use --add
echo ""
echo "Step 3: Deploying Firestore rules..."
firebase deploy --only firestore:rules
echo ""
echo "✅ Done! Rules should be active within 1-2 minutes."
