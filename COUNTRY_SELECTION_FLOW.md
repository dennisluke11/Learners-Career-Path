# How Country Selection Connects to South African Education Data

## Overview

When a user selects **South Africa** as their country, the app automatically loads South Africa-specific education data (subjects, grade levels, career requirements, etc.) using the country code `'ZA'`.

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS "SOUTH AFRICA"                                  │
│    via <app-country-selector> component                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Country Code: 'ZA'                                           │
│    Country Object: { code: 'ZA', name: 'South Africa', ... }   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. onCountryChange('ZA') triggered in app.component.ts          │
│    - Sets selectedCountry = { code: 'ZA', ... }                │
│    - Resets grade level, grades, subjects                      │
│    - Updates career baselines for ZA                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────────┐  ┌──────────────────────┐
│ 4a. GRADE LEVELS  │  │ 4b. SUBJECTS         │
│                   │  │                      │
│ GradeLevelsService│  │ SubjectsService      │
│ .getGradeLevels   │  │ .getSubjectsForCountry│
│ ForCountry('ZA')  │  │ ('ZA')               │
└─────────┬─────────┘  └──────────┬───────────┘
          │                       │
          ▼                       ▼
┌───────────────────┐  ┌──────────────────────┐
│ COUNTRY_GRADE_    │  │ COUNTRY_SUBJECTS      │
│ LEVELS['ZA']      │  │ ['ZA']                │
│                   │  │                       │
│ Returns:          │  │ Returns:              │
│ - Grade 8         │  │ - Mathematics         │
│ - Grade 9         │  │ - English (HL)       │
│ - Grade 10        │  │ - Life Orientation   │
│ - Grade 11        │  │ - Physical Sciences  │
│ - Grade 12 (Matric)│ │ - Life Sciences      │
│                   │  │ - Accounting         │
│                   │  │ - Business Studies   │
│                   │  │ - etc. (all ZA       │
│                   │  │   subjects)          │
└───────────────────┘  └───────────────────────┘
```

## Step-by-Step Flow

### Step 1: User Selects Country
**Component:** `country-selector.component.ts`
```typescript
onSelectCountry(event: Event) {
  const countryCode = target.value; // 'ZA'
  const country = this.countries.find(c => c.code === countryCode);
  this.countryChange.emit(country); // Emits { code: 'ZA', name: 'South Africa' }
}
```

### Step 2: App Component Receives Selection
**File:** `app.component.ts`
```typescript
async onCountryChange(country: Country) {
  this.selectedCountry.set(country); // Sets to { code: 'ZA', name: 'South Africa' }
  this.selectedGradeLevel.set(null); // Reset grade level
  this.grades.set({}); // Clear grades
  this.selectedSubjects.set([]); // Clear subjects
  
  // Update career baselines for South Africa
  const countrySpecificCareer = await this.careersService.getCareerForCountry(
    career.name,
    country.code // 'ZA'
  );
}
```

### Step 3a: Grade Levels Loaded
**Service:** `grade-levels.service.ts`
```typescript
async getGradeLevelsForCountry(countryCode: string) {
  // Tries Firebase first, then falls back to:
  return getGradeLevelsForCountry(countryCode); // 'ZA'
}
```

**Model:** `grade-level.model.ts`
```typescript
export const COUNTRY_GRADE_LEVELS: CountryGradeLevels = {
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
};
```

**Component:** `grade-level-selector.component.ts`
```typescript
ngOnChanges(changes: SimpleChanges) {
  if (changes['selectedCountry']) {
    if (this.selectedCountry) {
      await this.loadGradeLevels(this.selectedCountry.code); // 'ZA'
      // Loads: Grade 8, 9, 10, 11, 12 (Matric)
    }
  }
}
```

### Step 3b: Subjects Loaded
**Service:** `subjects.service.ts`
```typescript
async getSubjectsForCountry(countryCode: string) {
  // Tries Firebase first, then falls back to:
  return getSubjectsForCountry(countryCode); // 'ZA'
}
```

**Model:** `subject.model.ts`
```typescript
export const COUNTRY_SUBJECTS: CountrySubjects = {
  'ZA': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'MathLiteracy', displayName: 'Mathematical Literacy', required: false },
      { standardName: 'English', displayName: 'English (Home Language)', required: true },
      { standardName: 'LifeOrientation', displayName: 'Life Orientation', required: true },
      { standardName: 'Physics', displayName: 'Physical Sciences', required: false },
      { standardName: 'Biology', displayName: 'Life Sciences', required: false },
      // ... all South African subjects
    ]
  }
};
```

**Component:** `grade-input.component.ts`
```typescript
ngOnChanges(changes: SimpleChanges) {
  if (changes['selectedCountry']) {
    if (this.selectedCountry) {
      await this.loadSubjects(this.selectedCountry.code); // 'ZA'
      // Loads all South African subjects
    }
  }
}
```

### Step 4: Career Requirements Updated
**Service:** `careers.service.ts`
```typescript
async getCareerForCountry(careerName: string, countryCode: string) {
  // Gets career with country-specific baselines
  if (career.countryBaselines && career.countryBaselines[countryCode]) {
    // Returns career with ZA-specific grade requirements
    return {
      ...career,
      minGrades: { ...career.minGrades, ...career.countryBaselines['ZA'] }
    };
  }
}
```

**Example Career Baseline:**
```typescript
{
  name: 'Doctor',
  countryBaselines: {
    'ZA': { 
      Biology: 80,    // Life Sciences in ZA
      Chemistry: 80,  // Part of Physical Sciences
      Math: 75, 
      Physics: 70     // Part of Physical Sciences
    },
    'KE': { ... },   // Different for Kenya
    'NG': { ... }    // Different for Nigeria
  }
}
```

### Step 5: Study Resources Filtered
**Service:** `study-resources.service.ts`
```typescript
generateStudyResources(subject, gradeLevel, country, career) {
  const curriculum = this.getCurriculumName(country.code); // 'ZA' → 'CAPS/NSC (Matric)'
  // Generates resources specific to South African curriculum
}
```

### Step 6: Announcements Filtered
**Service:** `announcements.service.ts`
```typescript
filterAnnouncements(announcements, country, career, gradeLevel) {
  // Only shows announcements where:
  // - targetCountries includes 'ZA', OR
  // - targetCountries is empty (all countries)
}
```

### Step 7: Market Data Loaded
**Service:** `career-market.service.ts`
```typescript
getMarketData(careerName: string, countryCode?: string) {
  const docId = countryCode ? `${careerName}_${countryCode}` : careerName;
  // For South Africa: 'Software Engineer_ZA'
  // Returns ZA-specific market data (ZAR currency, local job counts)
}
```

## Key Data Structures

### Country Object
```typescript
{
  code: 'ZA',
  name: 'South Africa',
  flag: '🇿🇦',
  active: true
}
```

### Grade Levels for ZA
```typescript
[
  { level: 8, displayName: 'Grade 8' },
  { level: 9, displayName: 'Grade 9' },
  { level: 10, displayName: 'Grade 10' },
  { level: 11, displayName: 'Grade 11' },
  { level: 12, displayName: 'Grade 12 (Matric)' }
]
```

### Subjects for ZA
```typescript
[
  { standardName: 'Math', displayName: 'Mathematics', required: true },
  { standardName: 'English', displayName: 'English (Home Language)', required: true },
  { standardName: 'LifeOrientation', displayName: 'Life Orientation', required: true },
  { standardName: 'Physics', displayName: 'Physical Sciences', required: false },
  { standardName: 'Biology', displayName: 'Life Sciences', required: false },
  // ... 30+ subjects
]
```

## Where 'ZA' Code is Used

1. **Grade Levels:** `COUNTRY_GRADE_LEVELS['ZA']`
2. **Subjects:** `COUNTRY_SUBJECTS['ZA']`
3. **Career Baselines:** `career.countryBaselines['ZA']`
4. **Study Resources:** `studyResources_ZA_Grade_12` (Firestore doc ID)
5. **Market Data:** `marketData_ZA` (Firestore doc ID)
6. **Announcements:** `announcement.targetCountries.includes('ZA')`
7. **Analytics:** `trackSelect('country_selected', 'ZA', ...)`

## Firebase Collections (if data exists)

- `countries/ZA` - Country metadata
- `countrySubjects/ZA` - Subject list (overrides defaults)
- `countryGradeLevels/ZA` - Grade levels (overrides defaults)
- `studyResources/{subject}_ZA_{gradeLevel}` - Study resources
- `marketData/{career}_ZA` - Market data
- `announcements/{id}` - Filtered by `targetCountries: ['ZA']`

## Summary

**When user selects South Africa:**
1. ✅ Country code `'ZA'` is set
2. ✅ Grade levels load: Grade 8-12 (Matric)
3. ✅ Subjects load: All CAPS/NSC subjects (30+)
4. ✅ Career requirements use ZA-specific baselines
5. ✅ Study resources use CAPS/NSC curriculum
6. ✅ Market data uses ZAR currency
7. ✅ Announcements filter for ZA
8. ✅ All components react to country change

The country code `'ZA'` is the **key** that unlocks all South Africa-specific data throughout the application!

