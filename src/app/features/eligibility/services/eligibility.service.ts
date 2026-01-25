import { Injectable } from '@angular/core';
import { Grades } from '../../../shared/models/grades.model';
import { Career } from '../../../shared/models/career.model';
import { COUNTRY_SUBJECTS } from '../../../shared/models/subject.model';
import { SubjectsService } from '../../../shared/services/subjects.service';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import { EitherOrGroup } from '../../../shared/models/subject.model';

export interface EligibleCareer {
  career: Career;
  status: 'qualified' | 'close' | 'needs-improvement';
  matchScore: number;
  missingSubjects: string[];
  closeSubjects: string[];
}

@Injectable({ providedIn: 'root' })
export class EligibilityService {
  private eitherOrGroupsCache: { [countryCode: string]: EitherOrGroup[] } = {};

  constructor(
    private subjectsService: SubjectsService,
    private userPreferencesService: UserPreferencesService
  ) {}

  private normalizeSubjectName(subjectName: string, countryCode: string): string {
    if (!subjectName) return subjectName;

    const countryData = COUNTRY_SUBJECTS[countryCode];
    if (!countryData) {
      return this.fallbackNormalize(subjectName);
    }

    if (countryData.subjectAliases) {
      const alias = countryData.subjectAliases[subjectName];
      if (alias) return alias;
    }

    const subject = countryData.subjects.find(s => 
      s.standardName.toLowerCase() === subjectName.toLowerCase()
    );
    if (subject) return subject.standardName;

    const subjectByDisplay = countryData.subjects.find(s => {
      const displayLower = s.displayName.toLowerCase();
      const nameLower = subjectName.toLowerCase();
      return s.displayName === subjectName || displayLower === nameLower;
    });
    if (subjectByDisplay) return subjectByDisplay.standardName;

    return this.fallbackNormalize(subjectName);
  }

  private fallbackNormalize(subjectName: string): string {
    const variations: { [key: string]: string } = {
      'Mathematics': 'Math',
      'Maths': 'Math',
      'Mathematical Literacy': 'MathLiteracy',
      'Math Literacy': 'MathLiteracy',
      'English Home Language': 'English',
      'English (Home Language)': 'English',
      'English HL': 'English',
      'English First Additional Language': 'EnglishFAL',
      'English (First Additional Language)': 'EnglishFAL',
      'English FAL': 'EnglishFAL',
      'Life Orientation': 'LifeOrientation',
      'Physical Sciences': 'Physics',
      'Physical Science': 'Physics',
      'Life Sciences': 'Biology',
      'Life Science': 'Biology',
      'Computer Applications Technology': 'CAT',
      'Computer Applications Tech': 'CAT',
      'Information Technology': 'IT',
      'Computer': 'IT',
      'Computers': 'IT'
    };

    if (variations[subjectName]) {
      return variations[subjectName];
    }

    const nameLower = subjectName.toLowerCase();
    for (const [key, value] of Object.entries(variations)) {
      if (key.toLowerCase() === nameLower) {
        return value;
      }
    }

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

    return subjectName;
  }

  private async getGradeForSubject(grades: Grades, subjectName: string, countryCode: string): Promise<number> {
    if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
      return grades[subjectName] || 0;
    }

    const normalized = this.normalizeSubjectName(subjectName, countryCode);
    
    if (grades[normalized] !== undefined && grades[normalized] !== null) {
      return grades[normalized] || 0;
    }

    const normalizedLower = normalized.toLowerCase();
    for (const gradeKey in grades) {
      if (grades[gradeKey] === undefined || grades[gradeKey] === null) continue;
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      if (normalizedGradeKey.toLowerCase() === normalizedLower) {
        return grades[gradeKey] || 0;
      }
      
      if (gradeKey.toLowerCase() === normalizedLower) {
        return grades[gradeKey] || 0;
      }
    }

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

    const eitherOrGroups = await this.getEitherOrGroups(countryCode);
    for (const group of eitherOrGroups) {
      if (group.subjects.includes(subjectName) || group.subjects.includes(normalized)) {
        for (const groupSubject of group.subjects) {
          if (groupSubject !== subjectName && groupSubject !== normalized) {
            if (grades[groupSubject] !== undefined && grades[groupSubject] !== null) {
              return grades[groupSubject] || 0;
            }
          }
        }
      }
    }

    for (const gradeKey in grades) {
      if (grades[gradeKey] === undefined || grades[gradeKey] === null) continue;
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      const normalizedRequirement = this.normalizeSubjectName(subjectName, countryCode);
      
      if (normalizedGradeKey.toLowerCase() === normalizedRequirement.toLowerCase()) {
        return grades[gradeKey] || 0;
      }
      
      if (gradeKey.toLowerCase() === normalizedRequirement.toLowerCase()) {
        return grades[gradeKey] || 0;
      }
    }

    return 0;
  }

  private async isSubjectEntered(grades: Grades, subjectName: string, countryCode?: string): Promise<boolean> {
    if (!grades || Object.keys(grades).length === 0) {
      return false;
    }

    const code = countryCode || 'ZA';

    if (grades.hasOwnProperty(subjectName) && grades[subjectName] !== undefined && grades[subjectName] !== null) {
      return true;
    }

    const normalized = this.normalizeSubjectName(subjectName, code);
    if (grades.hasOwnProperty(normalized) && grades[normalized] !== undefined && grades[normalized] !== null) {
      return true;
    }

    const normalizedLower = normalized.toLowerCase();
    for (const gradeKey in grades) {
      if (!grades.hasOwnProperty(gradeKey)) continue;
      if (grades[gradeKey] === undefined || grades[gradeKey] === null) continue;
      
      if (gradeKey.toLowerCase() === normalizedLower) {
        return true;
      }
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, code);
      if (normalizedGradeKey.toLowerCase() === normalizedLower) {
        return true;
      }
    }

    if (subjectName === 'IT' || normalized === 'IT') {
      if (grades.hasOwnProperty('CAT') && grades['CAT'] !== undefined && grades['CAT'] !== null) {
        return true;
      }
    }
    if (subjectName === 'CAT' || normalized === 'CAT') {
      if (grades.hasOwnProperty('IT') && grades['IT'] !== undefined && grades['IT'] !== null) {
        return true;
      }
    }

    const eitherOrGroups = await this.getEitherOrGroups(code);
    for (const group of eitherOrGroups) {
      if (group.subjects.includes(subjectName) || group.subjects.includes(normalized)) {
        for (const groupSubject of group.subjects) {
          if (groupSubject !== subjectName && groupSubject !== normalized) {
            if (grades.hasOwnProperty(groupSubject) && grades[groupSubject] !== undefined && grades[groupSubject] !== null) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  private async getEitherOrGroups(countryCode: string): Promise<EitherOrGroup[]> {
    if (this.eitherOrGroupsCache[countryCode]) {
      return this.eitherOrGroupsCache[countryCode];
    }
    
    try {
      const groups = await this.subjectsService.getEitherOrGroups(countryCode);
      this.eitherOrGroupsCache[countryCode] = groups;
      return groups;
    } catch (error) {
      console.warn(`[EligibilityService] Could not fetch either/or groups for ${countryCode}, using empty array:`, error);
      return [];
    }
  }

  private findEitherOrGroup(subject: string, groups: EitherOrGroup[]): EitherOrGroup | null {
    return groups.find(group => group.subjects.includes(subject)) || null;
  }

  private async processEitherOrGroup(
    group: EitherOrGroup,
    requirements: { [subject: string]: number },
    grades: Grades,
    country: string,
    processedSubjects: Set<string>,
    missingSubjects: string[],
    closeSubjects: string[],
    totalRequirements: { value: number },
    metRequirements: { value: number }
  ): Promise<void> {
    const groupSubjectsInRequirements = group.subjects.filter(subj => requirements[subj] !== undefined);
    if (groupSubjectsInRequirements.length === 0) {
      return;
    }

    group.subjects.forEach(subj => processedSubjects.add(subj));

    const enteredSubjectsPromises = groupSubjectsInRequirements.map(async subj => {
      const entered = await this.isSubjectEntered(grades, subj, country);
      return entered ? subj : null;
    });
    const enteredSubjectsResults = await Promise.all(enteredSubjectsPromises);
    const enteredSubjects = enteredSubjectsResults.filter(subj => subj !== null) as string[];

    if (enteredSubjects.length === 0) {
      return;
    }

    const gradesForGroupPromises = enteredSubjects.map(async subj => ({
      subject: subj,
      grade: await this.getGradeForSubject(grades, subj, country),
      required: requirements[subj]
    }));
    const gradesForGroup = await Promise.all(gradesForGroupPromises);

    const bestGrade = Math.max(...gradesForGroup.map(g => g.grade));
    const minRequired = Math.min(...gradesForGroup.map(g => g.required));

    totalRequirements.value++;

    if (bestGrade >= minRequired) {
      metRequirements.value++;
    } else if (bestGrade >= minRequired * 0.9) {
      closeSubjects.push(group.description || group.subjects.join(' OR '));
    } else {
      missingSubjects.push(group.description || group.subjects.join(' OR '));
    }
  }

  async checkEligibility(grades: Grades, career: Career, countryCode?: string): Promise<EligibleCareer> {
    const missingSubjects: string[] = [];
    const closeSubjects: string[] = [];
    const totalRequirements = { value: 0 };
    const metRequirements = { value: 0 };

    const requirements = career.minGrades || {};

    if (!requirements || Object.keys(requirements).length === 0) {
      return {
        career,
        status: 'needs-improvement',
        matchScore: 0,
        missingSubjects: ['No requirements specified'],
        closeSubjects: []
      };
    }

    const country = countryCode || 'ZA';
    const enforceCompulsorySubjects = this.userPreferencesService.getEnforceCompulsorySubjects();
    const eitherOrGroups = await this.getEitherOrGroups(country);
    const processedSubjects = new Set<string>();
    
    let mandatorySubjectsToSkip: Set<string> = new Set();
    if (!enforceCompulsorySubjects) {
      try {
        const mandatorySubjects = await this.subjectsService.getMandatorySubjects(country);
        mandatorySubjectsToSkip = new Set(mandatorySubjects);
      } catch (error) {
        console.warn('Could not load mandatory subjects, proceeding without skipping:', error);
      }
    }

    for (const group of eitherOrGroups) {
      const hasRequiredSubject = group.subjects.some(subj => requirements[subj] !== undefined);
      
      if (hasRequiredSubject) {
        if (!enforceCompulsorySubjects) {
          const allSubjectsAreMandatory = group.subjects.every(subj => mandatorySubjectsToSkip.has(subj));
          if (allSubjectsAreMandatory) {
            group.subjects.forEach(subj => processedSubjects.add(subj));
            continue;
          }
        }
        
        await this.processEitherOrGroup(
          group,
          requirements,
          grades,
          country,
          processedSubjects,
          missingSubjects,
          closeSubjects,
          totalRequirements,
          metRequirements
        );
      }
    }

    for (const subject in requirements) {
      if (processedSubjects.has(subject)) {
        continue;
      }
      
      const subjectEntered = await this.isSubjectEntered(grades, subject, country);
      
      if (!subjectEntered) {
        if (!enforceCompulsorySubjects && mandatorySubjectsToSkip.has(subject)) {
          continue;
        }
        continue;
      }
      
      let keyExists = false;
      if (grades.hasOwnProperty(subject)) {
        keyExists = true;
      } else {
        const normalized = this.normalizeSubjectName(subject, country);
        if (grades.hasOwnProperty(normalized)) {
          keyExists = true;
        } else {
          const normalizedLower = normalized.toLowerCase();
          for (const gradeKey in grades) {
            if (grades.hasOwnProperty(gradeKey) && 
                gradeKey.toLowerCase() === normalizedLower) {
              keyExists = true;
              break;
            }
          }
        }
      }
      
      if (!keyExists) {
        continue;
      }
      
      const required = requirements[subject];
      const current = await this.getGradeForSubject(grades, subject, country);
      
      if (current === 0) {
        let zeroKeyExists = false;
        if (grades.hasOwnProperty(subject)) {
          zeroKeyExists = true;
        } else {
          const normalized = this.normalizeSubjectName(subject, country);
          if (grades.hasOwnProperty(normalized)) {
            zeroKeyExists = true;
          } else {
            // Check case-insensitive match
            const normalizedLower = normalized.toLowerCase();
            for (const gradeKey in grades) {
              if (grades.hasOwnProperty(gradeKey) && 
                  gradeKey.toLowerCase() === normalizedLower) {
                zeroKeyExists = true;
                break;
              }
            }
          }
        }
        
        if (!zeroKeyExists) {
          continue;
        }
      }
      
      totalRequirements.value++;
      
      if (current >= required) {
        metRequirements.value++;
      } else if (current >= required * 0.9) {
        closeSubjects.push(subject);
      } else {
        missingSubjects.push(subject);
      }
    }

    const filteredMissingSubjectsPromises = missingSubjects.map(async subject => {
      const group = eitherOrGroups.find(g => g.description === subject || g.subjects.join(' OR ') === subject);
      if (group) {
        const enteredPromises = group.subjects.map(subj => this.isSubjectEntered(grades, subj, country));
        const enteredResults = await Promise.all(enteredPromises);
        return enteredResults.some(entered => entered);
      }
      return await this.isSubjectEntered(grades, subject, country);
    });
    const filteredMissingSubjectsResults = await Promise.all(filteredMissingSubjectsPromises);
    const filteredMissingSubjects = missingSubjects.filter((_, index) => filteredMissingSubjectsResults[index]);

    const filteredCloseSubjectsPromises = closeSubjects.map(async subject => {
      const group = eitherOrGroups.find(g => g.description === subject || g.subjects.join(' OR ') === subject);
      if (group) {
        const enteredPromises = group.subjects.map(subj => this.isSubjectEntered(grades, subj, country));
        const enteredResults = await Promise.all(enteredPromises);
        return enteredResults.some(entered => entered);
      }
      return await this.isSubjectEntered(grades, subject, country);
    });
    const filteredCloseSubjectsResults = await Promise.all(filteredCloseSubjectsPromises);
    const filteredCloseSubjects = closeSubjects.filter((_, index) => filteredCloseSubjectsResults[index]);

    const matchScore = totalRequirements.value > 0 ? (metRequirements.value / totalRequirements.value) * 100 : 0;

    let status: 'qualified' | 'close' | 'needs-improvement';
    if (totalRequirements.value === 0) {
      status = 'needs-improvement';
    } else if (filteredMissingSubjects.length === 0 && filteredCloseSubjects.length === 0) {
      status = 'qualified';
    } else if (filteredMissingSubjects.length === 0 && filteredCloseSubjects.length > 0) {
      status = 'close';
    } else if (matchScore >= 60) {
      status = 'close';
    } else {
      status = 'needs-improvement';
    }

    return {
      career,
      status,
      matchScore: Math.round(matchScore),
      missingSubjects: filteredMissingSubjects,
      closeSubjects: filteredCloseSubjects
    };
  }

  async getEligibleCareers(grades: Grades, careers: Career[], countryCode?: string): Promise<EligibleCareer[]> {
    if (!grades || Object.keys(grades).length === 0) {
      return [];
    }

    const eligibleCareers = await Promise.all(
      careers.map(career => this.checkEligibility(grades, career, countryCode))
    );

    return eligibleCareers.sort((a, b) => {
      if (a.status === 'qualified' && b.status !== 'qualified') return -1;
      if (a.status !== 'qualified' && b.status === 'qualified') return 1;
      return b.matchScore - a.matchScore;
    });
  }

  async getFullyQualifiedCareers(grades: Grades, careers: Career[]): Promise<EligibleCareer[]> {
    const eligible = await this.getEligibleCareers(grades, careers);
    return eligible.filter(e => e.status === 'qualified');
  }

  async getCloseCareers(grades: Grades, careers: Career[]): Promise<EligibleCareer[]> {
    const eligible = await this.getEligibleCareers(grades, careers);
    return eligible.filter(e => e.status === 'close');
  }
}

