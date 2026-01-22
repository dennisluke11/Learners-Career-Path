import { Injectable } from '@angular/core';
import { Grades } from '../../../shared/models/grades.model';
import { Career } from '../../../shared/models/career.model';
import { COUNTRY_SUBJECTS } from '../../../shared/models/subject.model';

export interface EligibleCareer {
  career: Career;
  status: 'qualified' | 'close' | 'needs-improvement';
  matchScore: number;
  missingSubjects: string[];
  closeSubjects: string[];
}

@Injectable({ providedIn: 'root' })
export class EligibilityService {

  /**
   * Normalize subject name - maps various formats to standard name
   * Handles: display names, standard names, requirement names, aliases
   */
  private normalizeSubjectName(subjectName: string, countryCode: string): string {
    if (!subjectName) return subjectName;

    const countryData = COUNTRY_SUBJECTS[countryCode];
    if (!countryData) {
      // Fallback mapping if country data not available
      return this.fallbackNormalize(subjectName);
    }

    // Check subject aliases first
    if (countryData.subjectAliases) {
      const alias = countryData.subjectAliases[subjectName];
      if (alias) return alias;
    }

    // Check if it's already a standard name (case-insensitive)
    const subject = countryData.subjects.find(s => 
      s.standardName.toLowerCase() === subjectName.toLowerCase()
    );
    if (subject) return subject.standardName; // Return the correct case

    // Check if it matches a display name (exact or case-insensitive)
    const subjectByDisplay = countryData.subjects.find(s => {
      const displayLower = s.displayName.toLowerCase();
      const nameLower = subjectName.toLowerCase();
      return s.displayName === subjectName || displayLower === nameLower;
    });
    if (subjectByDisplay) return subjectByDisplay.standardName;

    // Try fallback mapping
    return this.fallbackNormalize(subjectName);
  }

  /**
   * Fallback normalization for common subject name variations
   */
  private fallbackNormalize(subjectName: string): string {
    const variations: { [key: string]: string } = {
      // Mathematics
      'Mathematics': 'Math',
      'Maths': 'Math',
      'Mathematical Literacy': 'MathLiteracy',
      'Math Literacy': 'MathLiteracy',
      
      // English
      'English Home Language': 'English',
      'English (Home Language)': 'English',
      'English HL': 'English',
      'English First Additional Language': 'EnglishFAL',
      'English (First Additional Language)': 'EnglishFAL',
      'English FAL': 'EnglishFAL',
      
      // Life Orientation
      'Life Orientation': 'LifeOrientation',
      
      // Sciences
      'Physical Sciences': 'Physics',
      'Physical Science': 'Physics',
      'Life Sciences': 'Biology',
      'Life Science': 'Biology',
      
      // Technology
      'Computer Applications Technology': 'CAT',
      'Computer Applications Tech': 'CAT',
      'Information Technology': 'IT',
      'Computer': 'IT',
      'Computers': 'IT'
    };

    // Try exact match
    if (variations[subjectName]) {
      return variations[subjectName];
    }

    // Try case-insensitive match
    const nameLower = subjectName.toLowerCase();
    for (const [key, value] of Object.entries(variations)) {
      if (key.toLowerCase() === nameLower) {
        return value;
      }
    }

    // Handle standard names with different cases (math -> Math, english -> English, etc.)
    const standardNameMap: { [key: string]: string } = {
      'math': 'Math',
      'MATH': 'Math',
      'mathliteracy': 'MathLiteracy',
      'MATHLITERACY': 'MathLiteracy',
      'english': 'English',
      'ENGLISH': 'English',
      'englishfal': 'EnglishFAL',
      'ENGLISHFAL': 'EnglishFAL',
      'physics': 'Physics',
      'PHYSICS': 'Physics',
      'biology': 'Biology',
      'BIOLOGY': 'Biology',
      'cat': 'CAT',
      'it': 'IT',
      'lifeorientation': 'LifeOrientation',
      'LIFEORIENTATION': 'LifeOrientation'
    };

    if (standardNameMap[nameLower]) {
      return standardNameMap[nameLower];
    }

    // Return as-is if no mapping found
    return subjectName;
  }

  /**
   * Get grade value for a subject, trying multiple name variations
   * This handles the mismatch between requirement names and grade keys
   */
  private getGradeForSubject(grades: Grades, subjectName: string, countryCode: string): number {
    // Try exact match first (requirement name might match grade key)
    if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
      return grades[subjectName] || 0;
    }

    // Normalize requirement name to standard name
    const normalized = this.normalizeSubjectName(subjectName, countryCode);
    
    // Try normalized name
    if (grades[normalized] !== undefined && grades[normalized] !== null) {
      return grades[normalized] || 0;
    }

    // Try case-insensitive match on grade keys (normalize grade keys too)
    const normalizedLower = normalized.toLowerCase();
    for (const gradeKey in grades) {
      if (grades[gradeKey] === undefined || grades[gradeKey] === null) continue;
      
      // Normalize the grade key as well for comparison
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      if (normalizedGradeKey.toLowerCase() === normalizedLower) {
        return grades[gradeKey] || 0;
      }
      
      // Also try direct case-insensitive match
      if (gradeKey.toLowerCase() === normalizedLower) {
        return grades[gradeKey] || 0;
      }
    }

    // Special mappings for IT subjects
    // CAT (Computer Applications Technology) can satisfy IT requirements
    if (subjectName === 'IT' || normalized === 'IT') {
      if (grades['CAT'] !== undefined && grades['CAT'] !== null) {
        return grades['CAT'] || 0;
      }
    }
    if (subjectName === 'CAT' || normalized === 'CAT') {
      if (grades['IT'] !== undefined && grades['IT'] !== null) {
        return grades['IT'] || 0;
      }
    }

    // Handle either/or subjects for South Africa
    if (countryCode === 'ZA') {
      // Math OR MathLiteracy
      if (subjectName === 'Math' || normalized === 'Math') {
        if (grades['MathLiteracy'] !== undefined && grades['MathLiteracy'] !== null) {
          return grades['MathLiteracy'] || 0;
        }
      }
      if (subjectName === 'MathLiteracy' || normalized === 'MathLiteracy') {
        if (grades['Math'] !== undefined && grades['Math'] !== null) {
          return grades['Math'] || 0;
        }
      }

      // English OR EnglishFAL
      if (subjectName === 'English' || normalized === 'English') {
        if (grades['EnglishFAL'] !== undefined && grades['EnglishFAL'] !== null) {
          return grades['EnglishFAL'] || 0;
        }
      }
      if (subjectName === 'EnglishFAL' || normalized === 'EnglishFAL') {
        if (grades['English'] !== undefined && grades['English'] !== null) {
          return grades['English'] || 0;
        }
      }
    }

    // Try reverse lookup - check all grade keys and normalize them
    for (const gradeKey in grades) {
      if (grades[gradeKey] === undefined || grades[gradeKey] === null) continue;
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      const normalizedRequirement = this.normalizeSubjectName(subjectName, countryCode);
      
      // Match if normalized names are the same (case-insensitive)
      if (normalizedGradeKey.toLowerCase() === normalizedRequirement.toLowerCase()) {
        return grades[gradeKey] || 0;
      }
      
      // Also try direct match with normalized requirement (case-insensitive)
      if (gradeKey.toLowerCase() === normalizedRequirement.toLowerCase()) {
        return grades[gradeKey] || 0;
      }
    }

    return 0;
  }

  checkEligibility(grades: Grades, career: Career, countryCode?: string): EligibleCareer {
    const missingSubjects: string[] = [];
    const closeSubjects: string[] = [];
    let totalRequirements = 0;
    let metRequirements = 0;

    // Get requirements to check - should already be set by CareersService.getCareersForCountry()
    const requirements = career.minGrades || {};

    // If no requirements found, this career cannot be evaluated
    if (!requirements || Object.keys(requirements).length === 0) {
      return {
        career,
        status: 'needs-improvement',
        matchScore: 0,
        missingSubjects: ['No requirements specified'],
        closeSubjects: []
      };
    }

    // Use country code from career if available, or default to 'ZA'
    const country = countryCode || 'ZA';

    // Debug logging for IT careers
    if (career.name && (career.name.includes('IT') || career.name.includes('Computer') || career.name.includes('Software') || career.name.includes('Cybersecurity') || career.name.includes('Network'))) {
      console.log(`[Eligibility] Checking ${career.name}:`, {
        requirements,
        grades,
        country
      });
    }

    // For South Africa, handle either/or subjects first
    // Track which subjects we've already processed
    const processedSubjects = new Set<string>();

    // Check Math/MathLiteracy pair if both are present
    if (country === 'ZA' && requirements['Math'] !== undefined && requirements['MathLiteracy'] !== undefined) {
      const mathGrade = this.getGradeForSubject(grades, 'Math', country);
      const mathLitGrade = this.getGradeForSubject(grades, 'MathLiteracy', country);
      const bestGrade = Math.max(mathGrade, mathLitGrade);
      const mathRequired = requirements['Math'];
      const mathLitRequired = requirements['MathLiteracy'];
      const minRequired = Math.min(mathRequired, mathLitRequired);
      
      totalRequirements++;
      processedSubjects.add('Math');
      processedSubjects.add('MathLiteracy');
      
      if (bestGrade >= minRequired) {
        metRequirements++;
      } else if (bestGrade >= minRequired * 0.9) {
        closeSubjects.push('Math/MathLiteracy');
      } else {
        missingSubjects.push('Math/MathLiteracy');
      }
    }

    // Check English/EnglishFAL pair if both are present
    if (country === 'ZA' && requirements['English'] !== undefined && requirements['EnglishFAL'] !== undefined) {
      const engGrade = this.getGradeForSubject(grades, 'English', country);
      const engFALGrade = this.getGradeForSubject(grades, 'EnglishFAL', country);
      const bestGrade = Math.max(engGrade, engFALGrade);
      const engRequired = requirements['English'];
      const engFALRequired = requirements['EnglishFAL'];
      const minRequired = Math.min(engRequired, engFALRequired);
      
      totalRequirements++;
      processedSubjects.add('English');
      processedSubjects.add('EnglishFAL');
      
      if (bestGrade >= minRequired) {
        metRequirements++;
      } else if (bestGrade >= minRequired * 0.9) {
        closeSubjects.push('English/EnglishFAL');
      } else {
        missingSubjects.push('English/EnglishFAL');
      }
    }

    // Check remaining subjects
    for (const subject in requirements) {
      // Skip if already processed as part of an either/or pair
      if (processedSubjects.has(subject)) {
        continue;
      }
      
      const required = requirements[subject];
      const current = this.getGradeForSubject(grades, subject, country);
      
      totalRequirements++;
      
      if (current >= required) {
        metRequirements++;
      } else if (current >= required * 0.9) {
        closeSubjects.push(subject);
      } else {
        missingSubjects.push(subject);
      }
    }

    const matchScore = totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 0;

    let status: 'qualified' | 'close' | 'needs-improvement';
    if (totalRequirements === 0) {
      status = 'needs-improvement';
    } else if (missingSubjects.length === 0 && closeSubjects.length === 0) {
      status = 'qualified';
    } else if (missingSubjects.length === 0 && closeSubjects.length > 0) {
      status = 'close';
    } else if (matchScore >= 60) {
      // Lowered threshold from 70% to 60% to show more "almost qualified" careers
      // This encourages users by showing careers within reach with improvement
      status = 'close';
    } else {
      status = 'needs-improvement';
    }

    const result = {
      career,
      status,
      matchScore: Math.round(matchScore),
      missingSubjects,
      closeSubjects
    };

    // Debug logging for IT careers
    if (career.name && (career.name.includes('IT') || career.name.includes('Computer') || career.name.includes('Software') || career.name.includes('Cybersecurity') || career.name.includes('Network'))) {
      console.log(`[Eligibility] ${career.name} result:`, {
        status: result.status,
        matchScore: result.matchScore,
        metRequirements,
        totalRequirements,
        missingSubjects: result.missingSubjects,
        closeSubjects: result.closeSubjects
      });
    }

    return result;
  }

  getEligibleCareers(grades: Grades, careers: Career[], countryCode?: string): EligibleCareer[] {
    if (!grades || Object.keys(grades).length === 0) {
      return [];
    }

    const eligibleCareers = careers.map(career => 
      this.checkEligibility(grades, career, countryCode)
    );

    return eligibleCareers.sort((a, b) => {
      if (a.status === 'qualified' && b.status !== 'qualified') return -1;
      if (a.status !== 'qualified' && b.status === 'qualified') return 1;
      return b.matchScore - a.matchScore;
    });
  }

  getFullyQualifiedCareers(grades: Grades, careers: Career[]): EligibleCareer[] {
    return this.getEligibleCareers(grades, careers)
      .filter(eligible => eligible.status === 'qualified');
  }

  getCloseCareers(grades: Grades, careers: Career[]): EligibleCareer[] {
    return this.getEligibleCareers(grades, careers)
      .filter(eligible => eligible.status === 'close');
  }
}

