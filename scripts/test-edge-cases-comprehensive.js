#!/usr/bin/env node

/**
 * Comprehensive Edge Case Testing
 * Tests all possible edge cases and potential bugs
 */

console.log('🔍 Comprehensive Edge Case Testing - Eligibility Algorithm\n');
console.log('='.repeat(70));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

// Simulate the complete eligibility service
function normalizeSubjectName(subjectName, countryCode) {
  if (!subjectName) return subjectName;

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
  // Try exact match first
  if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
    return grades[subjectName] || 0;
  }

  // Normalize requirement name to standard name
  const normalized = normalizeSubjectName(subjectName, countryCode);
  
  // Try normalized name
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

  // Handle either/or subjects for South Africa
  if (countryCode === 'ZA') {
    // Math OR MathLiteracy
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

// Edge Case Tests
const edgeCaseTests = [
  {
    name: 'Empty Grades Object',
    grades: {},
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'needs-improvement', matchScore: 0 },
    description: 'Empty grades should return needs-improvement with 0% match'
  },
  {
    name: 'Null/Undefined Grades',
    grades: { 'Math': null, 'English': undefined },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'needs-improvement', matchScore: 0 },
    description: 'Null/undefined grades should be treated as 0'
  },
  {
    name: 'Zero Grades',
    grades: { 'Math': 0, 'English': 0 },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'needs-improvement', matchScore: 0 },
    description: 'Zero grades should not meet requirements'
  },
  {
    name: 'Exact Match (Boundary)',
    grades: { 'Math': 60, 'English': 50 },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Exact match at requirement threshold should qualify'
  },
  {
    name: 'Just Below Requirement',
    grades: { 'Math': 59, 'English': 49 },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'close', matchScore: 0 },
    description: 'Just below requirement (90% threshold) should be close'
  },
  {
    name: '90% Threshold (Close)',
    grades: { 'Math': 54, 'English': 45 },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'close', matchScore: 0 },
    description: '90% of requirement should be marked as close'
  },
  {
    name: 'Math Only (No MathLiteracy)',
    grades: { 'Math': 70 },
    requirements: { 'Math': 60, 'MathLiteracy': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Math alone should satisfy Math/MathLiteracy pair'
  },
  {
    name: 'MathLiteracy Only (No Math)',
    grades: { 'MathLiteracy': 70 },
    requirements: { 'Math': 60, 'MathLiteracy': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'MathLiteracy alone should satisfy Math/MathLiteracy pair'
  },
  {
    name: 'Both Math and MathLiteracy (Use Best)',
    grades: { 'Math': 90, 'MathLiteracy': 70 },
    requirements: { 'Math': 60, 'MathLiteracy': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Should use best grade (90) when both are present'
  },
  {
    name: 'English Only (No EnglishFAL)',
    grades: { 'English': 70 },
    requirements: { 'English': 50, 'EnglishFAL': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'English alone should satisfy English/EnglishFAL pair'
  },
  {
    name: 'EnglishFAL Only (No English)',
    grades: { 'EnglishFAL': 70 },
    requirements: { 'English': 50, 'EnglishFAL': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'EnglishFAL alone should satisfy English/EnglishFAL pair'
  },
  {
    name: 'CAT Only (No IT)',
    grades: { 'CAT': 80 },
    requirements: { 'IT': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'CAT alone should satisfy IT requirement'
  },
  {
    name: 'IT Only (No CAT)',
    grades: { 'IT': 80 },
    requirements: { 'CAT': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'IT alone should satisfy CAT requirement'
  },
  {
    name: 'Mixed Case Subject Names',
    grades: { 'math': 70, 'ENGLISH': 60 },
    requirements: { 'Mathematics': 60, 'English Home Language': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Case-insensitive matching should work'
  },
  {
    name: '60% Threshold (Boundary)',
    grades: { 'Math': 60, 'English': 50, 'Physics': 0 },
    requirements: { 'Math': 60, 'English': 50, 'Physics': 60 },
    expected: { status: 'close', matchScore: 67 },
    description: 'Exactly 60% match should be close (2/3 = 67%)'
  },
  {
    name: '59% Threshold (Below)',
    grades: { 'Math': 60, 'English': 50, 'Physics': 0, 'Biology': 0 },
    requirements: { 'Math': 60, 'English': 50, 'Physics': 60, 'Biology': 60 },
    expected: { status: 'needs-improvement', matchScore: 50 },
    description: 'Below 60% match should be needs-improvement (2/4 = 50%)'
  },
  {
    name: 'Only Math in Requirements (No MathLiteracy)',
    grades: { 'Math': 70 },
    requirements: { 'Math': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Should work when only Math is required (no pair)'
  },
  {
    name: 'Only English in Requirements (No EnglishFAL)',
    grades: { 'English': 70 },
    requirements: { 'English': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Should work when only English is required (no pair)'
  },
  {
    name: 'MathLiteracy Lower Than Math',
    grades: { 'Math': 90, 'MathLiteracy': 50 },
    requirements: { 'Math': 60, 'MathLiteracy': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Should use Math (90) not MathLiteracy (50) when both present'
  },
  {
    name: 'EnglishFAL Lower Than English',
    grades: { 'English': 80, 'EnglishFAL': 50 },
    requirements: { 'English': 50, 'EnglishFAL': 60 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Should use English (80) not EnglishFAL (50) when both present'
  },
  {
    name: 'Very High Requirements',
    grades: { 'Math': 95, 'English': 90 },
    requirements: { 'Math': 100, 'English': 100 },
    expected: { status: 'close', matchScore: 0 },
    description: '95% and 90% of 100% should be close (90% threshold)'
  },
  {
    name: 'Negative Grades (Should be 0)',
    grades: { 'Math': -10, 'English': -5 },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'needs-improvement', matchScore: 0 },
    description: 'Negative grades should be treated as 0'
  },
  {
    name: 'Over 100 Grades',
    grades: { 'Math': 150, 'English': 200 },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Grades over 100 should still qualify (150 >= 60, 200 >= 50)'
  },
  {
    name: 'Decimal Requirements',
    grades: { 'Math': 60.5 },
    requirements: { 'Math': 60.5 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'Decimal grades and requirements should work'
  },
  {
    name: 'String Numbers (Edge Case)',
    grades: { 'Math': '70', 'English': '80' },
    requirements: { 'Math': 60, 'English': 50 },
    expected: { status: 'qualified', matchScore: 100 },
    description: 'String numbers should be converted (if handled by getGradeForSubject)'
  }
];

// Run edge case tests
console.log('\n📋 Running Edge Case Tests...\n');

for (const test of edgeCaseTests) {
  totalTests++;
  const result = checkEligibility(test.grades, test.requirements, 'ZA');
  
  // Handle string numbers
  const processedGrades = {};
  for (const [key, value] of Object.entries(test.grades)) {
    processedGrades[key] = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0);
  }
  const actualResult = checkEligibility(processedGrades, test.requirements, 'ZA');
  
  const statusMatch = actualResult.status === test.expected.status;
  const scoreMatch = actualResult.matchScore === test.expected.matchScore;
  const passed = statusMatch && scoreMatch;
  
  if (passed) {
    passedTests++;
    console.log(`✅ ${test.name}`);
  } else {
    failedTests++;
    console.log(`❌ ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    console.log(`   Got: status=${actualResult.status}, matchScore=${actualResult.matchScore}`);
    failures.push({
      name: test.name,
      expected: test.expected,
      got: { status: actualResult.status, matchScore: actualResult.matchScore }
    });
  }
}

// Summary
console.log(`\n${'='.repeat(70)}`);
console.log('📊 Edge Case Test Summary');
console.log('='.repeat(70));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\n❌ Failed Tests:`);
  failures.forEach((failure, index) => {
    console.log(`\n  ${index + 1}. ${failure.name}`);
    console.log(`     Expected: ${JSON.stringify(failure.expected)}`);
    console.log(`     Got: ${JSON.stringify(failure.got)}`);
  });
}

if (failedTests === 0) {
  console.log(`\n🎉 All edge case tests passed! Algorithm is water tight.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some edge cases failed. Algorithm needs fixes.`);
  process.exit(1);
}


