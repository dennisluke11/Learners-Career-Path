#!/usr/bin/env node

/**
 * Update Firestore with Accurate Subjects for 6 Countries
 * 
 * This script updates the Firestore 'countrySubjects' collection with
 * researched and accurate subjects for:
 * - South Africa (ZA)
 * - Kenya (KE)
 * - Nigeria (NG)
 * - Zimbabwe (ZW)
 * - Ethiopia (ET)
 * - Egypt (EG)
 * 
 * Usage:
 * node scripts/update-subjects-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if service account file exists (try both possible names)
let serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json or firebase-service-account.json not found!');
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the JSON file as "serviceAccountKey.json" in project root');
  console.log('4. Run this script again\n');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Researched subjects for each country
const COUNTRY_SUBJECTS = {
  'ZA': {
    subjects: [
      // Compulsory Subjects (4 required for NSC)
      // Note: Mathematics OR Mathematical Literacy (one required, not both - handled in component)
      { standardName: 'Math', displayName: 'Mathematics', required: false },
      { standardName: 'MathLiteracy', displayName: 'Mathematical Literacy', required: false },
      { standardName: 'English', displayName: 'English (Home Language)', required: true },
      { standardName: 'EnglishFAL', displayName: 'English (First Additional Language)', required: true },
      { standardName: 'Afrikaans', displayName: 'Afrikaans (First Additional Language)', required: false },
      { standardName: 'Zulu', displayName: 'isiZulu (Home Language/First Additional Language)', required: false },
      { standardName: 'Xhosa', displayName: 'isiXhosa (Home Language/First Additional Language)', required: false },
      { standardName: 'Sesotho', displayName: 'Sesotho (Home Language/First Additional Language)', required: false },
      { standardName: 'Setswana', displayName: 'Setswana (Home Language/First Additional Language)', required: false },
      { standardName: 'LifeOrientation', displayName: 'Life Orientation', required: true },
      
      // Sciences (Elective)
      { standardName: 'Physics', displayName: 'Physical Sciences', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry (part of Physical Sciences)', required: false },
      { standardName: 'Biology', displayName: 'Life Sciences', required: false },
      { standardName: 'AgriculturalSciences', displayName: 'Agricultural Sciences', required: false },
      
      // Business & Commerce (Elective)
      { standardName: 'Accounting', displayName: 'Accounting', required: false },
      { standardName: 'BusinessStudies', displayName: 'Business Studies', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      
      // Humanities (Elective)
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      
      // Technology (Elective)
      { standardName: 'IT', displayName: 'Information Technology', required: false },
      { standardName: 'CAT', displayName: 'Computer Applications Technology', required: false },
      { standardName: 'EGD', displayName: 'Engineering Graphics and Design', required: false },
      
      // Arts (Elective)
      { standardName: 'VisualArts', displayName: 'Visual Arts', required: false },
      { standardName: 'DramaticArts', displayName: 'Dramatic Arts', required: false },
      { standardName: 'Music', displayName: 'Music', required: false },
      
      // Other Electives
      { standardName: 'Tourism', displayName: 'Tourism', required: false },
      { standardName: 'ConsumerStudies', displayName: 'Consumer Studies', required: false },
      { standardName: 'HospitalityStudies', displayName: 'Hospitality Studies', required: false },
      { standardName: 'Design', displayName: 'Design', required: false }
    ],
    subjectAliases: {
      // Mathematics
      'Mathematics': 'Math',
      'Maths': 'Math',
      'Mathematical Literacy': 'MathLiteracy',
      'Math Literacy': 'MathLiteracy',
      
      // Languages
      'English Home Language': 'English',
      'English HL': 'English',
      'English First Additional Language': 'EnglishFAL',
      'English FAL': 'EnglishFAL',
      'Afrikaans First Additional Language': 'Afrikaans',
      'Afrikaans FAL': 'Afrikaans',
      'Afrikaans Home Language': 'Afrikaans',
      'Afrikaans HL': 'Afrikaans',
      'isiZulu': 'Zulu',
      'isiZulu Home Language': 'Zulu',
      'isiZulu First Additional Language': 'Zulu',
      'isiXhosa': 'Xhosa',
      'isiXhosa Home Language': 'Xhosa',
      'isiXhosa First Additional Language': 'Xhosa',
      'Sesotho Home Language': 'Sesotho',
      'Sesotho First Additional Language': 'Sesotho',
      'Setswana Home Language': 'Setswana',
      'Setswana First Additional Language': 'Setswana',
      
      // Sciences
      'Physical Sciences': 'Physics',
      'Physical Science': 'Physics',
      'Chemistry (part of Physical Sciences)': 'Chemistry',
      'Life Sciences': 'Biology',
      'Life Science': 'Biology',
      'Agricultural Sciences': 'AgriculturalSciences',
      'Agricultural Science': 'AgriculturalSciences',
      'Agriculture': 'AgriculturalSciences',
      
      // Technology
      'Computer Applications Technology': 'CAT',
      'Computer Applications Tech': 'CAT',
      'Information Technology': 'IT',
      'Engineering Graphics and Design': 'EGD',
      'Engineering Graphics': 'EGD',
      'Computer': 'IT',
      'Computers': 'IT',
      
      // Arts
      'Visual Arts': 'VisualArts',
      'Dramatic Arts': 'DramaticArts',
      'Drama': 'DramaticArts',
      
      // Other
      'Consumer Studies': 'ConsumerStudies',
      'Hospitality Studies': 'HospitalityStudies',
      'Hospitality': 'HospitalityStudies'
    }
  },
  'KE': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Kiswahili', displayName: 'Kiswahili', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'Agriculture', displayName: 'Agriculture', required: false },
      { standardName: 'ComputerStudies', displayName: 'Computer Studies', required: false },
      { standardName: 'History', displayName: 'History and Government', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'CRE', displayName: 'Christian Religious Education', required: false },
      { standardName: 'IRE', displayName: 'Islamic Religious Education', required: false },
      { standardName: 'HRE', displayName: 'Hindu Religious Education', required: false },
      { standardName: 'HomeScience', displayName: 'Home Science', required: false },
      { standardName: 'BusinessStudies', displayName: 'Business Studies', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'Maths': 'Math',
      'Kiswahili': 'Kiswahili',
      'History and Government': 'History',
      'Christian Religious Education': 'CRE',
      'Islamic Religious Education': 'IRE',
      'Hindu Religious Education': 'HRE'
    }
  },
  'NG': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English Language', required: true },
      { standardName: 'CivicEducation', displayName: 'Civic Education', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'FurtherMath', displayName: 'Further Mathematics', required: false },
      { standardName: 'DataProcessing', displayName: 'Data Processing', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'Government', displayName: 'Government', required: false },
      { standardName: 'Literature', displayName: 'Literature in English', required: false },
      { standardName: 'Accounting', displayName: 'Financial Accounting', required: false },
      { standardName: 'Commerce', displayName: 'Commerce', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'CRK', displayName: 'Christian Religious Knowledge', required: false },
      { standardName: 'IRK', displayName: 'Islamic Religious Knowledge', required: false },
      { standardName: 'AgriculturalScience', displayName: 'Agricultural Science', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'English Language': 'English',
      'Civic Education': 'CivicEducation',
      'Further Mathematics': 'FurtherMath',
      'Data Processing': 'DataProcessing',
      'Literature in English': 'Literature',
      'Financial Accounting': 'Accounting',
      'Christian Religious Knowledge': 'CRK',
      'Islamic Religious Knowledge': 'IRK',
      'Agricultural Science': 'AgriculturalScience'
    }
  },
  'ZW': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English Language', required: true },
      { standardName: 'Shona', displayName: 'Shona', required: false },
      { standardName: 'Ndebele', displayName: 'Ndebele', required: false },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'CombinedScience', displayName: 'Combined Science', required: false },
      { standardName: 'HeritageStudies', displayName: 'Heritage Studies', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Agriculture', displayName: 'Agriculture', required: false },
      { standardName: 'Accounting', displayName: 'Accounts', required: false },
      { standardName: 'BusinessStudies', displayName: 'Business Studies', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'ComputerStudies', displayName: 'Computer Studies', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'English Language': 'English',
      'Combined Science': 'CombinedScience',
      'Heritage Studies': 'HeritageStudies',
      'Accounts': 'Accounting'
    }
  },
  'ET': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Amharic', displayName: 'Amharic', required: true },
      { standardName: 'Civics', displayName: 'Civics and Ethical Education', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'IT', displayName: 'Information Technology', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'Agriculture', displayName: 'Agriculture', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'Civics and Ethical Education': 'Civics',
      'Information Technology': 'IT'
    }
  },
  'EG': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English (First Foreign Language)', required: true },
      { standardName: 'Arabic', displayName: 'Arabic Language', required: true },
      { standardName: 'SecondLanguage', displayName: 'Second Foreign Language (French/German/Italian/Spanish)', required: false },
      { standardName: 'Citizenship', displayName: 'Citizenship Education', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'PureMath', displayName: 'Pure Mathematics', required: false },
      { standardName: 'AppliedMath', displayName: 'Applied Mathematics', required: false },
      { standardName: 'Mechanics', displayName: 'Mechanics', required: false },
      { standardName: 'Geology', displayName: 'Geology', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'Philosophy', displayName: 'Philosophy', required: false },
      { standardName: 'Psychology', displayName: 'Psychology', required: false },
      { standardName: 'Sociology', displayName: 'Sociology', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'English (First Foreign Language)': 'English',
      'Arabic Language': 'Arabic',
      'Second Foreign Language': 'SecondLanguage',
      'Citizenship Education': 'Citizenship',
      'Pure Mathematics': 'PureMath',
      'Applied Mathematics': 'AppliedMath'
    }
  }
};

async function updateSubjects() {
  console.log('📚 Updating countrySubjects collection with accurate subjects...\n');
  
  const subjectsRef = db.collection('countrySubjects');
  const batch = db.batch();
  
  let updatedCount = 0;
  
  for (const [countryCode, data] of Object.entries(COUNTRY_SUBJECTS)) {
    const docRef = subjectsRef.doc(countryCode);
    batch.set(docRef, data, { merge: true });
    
    const countryNames = {
      'ZA': 'South Africa',
      'KE': 'Kenya',
      'NG': 'Nigeria',
      'ZW': 'Zimbabwe',
      'ET': 'Ethiopia',
      'EG': 'Egypt'
    };
    
    console.log(`  ✓ ${countryNames[countryCode]} (${countryCode}): ${data.subjects.length} subjects`);
    updatedCount++;
  }
  
  await batch.commit();
  
  console.log(`\n✅ Successfully updated ${updatedCount} countries with accurate subjects!`);
  console.log('\n📊 Summary:');
  console.log(`   • All subjects are now based on official curriculum research`);
  console.log(`   • Subjects are configurable remotely via Firestore`);
  console.log(`   • Changes will reflect immediately in the app\n`);
}

// Run the update
updateSubjects()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error updating subjects:', error);
    process.exit(1);
  });





