# Update Qualification Frameworks in Database

This guide explains how to update qualification levels in Firestore to include framework information for all countries.

## Framework Mappings

Each country has its own qualification framework:

- **South Africa (ZA)**: NQF (National Qualifications Framework)
  - Degree: NQF 7
  - BTech: NQF 7
  - Diploma: NQF 6
  - Certificate: NQF 5

- **Kenya (KE)**: KCSE (Kenya Certificate of Secondary Education)
  - Degree: KCSE A
  - BTech: KCSE A-
  - Diploma: KCSE B+
  - Certificate: KCSE B

- **Nigeria (NG)**: WAEC (West African Examinations Council)
  - Degree: WAEC A1-A3
  - BTech: WAEC B2-B3
  - Diploma: WAEC C4-C6
  - Certificate: WAEC C7-D7

- **Zimbabwe (ZW)**: ZIMSEC (Zimbabwe School Examinations Council)
  - Degree: ZIMSEC A
  - BTech: ZIMSEC B
  - Diploma: ZIMSEC C
  - Certificate: ZIMSEC D

- **Ethiopia (ET)**: General Education
  - Degree: Excellent
  - BTech: Very Good
  - Diploma: Good
  - Certificate: Satisfactory

- **Egypt (EG)**: Thanaweya Amma
  - Degree: 90-100%
  - BTech: 80-89%
  - Diploma: 70-79%
  - Certificate: 60-69%

## Database Update Script

You can create a script to update existing qualification levels in Firestore:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const FRAMEWORK_MAPPINGS = {
  'ZA': {
    name: 'NQF',
    levels: { 'Degree': 7, 'BTech': 7, 'Diploma': 6, 'Certificate': 5 }
  },
  'KE': {
    name: 'KCSE',
    levels: { 'Degree': 'A', 'BTech': 'A-', 'Diploma': 'B+', 'Certificate': 'B' }
  },
  'NG': {
    name: 'WAEC',
    levels: { 'Degree': 'A1-A3', 'BTech': 'B2-B3', 'Diploma': 'C4-C6', 'Certificate': 'C7-D7' }
  },
  'ZW': {
    name: 'ZIMSEC',
    levels: { 'Degree': 'A', 'BTech': 'B', 'Diploma': 'C', 'Certificate': 'D' }
  },
  'ET': {
    name: 'General Education',
    levels: { 'Degree': 'Excellent', 'BTech': 'Very Good', 'Diploma': 'Good', 'Certificate': 'Satisfactory' }
  },
  'EG': {
    name: 'Thanaweya Amma',
    levels: { 'Degree': '90-100%', 'BTech': '80-89%', 'Diploma': '70-79%', 'Certificate': '60-69%' }
  }
};

async function updateQualificationFrameworks() {
  const careersRef = db.collection('careers');
  const snapshot = await careersRef.get();
  
  console.log(`Found ${snapshot.size} careers to update\n`);
  
  let updated = 0;
  
  for (const doc of snapshot.docs) {
    const career = doc.data();
    
    if (!career.qualificationLevels) {
      continue;
    }
    
    const updates = {};
    let hasUpdates = false;
    
    // Update each country's qualification levels
    for (const [countryCode, levels] of Object.entries(career.qualificationLevels)) {
      if (!Array.isArray(levels)) continue;
      
      const framework = FRAMEWORK_MAPPINGS[countryCode];
      if (!framework) continue;
      
      const updatedLevels = levels.map(level => {
        // Skip if already has framework info
        if (level.frameworkName && level.frameworkLevel) {
          return level;
        }
        
        // Add framework info
        const frameworkLevel = framework.levels[level.level];
        if (frameworkLevel) {
          hasUpdates = true;
          return {
            ...level,
            frameworkName: framework.name,
            frameworkLevel: frameworkLevel,
            // Keep nqfLevel for backward compatibility (South Africa only)
            ...(countryCode === 'ZA' && level.nqfLevel ? { nqfLevel: level.nqfLevel } : {})
          };
        }
        
        return level;
      });
      
      if (hasUpdates) {
        updates[`qualificationLevels.${countryCode}`] = updatedLevels;
      }
    }
    
    if (hasUpdates) {
      await doc.ref.update(updates);
      updated++;
      console.log(`✅ Updated ${career.name}`);
    }
  }
  
  console.log(`\n✅ Updated ${updated} careers with framework information`);
}

updateQualificationFrameworks()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

## Manual Update via Firebase Console

1. Go to Firestore Database
2. Navigate to `careers` collection
3. For each career document:
   - Find `qualificationLevels` field
   - For each country code (KE, NG, ZW, ET, EG):
     - Add `frameworkName` field (e.g., "KCSE", "WAEC", etc.)
     - Add `frameworkLevel` field with the appropriate level
   - For South Africa (ZA), keep `nqfLevel` as is

## Example Data Structure

```json
{
  "qualificationLevels": {
    "ZA": [
      {
        "level": "Degree",
        "nqfLevel": 7,
        "frameworkName": "NQF",
        "frameworkLevel": 7,
        "minGrades": { "Mathematics": 60, "English": 50 }
      }
    ],
    "KE": [
      {
        "level": "Degree",
        "frameworkName": "KCSE",
        "frameworkLevel": "A",
        "minGrades": { "Mathematics": 60, "English": 50 }
      }
    ]
  }
}
```

## Notes

- The `nqfLevel` field is kept for backward compatibility with South Africa
- For new countries, always include `frameworkName` and `frameworkLevel`
- The UI will automatically display the correct framework based on the selected country
- If framework info is missing, the UI will fall back to just showing the level name

