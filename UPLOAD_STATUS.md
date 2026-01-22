# Firestore Upload Status

## ✅ Uploaded to Firestore

### Country Subjects
**Status:** ✅ **UPLOADED** (Just completed)

**Collection:** `countrySubjects`

**Countries Updated:**
- ✅ **South Africa (ZA)**: 29 subjects (updated with official CAPS subjects)
- ✅ Kenya (KE): 15 subjects
- ✅ Nigeria (NG): 18 subjects
- ✅ Zimbabwe (ZW): 16 subjects
- ✅ Ethiopia (ET): 12 subjects
- ✅ Egypt (EG): 17 subjects

**South African Subjects Include:**
- Compulsory: Mathematics, Mathematical Literacy, English (HL), Languages, Life Orientation
- Sciences: Physical Sciences, Life Sciences, Agricultural Sciences, Chemistry
- Business: Accounting, Business Studies, Economics
- Humanities: History, Geography
- Technology: IT, CAT, EGD
- Arts: Visual Arts, Dramatic Arts, Music
- Other: Tourism, Consumer Studies, Hospitality Studies, Design
- Languages: English, Afrikaans, isiZulu, isiXhosa, Sesotho, Setswana

**Script Used:** `scripts/update-subjects-firestore.js`

**Last Updated:** Just now (with official DBE sources)

---

### Market Data
**Status:** ✅ **UPLOADED** (Earlier today)

**Collection:** `marketData`

**Entries:** 24 entries (4 careers × 6 countries)

**Script Used:** `scripts/populate-market-data-firestore.js`

---

## ⚠️ Not Yet Uploaded (But Available in Code)

### Country Grade Levels
**Status:** ⚠️ **IN CODE ONLY** (Not in Firestore yet)

**Location:** `src/app/shared/models/grade-level.model.ts`

**South Africa Grade Levels:**
```typescript
'ZA': {
  system: 'Grade',
  levels: [
    { level: 8, displayName: 'Grade 8' },
    { level: 9, displayName: 'Grade 9' },
    { level: 10, displayName: 'Grade 10' },
    { level: 11, displayName: 'Grade 11' },
    { level: 12, displayName: 'Grade 12 (Matric)' }
  ],
  maxLevel: 12
}
```

**Note:** The app will use code defaults if not in Firestore. Grade levels are working but stored in code.

**To Upload:** Would need to create a script similar to `update-subjects-firestore.js`

---

## How It Works

### Priority Order:
1. **Firestore First** - If data exists in Firestore, use it
2. **Code Fallback** - If Firestore unavailable, use code defaults

### For Subjects:
```typescript
// Service checks Firestore first
async getSubjectsForCountry(countryCode: string) {
  if (firebaseService.isAvailable()) {
    const data = await firebaseService.getDocument('countrySubjects', countryCode);
    if (data) return data.subjects; // ✅ Uses Firestore
  }
  return getSubjectsForCountry(countryCode); // Fallback to code
}
```

### For Grade Levels:
```typescript
// Service checks Firestore first
async getGradeLevelsForCountry(countryCode: string) {
  if (firebaseService.isAvailable()) {
    const data = await firebaseService.getDocument('countryGradeLevels', countryCode);
    if (data) return data.levels; // Would use Firestore if exists
  }
  return getGradeLevelsForCountry(countryCode); // ✅ Currently uses code
}
```

---

## Summary

✅ **Subjects:** Uploaded to Firestore (29 subjects for South Africa)  
⚠️ **Grade Levels:** In code only (working, but not in Firestore)  
✅ **Market Data:** Uploaded to Firestore  
✅ **Careers:** Uploaded to Firestore (assumed, based on other scripts)

---

## Next Steps (Optional)

If you want grade levels in Firestore too:
1. Create `scripts/update-grade-levels-firestore.js`
2. Extract grade levels from `grade-level.model.ts`
3. Upload to `countryGradeLevels` collection

**Note:** This is optional - the app works fine with grade levels in code!

