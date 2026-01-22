#!/usr/bin/env node

/**
 * Verify Career Requirements for South Africa (ZA) with Qualification Levels
 * 
 * This script helps verify and update career admission requirements
 * from official government and university sources, with support for
 * qualification levels: Degree, BTech, Diploma, Certificate
 * 
 * Usage:
 *   node scripts/verify-career-requirements-za.js [career-name]
 * 
 * Examples:
 *   node scripts/verify-career-requirements-za.js Doctor
 *   node scripts/verify-career-requirements-za.js Engineer
 *   node scripts/verify-career-requirements-za.js --list-all
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save as "serviceAccountKey.json" in project root\n');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const COUNTRY_CODE = 'ZA';

// Qualification levels for South Africa
const QUALIFICATION_LEVELS = {
  'Degree': {
    name: 'Bachelor\'s Degree',
    nqfLevel: 7,
    minGovtRequirement: '4 subjects at 50-59% (Rating 4), Language 30%',
    description: 'University degree programs (e.g., MBChB, BSc, BA, LLB)'
  },
  'BTech': {
    name: 'Bachelor of Technology',
    nqfLevel: 7,
    minGovtRequirement: '4 subjects at 50-59% (Rating 4), Language 30%',
    description: 'Technology-focused degree programs at Universities of Technology'
  },
  'Diploma': {
    name: 'Diploma',
    nqfLevel: 6,
    minGovtRequirement: '4 subjects at 40-49% (Rating 3), Language 30%',
    description: 'Diploma programs at Universities of Technology and TVET colleges'
  },
  'Certificate': {
    name: 'Higher Certificate',
    nqfLevel: 5,
    minGovtRequirement: 'NSC with Language 30%, program-specific requirements',
    description: 'Entry-level certificate programs'
  }
};

// Official sources for South Africa
const OFFICIAL_SOURCES = [
  'https://www.dhet.gov.za - Department of Higher Education and Training',
  'https://www.usaf.ac.za - Universities South Africa',
  'https://www.saqa.org.za - South African Qualifications Authority',
  'https://www.umalusi.org.za - Umalusi (Quality Assurance)',
  'https://api.acts.co.za/higher-education-act-1997/n751_4__minimum_requirements_for_admission_to_the_higher_certificate_diploma_and_bachelor_s_degree.php - Higher Education Act',
  'https://www.uct.ac.za/apply/requirements - University of Cape Town',
  'https://www.wits.ac.za/study-at-wits/undergraduate/entry-requirements - University of the Witwatersrand',
  'https://www.up.ac.za/study-at-up/article/2799996/undergraduate-admission-requirements - University of Pretoria',
  'https://www.sun.ac.za/english/study/apply/undergraduate - Stellenbosch University',
  'https://www.uj.ac.za/study/undergraduate/entry-requirements - University of Johannesburg'
];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Display qualification levels
 */
function displayQualificationLevels() {
  console.log('\n📚 Qualification Levels in South Africa:\n');
  Object.entries(QUALIFICATION_LEVELS).forEach(([key, level]) => {
    console.log(`   ${key} (NQF Level ${level.nqfLevel}):`);
    console.log(`      ${level.name}`);
    console.log(`      ${level.description}`);
    console.log(`      Government Minimum: ${level.minGovtRequirement}\n`);
  });
}

/**
 * Display official sources
 */
function displaySources() {
  console.log('\n📚 Official Sources for South Africa:\n');
  OFFICIAL_SOURCES.forEach((source, index) => {
    console.log(`   ${index + 1}. ${source}`);
  });
  console.log('\n   See SOUTH_AFRICA_QUALIFICATION_LEVELS.md for detailed information.\n');
}

/**
 * Get career from Firestore
 */
async function getCareer(careerName) {
  try {
    const doc = await db.collection('careers').doc(careerName).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`❌ Error fetching career: ${error.message}`);
    return null;
  }
}

/**
 * List all careers
 */
async function listAllCareers() {
  try {
    const snapshot = await db.collection('careers').get();
    const careers = [];
    snapshot.forEach(doc => {
      careers.push({ id: doc.id, ...doc.data() });
    });

    console.log(`\n📋 Found ${careers.length} careers:\n`);
    careers.forEach((career, index) => {
      const status = career.verificationStatus || 'estimated';
      const statusIcon = status === 'verified' ? '✅' : status === 'needs-review' ? '⚠️' : '❓';
      
      // Check if has qualification levels for ZA
      const hasQualLevels = career.qualificationLevels && career.qualificationLevels[COUNTRY_CODE];
      const qualInfo = hasQualLevels ? ` (${career.qualificationLevels[COUNTRY_CODE].length} qualification levels)` : '';
      
      console.log(`   ${index + 1}. ${statusIcon} ${career.name} (${career.category || 'No category'}) - ${status}${qualInfo}`);
    });
    console.log();
    return careers;
  } catch (error) {
    console.error(`❌ Error listing careers: ${error.message}`);
    return [];
  }
}

/**
 * Display career details
 */
function displayCareer(career) {
  console.log(`\n📋 Career: ${career.name}`);
  console.log(`   Category: ${career.category || 'Not specified'}`);
  console.log(`   Status: ${career.verificationStatus || 'estimated'}`);
  if (career.lastVerified) {
    console.log(`   Last Verified: ${career.lastVerified}`);
  }

  // Display qualification levels if available
  if (career.qualificationLevels && career.qualificationLevels[COUNTRY_CODE]) {
    console.log(`\n   Qualification Levels for South Africa:`);
    career.qualificationLevels[COUNTRY_CODE].forEach((qual, index) => {
      console.log(`\n      ${index + 1}. ${qual.level} (NQF Level ${qual.nqfLevel || 'N/A'}):`);
      Object.entries(qual.minGrades || {}).forEach(([subject, grade]) => {
        console.log(`         ${subject}: ${grade}%`);
      });
      if (qual.aps) {
        console.log(`         APS: ${qual.aps}+`);
      }
      if (qual.notes) {
        console.log(`         Notes: ${qual.notes}`);
      }
      if (qual.sources) {
        console.log(`         Source: ${qual.sources.institution || qual.sources.url || 'Not specified'}`);
        if (qual.sources.verifiedDate) {
          console.log(`         Verified: ${qual.sources.verifiedDate}`);
        }
      }
    });
  } else {
    // Display legacy countryBaselines if available
    if (career.countryBaselines && career.countryBaselines[COUNTRY_CODE]) {
      console.log(`\n   Current Requirements (Legacy Format):`);
      Object.entries(career.countryBaselines[COUNTRY_CODE]).forEach(([subject, grade]) => {
        console.log(`      ${subject}: ${grade}%`);
      });
    } else {
      console.log(`\n   Default Requirements:`);
      Object.entries(career.minGrades || {}).forEach(([subject, grade]) => {
        console.log(`      ${subject}: ${grade}%`);
      });
    }
  }
  console.log();
}

/**
 * Collect qualification level requirements
 */
async function collectQualificationLevel() {
  console.log('\n📝 Select Qualification Level:\n');
  const levels = Object.keys(QUALIFICATION_LEVELS);
  levels.forEach((level, index) => {
    const info = QUALIFICATION_LEVELS[level];
    console.log(`   ${index + 1}. ${level} (NQF ${info.nqfLevel}) - ${info.name}`);
  });
  
  const choice = await question('\n   Enter number (1-4) or level name: ');
  
  let selectedLevel = null;
  const choiceNum = parseInt(choice);
  if (choiceNum >= 1 && choiceNum <= levels.length) {
    selectedLevel = levels[choiceNum - 1];
  } else if (levels.includes(choice)) {
    selectedLevel = choice;
  } else {
    console.log('   ⚠️  Invalid choice, using "Degree" as default');
    selectedLevel = 'Degree';
  }
  
  return selectedLevel;
}

/**
 * Collect requirements for a qualification level
 */
async function collectRequirements(qualificationLevel) {
  const levelInfo = QUALIFICATION_LEVELS[qualificationLevel];
  console.log(`\n📝 Entering requirements for ${qualificationLevel} (${levelInfo.name}):\n`);
  console.log(`   Government Minimum: ${levelInfo.minGovtRequirement}`);
  console.log(`   Enter specific program requirements (press Enter to skip, type 'done' when finished):\n`);

  const requirements = {};
  
  while (true) {
    const input = await question('   Subject and grade (e.g., "Math: 70" or "Mathematics: 70"): ');
    if (input.toLowerCase() === 'done' || input === '') {
      break;
    }

    const match = input.match(/(.+?):\s*(\d+)/);
    if (match) {
      const subject = match[1].trim();
      const grade = parseInt(match[2]);
      requirements[subject] = grade;
      console.log(`      ✅ ${subject}: ${grade}%`);
    } else {
      console.log(`      ⚠️  Invalid format. Use "Subject: Grade" (e.g., "Math: 70")`);
    }
  }

  // Ask for APS if applicable
  let aps = null;
  const apsInput = await question('\n   APS (Admission Point Score) requirement (press Enter to skip): ');
  if (apsInput && !isNaN(apsInput)) {
    aps = parseInt(apsInput);
    console.log(`      ✅ APS: ${aps}+`);
  }

  // Ask for notes
  const notes = await question('\n   Additional notes (e.g., "Mathematics required, not Mathematical Literacy", press Enter to skip): ');
  
  return { requirements, aps, notes };
}

/**
 * Collect source information
 */
async function collectSourceInfo() {
  console.log(`\n   📚 Source Information:\n`);
  const sourceUrl = await question('   Source URL (press Enter to skip): ');
  const institution = await question('   Institution name (e.g., "University of Cape Town", press Enter to skip): ');
  const sourceNotes = await question('   Additional source notes (press Enter to skip): ');

  return {
    url: sourceUrl || undefined,
    institution: institution || undefined,
    notes: sourceNotes || undefined,
    verifiedDate: new Date().toISOString().split('T')[0]
  };
}

/**
 * Interactive verification with qualification levels
 */
async function verifyCareer(careerName) {
  console.log(`\n🔍 Verifying: ${careerName} for South Africa (ZA)\n`);

  const career = await getCareer(careerName);
  if (!career) {
    console.log(`❌ Career "${careerName}" not found in database.`);
    return;
  }

  displayCareer(career);
  displayQualificationLevels();
  displaySources();

  console.log(`\n📝 Please verify the requirements from the official sources above.`);
  console.log(`   You can add multiple qualification levels for this career.\n`);

  const hasChanges = await question('   Do you want to add/update qualification levels? (y/n): ');
  if (hasChanges.toLowerCase() !== 'y') {
    console.log('\n   ✅ No changes needed.\n');
    rl.close();
    return;
  }

  // Initialize qualificationLevels if not exists
  if (!career.qualificationLevels) {
    career.qualificationLevels = {};
  }
  if (!career.qualificationLevels[COUNTRY_CODE]) {
    career.qualificationLevels[COUNTRY_CODE] = [];
  }

  const qualificationLevels = [];

  // Collect multiple qualification levels
  while (true) {
    const qualLevel = await collectQualificationLevel();
    const { requirements, aps, notes } = await collectRequirements(qualLevel);
    const sources = await collectSourceInfo();

    if (Object.keys(requirements).length === 0) {
      console.log('\n   ⚠️  No requirements entered. Skipping this qualification level.');
    } else {
      qualificationLevels.push({
        level: qualLevel,
        nqfLevel: QUALIFICATION_LEVELS[qualLevel].nqfLevel,
        minGrades: requirements,
        ...(aps && { aps }),
        ...(notes && { notes }),
        sources
      });
      console.log(`\n   ✅ Added ${qualLevel} requirements`);
    }

    const addMore = await question('\n   Add another qualification level? (y/n): ');
    if (addMore.toLowerCase() !== 'y') {
      break;
    }
  }

  if (qualificationLevels.length === 0) {
    console.log('\n   ⚠️  No qualification levels added.\n');
    rl.close();
    return;
  }

  // Confirm update
  console.log(`\n📋 Summary of changes:\n`);
  qualificationLevels.forEach((qual, index) => {
    console.log(`   ${index + 1}. ${qual.level} (NQF ${qual.nqfLevel}):`);
    Object.entries(qual.minGrades).forEach(([subject, grade]) => {
      console.log(`      ${subject}: ${grade}%`);
    });
    if (qual.aps) {
      console.log(`      APS: ${qual.aps}+`);
    }
  });

  const confirm = await question(`\n   Confirm update? (y/n): `);
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n   ❌ Update cancelled.\n');
    rl.close();
    return;
  }

  // Update career
  try {
    // Merge with existing qualification levels
    const existingLevels = career.qualificationLevels[COUNTRY_CODE] || [];
    const updatedLevels = [...existingLevels, ...qualificationLevels];

    const updateData = {
      [`qualificationLevels.${COUNTRY_CODE}`]: updatedLevels,
      lastVerified: new Date().toISOString().split('T')[0],
      verificationStatus: 'verified'
    };

    await db.collection('careers').doc(careerName).update(updateData);
    console.log(`\n   ✅ Successfully updated ${careerName} for ${COUNTRY_CODE}!\n`);
    console.log(`   Added ${qualificationLevels.length} qualification level(s).\n`);
  } catch (error) {
    console.error(`\n   ❌ Error updating: ${error.message}\n`);
  }

  rl.close();
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list-all')) {
    await listAllCareers();
    process.exit(0);
  }

  if (args.includes('--help') || args.length === 0) {
    console.log(`
📋 Career Requirements Verification Script for South Africa

Usage:
  node scripts/verify-career-requirements-za.js [career-name]
  node scripts/verify-career-requirements-za.js --list-all
  node scripts/verify-career-requirements-za.js --help

Examples:
  node scripts/verify-career-requirements-za.js Doctor
  node scripts/verify-career-requirements-za.js Engineer
  node scripts/verify-career-requirements-za.js --list-all

Qualification Levels:
  - Degree (NQF 7): Bachelor's Degree programs
  - BTech (NQF 7): Bachelor of Technology programs
  - Diploma (NQF 6): Diploma programs
  - Certificate (NQF 5): Higher Certificate programs

See SOUTH_AFRICA_QUALIFICATION_LEVELS.md for detailed information.
    `);
    process.exit(0);
  }

  const careerName = args[0];
  await verifyCareer(careerName);
}

// Run
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

