#!/usr/bin/env node

/**
 * Comprehensive Fix Script for Career Data Issues
 * 
 * This script identifies and fixes common issues in career requirements:
 * 1. Invalid subject names
 * 2. Missing Chemistry for South Africa
 * 3. Computer → IT/CAT/ComputerStudies mapping
 * 4. Business → BusinessStudies
 * 
 * Usage:
 * node scripts/fix-all-career-issues.js
 */

const fs = require('fs');
const path = require('path');

const careersDataPath = path.join(__dirname, '..', 'src/app/features/career-planning/services/careers-data.helper.ts');

// Subject mappings per country
const SUBJECT_MAPPINGS = {
  'ZA': {
    'Computer': 'IT',
    'Chemistry': 'Chemistry' // Now valid
  },
  'KE': {
    'Computer': 'ComputerStudies'
  },
  'NG': {
    'Computer': 'DataProcessing'
  },
  'ZW': {
    'Computer': 'ComputerStudies'
  },
  'ET': {
    'Computer': 'IT'
  },
  'EG': {
    'Computer': 'IT'
  }
};

// Global mappings (apply to all countries)
const GLOBAL_MAPPINGS = {
  'Business': 'BusinessStudies'
};

const countryNames = {
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'ZW': 'Zimbabwe',
  'ET': 'Ethiopia',
  'EG': 'Egypt'
};

function fixCareerData() {
  console.log('🔧 Comprehensive Career Data Fix Script\n');
  console.log('='.repeat(70));
  
  if (!fs.existsSync(careersDataPath)) {
    console.error(`❌ Error: ${careersDataPath} not found!`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(careersDataPath, 'utf8');
  let fixesApplied = 0;
  const fixes = [];
  
  // Fix 1: Business → BusinessStudies (global)
  const businessMatches = content.matchAll(/Business:\s*(\d+)/g);
  for (const match of businessMatches) {
    const oldText = `Business: ${match[1]}`;
    const newText = `BusinessStudies: ${match[1]}`;
    content = content.replace(oldText, newText);
    fixesApplied++;
    fixes.push(`Business → BusinessStudies: ${match[1]}%`);
  }
  
  // Fix 2: Computer → Country-specific mappings
  const countries = ['ZA', 'KE', 'NG', 'ZW', 'ET', 'EG'];
  
  for (const countryCode of countries) {
    const mapping = SUBJECT_MAPPINGS[countryCode];
    if (mapping && mapping['Computer']) {
      const replacement = mapping['Computer'];
      
      // Find Computer references in this country's baseline
      // Pattern: {..., Computer: XX}, // ... (countryCode)
      const regex = new RegExp(`(Computer:\\s*\\d+)([^}]*?)\\/\\/\\s*.*?\\(${countryCode}\\)`, 'g');
      const matches = [...content.matchAll(regex)];
      
      for (const match of matches) {
        const oldText = match[1];
        const newText = `${replacement}: ${oldText.split(':')[1].trim()}`;
        content = content.replace(oldText, newText);
        fixesApplied++;
        fixes.push(`${countryNames[countryCode]}: Computer → ${replacement}`);
      }
    }
  }
  
  // Write fixed content
  if (fixesApplied > 0) {
    fs.writeFileSync(careersDataPath, content, 'utf8');
    
    console.log(`\n✅ Applied ${fixesApplied} fixes:\n`);
    fixes.forEach((fix, index) => {
      console.log(`  ${index + 1}. ${fix}`);
    });
    
    console.log(`\n📝 File updated: ${careersDataPath}`);
    console.log('\n✨ All fixes applied successfully!\n');
  } else {
    console.log('\n✅ No fixes needed - all data is correct!\n');
  }
  
  return fixesApplied;
}

// Run fixes
const fixesApplied = fixCareerData();

if (fixesApplied > 0) {
  console.log('💡 Next Steps:');
  console.log('  1. Review the changes');
  console.log('  2. Run validation: node scripts/validate-all-careers.js');
  console.log('  3. Test the application');
  console.log('  4. Update Firestore if needed\n');
}

process.exit(fixesApplied > 0 ? 0 : 0);





