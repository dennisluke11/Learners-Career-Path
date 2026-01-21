export interface SubjectMapping {
  standardName: string;  // Internal standard name (e.g., "Math")
  displayName: string;    // Display name for the country (e.g., "Mathematics", "Maths")
  required: boolean;      // Is this subject required for grade input?
}

export interface CountrySubjects {
  [countryCode: string]: {
    subjects: SubjectMapping[];
    subjectAliases?: { [localName: string]: string }; // Map local names to standard names
  };
}

/**
 * Country-specific subject mappings
 * Maps local subject names to standard internal names
 */
export const COUNTRY_SUBJECTS: CountrySubjects = {
  // South Africa - CAPS/NSC Curriculum (Matric)
  'ZA': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'MathLiteracy', displayName: 'Mathematical Literacy', required: false },
      { standardName: 'English', displayName: 'English (Home Language)', required: true },
      { standardName: 'EnglishFAL', displayName: 'English (First Additional Language)', required: false },
      { standardName: 'Afrikaans', displayName: 'Afrikaans (First Additional Language)', required: false },
      { standardName: 'LifeOrientation', displayName: 'Life Orientation', required: true },
      { standardName: 'Physics', displayName: 'Physical Sciences', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry (part of Physical Sciences)', required: false },
      { standardName: 'Biology', displayName: 'Life Sciences', required: false },
      { standardName: 'Accounting', displayName: 'Accounting', required: false },
      { standardName: 'BusinessStudies', displayName: 'Business Studies', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'IT', displayName: 'Information Technology', required: false },
      { standardName: 'CAT', displayName: 'Computer Applications Technology', required: false },
      { standardName: 'EGD', displayName: 'Engineering Graphics and Design', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'Mathematical Literacy': 'MathLiteracy',
      'Physical Sciences': 'Physics',
      'Chemistry (part of Physical Sciences)': 'Chemistry',
      'Life Sciences': 'Biology',
      'English Home Language': 'English',
      'English First Additional Language': 'EnglishFAL',
      'Afrikaans First Additional Language': 'Afrikaans',
      'Computer Applications Technology': 'CAT',
      'Information Technology': 'IT',
      'Computer': 'IT', // Alias for generic Computer
      'Engineering Graphics and Design': 'EGD'
    }
  },
  
  // Kenya - KCSE/CBC Curriculum
  'KE': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Kiswahili', displayName: 'Kiswahili', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'Agriculture', displayName: 'Agriculture', required: false },
      { standardName: 'ComputerStudies', displayName: 'Computer Studies', required: false },
      { standardName: 'History', displayName: 'History and Government', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'CRE', displayName: 'Christian Religious Education', required: false },
      { standardName: 'IRE', displayName: 'Islamic Religious Education', required: false },
      { standardName: 'HRE', displayName: 'Hindu Religious Education', required: false },
      { standardName: 'HomeScience', displayName: 'Home Science', required: false },
      { standardName: 'BusinessStudies', displayName: 'Business Studies', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'Maths': 'Math',
      'Kiswahili': 'Kiswahili',
      'History and Government': 'History',
      'Christian Religious Education': 'CRE',
      'Islamic Religious Education': 'IRE',
      'Hindu Religious Education': 'HRE'
    }
  },
  
  // Nigeria - WAEC/WASSCE Curriculum
  'NG': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English Language', required: true },
      { standardName: 'CivicEducation', displayName: 'Civic Education', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'FurtherMath', displayName: 'Further Mathematics', required: false },
      { standardName: 'DataProcessing', displayName: 'Data Processing', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'Government', displayName: 'Government', required: false },
      { standardName: 'Literature', displayName: 'Literature in English', required: false },
      { standardName: 'Accounting', displayName: 'Financial Accounting', required: false },
      { standardName: 'Commerce', displayName: 'Commerce', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'CRK', displayName: 'Christian Religious Knowledge', required: false },
      { standardName: 'IRK', displayName: 'Islamic Religious Knowledge', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'English Language': 'English',
      'Civic Education': 'CivicEducation',
      'Further Mathematics': 'FurtherMath',
      'Data Processing': 'DataProcessing',
      'Literature in English': 'Literature',
      'Financial Accounting': 'Accounting',
      'Christian Religious Knowledge': 'CRK',
      'Islamic Religious Knowledge': 'IRK'
    }
  },
  
  // Zimbabwe - ZIMSEC Curriculum (O-Level and A-Level)
  'ZW': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English Language', required: true },
      { standardName: 'Shona', displayName: 'Shona', required: false },
      { standardName: 'Ndebele', displayName: 'Ndebele', required: false },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'CombinedScience', displayName: 'Combined Science', required: false },
      { standardName: 'HeritageStudies', displayName: 'Heritage Studies', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Agriculture', displayName: 'Agriculture', required: false },
      { standardName: 'Accounting', displayName: 'Accounts', required: false },
      { standardName: 'BusinessStudies', displayName: 'Business Studies', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'ComputerStudies', displayName: 'Computer Studies', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'English Language': 'English',
      'Combined Science': 'CombinedScience',
      'Heritage Studies': 'HeritageStudies',
      'Accounts': 'Accounting'
    }
  },
  
  // Ghana - WASSCE subjects
  'GH': {
    subjects: [
      { standardName: 'Math', displayName: 'Core Mathematics', required: true },
      { standardName: 'English', displayName: 'English Language', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'French', displayName: 'French', required: false }
    ]
  },
  
  // Tanzania - NECTA subjects
  'TZ': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Kiswahili', displayName: 'Kiswahili', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false }
    ]
  },
  
  // Uganda - UACE subjects
  'UG': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false }
    ]
  },
  
  // Rwanda
  'RW': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'French', displayName: 'French', required: false },
      { standardName: 'Kinyarwanda', displayName: 'Kinyarwanda', required: false },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'History', required: false }
    ]
  },
  
  // Ethiopia - General Education Curriculum
  'ET': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Amharic', displayName: 'Amharic', required: true },
      { standardName: 'Civics', displayName: 'Civics and Ethical Education', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'IT', displayName: 'Information Technology', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Economics', displayName: 'Economics', required: false },
      { standardName: 'Agriculture', displayName: 'Agriculture', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'Civics and Ethical Education': 'Civics',
      'Information Technology': 'IT'
    }
  },
  
  // Egypt - Thanaweya Amma (General Secondary Certificate)
  'EG': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English (First Foreign Language)', required: true },
      { standardName: 'Arabic', displayName: 'Arabic Language', required: true },
      { standardName: 'SecondLanguage', displayName: 'Second Foreign Language (French/German/Italian/Spanish)', required: false },
      { standardName: 'Citizenship', displayName: 'Citizenship Education', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'PureMath', displayName: 'Pure Mathematics', required: false },
      { standardName: 'AppliedMath', displayName: 'Applied Mathematics', required: false },
      { standardName: 'Mechanics', displayName: 'Mechanics', required: false },
      { standardName: 'Geology', displayName: 'Geology', required: false },
      { standardName: 'History', displayName: 'History', required: false },
      { standardName: 'Geography', displayName: 'Geography', required: false },
      { standardName: 'Philosophy', displayName: 'Philosophy', required: false },
      { standardName: 'Psychology', displayName: 'Psychology', required: false },
      { standardName: 'Sociology', displayName: 'Sociology', required: false }
    ],
    subjectAliases: {
      'Mathematics': 'Math',
      'English (First Foreign Language)': 'English',
      'Arabic Language': 'Arabic',
      'Second Foreign Language': 'SecondLanguage',
      'Citizenship Education': 'Citizenship',
      'Pure Mathematics': 'PureMath',
      'Applied Mathematics': 'AppliedMath'
    }
  },
  
  // Morocco
  'MA': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: false },
      { standardName: 'French', displayName: 'French', required: true },
      { standardName: 'Arabic', displayName: 'Arabic', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false }
    ]
  },
  
  // Senegal
  'SN': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'French', displayName: 'French', required: true },
      { standardName: 'English', displayName: 'English', required: false },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false }
    ]
  },
  
  // Ivory Coast
  'CI': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'French', displayName: 'French', required: true },
      { standardName: 'English', displayName: 'English', required: false },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false }
    ]
  },
  
  // USA - Common subjects
  'US': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'US History', required: false }
    ]
  },
  
  // UK - A-Level subjects
  'UK': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'History', required: false }
    ]
  },
  
  // Default/International - fallback for countries not specifically mapped
  'DEFAULT': {
    subjects: [
      { standardName: 'Math', displayName: 'Mathematics', required: true },
      { standardName: 'English', displayName: 'English', required: true },
      { standardName: 'Physics', displayName: 'Physics', required: false },
      { standardName: 'Chemistry', displayName: 'Chemistry', required: false },
      { standardName: 'Biology', displayName: 'Biology', required: false },
      { standardName: 'History', displayName: 'History', required: false }
    ]
  }
};

/**
 * Get subjects for a specific country
 */
export function getSubjectsForCountry(countryCode: string): SubjectMapping[] {
  return COUNTRY_SUBJECTS[countryCode]?.subjects || COUNTRY_SUBJECTS['DEFAULT'].subjects;
}

/**
 * Get all unique standard subject names across all countries
 */
export function getAllStandardSubjects(): string[] {
  const subjects = new Set<string>();
  Object.values(COUNTRY_SUBJECTS).forEach(country => {
    country.subjects.forEach(subj => subjects.add(subj.standardName));
  });
  return Array.from(subjects);
}

