#!/usr/bin/env node

/**
 * Verify All Firestore Data
 * 
 * This script checks all Firestore collections to ensure:
 * 1. All career requirements are marked as verified
 * 2. All market data exists and is not using hardcoded fallbacks
 * 3. All university data is verified
 * 4. All study resources are populated
 * 
 * Usage: node scripts/verify-all-firestore-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
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

const TODAY = new Date().toISOString().split('T')[0];
const MAX_VERIFICATION_AGE_DAYS = 365; // 1 year

async function verifyCareers() {
  console.log('📋 Verifying Careers Collection...\n');
  
  const careersSnapshot = await db.collection('careers').get();
  const issues = [];
  const verified = [];
  const needsReview = [];
  const estimated = [];
  
  for (const doc of careersSnapshot.docs) {
    const data = doc.data();
    const careerName = data.name || doc.id;
    
    // Check verification status
    const verificationStatus = data.verificationStatus || 'estimated';
    const lastVerified = data.lastVerified;
    
    if (verificationStatus === 'estimated') {
      estimated.push({ name: careerName, id: doc.id });
    } else if (verificationStatus === 'needs-review') {
      needsReview.push({ name: careerName, id: doc.id });
    } else if (verificationStatus === 'verified') {
      // Check if verification is stale
      if (lastVerified) {
        const verifiedDate = new Date(lastVerified);
        const daysSinceVerification = Math.floor((new Date() - verifiedDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceVerification > MAX_VERIFICATION_AGE_DAYS) {
          issues.push({
            career: careerName,
            issue: `Verification is ${daysSinceVerification} days old (older than ${MAX_VERIFICATION_AGE_DAYS} days)`,
            id: doc.id
          });
        } else {
          verified.push({ name: careerName, daysOld: daysSinceVerification });
        }
      } else {
        issues.push({
          career: careerName,
          issue: 'Marked as verified but missing lastVerified date',
          id: doc.id
        });
      }
    }
    
    // Check for qualification levels
    if (!data.qualificationLevels || Object.keys(data.qualificationLevels).length === 0) {
      issues.push({
        career: careerName,
        issue: 'Missing qualificationLevels',
        id: doc.id
      });
    }
  }
  
  console.log(`   ✅ Verified: ${verified.length}`);
  console.log(`   ⚠️  Needs Review: ${needsReview.length}`);
  console.log(`   ❓ Estimated: ${estimated.length}`);
  console.log(`   ❌ Issues: ${issues.length}\n`);
  
  if (issues.length > 0) {
    console.log('   Issues found:');
    issues.forEach(issue => {
      console.log(`      - ${issue.career}: ${issue.issue}`);
    });
    console.log('');
  }
  
  return { verified, needsReview, estimated, issues, total: careersSnapshot.size };
}

async function verifyMarketData() {
  console.log('💰 Verifying Market Data Collection...\n');
  
  const marketDataSnapshot = await db.collection('marketData').get();
  const missing = [];
  const hasData = [];
  
  // Get all careers
  const careersSnapshot = await db.collection('careers').get();
  const careerNames = careersSnapshot.docs.map(doc => doc.data().name || doc.id);
  
  const countries = ['KE', 'NG', 'ZA', 'ZW', 'ET', 'EG'];
  
  for (const careerName of careerNames) {
    for (const countryCode of countries) {
      const docId = `${careerName}_${countryCode}`;
      const doc = marketDataSnapshot.docs.find(d => d.id === docId);
      
      if (!doc) {
        missing.push({ career: careerName, country: countryCode });
      } else {
        const data = doc.data();
        if (!data.salaryRangesByLevel || !data.totalJobCount) {
          missing.push({ career: careerName, country: countryCode, issue: 'Incomplete data' });
        } else {
          hasData.push({ career: careerName, country: countryCode });
        }
      }
    }
  }
  
  console.log(`   ✅ Has Data: ${hasData.length}`);
  console.log(`   ❌ Missing/Incomplete: ${missing.length}\n`);
  
  if (missing.length > 0) {
    console.log('   Missing market data:');
    missing.slice(0, 10).forEach(item => {
      console.log(`      - ${item.career} (${item.country})${item.issue ? ': ' + item.issue : ''}`);
    });
    if (missing.length > 10) {
      console.log(`      ... and ${missing.length - 10} more`);
    }
    console.log('');
  }
  
  return { hasData, missing, total: careerNames.length * countries.length };
}

async function verifyUniversities() {
  console.log('🏛️  Verifying Universities Data...\n');
  
  // Check if universities are in career qualificationLevels
  const careersSnapshot = await db.collection('careers').get();
  const careersWithUniversities = [];
  const careersWithoutUniversities = [];
  
  for (const doc of careersSnapshot.docs) {
    const data = doc.data();
    const careerName = data.name || doc.id;
    
    if (data.qualificationLevels) {
      let hasUniversity = false;
      for (const countryCode in data.qualificationLevels) {
        const levels = data.qualificationLevels[countryCode];
        if (Array.isArray(levels)) {
          for (const level of levels) {
            if (level.sources && (
              (Array.isArray(level.sources) && level.sources.length > 0) ||
              (typeof level.sources === 'object' && level.sources.institution)
            )) {
              hasUniversity = true;
              break;
            }
          }
        }
        if (hasUniversity) break;
      }
      
      if (hasUniversity) {
        careersWithUniversities.push(careerName);
      } else {
        careersWithoutUniversities.push(careerName);
      }
    } else {
      careersWithoutUniversities.push(careerName);
    }
  }
  
  console.log(`   ✅ Careers with universities: ${careersWithUniversities.length}`);
  console.log(`   ❌ Careers without universities: ${careersWithoutUniversities.length}\n`);
  
  return { withUniversities: careersWithUniversities.length, withoutUniversities: careersWithoutUniversities.length };
}

async function verifyStudyResources() {
  console.log('📚 Verifying Study Resources Collection...\n');
  
  const resourcesSnapshot = await db.collection('studyResources').get();
  const subjects = ['Math', 'English', 'Physics', 'Chemistry', 'Biology'];
  const countries = ['ZA', 'KE', 'NG'];
  const gradeLevels = ['Grade 12', 'Grade 11', 'Grade 10'];
  
  const missing = [];
  const hasData = [];
  
  for (const subject of subjects) {
    for (const countryCode of countries) {
      for (const gradeLevel of gradeLevels) {
        const docId = `${subject}_${countryCode}_${gradeLevel.replace(/\s+/g, '_')}`;
        const doc = resourcesSnapshot.docs.find(d => d.id === docId);
        
        if (!doc) {
          missing.push({ subject, country: countryCode, gradeLevel });
        } else {
          hasData.push({ subject, country: countryCode, gradeLevel });
        }
      }
    }
  }
  
  console.log(`   ✅ Has Data: ${hasData.length}`);
  console.log(`   ❌ Missing: ${missing.length}\n`);
  
  return { hasData, missing };
}

async function main() {
  console.log('🔍 Verifying All Firestore Data\n');
  console.log('=' .repeat(50));
  console.log('');
  
  const results = {
    careers: await verifyCareers(),
    marketData: await verifyMarketData(),
    universities: await verifyUniversities(),
    studyResources: await verifyStudyResources()
  };
  
  console.log('=' .repeat(50));
  console.log('\n📊 SUMMARY\n');
  
  const totalIssues = 
    results.careers.issues.length +
    results.careers.estimated.length +
    results.careers.needsReview.length +
    results.marketData.missing.length +
    results.universities.withoutUniversities +
    results.studyResources.missing.length;
  
  if (totalIssues === 0) {
    console.log('✅ All Firestore data is verified and complete!\n');
  } else {
    console.log(`⚠️  Found ${totalIssues} issues that need attention:\n`);
    console.log(`   - Careers: ${results.careers.issues.length} issues, ${results.careers.estimated.length} estimated, ${results.careers.needsReview.length} need review`);
    console.log(`   - Market Data: ${results.marketData.missing.length} missing/incomplete`);
    console.log(`   - Universities: ${results.universities.withoutUniversities} careers without university data`);
    console.log(`   - Study Resources: ${results.studyResources.missing.length} missing\n`);
    
    console.log('📋 Recommended Actions:\n');
    console.log('   1. Run batch-verify-za-careers-extended.js to verify career requirements');
    console.log('   2. Run populate-market-data-firestore-ai.js to populate market data');
    console.log('   3. Run populate-all-sa-universities.js to add university data');
    console.log('   4. Run populate-study-resources-firestore.js to add study resources\n');
  }
  
  process.exit(totalIssues === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

