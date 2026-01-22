#!/usr/bin/env node

/**
 * Check for Stale Career Verification Data
 * 
 * This script identifies careers that need re-verification based on:
 * - Age of verification (older than threshold)
 * - Missing verification status
 * - Estimated/unverified data
 * 
 * Usage:
 *   node scripts/check-stale-verification.js
 *   node scripts/check-stale-verification.js --days 180
 *   node scripts/check-stale-verification.js --country ZA
 * 
 * Run this monthly to ensure data stays current!
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const daysIndex = args.indexOf('--days');
const countryIndex = args.indexOf('--country');

const VERIFICATION_THRESHOLD_DAYS = daysIndex !== -1 ? parseInt(args[daysIndex + 1]) : 365;
const FILTER_COUNTRY = countryIndex !== -1 ? args[countryIndex + 1] : null;

/**
 * Calculate days since a date
 */
function daysSince(dateString) {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

/**
 * Get verification status emoji
 */
function getStatusEmoji(status) {
  switch (status) {
    case 'verified': return '✅';
    case 'needs-review': return '⚠️';
    case 'estimated': return '❓';
    default: return '❌';
  }
}

/**
 * Analyze career verification status
 */
function analyzeCareer(career, countryCode = null) {
  const issues = [];
  const warnings = [];
  
  // Check verification status
  if (!career.verificationStatus) {
    issues.push('No verification status set');
  } else if (career.verificationStatus === 'estimated') {
    issues.push('Data is estimated, not verified');
  } else if (career.verificationStatus === 'needs-review') {
    warnings.push('Marked as needs review');
  }
  
  // Check last verified date
  const daysOld = daysSince(career.lastVerified);
  if (daysOld === Infinity) {
    issues.push('No verification date recorded');
  } else if (daysOld > VERIFICATION_THRESHOLD_DAYS) {
    issues.push(`Verified ${daysOld} days ago (threshold: ${VERIFICATION_THRESHOLD_DAYS} days)`);
  } else if (daysOld > VERIFICATION_THRESHOLD_DAYS * 0.8) {
    warnings.push(`Verification expiring soon (${daysOld} days old)`);
  }
  
  // Check qualification levels for specific country
  if (countryCode) {
    if (!career.qualificationLevels || !career.qualificationLevels[countryCode]) {
      if (!career.countryBaselines || !career.countryBaselines[countryCode]) {
        issues.push(`No requirements for country: ${countryCode}`);
      } else {
        warnings.push(`Using legacy countryBaselines format for ${countryCode}`);
      }
    } else {
      // Check each qualification level
      const levels = career.qualificationLevels[countryCode];
      levels.forEach((level, index) => {
        if (!level.sources) {
          warnings.push(`${level.level}: No source attribution`);
        } else if (!level.sources.url) {
          warnings.push(`${level.level}: No source URL`);
        }
        if (!level.minGrades || Object.keys(level.minGrades).length === 0) {
          issues.push(`${level.level}: No grade requirements specified`);
        }
      });
    }
  }
  
  return { issues, warnings, daysOld };
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Checking for Stale Career Verification Data\n');
  console.log(`📅 Threshold: ${VERIFICATION_THRESHOLD_DAYS} days`);
  if (FILTER_COUNTRY) {
    console.log(`🌍 Country filter: ${FILTER_COUNTRY}`);
  }
  console.log('\n' + '='.repeat(70) + '\n');

  try {
    const snapshot = await db.collection('careers').get();
    const careers = [];
    snapshot.forEach(doc => {
      careers.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📋 Found ${careers.length} careers in database\n`);

    // Categorize careers
    const critical = [];   // Issues that need immediate attention
    const warning = [];    // Warnings that should be addressed
    const healthy = [];    // All good

    careers.forEach(career => {
      const analysis = analyzeCareer(career, FILTER_COUNTRY || 'ZA');
      
      if (analysis.issues.length > 0) {
        critical.push({ career, analysis });
      } else if (analysis.warnings.length > 0) {
        warning.push({ career, analysis });
      } else {
        healthy.push({ career, analysis });
      }
    });

    // Display critical issues
    if (critical.length > 0) {
      console.log('🔴 CRITICAL - Needs Immediate Attention:\n');
      critical.forEach(({ career, analysis }) => {
        const emoji = getStatusEmoji(career.verificationStatus);
        console.log(`   ${emoji} ${career.name} (${career.category || 'No category'})`);
        analysis.issues.forEach(issue => {
          console.log(`      ❌ ${issue}`);
        });
        analysis.warnings.forEach(warn => {
          console.log(`      ⚠️  ${warn}`);
        });
        console.log();
      });
    }

    // Display warnings
    if (warning.length > 0) {
      console.log('🟡 WARNINGS - Should Be Addressed:\n');
      warning.forEach(({ career, analysis }) => {
        const emoji = getStatusEmoji(career.verificationStatus);
        console.log(`   ${emoji} ${career.name} (${career.category || 'No category'})`);
        analysis.warnings.forEach(warn => {
          console.log(`      ⚠️  ${warn}`);
        });
        console.log();
      });
    }

    // Display healthy careers
    if (healthy.length > 0) {
      console.log('🟢 HEALTHY - No Issues:\n');
      healthy.forEach(({ career, analysis }) => {
        const daysAgo = analysis.daysOld === Infinity ? 'N/A' : `${analysis.daysOld} days ago`;
        console.log(`   ✅ ${career.name} - Last verified: ${daysAgo}`);
      });
      console.log();
    }

    // Summary
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY:\n');
    console.log(`   🔴 Critical issues: ${critical.length} careers`);
    console.log(`   🟡 Warnings: ${warning.length} careers`);
    console.log(`   🟢 Healthy: ${healthy.length} careers`);
    console.log(`   📋 Total: ${careers.length} careers\n`);

    // Health score
    const healthScore = Math.round((healthy.length / careers.length) * 100);
    console.log(`   📈 Data Health Score: ${healthScore}%`);
    
    if (healthScore >= 90) {
      console.log('   ✨ Excellent! Your data is in great shape.\n');
    } else if (healthScore >= 70) {
      console.log('   👍 Good, but some attention needed.\n');
    } else if (healthScore >= 50) {
      console.log('   ⚠️  Needs improvement. Run verification scripts.\n');
    } else {
      console.log('   🚨 Critical! Most data needs verification.\n');
    }

    // Recommendations
    if (critical.length > 0) {
      console.log('📋 RECOMMENDED ACTIONS:\n');
      console.log('   1. Run batch verification for critical careers:');
      console.log('      node scripts/batch-verify-za-careers-extended.js\n');
      console.log('   2. Manually verify individual careers:');
      critical.slice(0, 3).forEach(({ career }) => {
        console.log(`      node scripts/verify-career-requirements-za.js "${career.name}"`);
      });
      console.log();
    }

    // Exit with appropriate code
    if (critical.length > 0) {
      process.exit(1); // Useful for CI/CD pipelines
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
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

