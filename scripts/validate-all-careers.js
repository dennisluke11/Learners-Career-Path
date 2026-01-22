#!/usr/bin/env node

/**
 * Comprehensive Validation of All Career Requirements
 * 
 * This script validates all career requirements against each country's curriculum
 * to ensure subjects are correct and available.
 * 
 * Usage:
 * node scripts/validate-all-careers.js
 */

const fs = require('fs');
const path = require('path');

// Read subject model to get valid subjects per country
const subjectsModelPath = path.join(__dirname, '..', 'src/app/shared/models/subject.model.ts');
const careersDataPath = path.join(__dirname, '..', 'src/app/features/career-planning/services/careers-data.helper.ts');

// Extract valid subjects from subject.model.ts
function extractValidSubjects() {
  const content = fs.readFileSync(subjectsModelPath, 'utf8');
  const countrySubjects = {};
  
  // Parse COUNTRY_SUBJECTS object
  const countryBlocks = content.match(/'([A-Z]{2})':\s*{[\s\S]*?subjects:\s*\[([\s\S]*?)\]/g);
  
  // More reliable parsing - find each country block
  const countries = ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG'];
  
  for (const countryCode of countries) {
    const regex = new RegExp(`'${countryCode}':\\s*{[\\s\\S]*?subjects:\\s*\\[([\\s\\S]*?)\\]`, 'g');
    const match = regex.exec(content);
    
    if (match) {
      const subjectsBlock = match[1];
      const subjects = [];
      
      // Extract standardName from each subject
      const subjectMatches = subjectsBlock.matchAll(/standardName:\s*['"]([^'"]+)['"]/g);
      for (const subMatch of subjectMatches) {
        subjects.push(subMatch[1]);
      }
      
      countrySubjects[countryCode] = subjects;
    }
  }
  
  return countrySubjects;
}

// Extract career data from careers-data.helper.ts
function extractCareerData() {
  const content = fs.readFileSync(careersDataPath, 'utf8');
  const careers = [];
  
  // Find all career definitions
  const lines = content.split('\n');
  let currentCareer = null;
  let inBaselines = false;
  let baselineLines = [];
  let countryIndex = 0;
  const countries = ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect career start
    if (line.includes('name:') && line.includes("'")) {
      const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
      if (nameMatch) {
        currentCareer = {
          name: nameMatch[1],
          baselines: {}
        };
        inBaselines = false;
        countryIndex = 0;
        baselineLines = [];
      }
    }
    
    // Detect countryBaselines start
    if (line.includes('countryBaselines:') && line.includes('createCountryBaselines')) {
      inBaselines = true;
      countryIndex = 0;
      baselineLines = [];
    }
    
    // Collect baseline lines
    if (inBaselines && currentCareer) {
      // Check if this line contains a country baseline
      if (line.trim().startsWith('{') && line.includes(':')) {
        baselineLines.push(line.trim());
      }
      
      // Check for country comment
      if (line.includes('//') && line.match(/\([A-Z]{2}\)/)) {
        const countryMatch = line.match(/\(([A-Z]{2})\)/);
        if (countryMatch && countryIndex < countries.length) {
          const countryCode = countryMatch[1];
          
          // Get the previous line which should have the baseline
          if (baselineLines.length > 0) {
            const baselineLine = baselineLines[baselineLines.length - 1];
            const subjects = parseBaselineLine(baselineLine);
            currentCareer.baselines[countryCode] = subjects;
          }
          
          countryIndex++;
        }
      }
      
      // End of baselines
      if (line.includes(')') && inBaselines && line.trim().endsWith(')')) {
        if (currentCareer && Object.keys(currentCareer.baselines).length > 0) {
          careers.push(currentCareer);
        }
        currentCareer = null;
        inBaselines = false;
      }
    }
  }
  
  return careers;
}

function parseBaselineLine(line) {
  const subjects = {};
  // Remove comments and braces
  let cleanLine = line.replace(/\/\/.*$/, '').trim();
  cleanLine = cleanLine.replace(/^\{/, '').replace(/\}$/, '');
  
  // Match patterns like "Biology: 75" or "English: 80"
  const matches = cleanLine.matchAll(/(\w+):\s*(\d+)/g);
  for (const match of matches) {
    subjects[match[1]] = parseInt(match[2]);
  }
  
  return subjects;
}

const countryNames = {
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'ZW': 'Zimbabwe',
  'ET': 'Ethiopia',
  'EG': 'Egypt'
};

async function validateAllCareers() {
  console.log('🔍 Comprehensive Career Requirements Validation\n');
  console.log('='.repeat(70));
  
  // Extract valid subjects
  console.log('\n📚 Extracting valid subjects from curriculum...');
  const validSubjects = extractValidSubjects();
  
  for (const [country, subjects] of Object.entries(validSubjects)) {
    console.log(`  ${countryNames[country]}: ${subjects.length} subjects`);
  }
  
  // Extract career data
  console.log('\n📋 Extracting career requirements...');
  const careers = extractCareerData();
  console.log(`  Found ${careers.length} careers\n`);
  
  // Validation results
  const issues = [];
  let totalChecks = 0;
  let validChecks = 0;
  
  // Validate each career
  for (const career of careers) {
    const careerIssues = [];
    
    for (const countryCode of ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG']) {
      const countryName = countryNames[countryCode];
      const baseline = career.baselines[countryCode] || {};
      const validSubjectsForCountry = validSubjects[countryCode] || [];
      
      if (Object.keys(baseline).length === 0) {
        careerIssues.push({
          country: countryCode,
          severity: 'warning',
          message: 'No requirements defined'
        });
        continue;
      }
      
      // Validate each subject
      for (const [subject, grade] of Object.entries(baseline)) {
        totalChecks++;
        
        if (validSubjectsForCountry.includes(subject)) {
          validChecks++;
        } else {
          careerIssues.push({
            country: countryCode,
            severity: 'error',
            subject: subject,
            grade: grade,
            message: `Subject "${subject}" not in ${countryName} curriculum`,
            suggestions: validSubjectsForCountry.filter(s => 
              s.toLowerCase().includes(subject.toLowerCase()) || 
              subject.toLowerCase().includes(s.toLowerCase())
            ).slice(0, 3)
          });
        }
      }
    }
    
    if (careerIssues.length > 0) {
      issues.push({
        career: career.name,
        issues: careerIssues
      });
    }
  }
  
  // Print detailed report
  console.log('='.repeat(70));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(70));
  
  console.log(`\n✅ Valid Requirements: ${validChecks}/${totalChecks} (${Math.round(validChecks/totalChecks*100)}%)`);
  console.log(`❌ Invalid Requirements: ${totalChecks - validChecks}/${totalChecks}`);
  console.log(`📋 Careers with Issues: ${issues.length}/${careers.length}\n`);
  
  if (issues.length > 0) {
    console.log('='.repeat(70));
    console.log('❌ ISSUES FOUND');
    console.log('='.repeat(70));
    
    for (const { career, issues: careerIssues } of issues) {
      console.log(`\n📋 ${career}`);
      console.log('-'.repeat(70));
      
      const errors = careerIssues.filter(i => i.severity === 'error');
      const warnings = careerIssues.filter(i => i.severity === 'warning');
      
      if (errors.length > 0) {
        console.log(`  ❌ ERRORS (${errors.length}):`);
        for (const issue of errors) {
          console.log(`     • ${countryNames[issue.country]}: ${issue.message}`);
          console.log(`       Subject: ${issue.subject}, Grade: ${issue.grade}%`);
          if (issue.suggestions && issue.suggestions.length > 0) {
            console.log(`       Suggestions: ${issue.suggestions.join(', ')}`);
          }
        }
      }
      
      if (warnings.length > 0) {
        console.log(`  ⚠️  WARNINGS (${warnings.length}):`);
        for (const issue of warnings) {
          console.log(`     • ${countryNames[issue.country]}: ${issue.message}`);
        }
      }
    }
    
    // Summary by country
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY BY COUNTRY');
    console.log('='.repeat(70));
    
    for (const countryCode of ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG']) {
      const countryIssues = issues.flatMap(i => 
        i.issues.filter(issue => issue.country === countryCode)
      );
      
      if (countryIssues.length > 0) {
        const errors = countryIssues.filter(i => i.severity === 'error');
        const warnings = countryIssues.filter(i => i.severity === 'warning');
        
        console.log(`\n🌍 ${countryNames[countryCode]} (${countryCode}):`);
        console.log(`   Errors: ${errors.length}, Warnings: ${warnings.length}`);
        
        if (errors.length > 0) {
          const uniqueSubjects = [...new Set(errors.map(e => e.subject))];
          console.log(`   Invalid subjects: ${uniqueSubjects.join(', ')}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(70));
    console.log('\n1. Fix invalid subject names to match curriculum');
    console.log('2. Add missing requirements for careers with warnings');
    console.log('3. Verify grade requirements against real admission standards');
    console.log('4. Update Firestore after fixing issues\n');
    
  } else {
    console.log('✅ All career requirements are valid!\n');
  }
  
  return { issues, totalChecks, validChecks };
}

// Run validation
validateAllCareers()
  .then(({ issues, totalChecks, validChecks }) => {
    if (issues.length > 0) {
      console.log(`\n⚠️  Found ${issues.length} careers with issues`);
      process.exit(1);
    } else {
      console.log('\n✅ All validations passed!');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });





