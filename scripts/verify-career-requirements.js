#!/usr/bin/env node

/**
 * Verify Career Requirements from Official Sources
 * 
 * This script helps verify and update career admission requirements
 * from official government and university sources.
 * 
 * Usage:
 *   node scripts/verify-career-requirements.js [career-name] [country-code]
 * 
 * Examples:
 *   node scripts/verify-career-requirements.js Doctor ZA
 *   node scripts/verify-career-requirements.js Engineer KE
 *   node scripts/verify-career-requirements.js --list-all
 *   node scripts/verify-career-requirements.js --update-all
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

// Official sources reference
const OFFICIAL_SOURCES = {
  ZA: {
    name: 'South Africa',
    sources: [
      'https://www.dhet.gov.za',
      'https://www.usaf.ac.za',
      'https://www.cao.ac.za',
      'https://www.uct.ac.za/apply/requirements',
      'https://www.wits.ac.za/study-at-wits/undergraduate/entry-requirements',
      'https://www.up.ac.za/study-at-up/article/2799996/undergraduate-admission-requirements'
    ],
    notes: 'Check individual university websites for specific requirements. Most use APS system.'
  },
  KE: {
    name: 'Kenya',
    sources: [
      'https://www.kuccps.ac.ke',
      'https://www.cue.or.ke',
      'https://www.uonbi.ac.ke/admissions'
    ],
    notes: 'Check KUCCPS for official cut-off points and requirements.'
  },
  NG: {
    name: 'Nigeria',
    sources: [
      'https://www.jamb.gov.ng',
      'https://www.nuc.edu.ng',
      'https://www.unilag.edu.ng/admissions'
    ],
    notes: 'JAMB sets minimum UTME scores. Check individual universities for specific requirements.'
  },
  GH: {
    name: 'Ghana',
    sources: [
      'https://www.gtec.gov.gh',
      'https://www.waecgh.org',
      'https://www.ug.edu.gh/admissions'
    ],
    notes: 'WASSCE requirements. Check individual universities for aggregate requirements.'
  },
  ZW: {
    name: 'Zimbabwe',
    sources: [
      'https://www.mhtestd.gov.zw',
      'https://www.zimsec.co.zw',
      'https://www.uz.ac.zw/admissions'
    ],
    notes: 'A-Level and O-Level requirements. Check individual universities.'
  },
  ET: {
    name: 'Ethiopia',
    sources: [
      'https://www.moe.gov.et',
      'https://www.herqa.gov.et',
      'https://www.aau.edu.et/admissions'
    ],
    notes: 'EHEEE requirements. Check individual universities for specific requirements.'
  },
  EG: {
    name: 'Egypt',
    sources: [
      'https://www.mohesr.gov.eg',
      'https://www.scu.eg',
      'https://www.cu.edu.eg/admissions'
    ],
    notes: 'Thanaweya Amma requirements. Check individual universities.'
  }
};

// Create readline interface for user input
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
 * Display official sources for a country
 */
function displaySources(countryCode) {
  const country = OFFICIAL_SOURCES[countryCode];
  if (!country) {
    console.log(`❌ No sources found for country code: ${countryCode}`);
    return;
  }

  console.log(`\n📚 Official Sources for ${country.name} (${countryCode}):\n`);
  country.sources.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
  if (country.notes) {
    console.log(`\n   📝 Notes: ${country.notes}\n`);
  }
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
      console.log(`   ${index + 1}. ${statusIcon} ${career.name} (${career.category || 'No category'}) - ${status}`);
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
  console.log(`\n   Default Requirements:`);
  Object.entries(career.minGrades || {}).forEach(([subject, grade]) => {
    console.log(`      ${subject}: ${grade}%`);
  });

  if (career.countryBaselines) {
    console.log(`\n   Country-Specific Requirements:`);
    Object.entries(career.countryBaselines).forEach(([countryCode, requirements]) => {
      const country = OFFICIAL_SOURCES[countryCode];
      const countryName = country ? country.name : countryCode;
      console.log(`\n      ${countryName} (${countryCode}):`);
      Object.entries(requirements).forEach(([subject, grade]) => {
        console.log(`         ${subject}: ${grade}%`);
      });

      // Display source if available
      if (career.sources && career.sources[countryCode]) {
        const source = career.sources[countryCode];
        console.log(`\n         📚 Source:`);
        if (source.institution) {
          console.log(`            Institution: ${source.institution}`);
        }
        if (source.url) {
          console.log(`            URL: ${source.url}`);
        }
        if (source.verifiedDate) {
          console.log(`            Verified: ${source.verifiedDate}`);
        }
        if (source.notes) {
          console.log(`            Notes: ${source.notes}`);
        }
      }
    });
  }
  console.log();
}

/**
 * Interactive verification
 */
async function verifyCareer(careerName, countryCode) {
  console.log(`\n🔍 Verifying: ${careerName} for ${countryCode}\n`);

  const career = await getCareer(careerName);
  if (!career) {
    console.log(`❌ Career "${careerName}" not found in database.`);
    return;
  }

  displayCareer(career);
  displaySources(countryCode);

  console.log(`\n📝 Please verify the requirements from the official sources above.`);
  console.log(`   Then provide the verified requirements:\n`);

  const hasChanges = await question('   Do you have updated requirements? (y/n): ');
  if (hasChanges.toLowerCase() !== 'y') {
    console.log('\n   ✅ No changes needed.\n');
    rl.close();
    return;
  }

  // Get updated requirements
  const requirements = {};
  console.log(`\n   Enter requirements for ${countryCode} (press Enter to skip, type 'done' when finished):\n`);

  while (true) {
    const input = await question('   Subject and grade (e.g., "Math: 70"): ');
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

  if (Object.keys(requirements).length === 0) {
    console.log('\n   ⚠️  No requirements entered.\n');
    rl.close();
    return;
  }

  // Get source information
  console.log(`\n   📚 Source Information:\n`);
  const sourceUrl = await question('   Source URL (press Enter to skip): ');
  const institution = await question('   Institution name (e.g., "University of Cape Town", press Enter to skip): ');
  const notes = await question('   Additional notes (press Enter to skip): ');

  // Update career
  const updateData = {
    [`countryBaselines.${countryCode}`]: requirements,
    lastVerified: new Date().toISOString().split('T')[0],
    verificationStatus: 'verified'
  };

  if (sourceUrl || institution || notes) {
    if (!updateData.sources) {
      updateData.sources = {};
    }
    updateData.sources[countryCode] = {
      ...(sourceUrl && { url: sourceUrl }),
      ...(institution && { institution: institution }),
      ...(notes && { notes: notes }),
      verifiedDate: new Date().toISOString().split('T')[0]
    };
  }

  const confirm = await question(`\n   Confirm update? (y/n): `);
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n   ❌ Update cancelled.\n');
    rl.close();
    return;
  }

  try {
    await db.collection('careers').doc(careerName).update(updateData);
    console.log(`\n   ✅ Successfully updated ${careerName} for ${countryCode}!\n`);
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
📋 Career Requirements Verification Script

Usage:
  node scripts/verify-career-requirements.js [career-name] [country-code]
  node scripts/verify-career-requirements.js --list-all
  node scripts/verify-career-requirements.js --help

Examples:
  node scripts/verify-career-requirements.js Doctor ZA
  node scripts/verify-career-requirements.js Engineer KE
  node scripts/verify-career-requirements.js --list-all

Options:
  --list-all    List all careers in the database
  --help        Show this help message

Country Codes:
  ZA - South Africa
  KE - Kenya
  NG - Nigeria
  GH - Ghana
  ZW - Zimbabwe
  ET - Ethiopia
  EG - Egypt
    `);
    process.exit(0);
  }

  if (args.length < 2) {
    console.error('❌ Error: Please provide career name and country code');
    console.log('   Usage: node scripts/verify-career-requirements.js [career-name] [country-code]');
    console.log('   Example: node scripts/verify-career-requirements.js Doctor ZA');
    process.exit(1);
  }

  const careerName = args[0];
  const countryCode = args[1].toUpperCase();

  if (!OFFICIAL_SOURCES[countryCode]) {
    console.error(`❌ Error: Unknown country code: ${countryCode}`);
    console.log(`   Supported codes: ${Object.keys(OFFICIAL_SOURCES).join(', ')}`);
    process.exit(1);
  }

  await verifyCareer(careerName, countryCode);
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


