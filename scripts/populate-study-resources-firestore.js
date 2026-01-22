#!/usr/bin/env node

/**
 * Populate Study Resources to Firestore
 * 
 * This script creates the studyResources collection and populates it with
 * study resources (topics, sites, past papers) for all subjects, countries, and grade levels.
 * 
 * Usage: node scripts/populate-study-resources-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Subjects
const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History'];

// Countries and their grade levels
const countryGradeLevels = {
  'KE': ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
  'NG': ['SS 1', 'SS 2', 'SS 3'],
  'ZA': ['Grade 10', 'Grade 11', 'Grade 12'],
  'ZW': ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'],
  'ET': ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  'EG': ['Grade 10', 'Grade 11', 'Grade 12']
};

// Topics by subject
const topicsBySubject = {
  'Math': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'],
  'Physics': ['Mechanics', 'Thermodynamics', 'Electricity and Magnetism', 'Waves', 'Optics'],
  'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Acids and Bases', 'Stoichiometry'],
  'Biology': ['Cell Biology', 'Genetics', 'Human Anatomy', 'Ecology', 'Evolution'],
  'English': ['Grammar', 'Composition', 'Literature Analysis', 'Reading Comprehension', 'Vocabulary'],
  'History': ['World History', 'National History', 'Political Systems', 'Economic History', 'Social Movements']
};

// Country-specific sites
const countrySites = {
  'KE': [
    { name: 'KCSE Past Papers', url: 'https://www.kcsepastpapers.com', description: 'Kenya Certificate of Secondary Education past papers' },
    { name: 'Elimu Library', url: 'https://www.elimulibrary.com', description: 'Kenyan educational resources and materials' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
    { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
  ],
  'NG': [
    { name: 'WAEC Past Questions', url: 'https://www.waeconline.org.ng', description: 'West African Examinations Council past questions' },
    { name: 'Nigerian Educational Portal', url: 'https://www.nigerianeducation.com', description: 'Educational resources for Nigerian students' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
    { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
  ],
  'ZA': [
    { name: 'Department of Basic Education', url: 'https://www.education.gov.za', description: 'South African curriculum and past papers' },
    { name: 'Mindset Learn', url: 'https://learn.mindset.africa', description: 'Free educational content for South African students' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
    { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
  ],
  'ZW': [
    { name: 'ZIMSEC Past Papers', url: 'https://www.zimsec.co.zw', description: 'Zimbabwe School Examinations Council past papers' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
    { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
  ],
  'ET': [
    { name: 'Ethiopian Education Portal', url: 'https://www.moe.gov.et', description: 'Ministry of Education resources' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
    { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
  ],
  'EG': [
    { name: 'Egyptian Education Portal', url: 'https://moe.gov.eg', description: 'Ministry of Education resources' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free online courses and practice exercises' },
    { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities' }
  ]
};

// Country-specific past papers
const countryPastPapers = {
  'KE': [
    { name: 'KCSE Past Papers 2023', url: 'https://www.kcsepastpapers.com/2023', description: 'Latest KCSE examination papers', year: '2023' },
    { name: 'KCSE Past Papers Archive', url: 'https://www.kcsepastpapers.com/archive', description: 'Historical KCSE papers' },
    { name: 'KNEC Past Papers', url: 'https://www.knec.ac.ke', description: 'Kenya National Examinations Council official papers' }
  ],
  'NG': [
    { name: 'WAEC Past Questions 2023', url: 'https://www.waeconline.org.ng/past-questions', description: 'Latest WAEC examination questions', year: '2023' },
    { name: 'JAMB Past Questions', url: 'https://www.jamb.gov.ng', description: 'Joint Admissions and Matriculation Board past questions' },
    { name: 'NECO Past Papers', url: 'https://www.neco.gov.ng', description: 'National Examinations Council past papers' }
  ],
  'ZA': [
    { name: 'Matric Past Papers 2023', url: 'https://www.education.gov.za/past-papers', description: 'Latest Matric examination papers', year: '2023' },
    { name: 'IEB Past Papers', url: 'https://www.ieb.co.za', description: 'Independent Examinations Board papers' },
    { name: 'DBE Past Papers', url: 'https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations.aspx', description: 'Department of Basic Education official papers' }
  ],
  'ZW': [
    { name: 'ZIMSEC O-Level Past Papers', url: 'https://www.zimsec.co.zw/past-exam-papers', description: 'ZIMSEC O-Level examination papers' },
    { name: 'ZIMSEC A-Level Past Papers', url: 'https://www.zimsec.co.zw/past-exam-papers', description: 'ZIMSEC A-Level examination papers' }
  ],
  'ET': [
    { name: 'Ethiopian National Exam Papers', url: 'https://www.moe.gov.et/exam-papers', description: 'Ethiopian national examination past papers' },
    { name: 'ESLCE Past Papers', url: 'https://www.moe.gov.et/eslce', description: 'Ethiopian School Leaving Certificate Examination papers' }
  ],
  'EG': [
    { name: 'Thanaweya Amma Past Papers', url: 'https://moe.gov.eg/past-papers', description: 'Egyptian General Secondary Certificate past papers' },
    { name: 'Ministry of Education Papers', url: 'https://moe.gov.eg/exams', description: 'Official examination papers from Ministry of Education' }
  ]
};

async function populateStudyResources() {
  console.log('📚 Populating Study Resources to Firestore...\n');

  const batch = db.batch();
  const studyResourcesRef = db.collection('studyResources');
  let count = 0;

  console.log('📤 Creating study resources for all subjects, countries, and grade levels...\n');

  for (const subject of subjects) {
    for (const [countryCode, gradeLevels] of Object.entries(countryGradeLevels)) {
      for (const gradeLevel of gradeLevels) {
        const docId = `${subject}_${countryCode}_${gradeLevel.replace(/\s+/g, '_')}`;
        const docRef = studyResourcesRef.doc(docId);

        const resource = {
          subject: subject,
          countryCode: countryCode,
          gradeLevel: gradeLevel,
          topics: topicsBySubject[subject] || ['General Topics', 'Key Concepts', 'Important Areas'],
          recommendedSites: countrySites[countryCode] || [
            { name: 'General Educational Resources', url: 'https://www.khanacademy.org', description: 'Free online educational content' }
          ],
          pastPapers: countryPastPapers[countryCode] || [
            { name: 'Past Papers Archive', url: '#', description: 'Check your local education board website' }
          ],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          source: 'Firestore Database'
        };

        batch.set(docRef, resource, { merge: true });
        count++;

        if (count % 30 === 0) {
          console.log(`   ✓ Processed ${count} study resources...`);
        }
      }
    }
  }

  console.log(`\n💾 Committing ${count} study resources to Firestore...`);
  await batch.commit();

  console.log(`\n✅ Successfully created ${count} study resources!`);
  console.log(`   (${subjects.length} subjects × ${Object.keys(countryGradeLevels).length} countries × ~4 grade levels each)\n`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Verify in Firebase Console > Firestore > studyResources collection`);
  console.log(`   2. Update study-resources.service.ts to use Firestore instead of hardcoded\n`);
}

// Run
populateStudyResources()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });


