#!/usr/bin/env node

/**
 * Complete Algorithm Test
 * Tests all mapping scenarios
 */

// Simulate the complete eligibility service
const userGrades = {
  'Math': 90,
  'English': 80,
  'LifeOrientation': 80,
  'CAT': 90
};

// Test scenarios
const testScenarios = [
  {
    name: 'IT Specialist',
    requirements: {
      'Math': 60,
      'MathLiteracy': 60,
      'IT': 50,
      'English': 50,
      'EnglishFAL': 60
    },
    expected: 'qualified',
    description: 'Should map CAT→IT, Math satisfies Math/MathLiteracy, English satisfies English/EnglishFAL'
  },
  {
    name: 'Software Engineer',
    requirements: {
      'Math': 70,
      'Physics': 60,
      'English': 50,
      'EnglishFAL': 60
    },
    expected: 'needs-improvement',
    description: 'Missing Physics, but Math and English should work'
  },
  {
    name: 'Cybersecurity Analyst',
    requirements: {
      'Math': 60,
      'MathLiteracy': 60,
      'IT': 50,
      'English': 50,
      'EnglishFAL': 60
    },
    expected: 'qualified',
    description: 'Should map CAT→IT, Math satisfies Math/MathLiteracy, English satisfies English/EnglishFAL'
  },
  {
    name: 'Accountant',
    requirements: {
      'Math': 50,
      'English': 50,
      'Accounting': 50
    },
    expected: 'qualified',
    description: 'Simple case - Math and English should work'
  },
  {
    name: 'Teacher',
    requirements: {
      'Math': 50,
      'English': 50
    },
    expected: 'qualified',
    description: 'Simple case - Math and English should work'
  }
];

// Simulate getGradeForSubject
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
  if (subjectName === 'CAT') {
    if (grades['IT'] !== undefined && grades['IT'] !== null) {
      return grades['IT'] || 0;
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

// Simulate checkEligibility
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
    } else if (bestGrade >= minRequired * 0.9) {
      closeSubjects.push('Math/MathLiteracy');
    } else {
      missingSubjects.push('Math/MathLiteracy');
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
    } else if (bestGrade >= minRequired * 0.9) {
      closeSubjects.push('English/EnglishFAL');
    } else {
      missingSubjects.push('English/EnglishFAL');
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
    } else if (current >= required * 0.9) {
      closeSubjects.push(subject);
    } else {
      missingSubjects.push(subject);
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

console.log('🧪 Complete Algorithm Test\n');
console.log('User Grades:');
console.log(JSON.stringify(userGrades, null, 2));
console.log();

let passed = 0;
let failed = 0;

for (const scenario of testScenarios) {
  console.log(`\n📋 Testing: ${scenario.name}`);
  console.log(`   Description: ${scenario.description}`);
  console.log(`   Requirements: ${JSON.stringify(scenario.requirements)}`);
  
  const result = checkEligibility(userGrades, scenario.requirements, 'ZA');
  
  const success = result.status === scenario.expected;
  if (success) {
    passed++;
    console.log(`   ✅ PASS: Status = ${result.status} (expected ${scenario.expected})`);
  } else {
    failed++;
    console.log(`   ❌ FAIL: Status = ${result.status} (expected ${scenario.expected})`);
  }
  
  console.log(`   Match Score: ${result.matchScore}%`);
  console.log(`   Met: ${result.metRequirements}/${result.totalRequirements} requirements`);
  if (result.missingSubjects.length > 0) {
    console.log(`   Missing: ${result.missingSubjects.join(', ')}`);
  }
  if (result.closeSubjects.length > 0) {
    console.log(`   Close: ${result.closeSubjects.join(', ')}`);
  }
}

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}/${testScenarios.length}`);
console.log(`   ❌ Failed: ${failed}/${testScenarios.length}`);

if (failed === 0) {
  console.log(`\n🎉 All tests passed! Algorithm is mapping correctly.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some tests failed. Algorithm needs review.`);
  process.exit(1);
}


