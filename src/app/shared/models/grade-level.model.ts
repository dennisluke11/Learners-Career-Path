export interface GradeLevel {
  level: number; // 1-12
  displayName: string; // Country-specific display name
}

export interface CountryGradeLevels {
  [countryCode: string]: {
    system: string; // e.g., "Grade", "Form", "Year", "Class"
    levels: GradeLevel[];
    maxLevel: number;
  };
}

/**
 * Country-specific grade level naming conventions
 */
export const COUNTRY_GRADE_LEVELS: CountryGradeLevels = {
  // Kenya - Uses Forms (Form 1-4 for secondary)
  'KE': {
    system: 'Form',
    levels: [
      { level: 9, displayName: 'Form 1' },
      { level: 10, displayName: 'Form 2' },
      { level: 11, displayName: 'Form 3' },
      { level: 12, displayName: 'Form 4' }
    ],
    maxLevel: 12
  },
  
  // Tanzania - Uses Forms
  'TZ': {
    system: 'Form',
    levels: [
      { level: 9, displayName: 'Form 1' },
      { level: 10, displayName: 'Form 2' },
      { level: 11, displayName: 'Form 3' },
      { level: 12, displayName: 'Form 4' }
    ],
    maxLevel: 12
  },
  
  // Uganda - Uses Senior 1-6
  'UG': {
    system: 'Senior',
    levels: [
      { level: 7, displayName: 'Senior 1' },
      { level: 8, displayName: 'Senior 2' },
      { level: 9, displayName: 'Senior 3' },
      { level: 10, displayName: 'Senior 4' },
      { level: 11, displayName: 'Senior 5' },
      { level: 12, displayName: 'Senior 6' }
    ],
    maxLevel: 12
  },
  
  // Rwanda - Uses Senior 1-6
  'RW': {
    system: 'Senior',
    levels: [
      { level: 7, displayName: 'Senior 1' },
      { level: 8, displayName: 'Senior 2' },
      { level: 9, displayName: 'Senior 3' },
      { level: 10, displayName: 'Senior 4' },
      { level: 11, displayName: 'Senior 5' },
      { level: 12, displayName: 'Senior 6' }
    ],
    maxLevel: 12
  },
  
  // Ethiopia - Uses Grade 9-12
  'ET': {
    system: 'Grade',
    levels: [
      { level: 9, displayName: 'Grade 9' },
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // Nigeria - Uses SS (Senior Secondary) 1-3
  'NG': {
    system: 'SS',
    levels: [
      { level: 10, displayName: 'SS 1' },
      { level: 11, displayName: 'SS 2' },
      { level: 12, displayName: 'SS 3' }
    ],
    maxLevel: 12
  },
  
  // Zimbabwe - Uses Form 1-6 (O-Level and A-Level)
  'ZW': {
    system: 'Form',
    levels: [
      { level: 9, displayName: 'Form 1' },
      { level: 10, displayName: 'Form 2' },
      { level: 11, displayName: 'Form 3' },
      { level: 12, displayName: 'Form 4 (O-Level)' },
      { level: 13, displayName: 'Form 5 (Lower 6)' },
      { level: 14, displayName: 'Form 6 (Upper 6 / A-Level)' }
    ],
    maxLevel: 14
  },
  
  // Ghana - Uses SHS (Senior High School) 1-3
  'GH': {
    system: 'SHS',
    levels: [
      { level: 10, displayName: 'SHS 1' },
      { level: 11, displayName: 'SHS 2' },
      { level: 12, displayName: 'SHS 3' }
    ],
    maxLevel: 12
  },
  
  // South Africa - Uses Grade 8-12
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
  },
  
  
  // Zambia - Uses Grade 8-12
  'ZM': {
    system: 'Grade',
    levels: [
      { level: 8, displayName: 'Grade 8' },
      { level: 9, displayName: 'Grade 9' },
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // Egypt - Uses Grade 10-12 (Secondary)
  'EG': {
    system: 'Grade',
    levels: [
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // Morocco - Uses Grade 10-12
  'MA': {
    system: 'Grade',
    levels: [
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // Senegal - Uses Grade 10-12
  'SN': {
    system: 'Grade',
    levels: [
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // Ivory Coast - Uses Grade 10-12
  'CI': {
    system: 'Grade',
    levels: [
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // USA - Uses Grade 9-12 (High School)
  'US': {
    system: 'Grade',
    levels: [
      { level: 9, displayName: 'Grade 9 (Freshman)' },
      { level: 10, displayName: 'Grade 10 (Sophomore)' },
      { level: 11, displayName: 'Grade 11 (Junior)' },
      { level: 12, displayName: 'Grade 12 (Senior)' }
    ],
    maxLevel: 12
  },
  
  // UK - Uses Year 10-13 (GCSE and A-Levels)
  'UK': {
    system: 'Year',
    levels: [
      { level: 10, displayName: 'Year 10 (GCSE)' },
      { level: 11, displayName: 'Year 11 (GCSE)' },
      { level: 12, displayName: 'Year 12 (A-Level)' },
      { level: 13, displayName: 'Year 13 (A-Level)' }
    ],
    maxLevel: 13
  },
  
  // Canada - Uses Grade 9-12
  'CA': {
    system: 'Grade',
    levels: [
      { level: 9, displayName: 'Grade 9' },
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  },
  
  // Australia - Uses Year 10-12
  'AU': {
    system: 'Year',
    levels: [
      { level: 10, displayName: 'Year 10' },
      { level: 11, displayName: 'Year 11' },
      { level: 12, displayName: 'Year 12' }
    ],
    maxLevel: 12
  },
  
  // Default - Standard Grade 1-12
  'DEFAULT': {
    system: 'Grade',
    levels: [
      { level: 1, displayName: 'Grade 1' },
      { level: 2, displayName: 'Grade 2' },
      { level: 3, displayName: 'Grade 3' },
      { level: 4, displayName: 'Grade 4' },
      { level: 5, displayName: 'Grade 5' },
      { level: 6, displayName: 'Grade 6' },
      { level: 7, displayName: 'Grade 7' },
      { level: 8, displayName: 'Grade 8' },
      { level: 9, displayName: 'Grade 9' },
      { level: 10, displayName: 'Grade 10' },
      { level: 11, displayName: 'Grade 11' },
      { level: 12, displayName: 'Grade 12' }
    ],
    maxLevel: 12
  }
};

/**
 * Get grade levels for a specific country
 */
export function getGradeLevelsForCountry(countryCode: string): GradeLevel[] {
  return COUNTRY_GRADE_LEVELS[countryCode]?.levels || COUNTRY_GRADE_LEVELS['DEFAULT'].levels;
}

/**
 * Get grade system name for a country
 */
export function getGradeSystemForCountry(countryCode: string): string {
  return COUNTRY_GRADE_LEVELS[countryCode]?.system || COUNTRY_GRADE_LEVELS['DEFAULT'].system;
}

/**
 * Get display name for a specific grade level in a country
 */
export function getGradeDisplayName(countryCode: string, level: number): string {
  const levels = getGradeLevelsForCountry(countryCode);
  const grade = levels.find(g => g.level === level);
  return grade?.displayName || `Grade ${level}`;
}

