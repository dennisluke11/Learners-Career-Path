import { Career } from '../../../shared/models/career.model';

export function createCountryBaselines(
  southAfrica: { [subject: string]: number },
  kenya: { [subject: string]: number },
  nigeria: { [subject: string]: number },
  zimbabwe: { [subject: string]: number },
  ethiopia: { [subject: string]: number },
  egypt: { [subject: string]: number }
): { [countryCode: string]: { [subject: string]: number } } {
  return {
    'ZA': southAfrica,
    'KE': kenya,
    'NG': nigeria,
    'ZW': zimbabwe,
    'ET': ethiopia,
    'EG': egypt
  };
}

export function getAllCareers(): Career[] {
  return [
    {
      name: 'Doctor',
      category: 'Medicine',
      minGrades: { Biology: 70, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, 
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, 
        { Biology: 70, Chemistry: 70, Math: 65, Physics: 60 }, 
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, 
        { Biology: 75, Chemistry: 75, Math: 70, Physics: 65 }, 
        { Biology: 80, Chemistry: 80, Math: 75, Physics: 70 }  
      )
    },
    {
      name: 'Nurse',
      category: 'Medicine',
      minGrades: { Biology: 65, Chemistry: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 70, Chemistry: 65, English: 65, Math: 55}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 75, Chemistry: 70, English: 75, Math: 65}  
      )
    },
    {
      name: 'Dentist',
      category: 'Medicine',
      minGrades: { Biology: 70, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 75, Math: 70, Physics: 65}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 60}, 
        {Biology: 85, Chemistry: 85, Math: 80, Physics: 75}  
      )
    },
    {
      name: 'Pharmacist',
      category: 'Medicine',
      minGrades: { Chemistry: 70, Biology: 65, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 75, Biology: 70, Math: 70, Physics: 60}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 85, Biology: 80, Math: 80, Physics: 70}  
      )
    },
    {
      name: 'Veterinarian',
      category: 'Medicine',
      minGrades: { Biology: 70, Chemistry: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 60}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 55}, 
        {Biology: 85, Chemistry: 80, Math: 75, Physics: 70}  
      )
    },
    {
      name: 'Physiotherapist',
      category: 'Medicine',
      minGrades: { Biology: 65, Chemistry: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 70, Chemistry: 65, English: 65, Math: 55}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 75, Chemistry: 70, English: 75, Math: 65}  
      )
    },
    {
      name: 'Medical Laboratory Scientist',
      category: 'Medicine',
      minGrades: { Chemistry: 65, Biology: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 70, Biology: 70, Math: 65, Physics: 55}, 
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, 
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, 
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, 
        {Chemistry: 65, Biology: 65, Math: 60, Physics: 50}, 
        {Chemistry: 80, Biology: 80, Math: 75, Physics: 70}  
      )
    },

    
    {
      name: 'Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 65, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 70, Chemistry: 65, English: 60}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 85, Physics: 80, Chemistry: 75, English: 70}  
      )
    },
    {
      name: 'Software Engineer',
      category: 'IT/Computer Science',
      minGrades: { Math: 70, Physics: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 65, English: 65, IT: 60},  - IT
        {Math: 70, Physics: 60, English: 60, ComputerStudies: 55},  - Computer Studies
        {Math: 70, Physics: 60, English: 60, DataProcessing: 55},  - Data Processing
        {Math: 70, Physics: 60, English: 60, ComputerStudies: 55},  - Computer Studies
        {Math: 70, Physics: 60, English: 60, IT: 55},  - IT
        {Math: 85, Physics: 75, English: 75, IT: 70}   - IT
      )
    },
    {
      name: 'Civil Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 65, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 70, Chemistry: 65, English: 60}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 65, Chemistry: 60, English: 55}, 
        {Math: 85, Physics: 80, Chemistry: 75, English: 70}  
      )
    },
    {
      name: 'Electrical Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 70, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 75, Chemistry: 65, English: 60}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 85, Physics: 85, Chemistry: 75, English: 70}  
      )
    },
    {
      name: 'Mechanical Engineer',
      category: 'Engineering',
      minGrades: { Math: 70, Physics: 70, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 75, Chemistry: 65, English: 60}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 60, English: 55}, 
        {Math: 85, Physics: 85, Chemistry: 75, English: 70}  
      )
    },
    {
      name: 'Agricultural Engineer',
      category: 'Engineering',
      minGrades: { Math: 65, Biology: 65, Chemistry: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 70, Biology: 70, Chemistry: 65, Physics: 55}, 
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, 
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, 
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, 
        {Math: 65, Biology: 65, Chemistry: 60, Physics: 50}, 
        {Math: 80, Biology: 80, Chemistry: 75, Physics: 70}  
      )
    },

    
    {
      name: 'Accountant',
      category: 'Business',
      minGrades: { Math: 70, English: 65, Economics: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 75, English: 70, Economics: 65, BusinessStudies: 60}, 
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 70, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 80, English: 75, Economics: 70, BusinessStudies: 65}  
      )
    },
    {
      name: 'Business Manager',
      category: 'Business',
      minGrades: { English: 65, Math: 60, Economics: 60 },
      countryBaselines: createCountryBaselines(
        {English: 70, Math: 65, Economics: 65, BusinessStudies: 60}, 
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, 
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, 
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, 
        {English: 65, Math: 60, Economics: 60, BusinessStudies: 55}, 
        {English: 75, Math: 70, Economics: 70, BusinessStudies: 65}  
      )
    },
    {
      name: 'Economist',
      category: 'Business',
      minGrades: { Math: 70, Economics: 70, English: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Economics: 75, English: 70, History: 60}, 
        {Math: 70, Economics: 70, English: 65, History: 55}, 
        {Math: 70, Economics: 70, English: 65, History: 55}, 
        {Math: 70, Economics: 70, English: 65, History: 55}, 
        {Math: 70, Economics: 70, English: 65, History: 55}, 
        {Math: 85, Economics: 85, English: 80, History: 70}  
      )
    },
    {
      name: 'Marketing Manager',
      category: 'Business',
      minGrades: { English: 70, Math: 60, Economics: 55 },
      countryBaselines: createCountryBaselines(
        {English: 75, Math: 65, Economics: 60, BusinessStudies: 60}, 
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, 
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, 
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, 
        {English: 70, Math: 60, Economics: 55, BusinessStudies: 50}, 
        {English: 80, Math: 70, Economics: 65, BusinessStudies: 65}  
      )
    },
    {
      name: 'Banker',
      category: 'Business',
      minGrades: { Math: 65, English: 65, Economics: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 70, English: 70, Economics: 65, BusinessStudies: 60}, 
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 65, English: 65, Economics: 60, BusinessStudies: 55}, 
        {Math: 75, English: 75, Economics: 70, BusinessStudies: 65}  
      )
    },

    
    {
      name: 'Lawyer',
      category: 'Law',
      minGrades: { English: 75, History: 70, Math: 60 },
      countryBaselines: createCountryBaselines(
        {English: 80, History: 75, Math: 65, Afrikaans: 60},  - Afrikaans is widely used
        {English: 75, History: 70, Math: 60, Kiswahili: 55},  - Kiswahili is official language
        {English: 75, History: 70, Math: 60, Literature: 55},  - Literature in English
        {English: 75, History: 70, Math: 60, Geography: 55},  - Geography (Literature not in curriculum)
        {English: 75, History: 70, Math: 60, Amharic: 55},  - Amharic is official language
        {English: 85, History: 80, Math: 70, Arabic: 70}   - Arabic is official language
      )
    },
    {
      name: 'Judge',
      category: 'Law',
      minGrades: { English: 80, History: 75, Math: 65 },
      countryBaselines: createCountryBaselines(
        {English: 85, History: 80, Math: 70, Afrikaans: 65},  - Afrikaans is widely used
        {English: 80, History: 75, Math: 65, Kiswahili: 60},  - Kiswahili is official language
        {English: 80, History: 75, Math: 65, Literature: 60},  - Literature in English
        {English: 80, History: 75, Math: 65, Geography: 60},  - Geography (Literature not in curriculum)
        {English: 80, History: 75, Math: 65, Amharic: 60},  - Amharic is official language
        {English: 90, History: 85, Math: 75, Arabic: 75}   - Arabic is official language
      )
    },

    
    {
      name: 'Teacher',
      category: 'Education',
      minGrades: { English: 65, History: 60, Math: 50 },
      countryBaselines: createCountryBaselines(
        {English: 70, History: 65, Math: 55, Biology: 50}, 
        {English: 65, History: 60, Math: 50, Biology: 45}, 
        {English: 65, History: 60, Math: 50, Biology: 45}, 
        {English: 65, History: 60, Math: 50, Biology: 45}, 
        {English: 65, History: 60, Math: 50, Biology: 45}, 
        {English: 75, History: 70, Math: 65, Biology: 55}  
      )
    },
    {
      name: 'Professor',
      category: 'Education',
      minGrades: { English: 75, Math: 70, Subject: 75 },
      countryBaselines: createCountryBaselines(
        {English: 80, Math: 75, Subject: 80, Research: 70}, 
        {English: 75, Math: 70, Subject: 75, Research: 65}, 
        {English: 75, Math: 70, Subject: 75, Research: 65}, 
        {English: 75, Math: 70, Subject: 75, Research: 65}, 
        {English: 75, Math: 70, Subject: 75, Research: 65}, 
        {English: 85, Math: 80, Subject: 85, Research: 75}  
      )
    },

    
    {
      name: 'Software Developer',
      category: 'IT/Computer Science',
      minGrades: { Math: 70, English: 60, Computer: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 75, English: 65, IT: 70, Physics: 60},  - IT
        {Math: 70, English: 60, ComputerStudies: 65, Physics: 55},  - Computer Studies
        {Math: 70, English: 60, DataProcessing: 65, Physics: 55},  - Data Processing
        {Math: 70, English: 60, ComputerStudies: 65, Physics: 55},  - Computer Studies
        {Math: 70, English: 60, IT: 65, Physics: 55},  - IT
        {Math: 85, English: 75, IT: 80, Physics: 70}   - IT
      )
    },
    {
      name: 'Data Scientist',
      category: 'IT/Computer Science',
      minGrades: { Math: 75, Statistics: 70, Computer: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Statistics: 75, IT: 70, Physics: 60},  - IT
        {Math: 75, Statistics: 70, ComputerStudies: 65, Physics: 55},  - Computer Studies
        {Math: 75, Statistics: 70, DataProcessing: 65, Physics: 55},  - Data Processing
        {Math: 75, Statistics: 70, ComputerStudies: 65, Physics: 55},  - Computer Studies
        {Math: 75, Statistics: 70, IT: 65, Physics: 55},  - IT
        {Math: 90, Statistics: 85, IT: 80, Physics: 75}   - IT
      )
    },
    {
      name: 'IT Specialist',
      category: 'IT/Computer Science',
      minGrades: { Computer: 70, Math: 65, English: 60 },
      countryBaselines: createCountryBaselines(
        {IT: 75, Math: 70, English: 65, Physics: 55},  - IT
        {ComputerStudies: 70, Math: 65, English: 60, Physics: 50},  - Computer Studies
        {DataProcessing: 70, Math: 65, English: 60, Physics: 50},  - Data Processing
        {ComputerStudies: 70, Math: 65, English: 60, Physics: 50},  - Computer Studies
        {IT: 70, Math: 65, English: 60, Physics: 50},  - IT
        {IT: 85, Math: 80, English: 75, Physics: 70}   - IT
      )
    },
    {
      name: 'Cybersecurity Analyst',
      category: 'IT/Computer Science',
      minGrades: { Computer: 75, Math: 70, English: 65 },
      countryBaselines: createCountryBaselines(
        {IT: 80, Math: 75, English: 70, Physics: 60},  - IT
        {ComputerStudies: 75, Math: 70, English: 65, Physics: 55},  - Computer Studies
        {DataProcessing: 75, Math: 70, English: 65, Physics: 55},  - Data Processing
        {ComputerStudies: 75, Math: 70, English: 65, Physics: 55},  - Computer Studies
        {IT: 75, Math: 70, English: 65, Physics: 55},  - IT
        {IT: 90, Math: 85, English: 80, Physics: 75}   - IT
      )
    },

    
    {
      name: 'Scientist',
      category: 'Science',
      minGrades: { Math: 75, Physics: 70, Chemistry: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Physics: 75, Chemistry: 75, Biology: 70}, 
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, 
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, 
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, 
        {Math: 75, Physics: 70, Chemistry: 70, Biology: 65}, 
        {Math: 90, Physics: 85, Chemistry: 85, Biology: 80}  
      )
    },
    {
      name: 'Researcher',
      category: 'Science',
      minGrades: { Math: 70, English: 70, Subject: 75 },
      countryBaselines: createCountryBaselines(
        {Math: 75, English: 75, Subject: 80, Research: 70}, 
        {Math: 70, English: 70, Subject: 75, Research: 65}, 
        {Math: 70, English: 70, Subject: 75, Research: 65}, 
        {Math: 70, English: 70, Subject: 75, Research: 65}, 
        {Math: 70, English: 70, Subject: 75, Research: 65}, 
        {Math: 85, English: 85, Subject: 90, Research: 80}  
      )
    },
    {
      name: 'Biologist',
      category: 'Science',
      minGrades: { Biology: 75, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 80, Chemistry: 75, Math: 70, Physics: 60}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 90, Chemistry: 85, Math: 80, Physics: 75}  
      )
    },
    {
      name: 'Chemist',
      category: 'Science',
      minGrades: { Chemistry: 75, Math: 70, Physics: 65 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 80, Math: 75, Physics: 70, Biology: 60}, 
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, 
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, 
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, 
        {Chemistry: 75, Math: 70, Physics: 65, Biology: 55}, 
        {Chemistry: 90, Math: 85, Physics: 80, Biology: 75}  
      )
    },
    {
      name: 'Physicist',
      category: 'Science',
      minGrades: { Physics: 80, Math: 80, Chemistry: 70 },
      countryBaselines: createCountryBaselines(
        {Physics: 85, Math: 85, Chemistry: 75, English: 65}, 
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, 
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, 
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, 
        {Physics: 80, Math: 80, Chemistry: 70, English: 60}, 
        {Physics: 95, Math: 95, Chemistry: 85, English: 75}  
      )
    },

    
    {
      name: 'Architect',
      category: 'Arts/Design',
      minGrades: { Math: 70, Physics: 65, Art: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 70, Art: 75, English: 65}, 
        {Math: 70, Physics: 65, Art: 70, English: 60}, 
        {Math: 70, Physics: 65, Art: 70, English: 60}, 
        {Math: 70, Physics: 65, Art: 70, English: 60}, 
        {Math: 70, Physics: 65, Art: 70, English: 60}, 
        {Math: 85, Physics: 80, Art: 85, English: 75}  
      )
    },
    {
      name: 'Journalist',
      category: 'Arts/Design',
      minGrades: { English: 75, History: 70, Literature: 65 },
      countryBaselines: createCountryBaselines(
        {English: 80, History: 75, Literature: 70, Kiswahili: 65}, 
        {English: 75, History: 70, Literature: 65, French: 60}, 
        {English: 75, History: 70, Literature: 65, Afrikaans: 60}, 
        {English: 75, History: 70, Literature: 65, Arabic: 60}, 
        {English: 75, History: 70, Literature: 65, French: 60}, 
        {English: 85, History: 80, Literature: 75, Language: 70}  
      )
    },
    {
      name: 'Writer',
      category: 'Arts/Design',
      minGrades: { English: 80, Literature: 75, History: 65 },
      countryBaselines: createCountryBaselines(
        {English: 85, Literature: 80, History: 70, Kiswahili: 65}, 
        {English: 80, Literature: 75, History: 65, French: 60}, 
        {English: 80, Literature: 75, History: 65, Afrikaans: 60}, 
        {English: 80, Literature: 75, History: 65, Arabic: 60}, 
        {English: 80, Literature: 75, History: 65, French: 60}, 
        {English: 90, Literature: 85, History: 75, Language: 70}  
      )
    },
    {
      name: 'Graphic Designer',
      category: 'Arts/Design',
      minGrades: { Art: 70, English: 60, Computer: 60 },
      countryBaselines: createCountryBaselines(
        {Art: 75, English: 65, IT: 65, Math: 50},  - IT
        {Art: 70, English: 60, ComputerStudies: 60, Math: 45},  - Computer Studies
        {Art: 70, English: 60, DataProcessing: 60, Math: 45},  - Data Processing
        {Art: 70, English: 60, ComputerStudies: 60, Math: 45},  - Computer Studies
        {Art: 70, English: 60, IT: 60, Math: 45},  - IT
        {Art: 85, English: 75, IT: 75, Math: 65}   - IT
      )
    },

    
    {
      name: 'Social Worker',
      category: 'Social Sciences',
      minGrades: { English: 70, History: 65, Psychology: 60 },
      countryBaselines: createCountryBaselines(
        {English: 75, History: 70, Psychology: 65, Sociology: 60}, 
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, 
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, 
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, 
        {English: 70, History: 65, Psychology: 60, Sociology: 55}, 
        {English: 80, History: 75, Psychology: 70, Sociology: 65}  
      )
    },
    {
      name: 'Psychologist',
      category: 'Social Sciences',
      minGrades: { Psychology: 75, Biology: 70, English: 70 },
      countryBaselines: createCountryBaselines(
        {Psychology: 80, Biology: 75, English: 75, Math: 65}, 
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, 
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, 
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, 
        {Psychology: 75, Biology: 70, English: 70, Math: 60}, 
        {Psychology: 90, Biology: 85, English: 85, Math: 75}  
      )
    },
    {
      name: 'Counselor',
      category: 'Social Sciences',
      minGrades: { English: 70, Psychology: 65, History: 60 },
      countryBaselines: createCountryBaselines(
        {English: 75, Psychology: 70, History: 65, Sociology: 60}, 
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, 
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, 
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, 
        {English: 70, Psychology: 65, History: 60, Sociology: 55}, 
        {English: 80, Psychology: 75, History: 70, Sociology: 65}  
      )
    },

    
    {
      name: 'Agricultural Scientist',
      category: 'Agriculture',
      minGrades: { Biology: 70, Chemistry: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, 
        {Biology: 70, Chemistry: 65, Math: 60, Physics: 50}, 
        {Biology: 85, Chemistry: 80, Math: 75, Physics: 70}  
      )
    },
    {
      name: 'Agricultural Extension Officer',
      category: 'Agriculture',
      minGrades: { Biology: 65, Chemistry: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 70, Chemistry: 65, English: 65, Math: 55}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 65, Chemistry: 60, English: 60, Math: 50}, 
        {Biology: 75, Chemistry: 70, English: 75, Math: 65}  
      )
    },

    
    {
      name: 'Environmental Scientist',
      category: 'Environmental Science',
      minGrades: { Biology: 70, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 75, Math: 70, Physics: 60}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 70, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 85, Chemistry: 85, Math: 80, Physics: 75}  
      )
    },
    {
      name: 'Wildlife Conservationist',
      category: 'Environmental Science',
      minGrades: { Biology: 75, Chemistry: 65, English: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 80, Chemistry: 70, English: 70, Geography: 60}, 
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, 
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, 
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, 
        {Biology: 75, Chemistry: 65, English: 65, Geography: 55}, 
        {Biology: 90, Chemistry: 80, English: 80, Geography: 75}  
      )
    },

    
    {
      name: 'Pilot',
      category: 'Aviation',
      minGrades: { Math: 75, Physics: 75, English: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Physics: 80, English: 75, Chemistry: 65}, 
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, 
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, 
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, 
        {Math: 75, Physics: 75, English: 70, Chemistry: 60}, 
        {Math: 90, Physics: 90, English: 85, Chemistry: 80}  
      )
    },
    {
      name: 'Aircraft Engineer',
      category: 'Aviation',
      minGrades: { Math: 75, Physics: 75, Chemistry: 70 },
      countryBaselines: createCountryBaselines(
        {Math: 80, Physics: 80, Chemistry: 75, English: 65}, 
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, 
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, 
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, 
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, 
        {Math: 90, Physics: 90, Chemistry: 85, English: 80}  
      )
    },

    
    {
      name: 'Marine Engineer',
      category: 'Maritime',
      minGrades: { Math: 70, Physics: 70, Chemistry: 65 },
      countryBaselines: createCountryBaselines(
        {Math: 75, Physics: 75, Chemistry: 70, English: 60}, 
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, 
        {Math: 70, Physics: 70, Chemistry: 65, English: 55}, 
        {Math: 85, Physics: 85, Chemistry: 80, English: 75}  
      )
    },
    {
      name: 'Marine Biologist',
      category: 'Maritime',
      minGrades: { Biology: 75, Chemistry: 70, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Biology: 80, Chemistry: 75, Math: 70, Physics: 60}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 75, Chemistry: 70, Math: 65, Physics: 55}, 
        {Biology: 90, Chemistry: 85, Math: 80, Physics: 75}  
      )
    },

    
    {
      name: 'Nutritionist',
      category: 'Food Science',
      minGrades: { Biology: 70, Chemistry: 65, Math: 60 },
      countryBaselines: createCountryBaselines(
        {Biology: 75, Chemistry: 70, Math: 65, English: 60}, 
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, 
        {Biology: 70, Chemistry: 65, Math: 60, English: 55}, 
        {Biology: 85, Chemistry: 80, Math: 75, English: 75}  
      )
    },
    {
      name: 'Food Scientist',
      category: 'Food Science',
      minGrades: { Chemistry: 70, Biology: 65, Math: 65 },
      countryBaselines: createCountryBaselines(
        {Chemistry: 75, Biology: 70, Math: 70, Physics: 60}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 70, Biology: 65, Math: 65, Physics: 55}, 
        {Chemistry: 85, Biology: 80, Math: 80, Physics: 75}  
      )
    },

    
    {
      name: 'Police Officer',
      category: 'Public Service',
      minGrades: { English: 65, Math: 60, History: 55 },
      countryBaselines: createCountryBaselines(
        {English: 70, Math: 65, History: 60, Kiswahili: 55}, 
        {English: 65, Math: 60, History: 55, French: 50}, 
        {English: 65, Math: 60, History: 55, Afrikaans: 50}, 
        {English: 65, Math: 60, History: 55, Arabic: 50}, 
        {English: 65, Math: 60, History: 55, French: 50}, 
        {English: 75, Math: 70, History: 65, Language: 60}  
      )
    },
    {
      name: 'Firefighter',
      category: 'Public Service',
      minGrades: { Math: 60, Physics: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 65, Physics: 65, English: 65, Chemistry: 55}, 
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, 
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, 
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, 
        {Math: 60, Physics: 60, English: 60, Chemistry: 50}, 
        {Math: 70, Physics: 70, English: 75, Chemistry: 65}  
      )
    },
    {
      name: 'Military Officer',
      category: 'Public Service',
      minGrades: { Math: 65, English: 65, Physics: 60 },
      countryBaselines: createCountryBaselines(
        {Math: 70, English: 70, Physics: 65, History: 60}, 
        {Math: 65, English: 65, Physics: 60, History: 55}, 
        {Math: 65, English: 65, Physics: 60, History: 55}, 
        {Math: 65, English: 65, Physics: 60, History: 55}, 
        {Math: 65, English: 65, Physics: 60, History: 55}, 
        {Math: 75, English: 75, Physics: 70, History: 65}  
      )
    },

    
    {
      name: 'Sports Coach',
      category: 'Sports Science',
      minGrades: { PhysicalEducation: 70, Biology: 60, English: 60 },
      countryBaselines: createCountryBaselines(
        {PhysicalEducation: 75, Biology: 65, English: 65, Math: 50}, 
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, 
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, 
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, 
        {PhysicalEducation: 70, Biology: 60, English: 60, Math: 45}, 
        {PhysicalEducation: 85, Biology: 75, English: 75, Math: 65}  
      )
    },
    {
      name: 'Fitness Trainer',
      category: 'Sports Science',
      minGrades: { PhysicalEducation: 65, Biology: 60, English: 55 },
      countryBaselines: createCountryBaselines(
        {PhysicalEducation: 70, Biology: 65, English: 60, Math: 45}, 
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, 
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, 
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, 
        {PhysicalEducation: 65, Biology: 60, English: 55, Math: 40}, 
        {PhysicalEducation: 80, Biology: 75, English: 70, Math: 60}  
      )
    }
  ];
}

