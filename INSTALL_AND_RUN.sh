#!/bin/bash

# Script to install firebase-admin and run import

echo "🔧 Installing firebase-admin..."

# Try to install with npm
if npm install firebase-admin --save-dev --legacy-peer-deps 2>/dev/null; then
    echo "✅ firebase-admin installed successfully!"
else
    echo "⚠️  npm install failed, trying with sudo..."
    if sudo npm install firebase-admin --save-dev --legacy-peer-deps; then
        echo "✅ firebase-admin installed with sudo!"
    else
        echo "❌ Installation failed. Please run manually:"
        echo "   sudo chown -R \$(whoami) ~/.npm"
        echo "   npm install firebase-admin --save-dev --legacy-peer-deps"
        exit 1
    fi
fi

echo ""
echo "🚀 Running import script..."
node scripts/setup-firestore.js





