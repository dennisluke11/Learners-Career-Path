/**
 * Script to add sample announcements to Firestore
 * 
 * Usage: node scripts/add-sample-announcements.js
 * 
 * Make sure you have:
 * 1. Firebase Admin SDK configured
 * 2. Service account key in project root as 'serviceAccountKey.json'
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('📝 Please download your service account key from Firebase Console');
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   2. Click "Generate New Private Key"');
    console.log('   3. Save as "serviceAccountKey.json" in project root');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Sample announcements to add
 */
const sampleAnnouncements = [
  {
    title: 'University of Nairobi - Medical School Admissions 2025',
    content: 'Applications for the MBChB (Bachelor of Medicine and Bachelor of Surgery) program are now open for the 2025 academic year.\n\nMinimum Requirements:\n• Biology: 75%\n• Chemistry: 75%\n• Mathematics: 70%\n• Physics: 65%\n\nApplication Deadline: March 31, 2025\n\nApply early to secure your spot in one of East Africa\'s leading medical schools.',
    type: 'university_admission',
    category: 'Medicine',
    targetCareers: ['Doctor', 'Nurse'],
    targetCountries: ['KE'],
    targetGradeLevels: [12],
    priority: 10,
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-03-31')),
    isActive: true,
    isPaid: true,
    company: {
      name: 'University of Nairobi',
      logo: 'https://uonbi.ac.ke/sites/default/files/2021-06/uon-logo.png',
      website: 'https://uonbi.ac.ke',
      contact: 'admissions@uonbi.ac.ke'
    },
    actionButton: {
      text: 'For More Details',
      url: 'https://uonbi.ac.ke/admissions',
      type: 'external'
    },
    views: 0,
    clicks: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Mastercard Foundation Scholarship - Engineering Students',
    content: 'Full scholarship opportunity for engineering students from Kenya, Nigeria, and South Africa.\n\nEligibility:\n• Must be pursuing Engineering career\n• Minimum grades: Math 70%, Physics 65%, Chemistry 60%\n• Grade 11 or 12 students\n• Demonstrated financial need\n\nScholarship covers:\n• Full tuition fees\n• Accommodation\n• Living expenses\n• Laptop and study materials',
    type: 'scholarship',
    category: 'Engineering',
    targetCareers: ['Engineer', 'Software Engineer', 'Civil Engineer'],
    targetCountries: ['KE', 'NG', 'ZA'],
    targetGradeLevels: [11, 12],
    priority: 9,
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
    isActive: true,
    isPaid: true,
    company: {
      name: 'Mastercard Foundation',
      logo: 'https://mastercardfdn.org/wp-content/uploads/2020/06/MCF-Logo-Horizontal-RGB.png',
      website: 'https://mastercardfdn.org',
      contact: 'scholarships@mastercardfdn.org'
    },
    actionButton: {
      text: 'For More Details',
      url: 'https://mastercardfdn.org/scholarships',
      type: 'external'
    },
    views: 0,
    clicks: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Coding Bootcamp - Software Engineering Career Path',
    content: '12-week intensive coding bootcamp designed for students interested in Software Engineering.\n\nProgram includes:\n• Full-stack web development\n• Mobile app development\n• Data structures and algorithms\n• Career preparation and job placement assistance\n\nNo prior coding experience required!\n\nSchedule: Flexible (evenings and weekends)\nFormat: Online with live sessions\n\nPerfect for Grade 10-12 students planning a career in tech.',
    type: 'training',
    category: 'Technology',
    targetCareers: ['Software Engineer', 'IT Specialist', 'Data Scientist'],
    targetCountries: ['KE', 'NG', 'ZA', 'ZW', 'ET', 'EG'],
    targetGradeLevels: [10, 11, 12],
    priority: 8,
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
    isActive: true,
    isPaid: false,
    company: {
      name: 'Tech Academy Africa',
      website: 'https://techacademy.africa',
      contact: 'info@techacademy.africa'
    },
    actionButton: {
      text: 'For More Details',
      url: 'https://techacademy.africa/bootcamp',
      type: 'external'
    },
    views: 0,
    clicks: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Career Fair 2024 - Nairobi',
    content: 'Join us for the largest career fair in East Africa!\n\nDate: March 15-16, 2024\nLocation: Kenyatta International Conference Centre, Nairobi\n\nMeet:\n• Top employers from various industries\n• University representatives\n• Scholarship providers\n• Career counselors\n\nFree admission for all students!\n\nPerfect opportunity to:\n• Explore different career options\n• Network with professionals\n• Learn about job opportunities\n• Get advice on university applications',
    type: 'event',
    category: 'General',
    targetCountries: ['KE'],
    targetGradeLevels: [11, 12],
    priority: 7,
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-16')),
    isActive: true,
    isPaid: false,
    company: {
      name: 'Career Connect Kenya',
      website: 'https://careerconnect.ke',
      contact: 'info@careerconnect.ke'
    },
    actionButton: {
      text: 'For More Details',
      url: 'https://careerconnect.ke/fair2024',
      type: 'external'
    },
    views: 0,
    clicks: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Welcome to Learner\'s Career Path',
    content: 'Start your career journey by selecting your country, grade level, and entering your grades to discover your path to success.\n\nOur platform helps you:\n• Identify careers that match your interests\n• Understand what grades you need to improve\n• Get personalized study tips\n• Access relevant study resources\n• Track your progress over time\n\nBegin your journey today!',
    type: 'general',
    category: 'General',
    priority: 1,
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-31')),
    isActive: true,
    isPaid: false,
    actionButton: {
      text: 'For More Details',
      url: '#',
      type: 'internal'
    },
    views: 0,
    clicks: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

/**
 * Add announcements to Firestore
 */
async function addAnnouncements() {
  console.log('\n📢 Adding sample announcements to Firestore...\n');

  const batch = db.batch();
  const announcementsRef = db.collection('announcements');

  for (const announcement of sampleAnnouncements) {
    const docRef = announcementsRef.doc();
    batch.set(docRef, announcement);
    console.log(`  ✅ Prepared: ${announcement.title}`);
  }

  try {
    await batch.commit();
    console.log('\n✅ Successfully added all announcements to Firestore!');
    console.log(`\n📊 Total announcements added: ${sampleAnnouncements.length}`);
    console.log('\n🎯 Next steps:');
    console.log('  1. Check Firebase Console → Firestore → announcements collection');
    console.log('  2. Verify announcements appear in the app');
    console.log('  3. Test filtering by country, career, grade level');
  } catch (error) {
    console.error('\n❌ Error adding announcements:', error);
    process.exit(1);
  }
}

// Run the script
addAnnouncements()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });






