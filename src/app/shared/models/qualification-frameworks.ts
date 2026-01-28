/**
 * Qualification Framework Mappings by Country
 * 
 * Each country has its own qualification framework system.
 * This file provides mappings and helper functions to display
 * qualification levels appropriately for each country.
 */

export interface QualificationFramework {
  name: string;
  fullName: string;
  levels: {
    [level: string]: string | number; // Maps qualification level to framework level
  };
}

export const QUALIFICATION_FRAMEWORKS: { [countryCode: string]: QualificationFramework } = {
  'ZA': {
    name: 'NQF',
    fullName: 'National Qualifications Framework',
    levels: {
      'Degree': 7,
      'BTech': 7,
      'Diploma': 6,
      'Certificate': 5
    }
  },
  'KE': {
    name: 'KCSE',
    fullName: 'Kenya Certificate of Secondary Education',
    levels: {
      'Degree': 'A',
      'BTech': 'A-',
      'Diploma': 'B+',
      'Certificate': 'B'
    }
  },
  'NG': {
    name: 'WAEC',
    fullName: 'West African Examinations Council',
    levels: {
      'Degree': 'A1-A3',
      'BTech': 'B2-B3',
      'Diploma': 'C4-C6',
      'Certificate': 'C7-D7'
    }
  },
  'ZW': {
    name: 'ZIMSEC',
    fullName: 'Zimbabwe School Examinations Council',
    levels: {
      'Degree': 'A',
      'BTech': 'B',
      'Diploma': 'C',
      'Certificate': 'D'
    }
  },
  'ET': {
    name: 'General Education',
    fullName: 'Ethiopian General Education System',
    levels: {
      'Degree': 'Excellent',
      'BTech': 'Very Good',
      'Diploma': 'Good',
      'Certificate': 'Satisfactory'
    }
  },
  'EG': {
    name: 'Thanaweya Amma',
    fullName: 'Egyptian General Secondary Education Certificate',
    levels: {
      'Degree': '90-100%',
      'BTech': '80-89%',
      'Diploma': '70-79%',
      'Certificate': '60-69%'
    }
  }
};

/**
 * Get the qualification framework for a country
 */
export function getQualificationFramework(countryCode: string): QualificationFramework | null {
  return QUALIFICATION_FRAMEWORKS[countryCode] || null;
}

/**
 * Get the framework level for a qualification level in a specific country
 */
export function getFrameworkLevel(countryCode: string, qualificationLevel: string): string | number | null {
  const framework = QUALIFICATION_FRAMEWORKS[countryCode];
  if (!framework) return null;
  return framework.levels[qualificationLevel] || null;
}

/**
 * Format qualification level display with framework
 */
export function formatQualificationLevel(
  level: string,
  countryCode: string,
  nqfLevel?: number,
  frameworkName?: string,
  frameworkLevel?: string | number
): string {
  // For South Africa, use NQF (backward compatibility)
  if (countryCode === 'ZA') {
    if (nqfLevel) {
      return `${level} (NQF ${nqfLevel})`;
    }
    if (frameworkLevel) {
      return `${level} (NQF ${frameworkLevel})`;
    }
    return level;
  }

  // For other countries, use their framework
  if (frameworkName && frameworkLevel) {
    return `${level} (${frameworkName} ${frameworkLevel})`;
  }

  // Fallback: try to get from framework mapping
  const framework = QUALIFICATION_FRAMEWORKS[countryCode];
  if (framework) {
    const mappedLevel = framework.levels[level];
    if (mappedLevel) {
      return `${level} (${framework.name} ${mappedLevel})`;
    }
  }

  // No framework info available
  return level;
}


