#!/usr/bin/env node

/**
 * Automated Firestore Setup Script
 * 
 * This script automatically creates all Firestore collections and documents
 * from the JSON data files.
 * 
 * Prerequisites:
 * 1. Firebase project created
 * 2. Firestore enabled
 * 3. Firebase Admin SDK credentials (service account key)
 * 
 * Usage:
 * 1. Get service account key from Firebase Console:
 *    - Project Settings > Service Accounts > Generate New Private Key
 * 2. Save as 'firebase-service-account.json' in project root
 * 3. Run: node scripts/setup-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the JSON file as "firebase-service-account.json" in project root');
  console.log('4. Run this script again\n');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to read JSON files
function readJSONFile(filename) {
  const filePath = path.join(__dirname, '..', 'firestore-data', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Warning: ${filename} not found, skipping...`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Setup Careers Collection
async function setupCareers() {
  console.log('📦 Setting up careers collection...');
  const careers = readJSONFile('careers.json');
  if (!careers) return;

  const batch = db.batch();
  const careersRef = db.collection('careers');

  for (const career of careers) {
    const docRef = careersRef.doc(career.name);
    batch.set(docRef, {
      name: career.name,
      minGrades: career.minGrades,
      countryBaselines: career.countryBaselines
    });
    console.log(`  ✓ Added career: ${career.name}`);
  }

  await batch.commit();
  console.log('✅ Careers collection setup complete!\n');
}

// Setup Countries Collection
async function setupCountries() {
  console.log('🌍 Setting up countries collection...');
  const countries = readJSONFile('countries.json');
  if (!countries) return;

  const batch = db.batch();
  const countriesRef = db.collection('countries');

  for (const country of countries) {
    const docRef = countriesRef.doc(country.code);
    batch.set(docRef, {
      code: country.code,
      name: country.name,
      flag: country.flag,
      active: country.active !== false // Default to true
    });
    console.log(`  ✓ Added country: ${country.name} (${country.code})`);
  }

  await batch.commit();
  console.log('✅ Countries collection setup complete!\n');
}

// Setup Country Subjects Collection
async function setupCountrySubjects() {
  console.log('📚 Setting up countrySubjects collection...');
  const files = fs.readdirSync(path.join(__dirname, '..', 'firestore-data'))
    .filter(f => f.startsWith('countrySubjects-') && f.endsWith('.json'));

  if (files.length === 0) {
    console.warn('⚠️  No countrySubjects files found');
    return;
  }

  const batch = db.batch();
  const subjectsRef = db.collection('countrySubjects');

  for (const file of files) {
    const countryCode = file.replace('countrySubjects-', '').replace('.json', '');
    const data = readJSONFile(file);
    if (!data) continue;

    const docRef = subjectsRef.doc(countryCode);
    batch.set(docRef, data);
    console.log(`  ✓ Added subjects for: ${countryCode}`);
  }

  await batch.commit();
  console.log('✅ CountrySubjects collection setup complete!\n');
}

// Setup Country Grade Levels Collection
async function setupCountryGradeLevels() {
  console.log('🎓 Setting up countryGradeLevels collection...');
  const files = fs.readdirSync(path.join(__dirname, '..', 'firestore-data'))
    .filter(f => f.startsWith('countryGradeLevels-') && f.endsWith('.json'));

  if (files.length === 0) {
    console.warn('⚠️  No countryGradeLevels files found');
    return;
  }

  const batch = db.batch();
  const gradeLevelsRef = db.collection('countryGradeLevels');

  for (const file of files) {
    const countryCode = file.replace('countryGradeLevels-', '').replace('.json', '');
    const data = readJSONFile(file);
    if (!data) continue;

    const docRef = gradeLevelsRef.doc(countryCode);
    batch.set(docRef, data);
    console.log(`  ✓ Added grade levels for: ${countryCode}`);
  }

  await batch.commit();
  console.log('✅ CountryGradeLevels collection setup complete!\n');
}

// Main setup function
async function setupFirestore() {
  console.log('🚀 Starting Firestore setup...\n');
  console.log('Project ID:', admin.app().options.projectId);
  console.log('');

  try {
    await setupCareers();
    await setupCountries();
    await setupCountrySubjects();
    await setupCountryGradeLevels();

    console.log('🎉 Firestore setup complete!');
    console.log('\n✅ All collections and documents have been created.');
    console.log('📱 Your app can now fetch data from Firestore!');
    console.log('\n⚠️  Remember to:');
    console.log('1. Add Firebase config to environment.ts');
    console.log('2. Set up security rules in Firebase Console');
    console.log('3. Test your app: npm start\n');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

// Run setup
setupFirestore().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});







