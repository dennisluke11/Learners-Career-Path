#!/bin/bash

# Fix npm cache permissions (requires sudo)
echo "Fixing npm cache permissions..."
sudo chown -R $(whoami) ~/.npm

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Setup complete! Run 'npm start' to start the development server."





