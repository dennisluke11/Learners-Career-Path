#!/usr/bin/env node

/**
 * Script to create adminUsers collection in Firestore
 * 
 * This script creates the adminUsers collection with a default admin user.
 * 
 * Usage: node scripts/create-admin-users.js [username] [password]
 * 
 * Examples:
 *   node scripts/create-admin-users.js
 *   node scripts/create-admin-users.js admin admin123
 *   node scripts/create-admin-users.js myadmin mypassword123
 * 
 * Prerequisites:
 * 1. Firebase Admin SDK configured
 * 2. Service account key in project root (firebase-service-account.json or serviceAccountKey.json)
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Get command line arguments
const args = process.argv.slice(2);
const username = args[0] || 'admin';
const password = args[1] || 'admin123';

// Check for service account file (try both common names)
const serviceAccountPath1 = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccountPath2 = path.join(__dirname, '..', 'serviceAccountKey.json');

let serviceAccountPath;
if (fs.existsSync(serviceAccountPath1)) {
  serviceAccountPath = serviceAccountPath1;
} else if (fs.existsSync(serviceAccountPath2)) {
  serviceAccountPath = serviceAccountPath2;
} else {
  console.error('❌ Error: Service account key not found!');
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the JSON file as "firebase-service-account.json" or "serviceAccountKey.json" in project root');
  console.log('4. Run this script again\n');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Create admin user in Firestore
 */
async function createAdminUser() {
  try {
    console.log('\n🔧 Creating adminUsers collection...\n');

    // Check if user already exists
    const existingUsers = await db.collection('adminUsers')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      console.log(`⚠️  Admin user "${username}" already exists!`);
      console.log('   Updating existing user...\n');
      
      const existingDoc = existingUsers.docs[0];
      await existingDoc.ref.update({
        password: password,
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Updated admin user: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Active: true`);
      console.log(`   Document ID: ${existingDoc.id}\n`);
      
      return;
    }

    // Create new admin user
    const adminUserData = {
      username: username,
      password: password,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      role: 'super-admin'
    };

    const docRef = await db.collection('adminUsers').add(adminUserData);

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Active: true`);
    console.log(`   Role: super-admin`);
    console.log(`   Document ID: ${docRef.id}\n`);

    console.log('🔐 Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}\n`);

    console.log('✅ You can now log in to the admin dashboard at:');
    console.log('   http://localhost:4200/admin/login\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

/**
 * List all admin users
 */
async function listAdminUsers() {
  try {
    const users = await db.collection('adminUsers').get();
    
    if (users.empty) {
      console.log('📋 No admin users found in Firestore.\n');
      return;
    }

    console.log(`\n📋 Found ${users.size} admin user(s):\n`);
    users.forEach((doc) => {
      const data = doc.data();
      console.log(`   Username: ${data.username}`);
      console.log(`   Active: ${data.active !== false ? 'Yes' : 'No'}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log(`   Document ID: ${doc.id}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing admin users:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Admin Users Setup Script\n');
  console.log(`📝 Creating admin user with:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}\n`);

  await createAdminUser();
  
  console.log('📋 Current admin users in Firestore:');
  await listAdminUsers();

  console.log('✅ Setup complete!\n');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

