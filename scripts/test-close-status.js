#!/usr/bin/env node

/**
 * Test Close Status Logic
 */

const userGrades = {
  'Math': 90,
  'English': 80,
  'LifeOrientation': 80,
  'CAT': 90
};

// Test cases that should be "close"
const testCases = [
  {
    name: 'Software Engineer',
    requirements: { 'Math': 70, 'Physics': 60, 'English': 50, 'EnglishFAL': 60 },
    description: 'Has Math and English, missing Physics - should be close (67% match)'
  },
  {
    name: 'Computer Scientist',
    requirements: { 'Math': 70, 'Physics': 60, 'English': 50, 'EnglishFAL': 60 },
    description: 'Has Math and English, missing Physics - should be close (67% match)'
  },
  {
    name: 'Data Scientist',
    requirements: { 'Math': 70, 'Physics': 60, 'English': 50, 'EnglishFAL': 60 },
    description: 'Has Math and English, missing Physics - should be close (67% match)'
  }
];

function getGradeForSubject(grades, subjectName, countryCode) {
  if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
    return grades[subjectName] || 0;
  }
  
  if (subjectName === 'IT' && grades['CAT'] !== undefined) {
    return grades['CAT'] || 0;
  }
  
  if (countryCode === 'ZA') {
    if (subjectName === 'Math' && grades['MathLiteracy'] !== undefined) {
      return grades['MathLiteracy'] || 0;
    }
    if (subjectName === 'MathLiteracy' && grades['Math'] !== undefined) {
      return grades['Math'] || 0;
    }
    if (subjectName === 'English' && grades['EnglishFAL'] !== undefined) {
      return grades['EnglishFAL'] || 0;
    }
    if (subjectName === 'EnglishFAL' && grades['English'] !== undefined) {
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
    // Lowered threshold from 70% to 60% to show more "almost qualified" careers
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

console.log('🧪 Testing Close Status Logic\n');
console.log('User Grades:', JSON.stringify(userGrades, null, 2));
console.log();

for (const testCase of testCases) {
  console.log(`\n📋 ${testCase.name}`);
  console.log(`   ${testCase.description}`);
  console.log(`   Requirements: ${JSON.stringify(testCase.requirements)}`);
  
  const result = checkEligibility(userGrades, testCase.requirements, 'ZA');
  
  console.log(`   Status: ${result.status}`);
  console.log(`   Match Score: ${result.matchScore}%`);
  console.log(`   Met: ${result.metRequirements}/${result.totalRequirements} requirements`);
  console.log(`   Missing: ${result.missingSubjects.join(', ') || 'None'}`);
  console.log(`   Close: ${result.closeSubjects.join(', ') || 'None'}`);
  
  if (result.status === 'close') {
    console.log(`   ✅ Correctly marked as "close"`);
  } else {
    console.log(`   ⚠️  Expected "close" but got "${result.status}"`);
  }
}

