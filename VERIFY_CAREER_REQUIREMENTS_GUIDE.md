# Verify Career Requirements - Quick Guide

This guide explains how to verify and update career admission requirements from official sources.

## 📋 Overview

The career requirements in this codebase are currently **ESTIMATED** and need to be verified against official government and university sources.

## 🚀 Quick Start

### 1. List All Careers

```bash
node scripts/verify-career-requirements.js --list-all
```

This shows all careers in the database with their current verification status:
- ✅ `verified` - Requirements verified from official sources
- ⚠️ `needs-review` - Needs verification
- ❓ `estimated` - Currently estimated (not verified)

### 2. Verify a Specific Career

```bash
node scripts/verify-career-requirements.js [career-name] [country-code]
```

**Examples:**
```bash
# Verify Doctor requirements for South Africa
node scripts/verify-career-requirements.js Doctor ZA

# Verify Engineer requirements for Kenya
node scripts/verify-career-requirements.js Engineer KE
```

### 3. Interactive Verification Process

When you run the verification script, it will:

1. **Display current requirements** - Shows what's currently in the database
2. **Show official sources** - Lists official websites to check
3. **Prompt for updates** - Asks if you have verified requirements
4. **Collect new requirements** - Interactive input for subject grades
5. **Collect source information** - URL, institution, notes
6. **Update database** - Saves verified requirements with source attribution

## 📚 Official Sources

See `CAREER_REQUIREMENTS_SOURCES.md` for a complete list of official sources by country.

### South Africa (ZA)
- Department of Higher Education and Training (DHET)
- Universities South Africa (USAf)
- Individual university websites (UCT, Wits, UP, etc.)

### Kenya (KE)
- Kenya Universities and Colleges Central Placement Service (KUCCPS)
- Commission for University Education (CUE)
- Individual university websites

### Other Countries
See `CAREER_REQUIREMENTS_SOURCES.md` for complete list.

## 🔍 Verification Workflow

### Step 1: Research Official Requirements

1. Go to the official sources listed in `CAREER_REQUIREMENTS_SOURCES.md`
2. Find the specific career/program requirements
3. Note the minimum grades for each subject
4. Record the source URL and institution name

### Step 2: Run Verification Script

```bash
node scripts/verify-career-requirements.js [career-name] [country-code]
```

### Step 3: Enter Verified Requirements

The script will prompt you to enter:
- Subject names and minimum grades (e.g., "Math: 70")
- Source URL
- Institution name
- Additional notes

### Step 4: Confirm Update

Review the changes and confirm to update the database.

## 📊 Data Structure

After verification, the career data includes:

```json
{
  "name": "Doctor",
  "minGrades": { "Biology": 70, "Chemistry": 70, "Math": 65 },
  "countryBaselines": {
    "ZA": {
      "Biology": 75,
      "Chemistry": 75,
      "Math": 70,
      "Physics": 65
    }
  },
  "sources": {
    "ZA": {
      "url": "https://www.uct.ac.za/apply/requirements",
      "institution": "University of Cape Town",
      "verifiedDate": "2024-01-15",
      "notes": "MBChB program requirements"
    }
  },
  "lastVerified": "2024-01-15",
  "verificationStatus": "verified"
}
```

## ⚠️ Important Notes

1. **Requirements change annually** - Verify each year
2. **Different universities may have different requirements** - Use the most competitive/representative university as baseline
3. **Document exceptions** - Note any variations in the notes field
4. **Keep source URLs** - For future reference and verification

## 🎯 Priority Careers

Start with the most popular careers:

1. **Doctor** (Medicine/MBChB)
2. **Engineer** (Various specializations)
3. **Lawyer** (LLB)
4. **Teacher** (Education)
5. **Nurse** (Nursing)
6. **Accountant** (Accounting)
7. **IT Professional** (Computer Science/IT)

## 🔄 Updating Multiple Careers

To update multiple careers, run the script for each:

```bash
# Verify multiple careers for South Africa
node scripts/verify-career-requirements.js Doctor ZA
node scripts/verify-career-requirements.js Engineer ZA
node scripts/verify-career-requirements.js Lawyer ZA
```

## 📝 Example Session

```bash
$ node scripts/verify-career-requirements.js Doctor ZA

🔍 Verifying: Doctor for ZA

📋 Career: Doctor
   Category: Medicine
   Status: estimated
   
   Default Requirements:
      Biology: 70%
      Chemistry: 70%
      Math: 65%

   Country-Specific Requirements:

      South Africa (ZA):
         Biology: 70%
         Chemistry: 70%
         Math: 65%
         Physics: 60%

📚 Official Sources for South Africa (ZA):

   1. https://www.dhet.gov.za
   2. https://www.usaf.ac.za
   3. https://www.cao.ac.za
   4. https://www.uct.ac.za/apply/requirements
   5. https://www.wits.ac.za/study-at-wits/undergraduate/entry-requirements
   6. https://www.up.ac.za/study-at-up/article/2799996/undergraduate-admission-requirements

   📝 Notes: Check individual university websites for specific requirements. Most use APS system.

📝 Please verify the requirements from the official sources above.
   Then provide the verified requirements:

   Do you have updated requirements? (y/n): y

   Enter requirements for ZA (press Enter to skip, type 'done' when finished):

   Subject and grade (e.g., "Math: 70"): Math: 70
      ✅ Math: 70%
   Subject and grade (e.g., "Math: 70"): Physics: 70
      ✅ Physics: 70%
   Subject and grade (e.g., "Math: 70"): Biology: 70
      ✅ Biology: 70%
   Subject and grade (e.g., "Math: 70"): Chemistry: 70
      ✅ Chemistry: 70%
   Subject and grade (e.g., "Math: 70"): done

   📚 Source Information:

   Source URL (press Enter to skip): https://www.uct.ac.za/apply/requirements
   Institution name (e.g., "University of Cape Town", press Enter to skip): University of Cape Town
   Additional notes (press Enter to skip): MBChB program, APS 35+

   Confirm update? (y/n): y

   ✅ Successfully updated Doctor for ZA!
```

## 🆘 Troubleshooting

### Career not found
- Check the career name spelling (case-sensitive)
- List all careers: `node scripts/verify-career-requirements.js --list-all`

### Country code not supported
- Check `CAREER_REQUIREMENTS_SOURCES.md` for supported codes
- Currently supported: ZA, KE, NG, GH, ZW, ET, EG

### Firebase connection error
- Ensure `serviceAccountKey.json` exists in project root
- Check Firebase project configuration

## 📖 Related Documentation

- `CAREER_REQUIREMENTS_SOURCES.md` - Complete list of official sources
- `SOUTH_AFRICA_EDUCATION_SOURCE.md` - South Africa education system reference

