/**
 * Script to load environment variables from .env file
 * Run this before building: node scripts/load-env.js
 */

const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Update environment.ts
const envTsPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
let envContent = fs.readFileSync(envTsPath, 'utf8');

// Replace API keys from .env
if (envVars.GEMINI_API_KEY) {
  envContent = envContent.replace(
    /geminiApiKey:\s*['"][^'"]*['"],?\s*\/\/.*/,
    `geminiApiKey: '${envVars.GEMINI_API_KEY}', // Loaded from .env`
  );
}

if (envVars.OPENAI_API_KEY) {
  envContent = envContent.replace(
    /openaiApiKey:\s*['"][^'"]*['"],?\s*\/\/.*/,
    `openaiApiKey: '${envVars.OPENAI_API_KEY}', // Loaded from .env`
  );
}

fs.writeFileSync(envTsPath, envContent, 'utf8');
console.log('✅ Environment variables loaded from .env file');

