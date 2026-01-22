/**
 * Script to add Tshwane University of Technology announcement to Firestore
 * 
 * Usage: node scripts/add-tut-announcement.js
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
 * Tshwane University of Technology Announcement
 */
const tutAnnouncement = {
  title: 'Tshwane University of Technology - 2025 Applications Open',
  content: 'Tshwane University of Technology (TUT) is now accepting applications for the 2025 academic year.\n\nExplore a wide range of programs across:\n• Engineering and Technology\n• Arts and Design\n• Science and Mathematics\n• Management Sciences\n• Health Sciences\n\nApplication Requirements:\n• National Senior Certificate (NSC) or equivalent\n• Minimum APS score varies by program\n• Subject-specific requirements apply\n\nApplication Deadline: September 30, 2024\n\nApply early to secure your spot at one of South Africa\'s leading universities of technology.',
  type: 'university_admission',
  image: 'https://www.tut.ac.za/Templates/images/logo.png', // TUT official logo
  company: {
    name: 'Tshwane University of Technology',
    logo: 'https://www.tut.ac.za/Templates/images/logo.png',
    website: 'https://www.tut.ac.za'
  },
  actionButton: {
    text: 'For More Details',
    url: 'https://www.tut.ac.za/apply-now',
    type: 'external'
  },
  targetCountries: ['ZA'], // South Africa only
  targetCareers: [], // Show for all careers
  targetGradeLevels: [], // Show for all grade levels (country selection is enough)
  priority: 10, // High priority
  isActive: true,
  isPaid: false, // Can be changed to true if sponsored
  startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
  endDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-31')), // Extended to end of 2025
  views: 0,
  clicks: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

/**
 * Add TUT announcement to Firestore
 */
async function addTUTAnnouncement() {
  console.log('\n📢 Adding Tshwane University of Technology announcement to Firestore...\n');

  try {
    const announcementsRef = db.collection('announcements');
    const docRef = await announcementsRef.add(tutAnnouncement);
    
    console.log('✅ Successfully added TUT announcement!');
    console.log(`\n📋 Announcement Details:`);
    console.log(`   Title: ${tutAnnouncement.title}`);
    console.log(`   Type: ${tutAnnouncement.type}`);
    console.log(`   Target Country: South Africa (ZA)`);
    console.log(`   Target Grade Level: Grade 12`);
    console.log(`   Priority: ${tutAnnouncement.priority}`);
    console.log(`   Website: ${tutAnnouncement.company.website}`);
    console.log(`   Logo: ${tutAnnouncement.company.logo}`);
    console.log(`   Document ID: ${docRef.id}`);
    console.log('\n🎯 Next steps:');
    console.log('  1. Check Firebase Console → Firestore → announcements collection');
    console.log('  2. Verify announcement appears in the app for South Africa users');
    console.log('  3. Test the "For More Details" button link');
    console.log('  4. Monitor views and clicks in Firestore');
    
    return docRef.id;
  } catch (error) {
    console.error('\n❌ Error adding TUT announcement:', error);
    throw error;
  }
}

// Run the script
addTUTAnnouncement()
  .then((docId) => {
    console.log(`\n✨ Done! Announcement ID: ${docId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

