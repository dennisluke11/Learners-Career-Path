/**
 * Browser-Based Firestore Setup Script
 * 
 * This script can be run directly in the Firebase Console browser console
 * to import data without needing a service account key.
 * 
 * Usage:
 * 1. Open Firebase Console > Firestore Database
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * Note: This uses the Firebase Web SDK and requires you to be authenticated
 */

// Import data from JSON (you'll need to paste the JSON data here)
const careersData = [
  {
    "name": "Doctor",
    "minGrades": {
      "Biology": 70,
      "Chemistry": 70,
      "Math": 65
    },
    "countryBaselines": {
      "KE": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "NG": { "Biology": 70, "Chemistry": 70, "Math": 65, "Physics": 60 },
      "ZA": { "Biology": 70, "Chemistry": 70, "Math": 65, "Physics": 60 },
      "GH": { "Biology": 70, "Chemistry": 70, "Math": 65, "Physics": 60 },
      "TZ": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "UG": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "RW": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "ET": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "EG": { "Biology": 70, "Chemistry": 70, "Math": 65, "Physics": 60 },
      "MA": { "Biology": 70, "Chemistry": 70, "Math": 65, "Physics": 60 },
      "ZW": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "ZM": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "MW": { "Biology": 75, "Chemistry": 75, "Math": 70, "Physics": 65 },
      "US": { "Biology": 85, "Chemistry": 85, "Math": 80, "Physics": 75 },
      "UK": { "Biology": 80, "Chemistry": 80, "Math": 75, "Physics": 70 },
      "CA": { "Biology": 85, "Chemistry": 85, "Math": 80, "Physics": 75 },
      "AU": { "Biology": 80, "Chemistry": 80, "Math": 75, "Physics": 70 }
    }
  },
  {
    "name": "Nurse",
    "minGrades": {
      "Biology": 65,
      "Chemistry": 60,
      "English": 60
    },
    "countryBaselines": {
      "KE": { "Biology": 70, "Chemistry": 65, "English": 65, "Math": 55 },
      "NG": { "Biology": 65, "Chemistry": 60, "English": 60, "Math": 50 },
      "ZA": { "Biology": 65, "Chemistry": 60, "English": 60, "Math": 50 },
      "GH": { "Biology": 65, "Chemistry": 60, "English": 60, "Math": 50 },
      "TZ": { "Biology": 70, "Chemistry": 65, "English": 65, "Math": 55 },
      "UG": { "Biology": 70, "Chemistry": 65, "English": 65, "Math": 55 },
      "RW": { "Biology": 70, "Chemistry": 65, "English": 65, "Math": 55 },
      "ET": { "Biology": 70, "Chemistry": 65, "English": 65, "Math": 55 },
      "EG": { "Biology": 65, "Chemistry": 60, "English": 60, "Math": 50 },
      "MA": { "Biology": 65, "Chemistry": 60, "English": 60, "Math": 50 },
      "US": { "Biology": 75, "Chemistry": 70, "English": 75, "Math": 65 },
      "UK": { "Biology": 70, "Chemistry": 65, "English": 70, "Math": 60 },
      "CA": { "Biology": 75, "Chemistry": 70, "English": 75, "Math": 65 },
      "AU": { "Biology": 70, "Chemistry": 65, "English": 70, "Math": 60 }
    }
  },
  {
    "name": "Engineer",
    "minGrades": {
      "Math": 70,
      "Physics": 65,
      "Chemistry": 60
    },
    "countryBaselines": {
      "KE": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "NG": { "Math": 70, "Physics": 65, "Chemistry": 60, "English": 55 },
      "ZA": { "Math": 70, "Physics": 65, "Chemistry": 60, "English": 55 },
      "GH": { "Math": 70, "Physics": 65, "Chemistry": 60, "English": 55 },
      "TZ": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "UG": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "RW": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "ET": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "EG": { "Math": 70, "Physics": 65, "Chemistry": 60, "English": 55 },
      "MA": { "Math": 70, "Physics": 65, "Chemistry": 60, "English": 55 },
      "ZW": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "ZM": { "Math": 75, "Physics": 70, "Chemistry": 65, "English": 60 },
      "US": { "Math": 85, "Physics": 80, "Chemistry": 75, "English": 70 },
      "UK": { "Math": 80, "Physics": 75, "Chemistry": 70, "English": 65 },
      "CA": { "Math": 85, "Physics": 80, "Chemistry": 75, "English": 70 },
      "AU": { "Math": 80, "Physics": 75, "Chemistry": 70, "English": 65 }
    }
  },
  {
    "name": "Teacher",
    "minGrades": {
      "English": 65,
      "History": 60,
      "Math": 50
    },
    "countryBaselines": {
      "KE": { "English": 70, "History": 65, "Math": 55, "Biology": 50 },
      "NG": { "English": 65, "History": 60, "Math": 50, "Biology": 45 },
      "ZA": { "English": 65, "History": 60, "Math": 50, "Biology": 45 },
      "GH": { "English": 65, "History": 60, "Math": 50, "Biology": 45 },
      "TZ": { "English": 70, "History": 65, "Math": 55, "Biology": 50 },
      "UG": { "English": 70, "History": 65, "Math": 55, "Biology": 50 },
      "RW": { "English": 70, "History": 65, "Math": 55, "Biology": 50 },
      "ET": { "English": 70, "History": 65, "Math": 55, "Biology": 50 },
      "EG": { "English": 65, "History": 60, "Math": 50, "Biology": 45 },
      "MA": { "English": 65, "History": 60, "Math": 50, "Biology": 45 },
      "US": { "English": 75, "History": 70, "Math": 65, "Biology": 55 },
      "UK": { "English": 70, "History": 65, "Math": 60, "Biology": 50 },
      "CA": { "English": 75, "History": 70, "Math": 65, "Biology": 55 },
      "AU": { "English": 70, "History": 65, "Math": 60, "Biology": 50 }
    }
  }
];

// Note: This browser script requires Firebase Admin SDK or manual Firestore API calls
// For best results, use the Node.js script with service account key

console.log('📋 To import data, use the Node.js script with service account key:');
console.log('1. Get service account key from Firebase Console');
console.log('2. Save as firebase-service-account.json');
console.log('3. Run: node scripts/setup-firestore.js');







