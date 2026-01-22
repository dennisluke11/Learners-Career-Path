#!/bin/bash

# Deploy Firestore Rules Script
# This script deploys your Firestore security rules to Firebase

echo "🔐 Deploying Firestore Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI is not installed"
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Error: Not logged in to Firebase"
    echo "   Login with: firebase login"
    exit 1
fi

# List available projects
echo "📋 Available Firebase projects:"
firebase projects:list
echo ""

# Check if project is set
CURRENT_PROJECT=$(firebase use 2>&1 | grep -i "using" | awk '{print $NF}')
if [ -z "$CURRENT_PROJECT" ]; then
    echo "⚠️  No active project set"
    echo "   Setting up project..."
    firebase use --add
else
    echo "✅ Current project: $CURRENT_PROJECT"
fi

echo ""
echo "🚀 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully deployed Firestore rules!"
    echo "   Your app should now have proper permissions."
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi


