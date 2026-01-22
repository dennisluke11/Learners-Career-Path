#!/usr/bin/env node

// Debug mixed case issue
const grades = { 'math': 70, 'ENGLISH': 60 };
const requirements = { 'Mathematics': 60, 'English Home Language': 50 };

function normalizeSubjectName(subjectName) {
  const variations = {
    'Mathematics': 'Math',
    'Maths': 'Math',
    'English Home Language': 'English',
    'English (Home Language)': 'English',
    'English HL': 'English'
  };
  return variations[subjectName] || subjectName;
}

function getGradeForSubject(grades, subjectName) {
  // Try exact match
  if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
    return grades[subjectName] || 0;
  }

  // Normalize requirement
  const normalized = normalizeSubjectName(subjectName);
  console.log(`  Requirement: "${subjectName}" → normalized: "${normalized}"`);
  
  // Try normalized name
  if (grades[normalized] !== undefined && grades[normalized] !== null) {
    return grades[normalized] || 0;
  }

  // Try case-insensitive
  const normalizedLower = normalized.toLowerCase();
  for (const gradeKey in grades) {
    console.log(`    Checking gradeKey: "${gradeKey}" (normalized: "${normalizeSubjectName(gradeKey)}")`);
    if (gradeKey.toLowerCase() === normalizedLower) {
      console.log(`    ✅ Matched! "${gradeKey}" (lowercase) === "${normalized}" (lowercase)`);
      return grades[gradeKey] || 0;
    }
  }

  return 0;
}

console.log('Debugging Mixed Case Matching:');
console.log('Grades:', grades);
console.log('Requirements:', requirements);
console.log();

for (const subject in requirements) {
  const grade = getGradeForSubject(grades, subject);
  console.log(`Subject: ${subject} → Grade: ${grade}`);
  console.log();
}


