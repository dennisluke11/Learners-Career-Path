# Verify South Africa Career Requirements - Quick Guide

This guide explains how to verify and update career admission requirements for South Africa with qualification levels.

## 🎯 Overview

South Africa has **4 qualification levels** with different government minimum requirements:
- **Degree** (NQF 7): Bachelor's Degree programs
- **BTech** (NQF 7): Bachelor of Technology programs  
- **Diploma** (NQF 6): Diploma programs
- **Certificate** (NQF 5): Higher Certificate programs

## 🚀 Quick Start

### 1. List All Careers

```bash
node scripts/verify-career-requirements-za.js --list-all
```

This shows all careers with their verification status and qualification levels.

### 2. Verify a Career

```bash
node scripts/verify-career-requirements-za.js [career-name]
```

**Examples:**
```bash
# Verify Doctor requirements
node scripts/verify-career-requirements-za.js Doctor

# Verify Engineer requirements
node scripts/verify-career-requirements-za.js Engineer
```

## 📚 Government Minimum Requirements

### Bachelor's Degree / BTech (NQF 7)
- **4 subjects** at **50-59%** (Rating 4 - Adequate Achievement)
- **Language** (LOLT): Minimum **30%**
- **Life Orientation excluded** from the four subjects

### Diploma (NQF 6)
- **4 subjects** at **40-49%** (Rating 3 - Moderate Achievement)
- **Language** (LOLT): Minimum **30%**
- **Life Orientation excluded** from the four subjects

### Certificate (NQF 5)
- **NSC** with **Language** (LOLT): Minimum **30%**
- **Program-specific requirements** may apply

**Source**: Higher Education Act, Government Gazette No. 751 (4) - 2018

## 🔍 Verification Process

### Step 1: Research Official Requirements

1. Check government minimums in `SOUTH_AFRICA_QUALIFICATION_LEVELS.md`
2. Check individual university websites for program-specific requirements
3. Note the qualification level (Degree, BTech, Diploma, Certificate)
4. Record source URL and institution name

### Step 2: Run Verification Script

```bash
node scripts/verify-career-requirements-za.js [career-name]
```

### Step 3: Select Qualification Level

The script will ask you to select:
- Degree
- BTech
- Diploma
- Certificate

### Step 4: Enter Requirements

Enter subject requirements in format: `Subject: Grade`
- Example: `Mathematics: 70`
- Example: `Physical Sciences: 70`
- Example: `English Home Language: 60`

### Step 5: Enter APS (if applicable)

Many universities use APS (Admission Point Score):
- Example: `35` (for competitive programs like Medicine)

### Step 6: Add Source Information

- Source URL (e.g., university website)
- Institution name (e.g., "University of Cape Town")
- Additional notes (e.g., "Mathematics required, not Mathematical Literacy")

### Step 7: Add More Qualification Levels (Optional)

You can add multiple qualification levels for the same career:
- Example: Doctor might have both "Degree" (MBChB) and "Diploma" (Nursing Diploma)

## 📊 Example: Medicine (MBChB)

### Qualification Level: Degree

**Requirements:**
- Mathematics: 70% (not Mathematical Literacy)
- Physical Sciences: 70%
- Life Sciences: 70%
- English (Home Language): 60% OR English (First Additional Language): 70%
- APS: 35+

**Source:**
- URL: https://www.uct.ac.za/apply/requirements
- Institution: University of Cape Town
- Notes: MBChB program - Mathematics required (not Mathematical Literacy)

## 📋 Official Sources

See `SOUTH_AFRICA_QUALIFICATION_LEVELS.md` for complete list of:
- Government sources (DHET, SAQA, Umalusi)
- University websites
- Higher Education Act references

## ⚠️ Important Notes

1. **Government minimums are legal minimums** - Most programs require higher grades
2. **Requirements change annually** - Verify each year
3. **Different universities have different requirements** - Use most competitive/representative as baseline
4. **Document exceptions** - Note variations in the notes field
5. **Keep source URLs** - For future reference

## 🎯 Priority Careers

Start with the most popular careers:

1. **Doctor** (Medicine/MBChB) - Degree
2. **Engineer** (Various) - Degree/BTech
3. **Lawyer** (LLB) - Degree
4. **Nurse** (Nursing) - Degree/Diploma
5. **Teacher** (Education) - Degree/Diploma
6. **Accountant** (Accounting) - Degree
7. **IT Professional** (Computer Science) - Degree/BTech

## 📖 Related Documentation

- `SOUTH_AFRICA_QUALIFICATION_LEVELS.md` - Complete qualification levels reference
- `CAREER_REQUIREMENTS_SOURCES.md` - Official sources by country
- `VERIFY_CAREER_REQUIREMENTS_GUIDE.md` - General verification guide

