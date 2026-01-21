#!/usr/bin/env node

/**
 * Validate Career Requirements Against Country Curricula
 * 
 * This script checks if all subjects used in career requirements
 * actually exist in each country's curriculum.
 * 
 * Usage:
 * node scripts/validate-careers-data.js
 */

const fs = require('fs');
const path = require('path');

// Read the careers data file
const careersDataPath = path.join(__dirname, '..', 'src/app/features/career-planning/services/careers-data.helper.ts');
const subjectsModelPath = path.join(__dirname, '..', 'src/app/shared/models/subject.model.ts');

// Country subject mappings (from subject.model.ts)
const COUNTRY_SUBJECTS = {
  'ZA': ['Math', 'MathLiteracy', 'English', 'EnglishFAL', 'Afrikaans', 'LifeOrientation', 'Physics', 'Biology', 'Accounting', 'BusinessStudies', 'Economics', 'History', 'Geography', 'IT', 'CAT', 'EGD'],
  'KE': ['Math', 'English', 'Kiswahili', 'Physics', 'Chemistry', 'Biology', 'Agriculture', 'ComputerStudies', 'History', 'Geography', 'CRE', 'IRE', 'HRE', 'HomeScience', 'BusinessStudies'],
  'NG': ['Math', 'English', 'CivicEducation', 'Physics', 'Chemistry', 'Biology', 'FurtherMath', 'DataProcessing', 'Economics', 'Government', 'Literature', 'Accounting', 'Commerce', 'Geography', 'History', 'CRK', 'IRK'],
  'ZW': ['Math', 'English', 'Shona', 'Ndebele', 'Physics', 'Chemistry', 'Biology', 'CombinedScience', 'HeritageStudies', 'Geography', 'History', 'Agriculture', 'Accounting', 'BusinessStudies', 'Economics', 'ComputerStudies'],
  'ET': ['Math', 'English', 'Amharic', 'Civics', 'Physics', 'Chemistry', 'Biology', 'IT', 'Geography', 'History', 'Economics', 'Agriculture'],
  'EG': ['Math', 'English', 'Arabic', 'SecondLanguage', 'Citizenship', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Philosophy', 'Psychology', 'Sociology', 'Economics', 'Accounting', 'BusinessStudies', 'IT']
};

// Subject aliases (standard names that map to country-specific names)
const SUBJECT_ALIASES = {
  'ZA': {
    'Mathematics': 'Math',
    'Physical Sciences': 'Physics',
    'Life Sciences': 'Biology',
    'English Home Language': 'English',
    'English First Additional Language': 'EnglishFAL',
    'Afrikaans First Additional Language': 'Afrikaans'
  },
  'KE': {
    'Mathematics': 'Math',
    'Maths': 'Math',
    'History and Government': 'History'
  },
  'NG': {
    'Mathematics': 'Math',
    'English Language': 'English',
    'Literature in English': 'Literature'
  },
  'ZW': {
    'Mathematics': 'Math',
    'English Language': 'English',
    'Combined Science': 'CombinedScience',
    'Heritage Studies': 'HeritageStudies',
    'Accounts': 'Accounting'
  },
  'ET': {
    'Mathematics': 'Math',
    'Civics and Ethical Education': 'Civics',
    'Information Technology': 'IT'
  },
  'EG': {
    'Mathematics': 'Math',
    'English (First Foreign Language)': 'English',
    'Arabic Language': 'Arabic'
  }
};

const countryNames = {
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'ZW': 'Zimbabwe',
  'ET': 'Ethiopia',
  'EG': 'Egypt'
};

function normalizeSubjectName(subject, countryCode) {
  // Check aliases first
  const aliases = SUBJECT_ALIASES[countryCode] || {};
  if (aliases[subject]) {
    return aliases[subject];
  }
  
  // Return as-is if no alias
  return subject;
}

function validateSubject(subject, countryCode) {
  const normalized = normalizeSubjectName(subject, countryCode);
  const validSubjects = COUNTRY_SUBJECTS[countryCode] || [];
  
  return {
    isValid: validSubjects.includes(normalized),
    normalized,
    validSubjects
  };
}

function extractCareerData(content) {
  const careers = [];
  const careerRegex = /{\s*name:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*minGrades:\s*{([^}]+)},\s*countryBaselines:\s*createCountryBaselines\(\s*{([^}]+)},\s*\/\/\s*South\s+Africa\s*\(ZA\)\s*{([^}]+)},\s*\/\/\s*Kenya\s*\(KE\)\s*{([^}]+)},\s*\/\/\s*Nigeria\s*\(NG\)\s*{([^}]+)},\s*\/\/\s*Zimbabwe\s*\(ZW\)\s*{([^}]+)},\s*\/\/\s*Ethiopia\s*\(ET\)\s*{([^}]+)},\s*\/\/\s*Egypt\s*\(EG\)/g;
  
  // Simple parsing - extract career blocks
  const careerBlocks = content.match(/{[^}]*name:\s*['"]([^'"]+)['"][^}]*countryBaselines:[^}]*}/g);
  
  if (!careerBlocks) {
    // Try a different approach - read the file and parse manually
    const lines = content.split('\n');
    let currentCareer = null;
    let inCountryBaselines = false;
    let currentCountry = null;
    let baselineData = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect career start
      if (line.includes('name:') && line.includes("'")) {
        const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
        if (nameMatch) {
          currentCareer = {
            name: nameMatch[1],
            baselines: {}
          };
        }
      }
      
      // Detect country baseline
      if (line.includes('createCountryBaselines(')) {
        inCountryBaselines = true;
        currentCountry = null;
        baselineData = {};
      }
      
      // Parse country baseline lines
      if (inCountryBaselines && line.includes('//')) {
        const countryMatch = line.match(/\/\/\s*([^(]+)\s*\(([A-Z]{2})\)/);
        if (countryMatch) {
          currentCountry = countryMatch[2];
          // Extract subjects from the previous line
          const prevLine = i > 0 ? lines[i - 1].trim() : '';
          if (prevLine.startsWith('{') && prevLine.includes(':')) {
            const subjects = {};
            const matches = prevLine.matchAll(/(\w+):\s*(\d+)/g);
            for (const match of matches) {
              subjects[match[1]] = parseInt(match[2]);
            }
            if (currentCareer && currentCountry) {
              currentCareer.baselines[currentCountry] = subjects;
            }
          }
        }
      }
      
      // End of country baselines
      if (line.includes(')') && inCountryBaselines) {
        if (currentCareer) {
          careers.push(currentCareer);
        }
        currentCareer = null;
        inCountryBaselines = false;
      }
    }
  }
  
  return careers;
}

function parseBaselineLine(line) {
  const subjects = {};
  // Match patterns like "Biology: 75" or "English: 80"
  const matches = line.matchAll(/(\w+):\s*(\d+)/g);
  for (const match of matches) {
    subjects[match[1]] = parseInt(match[2]);
  }
  return subjects;
}

async function validateCareersData() {
  console.log('🔍 Validating career requirements against country curricula...\n');
  
  if (!fs.existsSync(careersDataPath)) {
    console.error(`❌ Error: ${careersDataPath} not found!`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(careersDataPath, 'utf8');
  
  // Extract career data manually
  const issues = [];
  const careers = [];
  
  // Find all career definitions
  const careerMatches = content.matchAll(/name:\s*['"]([^'"]+)['"][\s\S]*?countryBaselines:\s*createCountryBaselines\(([\s\S]*?)\)/g);
  
  for (const match of careerMatches) {
    const careerName = match[1];
    const baselinesBlock = match[2];
    
    // Parse each country's baseline
    const countryLines = baselinesBlock.split(',').filter(line => line.trim().startsWith('{'));
    
    const career = {
      name: careerName,
      baselines: {}
    };
    
    // Parse country baselines (they're in order: ZA, KE, NG, ZW, ET, EG)
    const countries = ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG'];
    countryLines.forEach((line, index) => {
      if (index < countries.length) {
        const countryCode = countries[index];
        const subjects = parseBaselineLine(line);
        career.baselines[countryCode] = subjects;
      }
    });
    
    careers.push(career);
  }
  
  console.log(`📋 Found ${careers.length} careers to validate\n`);
  
  // Validate each career
  for (const career of careers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${career.name}`);
    console.log('='.repeat(60));
    
    for (const countryCode of ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG']) {
      const countryName = countryNames[countryCode];
      const baseline = career.baselines[countryCode] || {};
      
      console.log(`\n  🌍 ${countryName} (${countryCode}):`);
      
      if (Object.keys(baseline).length === 0) {
        console.log(`     ⚠️  No requirements defined`);
        issues.push({
          career: career.name,
          country: countryCode,
          issue: 'No requirements defined',
          severity: 'warning'
        });
        continue;
      }
      
      // Validate each subject
      for (const [subject, grade] of Object.entries(baseline)) {
        const validation = validateSubject(subject, countryCode);
        
        if (validation.isValid) {
          console.log(`     ✅ ${subject}: ${grade}%`);
        } else {
          console.log(`     ❌ ${subject}: ${grade}% - NOT IN CURRICULUM!`);
          console.log(`        Available subjects: ${validation.validSubjects.slice(0, 5).join(', ')}...`);
          issues.push({
            career: career.name,
            country: countryCode,
            subject: subject,
            grade: grade,
            issue: `Subject "${subject}" not in ${countryName} curriculum`,
            severity: 'error'
          });
        }
      }
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All career requirements are valid!');
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ Found ${errors.length} ERROR(S):`);
      errors.forEach(issue => {
        console.log(`   • ${issue.career} (${countryNames[issue.country]}): ${issue.issue}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  Found ${warnings.length} WARNING(S):`);
      warnings.forEach(issue => {
        console.log(`   • ${issue.career} (${countryNames[issue.country]}): ${issue.issue}`);
      });
    }
  }
  
  console.log('\n');
  
  return { errors, warnings };
}

// Run validation
validateCareersData()
  .then(({ errors, warnings }) => {
    if (errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });




