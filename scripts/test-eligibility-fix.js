#!/usr/bin/env node

/**
 * Test Eligibility Fix
 * 
 * Simulates the eligibility check with the new logic
 */

// Simulate the eligibility service logic
const sampleGrades = {
  'Math': 80,
  'English': 80,
  'LifeOrientation': 80,
  'CAT': 80
};

const requirements = {
  'Math': 60,
  'MathLiteracy': 60,
  'IT': 50,
  'English': 50,
  'EnglishFAL': 60
};

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

  const checkedEitherOrPairs = new Set();

  for (const subject in requirements) {
    const required = requirements[subject];

    // Handle Math/MathLiteracy either/or
    if (countryCode === 'ZA' && subject === 'MathLiteracy' && requirements['Math'] !== undefined) {
      if (checkedEitherOrPairs.has('Math')) continue;
      checkedEitherOrPairs.add('Math');
      
      const mathGrade = getGradeForSubject(grades, 'Math', countryCode);
      const mathLitGrade = getGradeForSubject(grades, 'MathLiteracy', countryCode);
      const bestGrade = Math.max(mathGrade, mathLitGrade);
      const mathRequired = requirements['Math'] || required;
      const mathLitRequired = required;
      const minRequired = Math.min(mathRequired, mathLitRequired);

      totalRequirements++;
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
      continue;
    }

    // Handle English/EnglishFAL either/or
    if (countryCode === 'ZA' && subject === 'EnglishFAL' && requirements['English'] !== undefined) {
      if (checkedEitherOrPairs.has('English')) continue;
      checkedEitherOrPairs.add('English');
      
      const engGrade = getGradeForSubject(grades, 'English', countryCode);
      const engFALGrade = getGradeForSubject(grades, 'EnglishFAL', countryCode);
      const bestGrade = Math.max(engGrade, engFALGrade);
      const engRequired = requirements['English'] || required;
      const engFALRequired = required;
      const minRequired = Math.min(engRequired, engFALRequired);

      totalRequirements++;
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
      continue;
    }

    // Regular subject check
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
      console.log(`   ❌ ${subject}: ${current}% < ${required}%`);
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

console.log('🧪 Testing Eligibility Fix\n');
console.log('User Grades:');
console.log(JSON.stringify(sampleGrades, null, 2));
console.log('\nCareer Requirements:');
console.log(JSON.stringify(requirements, null, 2));
console.log('\n📊 Eligibility Check:\n');

const result = checkEligibility(sampleGrades, requirements, 'ZA');

console.log(`\n📈 Results:`);
console.log(`   Status: ${result.status.toUpperCase()}`);
console.log(`   Match Score: ${result.matchScore}%`);
console.log(`   Met: ${result.metRequirements}/${result.totalRequirements} requirements`);
console.log(`   Missing: ${result.missingSubjects.length > 0 ? result.missingSubjects.join(', ') : 'None'}`);
console.log(`   Close: ${result.closeSubjects.length > 0 ? result.closeSubjects.join(', ') : 'None'}`);


