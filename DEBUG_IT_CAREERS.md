# Debug IT Careers Not Showing

## Issue
User has excellent grades:
- Mathematics: 90
- English: 80
- Life Orientation: 80
- Computer Applications Technology: 90

But IT careers (IT Specialist, Cybersecurity Analyst, Network Engineer) are not showing in "Fully Qualified" section.

## Expected Results
Based on test script, these careers should be **QUALIFIED**:
- ✅ IT Specialist (Math 90 >= 60, CAT 90 >= IT 50, English 80 >= 50)
- ✅ Cybersecurity Analyst (Math 90 >= 60, CAT 90 >= IT 50, English 80 >= 50)
- ✅ Network Engineer (Math 90 >= 60, CAT 90 >= IT 50, English 80 >= 50)

## Fixes Applied

### 1. Subject Name Mapping
- ✅ CAT → IT mapping added to `getGradeForSubject()`
- ✅ Either/or logic for Math/MathLiteracy
- ✅ Either/or logic for English/EnglishFAL

### 2. Debug Logging Added
- Added console logging in `EligibilityService.checkEligibility()` for IT careers
- Added console logging in `EligibleCareersComponent.updateEligibleCareers()`

## How to Debug

1. **Open browser console** (F12 → Console tab)
2. **Enter your grades** in the app
3. **Look for console logs**:
   - `[Eligibility] Checking IT Specialist:` - Shows requirements and grades
   - `[Eligibility] IT Specialist result:` - Shows status and match score
   - `[EligibleCareers] Results:` - Shows all qualified careers and IT careers

4. **Check the logs** to see:
   - Are the grades being passed correctly? (Should show Math: 90, CAT: 90, English: 80)
   - Are the requirements correct? (Should show Math: 60, IT: 50, English: 50)
   - What's the status? (Should be "qualified")
   - Are IT careers in the results? (Check `itCareers` array)

## Possible Issues

1. **Caching**: The app might be using cached code. Try:
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache
   - Restart dev server

2. **Grade Keys**: Verify grades are stored with correct keys:
   - Should be "CAT" not "Computer Applications Technology"
   - Should be "Math" not "Mathematics"
   - Should be "English" not "English (Home Language)"

3. **Requirements**: Verify requirements are extracted correctly:
   - Should come from `qualificationLevels[ZA][0].minGrades`
   - Should have "IT" not "Information Technology"

## Next Steps

1. Check browser console logs
2. Verify grades object structure
3. Verify requirements structure
4. If still not working, share console logs for further debugging

