# Fix Subject Name Matching Issue

## ⚠️ Issue Identified

The "Courses & Careers You Qualify For" section showed **no results** even when users had qualifying grades because:

1. **Subject name mismatch**: Career requirements used **display names** (e.g., "Mathematics", "English Home Language", "Physical Sciences", "Information Technology")
2. **Grades used standard names**: User grades were stored with **standard names** (e.g., "Math", "English", "Physics", "IT"/"CAT")
3. **No matching**: The eligibility service couldn't match "Mathematics" (requirement) with "Math" (grade)

## ✅ Fixes Applied

### 1. Updated EligibilityService (`eligibility.service.ts`)

**Added subject name normalization:**
- `normalizeSubjectName()` - Maps display names to standard names
- `getGradeForSubject()` - Tries multiple name variations to find grade value
- Handles both directions: requirement names → standard names → grade keys

**Mappings:**
- "Mathematics" → "Math"
- "English Home Language" → "English"
- "Physical Sciences" → "Physics"
- "Life Sciences" → "Biology"
- "Computer Applications Technology" → "CAT"
- "Information Technology" → "IT"
- "Life Orientation" → "LifeOrientation"

### 2. Fixed Career Requirements (`fix-career-requirements-subject-names.js`)

**Updated all 36 careers** to use standard subject names:
- Changed "Mathematics" → "Math"
- Changed "English Home Language" → "English"
- Changed "Physical Sciences" → "Physics"
- Changed "Life Sciences" → "Biology"
- Changed "Information Technology" → "IT"
- Changed "Computer Applications Technology" → "CAT"

### 3. Updated Component (`eligible-careers.component.ts`)

**Passes country code** to eligibility service for proper subject normalization.

## How It Works Now

### Example: User Grades
```typescript
{
  "Math": 70,
  "English": 70,
  "LifeOrientation": 70,
  "CAT": 80
}
```

### Career Requirement (IT Specialist - Degree)
```typescript
{
  "Math": 60,           // ✅ Matches "Math"
  "IT": 50,             // ✅ Matches "CAT" (normalized)
  "English": 50         // ✅ Matches "English"
}
```

### Result
- Math: 70 >= 60 ✅
- IT: 80 >= 50 ✅ (CAT normalized to IT)
- English: 70 >= 50 ✅
- **Status**: `qualified` ✅

## Expected Behavior

### Before Fix:
- No careers showing as qualified (subject name mismatch)
- Even with perfect grades, no results

### After Fix:
- Careers correctly match user grades with requirements
- Accurate qualification status
- Proper "Fully Qualified" and "Close to Qualifying" counts

## Testing

With your grades:
- Mathematics = 70 → "Math": 70
- English (Home Language) = 70 → "English": 70
- Life Orientation = 70 → "LifeOrientation": 70
- Computer Applications Technology = 80 → "CAT": 80

You should now see careers that require:
- Math ≤ 70 ✅
- English ≤ 70 ✅
- IT/CAT ≤ 80 ✅

Examples:
- **IT Specialist** (requires Math 60, IT 50, English 50) → ✅ Qualified
- **Software Engineer** (requires Math 70, IT 50, English 50) → ✅ Qualified
- **Computer Scientist** (requires Math 70, Physics 60, English 50) → ⚠️ Close (needs Physics)

## Next Steps

1. ✅ **Fixed subject name matching** - Complete
2. ✅ **Updated all career requirements** - Complete
3. ⏳ **Test in application** - Verify careers now show correctly
4. ⏳ **User testing** - Get feedback on qualification accuracy

---

**Last Updated**: 2024-01-15  
**Status**: ✅ Fixed - Subject names now match correctly

