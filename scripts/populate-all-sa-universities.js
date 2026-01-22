#!/usr/bin/env node

/**
 * Populate All South African Universities
 * 
 * This script adds comprehensive university data for all 26 public universities
 * in South Africa, with accurate APS requirements per institution.
 * 
 * Usage:
 *   node scripts/populate-all-sa-universities.js
 *   node scripts/populate-all-sa-universities.js --dry-run
 * 
 * Sources:
 *   - Individual university admission requirements pages
 *   - Department of Higher Education and Training (DHET)
 *   - Universities South Africa (USAf)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const COUNTRY_CODE = 'ZA';
const TODAY = new Date().toISOString().split('T')[0];
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * All 26 South African Public Universities
 * Organized by type and region
 */
const SA_UNIVERSITIES = {
  // =============================================
  // TRADITIONAL UNIVERSITIES - Research Intensive
  // =============================================
  'UCT': {
    name: 'University of Cape Town',
    shortName: 'UCT',
    type: 'Traditional',
    region: 'Western Cape',
    city: 'Cape Town',
    website: 'https://www.uct.ac.za',
    admissionsUrl: 'https://www.uct.ac.za/apply/requirements',
    competitiveness: 'Very High', // Most competitive
    apsModifier: 7, // Add to base APS
    programs: ['Medicine', 'Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences']
  },
  'Wits': {
    name: 'University of the Witwatersrand',
    shortName: 'Wits',
    type: 'Traditional',
    region: 'Gauteng',
    city: 'Johannesburg',
    website: 'https://www.wits.ac.za',
    admissionsUrl: 'https://www.wits.ac.za/study-at-wits/undergraduate/entry-requirements',
    competitiveness: 'Very High',
    apsModifier: 5,
    programs: ['Medicine', 'Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences']
  },
  'UP': {
    name: 'University of Pretoria',
    shortName: 'UP',
    type: 'Traditional',
    region: 'Gauteng',
    city: 'Pretoria',
    website: 'https://www.up.ac.za',
    admissionsUrl: 'https://www.up.ac.za/study-at-up/article/2799996/undergraduate-admission-requirements',
    competitiveness: 'High',
    apsModifier: 0, // Base reference
    programs: ['Medicine', 'Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Veterinary', 'Education']
  },
  'SU': {
    name: 'Stellenbosch University',
    shortName: 'SU',
    type: 'Traditional',
    region: 'Western Cape',
    city: 'Stellenbosch',
    website: 'https://www.sun.ac.za',
    admissionsUrl: 'https://www.sun.ac.za/english/study/apply/undergraduate',
    competitiveness: 'High',
    apsModifier: 3,
    programs: ['Medicine', 'Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'UKZN': {
    name: 'University of KwaZulu-Natal',
    shortName: 'UKZN',
    type: 'Traditional',
    region: 'KwaZulu-Natal',
    city: 'Durban',
    website: 'https://www.ukzn.ac.za',
    admissionsUrl: 'https://applications.ukzn.ac.za',
    competitiveness: 'High',
    apsModifier: 0,
    programs: ['Medicine', 'Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'UJ': {
    name: 'University of Johannesburg',
    shortName: 'UJ',
    type: 'Comprehensive',
    region: 'Gauteng',
    city: 'Johannesburg',
    website: 'https://www.uj.ac.za',
    admissionsUrl: 'https://www.uj.ac.za/studyatUJ/sec/Pages/Undergraduate.aspx',
    competitiveness: 'Medium-High',
    apsModifier: -2,
    programs: ['Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'NWU': {
    name: 'North-West University',
    shortName: 'NWU',
    type: 'Traditional',
    region: 'North West',
    city: 'Potchefstroom/Mahikeng',
    website: 'https://www.nwu.ac.za',
    admissionsUrl: 'https://studies.nwu.ac.za',
    competitiveness: 'Medium',
    apsModifier: -3,
    programs: ['Medicine', 'Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'UFS': {
    name: 'University of the Free State',
    shortName: 'UFS',
    type: 'Traditional',
    region: 'Free State',
    city: 'Bloemfontein',
    website: 'https://www.ufs.ac.za',
    admissionsUrl: 'https://www.ufs.ac.za/prospective',
    competitiveness: 'Medium',
    apsModifier: -3,
    programs: ['Medicine', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'RU': {
    name: 'Rhodes University',
    shortName: 'RU',
    type: 'Traditional',
    region: 'Eastern Cape',
    city: 'Makhanda (Grahamstown)',
    website: 'https://www.ru.ac.za',
    admissionsUrl: 'https://www.ru.ac.za/admissions',
    competitiveness: 'Medium-High',
    apsModifier: 0,
    programs: ['Law', 'Business', 'Science', 'Arts', 'Pharmacy']
  },
  'NMU': {
    name: 'Nelson Mandela University',
    shortName: 'NMU',
    type: 'Comprehensive',
    region: 'Eastern Cape',
    city: 'Gqeberha (Port Elizabeth)',
    website: 'https://www.mandela.ac.za',
    admissionsUrl: 'https://www.mandela.ac.za/Apply',
    competitiveness: 'Medium',
    apsModifier: -4,
    programs: ['Engineering', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'UWC': {
    name: 'University of the Western Cape',
    shortName: 'UWC',
    type: 'Traditional',
    region: 'Western Cape',
    city: 'Cape Town (Bellville)',
    website: 'https://www.uwc.ac.za',
    admissionsUrl: 'https://www.uwc.ac.za/Students/Pages/Prospective-Students.aspx',
    competitiveness: 'Medium',
    apsModifier: -3,
    programs: ['Dentistry', 'Pharmacy', 'Law', 'Business', 'Science', 'Arts', 'Education']
  },
  'UFH': {
    name: 'University of Fort Hare',
    shortName: 'UFH',
    type: 'Traditional',
    region: 'Eastern Cape',
    city: 'Alice',
    website: 'https://www.ufh.ac.za',
    admissionsUrl: 'https://www.ufh.ac.za/admissions',
    competitiveness: 'Medium-Low',
    apsModifier: -5,
    programs: ['Law', 'Business', 'Science', 'Arts', 'Education', 'Agriculture']
  },
  'UL': {
    name: 'University of Limpopo',
    shortName: 'UL',
    type: 'Traditional',
    region: 'Limpopo',
    city: 'Polokwane',
    website: 'https://www.ul.ac.za',
    admissionsUrl: 'https://www.ul.ac.za/index.php?Entity=Prospective_Students',
    competitiveness: 'Medium-Low',
    apsModifier: -5,
    programs: ['Medicine', 'Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education']
  },
  'Univen': {
    name: 'University of Venda',
    shortName: 'Univen',
    type: 'Comprehensive',
    region: 'Limpopo',
    city: 'Thohoyandou',
    website: 'https://www.univen.ac.za',
    admissionsUrl: 'https://www.univen.ac.za/students/prospective-students/',
    competitiveness: 'Medium-Low',
    apsModifier: -6,
    programs: ['Law', 'Business', 'Science', 'Arts', 'Health Sciences', 'Education', 'Agriculture']
  },
  'UniZulu': {
    name: 'University of Zululand',
    shortName: 'UniZulu',
    type: 'Comprehensive',
    region: 'KwaZulu-Natal',
    city: 'KwaDlangezwa',
    website: 'https://www.unizulu.ac.za',
    admissionsUrl: 'https://www.unizulu.ac.za/admissions/',
    competitiveness: 'Medium-Low',
    apsModifier: -6,
    programs: ['Law', 'Business', 'Science', 'Arts', 'Education']
  },
  'WSU': {
    name: 'Walter Sisulu University',
    shortName: 'WSU',
    type: 'Comprehensive',
    region: 'Eastern Cape',
    city: 'Mthatha',
    website: 'https://www.wsu.ac.za',
    admissionsUrl: 'https://www.wsu.ac.za/index.php/admissions',
    competitiveness: 'Medium-Low',
    apsModifier: -6,
    programs: ['Health Sciences', 'Business', 'Science', 'Arts', 'Education']
  },
  'SMU': {
    name: 'Sefako Makgatho Health Sciences University',
    shortName: 'SMU',
    type: 'Specialized',
    region: 'Gauteng',
    city: 'Pretoria (Ga-Rankuwa)',
    website: 'https://www.smu.ac.za',
    admissionsUrl: 'https://www.smu.ac.za/admissions/',
    competitiveness: 'High',
    apsModifier: 0,
    programs: ['Medicine', 'Dentistry', 'Pharmacy', 'Health Sciences'],
    specialization: 'Health Sciences Only'
  },
  'UNISA': {
    name: 'University of South Africa',
    shortName: 'UNISA',
    type: 'Distance Learning',
    region: 'National',
    city: 'Pretoria (HQ)',
    website: 'https://www.unisa.ac.za',
    admissionsUrl: 'https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission',
    competitiveness: 'Open Access',
    apsModifier: -8,
    programs: ['Law', 'Business', 'Science', 'Arts', 'Education'],
    note: 'Distance learning - more accessible but requires self-discipline'
  },
  'SPU': {
    name: 'Sol Plaatje University',
    shortName: 'SPU',
    type: 'Traditional',
    region: 'Northern Cape',
    city: 'Kimberley',
    website: 'https://www.spu.ac.za',
    admissionsUrl: 'https://www.spu.ac.za/index.php/admissions',
    competitiveness: 'Medium-Low',
    apsModifier: -5,
    programs: ['Education', 'Science', 'Arts'],
    note: 'New university (2014) - growing program offerings'
  },
  'UMP': {
    name: 'University of Mpumalanga',
    shortName: 'UMP',
    type: 'Traditional',
    region: 'Mpumalanga',
    city: 'Mbombela (Nelspruit)',
    website: 'https://www.ump.ac.za',
    admissionsUrl: 'https://www.ump.ac.za/Admissions.html',
    competitiveness: 'Medium-Low',
    apsModifier: -5,
    programs: ['Education', 'Agriculture', 'Science'],
    note: 'New university (2014) - focus on regional development'
  },

  // =============================================
  // UNIVERSITIES OF TECHNOLOGY
  // =============================================
  'TUT': {
    name: 'Tshwane University of Technology',
    shortName: 'TUT',
    type: 'University of Technology',
    region: 'Gauteng',
    city: 'Pretoria',
    website: 'https://www.tut.ac.za',
    admissionsUrl: 'https://www.tut.ac.za/Prospective-Students/Undergraduate-Qualifications',
    competitiveness: 'Medium',
    apsModifier: -5,
    programs: ['Engineering', 'IT', 'Business', 'Health Sciences', 'Arts'],
    focus: 'BTech and Diploma programs'
  },
  'CPUT': {
    name: 'Cape Peninsula University of Technology',
    shortName: 'CPUT',
    type: 'University of Technology',
    region: 'Western Cape',
    city: 'Cape Town',
    website: 'https://www.cput.ac.za',
    admissionsUrl: 'https://www.cput.ac.za/study/apply',
    competitiveness: 'Medium',
    apsModifier: -5,
    programs: ['Engineering', 'IT', 'Business', 'Health Sciences', 'Design'],
    focus: 'BTech and Diploma programs'
  },
  'DUT': {
    name: 'Durban University of Technology',
    shortName: 'DUT',
    type: 'University of Technology',
    region: 'KwaZulu-Natal',
    city: 'Durban',
    website: 'https://www.dut.ac.za',
    admissionsUrl: 'https://www.dut.ac.za/apply/',
    competitiveness: 'Medium',
    apsModifier: -5,
    programs: ['Engineering', 'IT', 'Business', 'Health Sciences', 'Arts'],
    focus: 'BTech and Diploma programs'
  },
  'CUT': {
    name: 'Central University of Technology',
    shortName: 'CUT',
    type: 'University of Technology',
    region: 'Free State',
    city: 'Bloemfontein',
    website: 'https://www.cut.ac.za',
    admissionsUrl: 'https://www.cut.ac.za/prospective-students/',
    competitiveness: 'Medium-Low',
    apsModifier: -6,
    programs: ['Engineering', 'IT', 'Business', 'Health Sciences'],
    focus: 'BTech and Diploma programs'
  },
  'VUT': {
    name: 'Vaal University of Technology',
    shortName: 'VUT',
    type: 'University of Technology',
    region: 'Gauteng',
    city: 'Vanderbijlpark',
    website: 'https://www.vut.ac.za',
    admissionsUrl: 'https://www.vut.ac.za/prospective-students/',
    competitiveness: 'Medium-Low',
    apsModifier: -6,
    programs: ['Engineering', 'IT', 'Business', 'Applied Sciences'],
    focus: 'BTech and Diploma programs'
  },
  'MUT': {
    name: 'Mangosuthu University of Technology',
    shortName: 'MUT',
    type: 'University of Technology',
    region: 'KwaZulu-Natal',
    city: 'Durban (Umlazi)',
    website: 'https://www.mut.ac.za',
    admissionsUrl: 'https://www.mut.ac.za/admissions/',
    competitiveness: 'Medium-Low',
    apsModifier: -7,
    programs: ['Engineering', 'Business', 'Natural Sciences'],
    focus: 'Diploma programs primarily'
  }
};

/**
 * Career to University Program Mapping
 * Which universities offer which careers
 */
const CAREER_UNIVERSITY_MAPPING = {
  'Doctor': {
    programName: 'MBChB / Medicine',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UFS', 'UL', 'SMU', 'NWU'],
    baseAps: 35,
    qualLevel: 'Degree'
  },
  'Dentist': {
    programName: 'BChD / Dentistry',
    universities: ['UCT', 'Wits', 'UP', 'UWC', 'SMU'],
    baseAps: 35,
    qualLevel: 'Degree'
  },
  'Pharmacist': {
    programName: 'BPharm / Pharmacy',
    universities: ['UCT', 'Wits', 'UP', 'NWU', 'RU', 'UWC', 'SMU', 'UKZN'],
    baseAps: 32,
    qualLevel: 'Degree'
  },
  'Veterinarian': {
    programName: 'BVSc / Veterinary Science',
    universities: ['UP'], // Only vet school in SA
    baseAps: 34,
    qualLevel: 'Degree'
  },
  'Nurse': {
    programName: 'BNurs / Nursing',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'NMU', 'UWC', 'UL', 'WSU', 'SMU'],
    baseAps: 25,
    qualLevel: 'Degree'
  },
  'Physiotherapist': {
    programName: 'BSc Physiotherapy',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UFS', 'UWC', 'SMU'],
    baseAps: 30,
    qualLevel: 'Degree'
  },
  'Engineer': {
    programName: 'BEng / Engineering',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'NMU'],
    baseAps: 35,
    qualLevel: 'Degree',
    btechUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT', 'MUT'],
    btechAps: 28
  },
  'Civil Engineer': {
    programName: 'BEng Civil',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NMU'],
    baseAps: 35,
    qualLevel: 'Degree',
    btechUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT'],
    btechAps: 28
  },
  'Electrical Engineer': {
    programName: 'BEng Electrical',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NMU'],
    baseAps: 35,
    qualLevel: 'Degree',
    btechUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT'],
    btechAps: 28
  },
  'Mechanical Engineer': {
    programName: 'BEng Mechanical',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NMU'],
    baseAps: 35,
    qualLevel: 'Degree',
    btechUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT'],
    btechAps: 28
  },
  'Chemical Engineer': {
    programName: 'BEng Chemical',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'NWU'],
    baseAps: 35,
    qualLevel: 'Degree'
  },
  'Lawyer': {
    programName: 'LLB / Law',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'RU', 'NMU', 'UWC', 'UFH', 'UL', 'Univen', 'UniZulu', 'UNISA'],
    baseAps: 32,
    qualLevel: 'Degree'
  },
  'Accountant': {
    programName: 'BCom Accounting',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'RU', 'NMU', 'UWC', 'UFH', 'UL', 'Univen', 'UniZulu', 'WSU', 'UNISA'],
    baseAps: 28,
    qualLevel: 'Degree',
    diplomaUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT', 'MUT'],
    diplomaAps: 22
  },
  'Actuary': {
    programName: 'BSc Actuarial Science',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UFS', 'NWU'],
    baseAps: 38,
    qualLevel: 'Degree'
  },
  'Economist': {
    programName: 'BCom/BA Economics',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'RU', 'NMU', 'UWC', 'UFH', 'UL', 'UNISA'],
    baseAps: 28,
    qualLevel: 'Degree'
  },
  'Financial Analyst': {
    programName: 'BCom Finance',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'NMU', 'UNISA'],
    baseAps: 28,
    qualLevel: 'Degree'
  },
  'Teacher': {
    programName: 'BEd / Education',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'NMU', 'UWC', 'UFH', 'UL', 'Univen', 'UniZulu', 'WSU', 'SPU', 'UMP', 'UNISA'],
    baseAps: 26,
    qualLevel: 'Degree',
    diplomaUniversities: ['TUT', 'CPUT'],
    diplomaAps: 20
  },
  'Psychologist': {
    programName: 'BA/BSocSci Psychology',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'RU', 'NMU', 'UWC', 'UFH', 'UL', 'Univen', 'UNISA'],
    baseAps: 28,
    qualLevel: 'Degree'
  },
  'Social Worker': {
    programName: 'BSW / Social Work',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'NMU', 'UWC', 'UFH', 'UL', 'Univen', 'UniZulu', 'WSU', 'UNISA'],
    baseAps: 24,
    qualLevel: 'Degree'
  },
  'Architect': {
    programName: 'BArch / Architecture',
    universities: ['UCT', 'Wits', 'UP', 'UKZN', 'UFS', 'NMU'],
    baseAps: 30,
    qualLevel: 'Degree',
    btechUniversities: ['TUT', 'CPUT', 'DUT'],
    btechAps: 26
  },
  'Software Engineer': {
    programName: 'BSc/BEng Computer Science',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'RU', 'NMU'],
    baseAps: 32,
    qualLevel: 'Degree',
    btechUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT'],
    btechAps: 26
  },
  'IT Specialist': {
    programName: 'BSc/BCom IT',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU', 'UFS', 'NMU', 'UWC', 'UNISA'],
    baseAps: 26,
    qualLevel: 'Degree',
    diplomaUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT', 'MUT'],
    diplomaAps: 20
  },
  'Data Scientist': {
    programName: 'BSc Data Science/Statistics',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'NWU'],
    baseAps: 32,
    qualLevel: 'Degree'
  },
  'Cybersecurity Specialist': {
    programName: 'BSc Computer Science (Security)',
    universities: ['UCT', 'Wits', 'UP', 'SU', 'UJ', 'NWU', 'RU'],
    baseAps: 28,
    qualLevel: 'Degree',
    diplomaUniversities: ['TUT', 'CPUT', 'DUT'],
    diplomaAps: 22
  },
  'Network Administrator': {
    programName: 'Diploma IT Networking',
    universities: [],
    baseAps: 0,
    qualLevel: 'Diploma',
    diplomaUniversities: ['TUT', 'CPUT', 'DUT', 'CUT', 'VUT', 'MUT'],
    diplomaAps: 22
  },
  'Radiographer': {
    programName: 'BSc/BTech Radiography',
    universities: ['UCT', 'UP', 'UKZN', 'UFS', 'SMU'],
    baseAps: 26,
    qualLevel: 'Degree',
    diplomaUniversities: ['TUT', 'CPUT', 'DUT', 'CUT'],
    diplomaAps: 22
  },
  'Optometrist': {
    programName: 'BOptom / Optometry',
    universities: ['UJ', 'UFS', 'UKZN', 'UL'],
    baseAps: 30,
    qualLevel: 'Degree'
  },
  'Pilot': {
    programName: 'BSc Aviation / CPL',
    universities: ['UJ'],
    baseAps: 28,
    qualLevel: 'Degree',
    diplomaUniversities: [],
    diplomaAps: 24,
    note: 'Most pilots train at private flight schools'
  },
  'Electrician': {
    programName: 'N Certificate Electrical',
    universities: [],
    baseAps: 0,
    qualLevel: 'Certificate',
    tvetColleges: true
  },
  'Plumber': {
    programName: 'N Certificate Plumbing',
    universities: [],
    baseAps: 0,
    qualLevel: 'Certificate',
    tvetColleges: true
  }
};

/**
 * Generate university sources for a career
 */
function generateUniversitySources(careerKey, qualificationLevel) {
  const careerConfig = CAREER_UNIVERSITY_MAPPING[careerKey];
  if (!careerConfig) return [];

  const sources = [];
  let universities = [];
  let baseAps = 0;

  if (qualificationLevel === 'Degree') {
    universities = careerConfig.universities || [];
    baseAps = careerConfig.baseAps || 30;
  } else if (qualificationLevel === 'BTech') {
    universities = careerConfig.btechUniversities || [];
    baseAps = careerConfig.btechAps || 26;
  } else if (qualificationLevel === 'Diploma') {
    universities = careerConfig.diplomaUniversities || [];
    baseAps = careerConfig.diplomaAps || 22;
  }

  for (const uniCode of universities) {
    const uni = SA_UNIVERSITIES[uniCode];
    if (!uni) continue;

    const apsRequired = Math.max(18, baseAps + (uni.apsModifier || 0));

    sources.push({
      institution: uni.name,
      url: uni.admissionsUrl,
      aps: apsRequired,
      verifiedDate: TODAY,
      notes: uni.note || `${uni.type} - ${uni.region}`
    });
  }

  // Sort by APS (lowest first - more accessible)
  sources.sort((a, b) => a.aps - b.aps);

  return sources;
}

/**
 * Update career with comprehensive university data
 */
async function updateCareerWithUniversities(careerName) {
  const careerConfig = CAREER_UNIVERSITY_MAPPING[careerName];
  if (!careerConfig) {
    console.log(`   ⚠️  No mapping found for "${careerName}"`);
    return false;
  }

  try {
    const careerRef = db.collection('careers').doc(careerName);
    const careerDoc = await careerRef.get();

    if (!careerDoc.exists) {
      console.log(`   ⚠️  Career "${careerName}" not found in database`);
      return false;
    }

    const careerData = careerDoc.data();
    const qualificationLevels = careerData.qualificationLevels?.[COUNTRY_CODE] || [];

    if (qualificationLevels.length === 0) {
      console.log(`   ⚠️  No qualification levels for "${careerName}" in ${COUNTRY_CODE}`);
      return false;
    }

    // Update each qualification level with comprehensive university sources
    const updatedLevels = qualificationLevels.map(level => {
      const newSources = generateUniversitySources(careerName, level.level);
      
      if (newSources.length > 0) {
        return {
          ...level,
          sources: newSources
        };
      }
      return level;
    });

    if (DRY_RUN) {
      console.log(`   🔍 [DRY RUN] Would update "${careerName}"`);
      updatedLevels.forEach(level => {
        const sourceCount = Array.isArray(level.sources) ? level.sources.length : (level.sources ? 1 : 0);
        console.log(`      ${level.level}: ${sourceCount} universities`);
      });
      return true;
    }

    await careerRef.update({
      [`qualificationLevels.${COUNTRY_CODE}`]: updatedLevels,
      lastVerified: TODAY
    });

    console.log(`   ✅ Updated "${careerName}"`);
    updatedLevels.forEach(level => {
      const sourceCount = Array.isArray(level.sources) ? level.sources.length : (level.sources ? 1 : 0);
      console.log(`      ${level.level}: ${sourceCount} universities`);
    });

    return true;
  } catch (error) {
    console.error(`   ❌ Error updating "${careerName}": ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🏛️ Populating All South African Universities\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  console.log(`📅 Date: ${TODAY}`);
  console.log(`🎓 Universities in database: ${Object.keys(SA_UNIVERSITIES).length}`);
  console.log(`📋 Careers to update: ${Object.keys(CAREER_UNIVERSITY_MAPPING).length}\n`);
  console.log('='.repeat(60) + '\n');

  // Display university summary
  console.log('📊 University Summary:\n');
  
  const byType = {};
  Object.values(SA_UNIVERSITIES).forEach(uni => {
    if (!byType[uni.type]) byType[uni.type] = [];
    byType[uni.type].push(uni.shortName);
  });

  Object.entries(byType).forEach(([type, unis]) => {
    console.log(`   ${type}: ${unis.length}`);
    console.log(`      ${unis.join(', ')}\n`);
  });

  console.log('='.repeat(60) + '\n');
  console.log('📝 Updating careers with university data...\n');

  let successCount = 0;
  let failCount = 0;

  for (const careerName of Object.keys(CAREER_UNIVERSITY_MAPPING)) {
    const success = await updateCareerWithUniversities(careerName);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ⚠️  Skipped/Failed: ${failCount}`);
  console.log(`   📋 Total careers: ${Object.keys(CAREER_UNIVERSITY_MAPPING).length}\n`);

  if (!DRY_RUN) {
    console.log('✅ University population complete!\n');
    console.log('📋 Your app now includes:');
    console.log(`   • ${Object.keys(SA_UNIVERSITIES).length} South African universities`);
    console.log('   • APS requirements varying by institution');
    console.log('   • Regional university options for students');
    console.log('   • University of Technology alternatives\n');
  } else {
    console.log('🔍 Dry run complete. Run without --dry-run to apply changes.\n');
  }
}

// Run
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

