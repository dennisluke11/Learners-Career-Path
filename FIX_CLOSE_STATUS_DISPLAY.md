# Fix: Show "Close to Qualifying" Careers

## Issue
The "Close to Qualifying" section was not showing careers that were almost qualified (e.g., 67% match score) because the threshold was set too high at 70%.

## Fix Applied

### Changed Threshold
**Before**: `matchScore >= 70` → "close"  
**After**: `matchScore >= 60` → "close"

### Rationale
- **60% threshold** is more encouraging and shows careers within reach
- Users with 2/3 requirements met (67%) should see these as "almost qualified"
- Helps motivate students by showing achievable goals

## Status Logic

The eligibility service now marks careers as "close" if:
1. ✅ All requirements met → "qualified"
2. ✅ All requirements met but some are close (90% of required) → "close"
3. ✅ Match score >= 60% (even with missing subjects) → "close"
4. ❌ Match score < 60% → "needs-improvement"

## Example

### User Grades:
- Math: 90
- English: 80
- CAT: 90
- Life Orientation: 80

### Software Engineer Requirements:
- Math: 70 ✅ (user has 90)
- Physics: 60 ❌ (user has 0)
- English: 50 ✅ (user has 80)

**Result**:
- Match Score: 67% (2/3 requirements met)
- Status: **"close"** (was "needs-improvement" before)
- Shows in "Close to Qualifying" section ✅

## What Users Will See

### Before Fix:
- Only careers with 70%+ match score shown as "close"
- Careers with 60-69% match score hidden (marked as "needs-improvement")

### After Fix:
- Careers with 60%+ match score shown as "close"
- More careers visible in "Close to Qualifying" section
- Better motivation for students to improve

---

**Last Updated**: 2024-01-15  
**Status**: ✅ Fixed - Close threshold lowered to 60%

