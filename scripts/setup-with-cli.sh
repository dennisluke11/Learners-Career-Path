#!/bin/bash

# Alternative setup using Firebase CLI
# This method uses Firebase CLI instead of Admin SDK

echo "🚀 Firestore Setup using Firebase CLI"
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

echo ""
echo "📋 Next steps:"
echo "1. Initialize Firebase in this project:"
echo "   firebase init firestore"
echo ""
echo "2. Select your Firebase project"
echo "3. Choose 'firestore.rules' and 'firestore.indexes.json'"
echo "4. Use the setup-firestore.js script to import data"
echo ""
echo "Or use the automated script:"
echo "   node scripts/setup-firestore.js"
echo ""





