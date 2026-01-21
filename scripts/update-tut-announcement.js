/**
 * Script to update existing TUT announcement in Firestore
 * Removes grade level restriction and extends end date
 * 
 * Usage: node scripts/update-tut-announcement.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
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
 * Update TUT announcement
 */
async function updateTUTAnnouncement() {
  console.log('\n📢 Updating Tshwane University of Technology announcement...\n');

  try {
    // Find the TUT announcement by title
    const announcementsRef = db.collection('announcements');
    const snapshot = await announcementsRef
      .where('title', '==', 'Tshwane University of Technology - 2025 Applications Open')
      .get();

    if (snapshot.empty) {
      console.log('⚠️  No TUT announcement found. Creating new one...');
      // Create new announcement
      const tutAnnouncement = {
        title: 'Tshwane University of Technology - 2025 Applications Open',
        content: 'Tshwane University of Technology (TUT) is now accepting applications for the 2025 academic year.\n\nExplore a wide range of programs across:\n• Engineering and Technology\n• Arts and Design\n• Science and Mathematics\n• Management Sciences\n• Health Sciences\n\nApplication Requirements:\n• National Senior Certificate (NSC) or equivalent\n• Minimum APS score varies by program\n• Subject-specific requirements apply\n\nApplication Deadline: September 30, 2024\n\nApply early to secure your spot at one of South Africa\'s leading universities of technology.',
        type: 'university_admission',
        image: 'https://www.tut.ac.za/Templates/images/logo.png',
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
        targetCountries: ['ZA'],
        targetCareers: [],
        targetGradeLevels: [], // No grade level restriction
        priority: 10,
        isActive: true,
        isPaid: false,
        startDate: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
        endDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-31')),
        views: 0,
        clicks: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await announcementsRef.add(tutAnnouncement);
      console.log(`✅ Created new TUT announcement with ID: ${docRef.id}`);
      return docRef.id;
    }

    // Update existing announcement(s)
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        targetGradeLevels: [], // Remove grade level restriction
        endDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-31')), // Extend end date
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      updatedCount++;
      console.log(`  ✅ Prepared update for document: ${doc.id}`);
    });

    await batch.commit();
    console.log(`\n✅ Successfully updated ${updatedCount} TUT announcement(s)!`);
    console.log('\n📋 Changes Applied:');
    console.log('   • Removed grade level restriction (now shows for all grade levels)');
    console.log('   • Extended end date to December 31, 2025');
    console.log('   • Announcement now shows when South Africa is selected (no grade level needed)');
    
    return updatedCount;
  } catch (error) {
    console.error('\n❌ Error updating TUT announcement:', error);
    throw error;
  }
}

// Run the script
updateTUTAnnouncement()
  .then((result) => {
    console.log(`\n✨ Done!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });



