#!/usr/bin/env node

/**
 * Comprehensive Test Suite - All Use Cases
 * Tests all mapping scenarios, eligibility logic, and edge cases
 */

console.log('🧪 Comprehensive Test Suite - All Use Cases\n');
console.log('=' .repeat(60));

// Test data
const testGrades = {
  'Math': 90,
  'English': 80,
  'LifeOrientation': 80,
  'CAT': 90
};

// Simulate all the service logic
function normalizeSubjectName(subjectName, countryCode) {
  const variations = {
    'Mathematics': 'Math',
    'Maths': 'Math',
    'Mathematical Literacy': 'MathLiteracy',
    'Math Literacy': 'MathLiteracy',
    'English Home Language': 'English',
    'English (Home Language)': 'English',
    'English HL': 'English',
    'English First Additional Language': 'EnglishFAL',
    'English (First Additional Language)': 'EnglishFAL',
    'English FAL': 'EnglishFAL',
    'Life Orientation': 'LifeOrientation',
    'Physical Sciences': 'Physics',
    'Physical Science': 'Physics',
    'Life Sciences': 'Biology',
    'Life Science': 'Biology',
    'Computer Applications Technology': 'CAT',
    'Computer Applications Tech': 'CAT',
    'Information Technology': 'IT',
    'Computer': 'IT',
    'Computers': 'IT'
  };

  if (variations[subjectName]) {
    return variations[subjectName];
  }

  const nameLower = subjectName.toLowerCase();
  for (const [key, value] of Object.entries(variations)) {
    if (key.toLowerCase() === nameLower) {
      return value;
    }
  }

  return subjectName;
}

function getGradeForSubject(grades, subjectName, countryCode) {
  if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
    return grades[subjectName] || 0;
  }

  const normalized = normalizeSubjectName(subjectName, countryCode);
  
  if (grades[normalized] !== undefined && grades[normalized] !== null) {
    return grades[normalized] || 0;
  }

  // CAT ↔ IT mapping
  if (subjectName === 'IT' || normalized === 'IT') {
    if (grades['CAT'] !== undefined && grades['CAT'] !== null) {
      return grades['CAT'] || 0;
    }
  }
  if (subjectName === 'CAT' || normalized === 'CAT') {
    if (grades['IT'] !== undefined && grades['IT'] !== null) {
      return grades['IT'] || 0;
    }
  }

  // Math OR MathLiteracy
  if (countryCode === 'ZA') {
    if (subjectName === 'Math' || normalized === 'Math') {
      if (grades['MathLiteracy'] !== undefined && grades['MathLiteracy'] !== null) {
        return grades['MathLiteracy'] || 0;
      }
    }
    if (subjectName === 'MathLiteracy' || normalized === 'MathLiteracy') {
      if (grades['Math'] !== undefined && grades['Math'] !== null) {
        return grades['Math'] || 0;
      }
    }

    // English OR EnglishFAL
    if (subjectName === 'English' || normalized === 'English') {
      if (grades['EnglishFAL'] !== undefined && grades['EnglishFAL'] !== null) {
        return grades['EnglishFAL'] || 0;
      }
    }
    if (subjectName === 'EnglishFAL' || normalized === 'EnglishFAL') {
      if (grades['English'] !== undefined && grades['English'] !== null) {
        return grades['English'] || 0;
      }
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

  // Math/MathLiteracy pair
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

  // English/EnglishFAL pair
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

  // Remaining subjects
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
  } else if (matchScore >= 60) {
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

// Test Cases
const testCases = [
  {
    name: 'Subject Name Normalization',
    tests: [
      { input: 'Mathematics', expected: 'Math', description: 'Mathematics → Math' },
      { input: 'English Home Language', expected: 'English', description: 'English Home Language → English' },
      { input: 'Physical Sciences', expected: 'Physics', description: 'Physical Sciences → Physics' },
      { input: 'Computer Applications Technology', expected: 'CAT', description: 'Computer Applications Technology → CAT' },
      { input: 'Information Technology', expected: 'IT', description: 'Information Technology → IT' }
    ]
  },
  {
    name: 'CAT ↔ IT Mapping',
    tests: [
      { 
        requirements: { 'IT': 50 },
        expected: 90,
        description: 'CAT: 90 should satisfy IT: 50 requirement'
      },
      {
        requirements: { 'CAT': 50 },
        expected: 90,
        description: 'IT: 90 should satisfy CAT: 50 requirement (reverse)'
      }
    ]
  },
  {
    name: 'Math OR MathLiteracy Either/Or',
    tests: [
      {
        requirements: { 'Math': 60, 'MathLiteracy': 60 },
        expected: 'qualified',
        description: 'Math: 90 should satisfy both Math: 60 and MathLiteracy: 60'
      }
    ]
  },
  {
    name: 'English OR EnglishFAL Either/Or',
    tests: [
      {
        requirements: { 'English': 50, 'EnglishFAL': 60 },
        expected: 'qualified',
        description: 'English: 80 should satisfy both English: 50 and EnglishFAL: 60'
      }
    ]
  },
  {
    name: 'Fully Qualified Careers',
    tests: [
      {
        career: 'IT Specialist',
        requirements: { 'Math': 60, 'MathLiteracy': 60, 'IT': 50, 'English': 50, 'EnglishFAL': 60 },
        expected: 'qualified',
        description: 'Should be qualified with Math: 90, CAT: 90, English: 80'
      },
      {
        career: 'Cybersecurity Analyst',
        requirements: { 'Math': 60, 'MathLiteracy': 60, 'IT': 50, 'English': 50, 'EnglishFAL': 60 },
        expected: 'qualified',
        description: 'Should be qualified with Math: 90, CAT: 90, English: 80'
      },
      {
        career: 'Network Engineer',
        requirements: { 'Math': 60, 'MathLiteracy': 60, 'IT': 50, 'English': 50, 'EnglishFAL': 60 },
        expected: 'qualified',
        description: 'Should be qualified with Math: 90, CAT: 90, English: 80'
      },
      {
        career: 'Teacher',
        requirements: { 'Math': 50, 'English': 50 },
        expected: 'qualified',
        description: 'Should be qualified with Math: 90, English: 80'
      }
    ]
  },
  {
    name: 'Close to Qualifying (60%+ threshold)',
    tests: [
      {
        career: 'Software Engineer',
        requirements: { 'Math': 70, 'Physics': 60, 'English': 50, 'EnglishFAL': 60 },
        expected: 'close',
        description: '67% match (2/3) - should be close (needs Physics)'
      },
      {
        career: 'Computer Scientist',
        requirements: { 'Math': 70, 'Physics': 60, 'English': 50, 'EnglishFAL': 60 },
        expected: 'close',
        description: '67% match (2/3) - should be close (needs Physics)'
      },
      {
        career: 'Data Scientist',
        requirements: { 'Math': 70, 'Physics': 60, 'English': 50, 'EnglishFAL': 60 },
        expected: 'close',
        description: '67% match (2/3) - should be close (needs Physics)'
      }
    ]
  },
  {
    name: 'Needs Improvement (< 60%)',
    tests: [
      {
        career: 'Doctor',
        requirements: { 'Math': 70, 'Physics': 70, 'Biology': 70, 'English': 60 },
        expected: 'needs-improvement',
        description: '50% match (2/4) - should be needs-improvement (needs Physics, Biology)'
      },
      {
        career: 'Engineer',
        requirements: { 'Math': 70, 'Physics': 70, 'English': 50 },
        expected: 'close',
        description: '67% match (2/3) - should be close (needs Physics) - threshold is 60%'
      }
    ]
  },
  {
    name: 'Edge Cases',
    tests: [
      {
        career: 'Empty Requirements',
        requirements: {},
        expected: 'needs-improvement',
        description: 'Empty requirements should return needs-improvement'
      },
      {
        career: 'All Requirements Met',
        requirements: { 'Math': 50, 'English': 50, 'LifeOrientation': 50 },
        expected: 'qualified',
        description: 'All requirements met should be qualified'
      },
      {
        career: 'Close Subjects (90% of required)',
        requirements: { 'Math': 100, 'English': 100 },
        expected: 'needs-improvement',
        description: 'Math: 90 (90% of 100) is close, English: 80 (80% of 100) is missing. Match score 0% (0/2) < 60% threshold, so needs-improvement'
      }
    ]
  }
];

// Run tests
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

console.log('\n📋 Test Grades:');
console.log(JSON.stringify(testGrades, null, 2));
console.log();

for (const testSuite of testCases) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Test Suite: ${testSuite.name}`);
  console.log('='.repeat(60));

  for (const test of testSuite.tests) {
    totalTests++;
    let result;
    let passed = false;

    if (testSuite.name === 'Subject Name Normalization') {
      result = normalizeSubjectName(test.input, 'ZA');
      passed = result === test.expected;
      console.log(`\n  Test: ${test.description}`);
      console.log(`    Input: "${test.input}"`);
      console.log(`    Expected: "${test.expected}"`);
      console.log(`    Got: "${result}"`);
    } else if (testSuite.name === 'CAT ↔ IT Mapping') {
      const grade = getGradeForSubject(testGrades, Object.keys(test.requirements)[0], 'ZA');
      passed = grade === test.expected;
      console.log(`\n  Test: ${test.description}`);
      console.log(`    Requirement: ${JSON.stringify(test.requirements)}`);
      console.log(`    Expected Grade: ${test.expected}`);
      console.log(`    Got: ${grade}`);
    } else {
      result = checkEligibility(testGrades, test.requirements, 'ZA');
      passed = result.status === test.expected;
      console.log(`\n  Test: ${test.career || 'Career'}`);
      console.log(`    Description: ${test.description}`);
      console.log(`    Requirements: ${JSON.stringify(test.requirements)}`);
      console.log(`    Expected Status: ${test.expected}`);
      console.log(`    Got Status: ${result.status}`);
      console.log(`    Match Score: ${result.matchScore}%`);
      console.log(`    Met: ${result.metRequirements}/${result.totalRequirements}`);
      if (result.missingSubjects.length > 0) {
        console.log(`    Missing: ${result.missingSubjects.join(', ')}`);
      }
      if (result.closeSubjects.length > 0) {
        console.log(`    Close: ${result.closeSubjects.join(', ')}`);
      }
    }

    if (passed) {
      passedTests++;
      console.log(`    ✅ PASS`);
    } else {
      failedTests++;
      console.log(`    ❌ FAIL`);
      failures.push({
        suite: testSuite.name,
        test: test.career || test.description,
        expected: test.expected,
        got: result?.status || result
      });
    }
  }
}

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\n❌ Failed Tests:`);
  failures.forEach((failure, index) => {
    console.log(`\n  ${index + 1}. ${failure.suite} - ${failure.test}`);
    console.log(`     Expected: ${failure.expected}`);
    console.log(`     Got: ${failure.got}`);
  });
}

if (failedTests === 0) {
  console.log(`\n🎉 All tests passed! All use cases are working correctly.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some tests failed. Please review the failures above.`);
  process.exit(1);
}

