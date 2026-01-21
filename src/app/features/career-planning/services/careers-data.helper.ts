import { Career } from '../../../shared/models/career.model';

/**
 * Helper function to generate country baselines for a career
 * This creates consistent baselines across all supported countries
 */
export function createCountryBaselines(
  southAfrica: { [subject: string]: number },
  kenya: { [subject: string]: number },
  nigeria: { [subject: string]: number },
  zimbabwe: { [subject: string]: number },
  ethiopia: { [subject: string]: number },
  egypt: { [subject: string]: number }
): { [countryCode: string]: { [subject: string]: number } } {
  return {
    'ZA': southAfrica, // South Africa
    'KE': kenya, // Kenya
    'NG': nigeria, // Nigeria
    'ZW': zimbabwe, // Zimbabwe
    'ET': ethiopia, // Ethiopia
    'EG': egypt // Egypt
  };
}

/**
 * Comprehensive list of careers with requirements
 */
export function getAllCareers(): Career[] {
  return [
    // ========== MEDICAL & HEALTH ==========
    {
      name: 'Doctor',
      category: 'Medicine',
      minGrades: { Biology: 70, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, // South Africa (ZA)
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, // Kenya (KE)
        { Biology: 70, Chemistry: 70, Math: 65, Physics: 60 }, // Nigeria (NG)
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, // Zimbabwe (ZW)
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, // Ethiopia (ET)
        { Biology: 80, Chemistry: 80, Math: 75, Physics: 70 }  // Egypt (EG)
      )
    },
    {
      name: 'Nurse',
      category: 'Medicine',
      minGrades: { Biology: 65, Chemistry: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 70, Chemistry: 65, English: 65, Math: 55}, // South Africa (ZA)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Kenya (KE)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Nigeria (NG)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Zimbabwe (ZW)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Ethiopia (ET)
        {Biology: 75, Chemistry: 70, English: 75, Math: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Dentist',
      category: 'Medicine',
      minGrades: { Biology: 70, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 75, Math: 70, Physics: 65}, // South Africa (ZA)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, // Kenya (KE)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, // Nigeria (NG)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, // Zimbabwe (ZW)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, // Ethiopia (ET)
        {Biology: 85, Chemistry: 85, Math: 80, Physics: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Pharmacist',
      category: 'Medicine',
      minGrades: { Chemistry: 70, Biology: 65, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 75, Biology: 70, Math: 70, Physics: 60}, // South Africa (ZA)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Kenya (KE)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Nigeria (NG)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Zimbabwe (ZW)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Ethiopia (ET)
        {Chemistry: 85, Biology: 80, Math: 80, Physics: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Veterinarian',
      category: 'Medicine',
      minGrades: { Biology: 70, Chemistry: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 60}, // South Africa (ZA)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, // Kenya (KE)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, // Nigeria (NG)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, // Zimbabwe (ZW)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, // Ethiopia (ET)
        {Biology: 85, Chemistry: 80, Math: 75, Physics: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Physiotherapist',
      category: 'Medicine',
      minGrades: { Biology: 65, Chemistry: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 70, Chemistry: 65, English: 65, Math: 55}, // South Africa (ZA)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Kenya (KE)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Nigeria (NG)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Zimbabwe (ZW)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Ethiopia (ET)
        {Biology: 75, Chemistry: 70, English: 75, Math: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Medical Laboratory Scientist',
      category: 'Medicine',
      minGrades: { Chemistry: 65, Biology: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 70, Biology: 70, Math: 65, Physics: 55}, // South Africa (ZA)
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, // Kenya (KE)
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, // Nigeria (NG)
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, // Zimbabwe (ZW)
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, // Ethiopia (ET)
        {Chemistry: 80, Biology: 80, Math: 75, Physics: 70}  // Egypt (EG)
      )
    },

    // ========== ENGINEERING ==========
    {
      name: 'Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 65, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 70, Chemistry: 65, English: 60}, // South Africa (ZA)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Kenya (KE)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Nigeria (NG)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Zimbabwe (ZW)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Ethiopia (ET)
        {Math: 85, Physics: 80, Chemistry: 75, English: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Software Engineer',
      category: 'IT/Computer Science',
      minGrades: { Math: 70, Physics: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 65, English: 65, IT: 60}, // South Africa (ZA) - IT
        {Math: 70, Physics: 60, English: 60, ComputerStudies: 55}, // Kenya (KE) - Computer Studies
        {Math: 70, Physics: 60, English: 60, DataProcessing: 55}, // Nigeria (NG) - Data Processing
        {Math: 70, Physics: 60, English: 60, ComputerStudies: 55}, // Zimbabwe (ZW) - Computer Studies
        {Math: 70, Physics: 60, English: 60, IT: 55}, // Ethiopia (ET) - IT
        {Math: 85, Physics: 75, English: 75, IT: 70}  // Egypt (EG) - IT
      )
    },
    {
      name: 'Civil Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 65, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 70, Chemistry: 65, English: 60}, // South Africa (ZA)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Kenya (KE)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Nigeria (NG)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Zimbabwe (ZW)
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, // Ethiopia (ET)
        {Math: 85, Physics: 80, Chemistry: 75, English: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Electrical Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 70, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 75, Chemistry: 65, English: 60}, // South Africa (ZA)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Kenya (KE)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Nigeria (NG)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Zimbabwe (ZW)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Ethiopia (ET)
        {Math: 85, Physics: 85, Chemistry: 75, English: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Mechanical Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 70, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 75, Chemistry: 65, English: 60}, // South Africa (ZA)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Kenya (KE)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Nigeria (NG)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Zimbabwe (ZW)
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, // Ethiopia (ET)
        {Math: 85, Physics: 85, Chemistry: 75, English: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Agricultural Engineer',
      category: 'Engineering',
      minGrades: { Math: 65, Biology: 65, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 70, Biology: 70, Chemistry: 65, Physics: 55}, // South Africa (ZA)
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, // Kenya (KE)
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, // Nigeria (NG)
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, // Zimbabwe (ZW)
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, // Ethiopia (ET)
        {Math: 80, Biology: 80, Chemistry: 75, Physics: 70}  // Egypt (EG)
      )
    },

    // ========== BUSINESS & FINANCE ==========
    {
      name: 'Accountant',
      category: 'Business',
      minGrades: { Math: 70, English: 65, Economics: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, English: 70, Economics: 65, BusinessStudies: 60}, // South Africa (ZA)
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, // Kenya (KE)
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, // Nigeria (NG)
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, // Zimbabwe (ZW)
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, // Ethiopia (ET)
        {Math: 80, English: 75, Economics: 70, BusinessStudies: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Business Manager',
      category: 'Business',
      minGrades: { English: 65, Math: 60, Economics: 60 },
      countryBaselines: createCountryBaselines(
        {English: 70, Math: 65, Economics: 65, BusinessStudies: 60}, // South Africa (ZA)
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, // Kenya (KE)
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, // Nigeria (NG)
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, // Zimbabwe (ZW)
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, // Ethiopia (ET)
        {English: 75, Math: 70, Economics: 70, BusinessStudies: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Economist',
      category: 'Business',
      minGrades: { Math: 70, Economics: 70, English: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Economics: 75, English: 70, History: 60}, // South Africa (ZA)
        {Math: 70, Economics: 70, English: 65, History: 55}, // Kenya (KE)
        {Math: 70, Economics: 70, English: 65, History: 55}, // Nigeria (NG)
        {Math: 70, Economics: 70, English: 65, History: 55}, // Zimbabwe (ZW)
        {Math: 70, Economics: 70, English: 65, History: 55}, // Ethiopia (ET)
        {Math: 85, Economics: 85, English: 80, History: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Marketing Manager',
      category: 'Business',
      minGrades: { English: 70, Math: 60, Economics: 55 },
      countryBaselines: createCountryBaselines(
        {English: 75, Math: 65, Economics: 60, BusinessStudies: 60}, // South Africa (ZA)
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, // Kenya (KE)
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, // Nigeria (NG)
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, // Zimbabwe (ZW)
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, // Ethiopia (ET)
        {English: 80, Math: 70, Economics: 65, BusinessStudies: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Banker',
      category: 'Business',
      minGrades: { Math: 65, English: 65, Economics: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 70, English: 70, Economics: 65, BusinessStudies: 60}, // South Africa (ZA)
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, // Kenya (KE)
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, // Nigeria (NG)
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, // Zimbabwe (ZW)
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, // Ethiopia (ET)
        {Math: 75, English: 75, Economics: 70, BusinessStudies: 65}  // Egypt (EG)
      )
    },

    // ========== LAW ==========
    {
      name: 'Lawyer',
      category: 'Law',
      minGrades: { English: 75, History: 70, Math: 60 },
      countryBaselines: createCountryBaselines(
        {English: 80, History: 75, Math: 65, Afrikaans: 60}, // South Africa (ZA) - Afrikaans is widely used
        {English: 75, History: 70, Math: 60, Kiswahili: 55}, // Kenya (KE) - Kiswahili is official language
        {English: 75, History: 70, Math: 60, Literature: 55}, // Nigeria (NG) - Literature in English
        {English: 75, History: 70, Math: 60, Geography: 55}, // Zimbabwe (ZW) - Geography (Literature not in curriculum)
        {English: 75, History: 70, Math: 60, Amharic: 55}, // Ethiopia (ET) - Amharic is official language
        {English: 85, History: 80, Math: 70, Arabic: 70}  // Egypt (EG) - Arabic is official language
      )
    },
    {
      name: 'Judge',
      category: 'Law',
      minGrades: { English: 80, History: 75, Math: 65 },
      countryBaselines: createCountryBaselines(
        {English: 85, History: 80, Math: 70, Afrikaans: 65}, // South Africa (ZA) - Afrikaans is widely used
        {English: 80, History: 75, Math: 65, Kiswahili: 60}, // Kenya (KE) - Kiswahili is official language
        {English: 80, History: 75, Math: 65, Literature: 60}, // Nigeria (NG) - Literature in English
        {English: 80, History: 75, Math: 65, Geography: 60}, // Zimbabwe (ZW) - Geography (Literature not in curriculum)
        {English: 80, History: 75, Math: 65, Amharic: 60}, // Ethiopia (ET) - Amharic is official language
        {English: 90, History: 85, Math: 75, Arabic: 75}  // Egypt (EG) - Arabic is official language
      )
    },

    // ========== EDUCATION ==========
    {
      name: 'Teacher',
      category: 'Education',
      minGrades: { English: 65, History: 60, Math: 50 },
      countryBaselines: createCountryBaselines(
        {English: 70, History: 65, Math: 55, Biology: 50}, // South Africa (ZA)
        {English: 65, History: 60, Math: 50, Biology: 45}, // Kenya (KE)
        {English: 65, History: 60, Math: 50, Biology: 45}, // Nigeria (NG)
        {English: 65, History: 60, Math: 50, Biology: 45}, // Zimbabwe (ZW)
        {English: 65, History: 60, Math: 50, Biology: 45}, // Ethiopia (ET)
        {English: 75, History: 70, Math: 65, Biology: 55}  // Egypt (EG)
      )
    },
    {
      name: 'Professor',
      category: 'Education',
      minGrades: { English: 75, Math: 70, Subject: 75 },
      countryBaselines: createCountryBaselines(
        {English: 80, Math: 75, Subject: 80, Research: 70}, // South Africa (ZA)
        {English: 75, Math: 70, Subject: 75, Research: 65}, // Kenya (KE)
        {English: 75, Math: 70, Subject: 75, Research: 65}, // Nigeria (NG)
        {English: 75, Math: 70, Subject: 75, Research: 65}, // Zimbabwe (ZW)
        {English: 75, Math: 70, Subject: 75, Research: 65}, // Ethiopia (ET)
        {English: 85, Math: 80, Subject: 85, Research: 75}  // Egypt (EG)
      )
    },

    // ========== TECHNOLOGY ==========
    {
      name: 'Software Developer',
      category: 'IT/Computer Science',
      minGrades: { Math: 70, English: 60, Computer: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 75, English: 65, IT: 70, Physics: 60}, // South Africa (ZA) - IT
        {Math: 70, English: 60, ComputerStudies: 65, Physics: 55}, // Kenya (KE) - Computer Studies
        {Math: 70, English: 60, DataProcessing: 65, Physics: 55}, // Nigeria (NG) - Data Processing
        {Math: 70, English: 60, ComputerStudies: 65, Physics: 55}, // Zimbabwe (ZW) - Computer Studies
        {Math: 70, English: 60, IT: 65, Physics: 55}, // Ethiopia (ET) - IT
        {Math: 85, English: 75, IT: 80, Physics: 70}  // Egypt (EG) - IT
      )
    },
    {
      name: 'Data Scientist',
      category: 'IT/Computer Science',
      minGrades: { Math: 75, Statistics: 70, Computer: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Statistics: 75, IT: 70, Physics: 60}, // South Africa (ZA) - IT
        {Math: 75, Statistics: 70, ComputerStudies: 65, Physics: 55}, // Kenya (KE) - Computer Studies
        {Math: 75, Statistics: 70, DataProcessing: 65, Physics: 55}, // Nigeria (NG) - Data Processing
        {Math: 75, Statistics: 70, ComputerStudies: 65, Physics: 55}, // Zimbabwe (ZW) - Computer Studies
        {Math: 75, Statistics: 70, IT: 65, Physics: 55}, // Ethiopia (ET) - IT
        {Math: 90, Statistics: 85, IT: 80, Physics: 75}  // Egypt (EG) - IT
      )
    },
    {
      name: 'IT Specialist',
      category: 'IT/Computer Science',
      minGrades: { Computer: 70, Math: 65, English: 60 },
      countryBaselines: createCountryBaselines(
        {IT: 75, Math: 70, English: 65, Physics: 55}, // South Africa (ZA) - IT
        {ComputerStudies: 70, Math: 65, English: 60, Physics: 50}, // Kenya (KE) - Computer Studies
        {DataProcessing: 70, Math: 65, English: 60, Physics: 50}, // Nigeria (NG) - Data Processing
        {ComputerStudies: 70, Math: 65, English: 60, Physics: 50}, // Zimbabwe (ZW) - Computer Studies
        {IT: 70, Math: 65, English: 60, Physics: 50}, // Ethiopia (ET) - IT
        {IT: 85, Math: 80, English: 75, Physics: 70}  // Egypt (EG) - IT
      )
    },
    {
      name: 'Cybersecurity Analyst',
      category: 'IT/Computer Science',
      minGrades: { Computer: 75, Math: 70, English: 65 },
      countryBaselines: createCountryBaselines(
        {IT: 80, Math: 75, English: 70, Physics: 60}, // South Africa (ZA) - IT
        {ComputerStudies: 75, Math: 70, English: 65, Physics: 55}, // Kenya (KE) - Computer Studies
        {DataProcessing: 75, Math: 70, English: 65, Physics: 55}, // Nigeria (NG) - Data Processing
        {ComputerStudies: 75, Math: 70, English: 65, Physics: 55}, // Zimbabwe (ZW) - Computer Studies
        {IT: 75, Math: 70, English: 65, Physics: 55}, // Ethiopia (ET) - IT
        {IT: 90, Math: 85, English: 80, Physics: 75}  // Egypt (EG) - IT
      )
    },

    // ========== SCIENCE & RESEARCH ==========
    {
      name: 'Scientist',
      category: 'Science',
      minGrades: { Math: 75, Physics: 70, Chemistry: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Physics: 75, Chemistry: 75, Biology: 70}, // South Africa (ZA)
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, // Kenya (KE)
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, // Nigeria (NG)
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, // Zimbabwe (ZW)
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, // Ethiopia (ET)
        {Math: 90, Physics: 85, Chemistry: 85, Biology: 80}  // Egypt (EG)
      )
    },
    {
      name: 'Researcher',
      category: 'Science',
      minGrades: { Math: 70, English: 70, Subject: 75 },
      countryBaselines: createCountryBaselines(
        {Math: 75, English: 75, Subject: 80, Research: 70}, // South Africa (ZA)
        {Math: 70, English: 70, Subject: 75, Research: 65}, // Kenya (KE)
        {Math: 70, English: 70, Subject: 75, Research: 65}, // Nigeria (NG)
        {Math: 70, English: 70, Subject: 75, Research: 65}, // Zimbabwe (ZW)
        {Math: 70, English: 70, Subject: 75, Research: 65}, // Ethiopia (ET)
        {Math: 85, English: 85, Subject: 90, Research: 80}  // Egypt (EG)
      )
    },
    {
      name: 'Biologist',
      category: 'Science',
      minGrades: { Biology: 75, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 80, Chemistry: 75, Math: 70, Physics: 60}, // South Africa (ZA)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Kenya (KE)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Nigeria (NG)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Zimbabwe (ZW)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Ethiopia (ET)
        {Biology: 90, Chemistry: 85, Math: 80, Physics: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Chemist',
      category: 'Science',
      minGrades: { Chemistry: 75, Math: 70, Physics: 65 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 80, Math: 75, Physics: 70, Biology: 60}, // South Africa (ZA)
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, // Kenya (KE)
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, // Nigeria (NG)
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, // Zimbabwe (ZW)
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, // Ethiopia (ET)
        {Chemistry: 90, Math: 85, Physics: 80, Biology: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Physicist',
      category: 'Science',
      minGrades: { Physics: 80, Math: 80, Chemistry: 70 },
      countryBaselines: createCountryBaselines(
        {Physics: 85, Math: 85, Chemistry: 75, English: 65}, // South Africa (ZA)
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, // Kenya (KE)
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, // Nigeria (NG)
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, // Zimbabwe (ZW)
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, // Ethiopia (ET)
        {Physics: 95, Math: 95, Chemistry: 85, English: 75}  // Egypt (EG)
      )
    },

    // ========== ARTS & DESIGN ==========
    {
      name: 'Architect',
      category: 'Arts/Design',
      minGrades: { Math: 70, Physics: 65, Art: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 70, Art: 75, English: 65}, // South Africa (ZA)
        {Math: 70, Physics: 65, Art: 70, English: 60}, // Kenya (KE)
        {Math: 70, Physics: 65, Art: 70, English: 60}, // Nigeria (NG)
        {Math: 70, Physics: 65, Art: 70, English: 60}, // Zimbabwe (ZW)
        {Math: 70, Physics: 65, Art: 70, English: 60}, // Ethiopia (ET)
        {Math: 85, Physics: 80, Art: 85, English: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Journalist',
      category: 'Arts/Design',
      minGrades: { English: 75, History: 70, Literature: 65 },
      countryBaselines: createCountryBaselines(
        {English: 80, History: 75, Literature: 70, Kiswahili: 65}, // South Africa (ZA)
        {English: 75, History: 70, Literature: 65, French: 60}, // Kenya (KE)
        {English: 75, History: 70, Literature: 65, Afrikaans: 60}, // Nigeria (NG)
        {English: 75, History: 70, Literature: 65, Arabic: 60}, // Zimbabwe (ZW)
        {English: 75, History: 70, Literature: 65, French: 60}, // Ethiopia (ET)
        {English: 85, History: 80, Literature: 75, Language: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Writer',
      category: 'Arts/Design',
      minGrades: { English: 80, Literature: 75, History: 65 },
      countryBaselines: createCountryBaselines(
        {English: 85, Literature: 80, History: 70, Kiswahili: 65}, // South Africa (ZA)
        {English: 80, Literature: 75, History: 65, French: 60}, // Kenya (KE)
        {English: 80, Literature: 75, History: 65, Afrikaans: 60}, // Nigeria (NG)
        {English: 80, Literature: 75, History: 65, Arabic: 60}, // Zimbabwe (ZW)
        {English: 80, Literature: 75, History: 65, French: 60}, // Ethiopia (ET)
        {English: 90, Literature: 85, History: 75, Language: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Graphic Designer',
      category: 'Arts/Design',
      minGrades: { Art: 70, English: 60, Computer: 60 },
      countryBaselines: createCountryBaselines(
        {Art: 75, English: 65, IT: 65, Math: 50}, // South Africa (ZA) - IT
        {Art: 70, English: 60, ComputerStudies: 60, Math: 45}, // Kenya (KE) - Computer Studies
        {Art: 70, English: 60, DataProcessing: 60, Math: 45}, // Nigeria (NG) - Data Processing
        {Art: 70, English: 60, ComputerStudies: 60, Math: 45}, // Zimbabwe (ZW) - Computer Studies
        {Art: 70, English: 60, IT: 60, Math: 45}, // Ethiopia (ET) - IT
        {Art: 85, English: 75, IT: 75, Math: 65}  // Egypt (EG) - IT
      )
    },

    // ========== SOCIAL WORK & PSYCHOLOGY ==========
    {
      name: 'Social Worker',
      category: 'Social Sciences',
      minGrades: { English: 70, History: 65, Psychology: 60 },
      countryBaselines: createCountryBaselines(
        {English: 75, History: 70, Psychology: 65, Sociology: 60}, // South Africa (ZA)
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, // Kenya (KE)
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, // Nigeria (NG)
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, // Zimbabwe (ZW)
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, // Ethiopia (ET)
        {English: 80, History: 75, Psychology: 70, Sociology: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Psychologist',
      category: 'Social Sciences',
      minGrades: { Psychology: 75, Biology: 70, English: 70 },
      countryBaselines: createCountryBaselines(
        {Psychology: 80, Biology: 75, English: 75, Math: 65}, // South Africa (ZA)
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, // Kenya (KE)
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, // Nigeria (NG)
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, // Zimbabwe (ZW)
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, // Ethiopia (ET)
        {Psychology: 90, Biology: 85, English: 85, Math: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Counselor',
      category: 'Social Sciences',
      minGrades: { English: 70, Psychology: 65, History: 60 },
      countryBaselines: createCountryBaselines(
        {English: 75, Psychology: 70, History: 65, Sociology: 60}, // South Africa (ZA)
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, // Kenya (KE)
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, // Nigeria (NG)
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, // Zimbabwe (ZW)
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, // Ethiopia (ET)
        {English: 80, Psychology: 75, History: 70, Sociology: 65}  // Egypt (EG)
      )
    },

    // ========== AGRICULTURE ==========
    {
      name: 'Agricultural Scientist',
      category: 'Agriculture',
      minGrades: { Biology: 70, Chemistry: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // South Africa (ZA)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, // Kenya (KE)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, // Nigeria (NG)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, // Zimbabwe (ZW)
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, // Ethiopia (ET)
        {Biology: 85, Chemistry: 80, Math: 75, Physics: 70}  // Egypt (EG)
      )
    },
    {
      name: 'Agricultural Extension Officer',
      category: 'Agriculture',
      minGrades: { Biology: 65, Chemistry: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 70, Chemistry: 65, English: 65, Math: 55}, // South Africa (ZA)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Kenya (KE)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Nigeria (NG)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Zimbabwe (ZW)
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, // Ethiopia (ET)
        {Biology: 75, Chemistry: 70, English: 75, Math: 65}  // Egypt (EG)
      )
    },

    // ========== ENVIRONMENTAL ==========
    {
      name: 'Environmental Scientist',
      category: 'Environmental Science',
      minGrades: { Biology: 70, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 75, Math: 70, Physics: 60}, // South Africa (ZA)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, // Kenya (KE)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, // Nigeria (NG)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, // Zimbabwe (ZW)
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, // Ethiopia (ET)
        {Biology: 85, Chemistry: 85, Math: 80, Physics: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Wildlife Conservationist',
      category: 'Environmental Science',
      minGrades: { Biology: 75, Chemistry: 65, English: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 80, Chemistry: 70, English: 70, Geography: 60}, // South Africa (ZA)
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, // Kenya (KE)
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, // Nigeria (NG)
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, // Zimbabwe (ZW)
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, // Ethiopia (ET)
        {Biology: 90, Chemistry: 80, English: 80, Geography: 75}  // Egypt (EG)
      )
    },

    // ========== AVIATION ==========
    {
      name: 'Pilot',
      category: 'Aviation',
      minGrades: { Math: 75, Physics: 75, English: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Physics: 80, English: 75, Chemistry: 65}, // South Africa (ZA)
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, // Kenya (KE)
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, // Nigeria (NG)
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, // Zimbabwe (ZW)
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, // Ethiopia (ET)
        {Math: 90, Physics: 90, English: 85, Chemistry: 80}  // Egypt (EG)
      )
    },
    {
      name: 'Aircraft Engineer',
      category: 'Aviation',
      minGrades: { Math: 75, Physics: 75, Chemistry: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Physics: 80, Chemistry: 75, English: 65}, // South Africa (ZA)
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, // Kenya (KE)
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, // Nigeria (NG)
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, // Zimbabwe (ZW)
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, // Ethiopia (ET)
        {Math: 90, Physics: 90, Chemistry: 85, English: 80}  // Egypt (EG)
      )
    },

    // ========== MARITIME ==========
    {
      name: 'Marine Engineer',
      category: 'Maritime',
      minGrades: { Math: 70, Physics: 70, Chemistry: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, // South Africa (ZA)
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, // Kenya (KE)
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, // Nigeria (NG)
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, // Zimbabwe (ZW)
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, // Ethiopia (ET)
        {Math: 85, Physics: 85, Chemistry: 80, English: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Marine Biologist',
      category: 'Maritime',
      minGrades: { Biology: 75, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 80, Chemistry: 75, Math: 70, Physics: 60}, // South Africa (ZA)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Kenya (KE)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Nigeria (NG)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Zimbabwe (ZW)
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, // Ethiopia (ET)
        {Biology: 90, Chemistry: 85, Math: 80, Physics: 75}  // Egypt (EG)
      )
    },

    // ========== FOOD & NUTRITION ==========
    {
      name: 'Nutritionist',
      category: 'Food Science',
      minGrades: { Biology: 70, Chemistry: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 70, Math: 65, English: 60}, // South Africa (ZA)
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, // Kenya (KE)
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, // Nigeria (NG)
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, // Zimbabwe (ZW)
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, // Ethiopia (ET)
        {Biology: 85, Chemistry: 80, Math: 75, English: 75}  // Egypt (EG)
      )
    },
    {
      name: 'Food Scientist',
      category: 'Food Science',
      minGrades: { Chemistry: 70, Biology: 65, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 75, Biology: 70, Math: 70, Physics: 60}, // South Africa (ZA)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Kenya (KE)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Nigeria (NG)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Zimbabwe (ZW)
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, // Ethiopia (ET)
        {Chemistry: 85, Biology: 80, Math: 80, Physics: 75}  // Egypt (EG)
      )
    },

    // ========== PUBLIC SERVICE ==========
    {
      name: 'Police Officer',
      category: 'Public Service',
      minGrades: { English: 65, Math: 60, History: 55 },
      countryBaselines: createCountryBaselines(
        {English: 70, Math: 65, History: 60, Kiswahili: 55}, // South Africa (ZA)
        {English: 65, Math: 60, History: 55, French: 50}, // Kenya (KE)
        {English: 65, Math: 60, History: 55, Afrikaans: 50}, // Nigeria (NG)
        {English: 65, Math: 60, History: 55, Arabic: 50}, // Zimbabwe (ZW)
        {English: 65, Math: 60, History: 55, French: 50}, // Ethiopia (ET)
        {English: 75, Math: 70, History: 65, Language: 60}  // Egypt (EG)
      )
    },
    {
      name: 'Firefighter',
      category: 'Public Service',
      minGrades: { Math: 60, Physics: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 65, Physics: 65, English: 65, Chemistry: 55}, // South Africa (ZA)
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, // Kenya (KE)
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, // Nigeria (NG)
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, // Zimbabwe (ZW)
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, // Ethiopia (ET)
        {Math: 70, Physics: 70, English: 75, Chemistry: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Military Officer',
      category: 'Public Service',
      minGrades: { Math: 65, English: 65, Physics: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 70, English: 70, Physics: 65, History: 60}, // South Africa (ZA)
        {Math: 65, English: 65, Physics: 60, History: 55}, // Kenya (KE)
        {Math: 65, English: 65, Physics: 60, History: 55}, // Nigeria (NG)
        {Math: 65, English: 65, Physics: 60, History: 55}, // Zimbabwe (ZW)
        {Math: 65, English: 65, Physics: 60, History: 55}, // Ethiopia (ET)
        {Math: 75, English: 75, Physics: 70, History: 65}  // Egypt (EG)
      )
    },

    // ========== SPORTS & FITNESS ==========
    {
      name: 'Sports Coach',
      category: 'Sports Science',
      minGrades: { PhysicalEducation: 70, Biology: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {PhysicalEducation: 75, Biology: 65, English: 65, Math: 50}, // South Africa (ZA)
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, // Kenya (KE)
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, // Nigeria (NG)
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, // Zimbabwe (ZW)
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, // Ethiopia (ET)
        {PhysicalEducation: 85, Biology: 75, English: 75, Math: 65}  // Egypt (EG)
      )
    },
    {
      name: 'Fitness Trainer',
      category: 'Sports Science',
      minGrades: { PhysicalEducation: 65, Biology: 60, English: 55 },
      countryBaselines: createCountryBaselines(
        {PhysicalEducation: 70, Biology: 65, English: 60, Math: 45}, // South Africa (ZA)
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, // Kenya (KE)
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, // Nigeria (NG)
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, // Zimbabwe (ZW)
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, // Ethiopia (ET)
        {PhysicalEducation: 80, Biology: 75, English: 70, Math: 60}  // Egypt (EG)
      )
    }
  ];
}

