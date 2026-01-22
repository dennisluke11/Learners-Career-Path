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
 * Tshwane University of Technology Open Day Announcement
 */
const tutAnnouncement = {
  title: 'Tshwane University of Technology - Open Day 2026',
  content: '🎓 Join us for Tshwane University of Technology (TUT) Open Day 2026!\n\n📅 **Date:** Saturday, March 15, 2026\n⏰ **Time:** 9:00 AM - 3:00 PM\n📍 **Location:** TUT Main Campus, Pretoria\n\n**What to Expect:**\n• Campus tours and facility visits\n• Meet with faculty and current students\n• Learn about our programs:\n  - Engineering and Technology\n  - Arts and Design\n  - Science and Mathematics\n  - Management Sciences\n  - Health Sciences\n• Get information about admission requirements\n• Financial aid and scholarship opportunities\n• Career guidance and counseling\n\n**Who Should Attend:**\n• Grade 11 and 12 learners\n• Parents and guardians\n• Anyone interested in pursuing higher education\n\n**Registration:**\nPre-registration is recommended but walk-ins are welcome!\n\nDon\'t miss this opportunity to explore your future at one of South Africa\'s leading universities of technology!',
  type: 'event',
  image: 'https://www.tut.ac.za/Templates/images/logo.png', // TUT official logo
  company: {
    name: 'Tshwane University of Technology',
    logo: 'https://www.tut.ac.za/Templates/images/logo.png',
    website: 'https://www.tut.ac.za',
    contact: 'info@tut.ac.za'
  },
  actionButton: {
    text: 'Register for Open Day',
    url: 'https://www.tut.ac.za/open-day-2025',
    type: 'external'
  },
  targetCountries: ['ZA'], // South Africa only
  targetCareers: [], // Show for all careers
  targetGradeLevels: [11, 12], // Grade 11 and 12 learners
  priority: 10, // High priority
  isActive: true,
  isPaid: false,
  startDate: admin.firestore.Timestamp.fromDate(new Date('2026-01-01')), // Start showing from Jan 1, 2026
  endDate: admin.firestore.Timestamp.fromDate(new Date('2026-03-15')), // End on Open Day date
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
    
    console.log('✅ Successfully added TUT Open Day announcement!');
    console.log(`\n📋 Announcement Details:`);
    console.log(`   Title: ${tutAnnouncement.title}`);
    console.log(`   Type: ${tutAnnouncement.type}`);
    console.log(`   Target Country: South Africa (ZA)`);
    console.log(`   Target Grade Levels: ${tutAnnouncement.targetGradeLevels.join(', ')}`);
    console.log(`   Priority: ${tutAnnouncement.priority}`);
    console.log(`   Start Date: ${tutAnnouncement.startDate.toDate().toLocaleDateString()}`);
    console.log(`   End Date: ${tutAnnouncement.endDate.toDate().toLocaleDateString()}`);
    console.log(`   Website: ${tutAnnouncement.company.website}`);
    console.log(`   Document ID: ${docRef.id}`);
    console.log('\n🎯 Next steps:');
    console.log('  1. Check Firebase Console → Firestore → announcements collection');
    console.log('  2. Verify announcement appears in the app for South Africa users (Grade 11-12)');
    console.log('  3. Test the "Register for Open Day" button link');
    console.log('  4. Monitor views and clicks in Firestore');
    console.log('  5. Refresh the app to see the announcement');
    
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

