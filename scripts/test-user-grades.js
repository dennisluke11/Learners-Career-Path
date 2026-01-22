#!/usr/bin/env node

/**
 * Test with User's Actual Grades
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User's actual grades
const userGrades = {
  'Math': 90,
  'English': 80,
  'LifeOrientation': 80,
  'CAT': 90
};

// Simulate the eligibility service logic
function getGradeForSubject(grades, subjectName, countryCode) {
  // Try exact match
  if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
    return grades[subjectName] || 0;
  }

  // CAT can satisfy IT requirements
  if (subjectName === 'IT') {
    if (grades['CAT'] !== undefined && grades['CAT'] !== null) {
      return grades['CAT'] || 0;
    }
  }

  // Math OR MathLiteracy
  if (subjectName === 'Math') {
    if (grades['MathLiteracy'] !== undefined && grades['MathLiteracy'] !== null) {
      return grades['MathLiteracy'] || 0;
    }
  }
  if (subjectName === 'MathLiteracy') {
    if (grades['Math'] !== undefined && grades['Math'] !== null) {
      return grades['Math'] || 0;
    }
  }

  // English OR EnglishFAL
  if (subjectName === 'English') {
    if (grades['EnglishFAL'] !== undefined && grades['EnglishFAL'] !== null) {
      return grades['EnglishFAL'] || 0;
    }
  }
  if (subjectName === 'EnglishFAL') {
    if (grades['English'] !== undefined && grades['English'] !== null) {
      return grades['English'] || 0;
    }
  }

  return 0;
}

function checkEligibility(grades, requirements, countryCode = 'ZA') {
  const missingSubjects = [];
  const closeSubjects = [];
  let totalRequirements = 0;
  let metRequirements = 0;
  const processedSubjects = new Set();

  // Check Math/MathLiteracy pair if both are present
  if (countryCode === 'ZA' && requirements['Math'] !== undefined && requirements['MathLiteracy'] !== undefined) {
    const mathGrade = getGradeForSubject(grades, 'Math', countryCode);
    const mathLitGrade = getGradeForSubject(grades, 'MathLiteracy', countryCode);
    const bestGrade = Math.max(mathGrade, mathLitGrade);
    const mathRequired = requirements['Math'];
    const mathLitRequired = requirements['MathLiteracy'];
    const minRequired = Math.min(mathRequired, mathLitRequired);
    
    totalRequirements++;
    processedSubjects.add('Math');
    processedSubjects.add('MathLiteracy');
    
    if (bestGrade >= minRequired) {
      metRequirements++;
      console.log(`   ✅ Math/MathLiteracy: ${bestGrade}% >= ${minRequired}%`);
    } else if (bestGrade >= minRequired * 0.9) {
      closeSubjects.push('Math/MathLiteracy');
      console.log(`   ⚠️  Math/MathLiteracy: ${bestGrade}% >= ${minRequired * 0.9}% (close)`);
    } else {
      missingSubjects.push('Math/MathLiteracy');
      console.log(`   ❌ Math/MathLiteracy: ${bestGrade}% < ${minRequired}%`);
    }
  }

  // Check English/EnglishFAL pair if both are present
  if (countryCode === 'ZA' && requirements['English'] !== undefined && requirements['EnglishFAL'] !== undefined) {
    const engGrade = getGradeForSubject(grades, 'English', countryCode);
    const engFALGrade = getGradeForSubject(grades, 'EnglishFAL', countryCode);
    const bestGrade = Math.max(engGrade, engFALGrade);
    const engRequired = requirements['English'];
    const engFALRequired = requirements['EnglishFAL'];
    const minRequired = Math.min(engRequired, engFALRequired);
    
    totalRequirements++;
    processedSubjects.add('English');
    processedSubjects.add('EnglishFAL');
    
    if (bestGrade >= minRequired) {
      metRequirements++;
      console.log(`   ✅ English/EnglishFAL: ${bestGrade}% >= ${minRequired}%`);
    } else if (bestGrade >= minRequired * 0.9) {
      closeSubjects.push('English/EnglishFAL');
      console.log(`   ⚠️  English/EnglishFAL: ${bestGrade}% >= ${minRequired * 0.9}% (close)`);
    } else {
      missingSubjects.push('English/EnglishFAL');
      console.log(`   ❌ English/EnglishFAL: ${bestGrade}% < ${minRequired}%`);
    }
  }

  // Check remaining subjects
  for (const subject in requirements) {
    if (processedSubjects.has(subject)) {
      continue;
    }
    
    const required = requirements[subject];
    const current = getGradeForSubject(grades, subject, countryCode);
    totalRequirements++;

    if (current >= required) {
      metRequirements++;
      console.log(`   ✅ ${subject}: ${current}% >= ${required}%`);
    } else if (current >= required * 0.9) {
      closeSubjects.push(subject);
      console.log(`   ⚠️  ${subject}: ${current}% >= ${required * 0.9}% (close)`);
    } else {
      missingSubjects.push(subject);
      console.log(`   ❌ ${subject}: ${current}% < ${required}% (user has: ${current}%)`);
    }
  }

  const matchScore = totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 0;

  let status;
  if (totalRequirements === 0) {
    status = 'needs-improvement';
  } else if (missingSubjects.length === 0 && closeSubjects.length === 0) {
    status = 'qualified';
  } else if (missingSubjects.length === 0 && closeSubjects.length > 0) {
    status = 'close';
  } else if (matchScore >= 70) {
    status = 'close';
  } else {
    status = 'needs-improvement';
  }

  return {
    status,
    matchScore: Math.round(matchScore),
    missingSubjects,
    closeSubjects,
    metRequirements,
    totalRequirements
  };
}

async function testITCareers() {
  console.log('🧪 Testing IT Careers with User Grades\n');
  console.log('User Grades:');
  console.log(JSON.stringify(userGrades, null, 2));
  console.log();

  const itCareers = ['IT Specialist', 'Software Engineer', 'Computer Scientist', 'Cybersecurity Analyst', 'Network Engineer', 'Data Scientist'];

  for (const careerName of itCareers) {
    console.log(`\n📋 ${careerName}:`);
    const doc = await db.collection('careers').doc(careerName).get();
    
    if (!doc.exists) {
      console.log(`   ❌ Career not found`);
      continue;
    }

    const career = { id: doc.id, ...doc.data() };
    
    if (career.qualificationLevels && career.qualificationLevels.ZA && career.qualificationLevels.ZA.length > 0) {
      const firstLevel = career.qualificationLevels.ZA[0];
      const requirements = firstLevel.minGrades || {};
      
      console.log(`   Requirements: ${JSON.stringify(requirements)}`);
      console.log(`   Checking eligibility...\n`);
      
      const result = checkEligibility(userGrades, requirements, 'ZA');
      
      console.log(`\n   📊 Result: ${result.status.toUpperCase()}`);
      console.log(`   Match Score: ${result.matchScore}%`);
      console.log(`   Met: ${result.metRequirements}/${result.totalRequirements} requirements`);
      if (result.missingSubjects.length > 0) {
        console.log(`   Missing: ${result.missingSubjects.join(', ')}`);
      }
    } else {
      console.log(`   ⚠️  No qualificationLevels[ZA] found`);
    }
  }
}

testITCareers()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

