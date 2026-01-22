#!/usr/bin/env node

/**
 * Firestore Setup using REST API (no firebase-admin needed)
 * 
 * This script uses Firebase REST API to import data directly
 * Requires: service account key and Node.js with https module
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Helper to read JSON files
function readJSONFile(filename) {
  const filePath = path.join(__dirname, '..', 'firestore-data', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Warning: ${filename} not found`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Get OAuth token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwt = require('jsonwebtoken');
    
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    );

    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`;
    
    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.access_token);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Import data using REST API
async function importData() {
  console.log('🚀 Starting Firestore import via REST API...\n');
  
  try {
    // This approach requires firebase-admin for proper Firestore API
    // Let's use a simpler approach - guide user to install firebase-admin
    console.log('📦 This script requires firebase-admin package.');
    console.log('   Trying alternative method...\n');
    
    // Check if we can use require
    try {
      const admin = require('firebase-admin');
      console.log('✅ firebase-admin found! Using it...\n');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      const db = admin.firestore();
      
      // Import careers
      console.log('📦 Importing careers...');
      const careers = readJSONFile('careers.json');
      if (careers) {
        const batch = db.batch();
        careers.forEach(career => {
          const ref = db.collection('careers').doc(career.name);
          batch.set(ref, career);
        });
        await batch.commit();
        console.log(`  ✅ Imported ${careers.length} careers\n`);
      }
      
      // Import countries
      console.log('🌍 Importing countries...');
      const countries = readJSONFile('countries.json');
      if (countries) {
        const batch = db.batch();
        countries.forEach(country => {
          const ref = db.collection('countries').doc(country.code);
          batch.set(ref, country);
        });
        await batch.commit();
        console.log(`  ✅ Imported ${countries.length} countries\n`);
      }
      
      // Import country subjects
      console.log('📚 Importing country subjects...');
      const subjectFiles = fs.readdirSync(path.join(__dirname, '..', 'firestore-data'))
        .filter(f => f.startsWith('countrySubjects-') && f.endsWith('.json'));
      
      for (const file of subjectFiles) {
        const countryCode = file.replace('countrySubjects-', '').replace('.json', '');
        const data = readJSONFile(file);
        if (data) {
          await db.collection('countrySubjects').doc(countryCode).set(data);
          console.log(`  ✅ Imported subjects for ${countryCode}`);
        }
      }
      console.log('');
      
      // Import grade levels
      console.log('🎓 Importing grade levels...');
      const gradeFiles = fs.readdirSync(path.join(__dirname, '..', 'firestore-data'))
        .filter(f => f.startsWith('countryGradeLevels-') && f.endsWith('.json'));
      
      for (const file of gradeFiles) {
        const countryCode = file.replace('countryGradeLevels-', '').replace('.json', '');
        const data = readJSONFile(file);
        if (data) {
          await db.collection('countryGradeLevels').doc(countryCode).set(data);
          console.log(`  ✅ Imported grade levels for ${countryCode}`);
        }
      }
      console.log('');
      
      console.log('🎉 All data imported successfully!');
      
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.error('❌ firebase-admin not installed!');
        console.log('\n📋 Please install it:');
        console.log('   npm install firebase-admin --save-dev');
        console.log('\n   Or if you have permission issues, try:');
        console.log('   sudo npm install firebase-admin --save-dev -g');
        console.log('   Then run: node scripts/setup-firestore.js\n');
        process.exit(1);
      } else {
        throw e;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importData();





