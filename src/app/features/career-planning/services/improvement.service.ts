import { Injectable } from '@angular/core';
import { Grades } from '../../../shared/models/grades.model';
import { Career } from '../../../shared/models/career.model';
import { SubjectsService } from '../../../shared/services/subjects.service';
import { EitherOrGroup } from '../../../shared/models/subject.model';

@Injectable({ providedIn: 'root' })
export class ImprovementService {
  constructor(private subjectsService: SubjectsService) {}

  async calculateImprovements(studentGrades: Grades, career: Career, countryCode: string = 'ZA'): Promise<{ [subject: string]: number }> {
    const improvements: { [subject: string]: number } = {};
    const requirements = career.minGrades || {};

    if (!requirements || Object.keys(requirements).length === 0) {
      return improvements;
    }

    const processedSubjects = new Set<string>();
    const eitherOrGroups = await this.subjectsService.getEitherOrGroups(countryCode);

    for (const group of eitherOrGroups) {
      const groupSubjectsInRequirements = group.subjects.filter(subj => requirements[subj] !== undefined);
      if (groupSubjectsInRequirements.length === 0) {
        continue;
      }

      group.subjects.forEach(subj => processedSubjects.add(subj));

      const enteredSubjects = groupSubjectsInRequirements.filter(subj => 
        this.isSubjectEntered(studentGrades, subj, countryCode)
      );

      if (enteredSubjects.length === 0) {
        continue;
      }

      const gradesForGroup = enteredSubjects.map(subj => ({
        grade: this.getGradeForSubject(studentGrades, subj, countryCode),
        required: requirements[subj]
      }));

      const bestGrade = Math.max(...gradesForGroup.map(g => g.grade));
      const minRequired = Math.min(...gradesForGroup.map(g => g.required));

      if (bestGrade < minRequired) {
        improvements[group.description || group.subjects.join(' OR ')] = minRequired - bestGrade;
      }
    }

    for (const subject in requirements) {
      if (processedSubjects.has(subject)) {
        continue;
      }

      // Only calculate improvement if subject was actually entered
      if (!this.isSubjectEntered(studentGrades, subject, countryCode)) {
        continue; // Skip subjects not entered by the learner
      }

      const required = requirements[subject];
      const current = this.getGradeForSubject(studentGrades, subject, countryCode);

      if (current < required) {
        improvements[subject] = required - current;
      }
    }

    return improvements;
  }

  private getGradeForSubject(grades: Grades, subjectName: string, countryCode: string): number {
    if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
      return grades[subjectName] || 0;
    }

    if (subjectName === 'IT' && grades['CAT'] !== undefined && grades['CAT'] !== null) {
      return grades['CAT'] || 0;
    }
    if (subjectName === 'CAT' && grades['IT'] !== undefined && grades['IT'] !== null) {
      return grades['IT'] || 0;
    }


    return 0;
  }

  /**
   * Check if a subject was actually entered by the user (exists in grades object)
   * Returns true if subject exists in grades (even if value is 0)
   * Returns false if subject is completely missing
   */
  private isSubjectEntered(grades: Grades, subjectName: string, countryCode: string): boolean {
    if (!grades || Object.keys(grades).length === 0) {
      return false;
    }

    // Check exact match
    if (grades[subjectName] !== undefined && grades[subjectName] !== null) {
      return true;
    }

    // Check normalized name
    const normalized = this.normalizeSubjectName(subjectName, countryCode);
    if (grades[normalized] !== undefined && grades[normalized] !== null) {
      return true;
    }

    // Check case-insensitive match
    const normalizedLower = normalized.toLowerCase();
    for (const gradeKey in grades) {
      if (grades[gradeKey] === undefined || grades[gradeKey] === null) continue;
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      if (normalizedGradeKey.toLowerCase() === normalizedLower) {
        return true;
      }
      if (gradeKey.toLowerCase() === normalizedLower) {
        return true;
      }
    }


    // Check IT/CAT mapping
    if (subjectName === 'IT' || normalized === 'IT') {
      if (grades['CAT'] !== undefined && grades['CAT'] !== null) {
        return true;
      }
    }
    if (subjectName === 'CAT' || normalized === 'CAT') {
      if (grades['IT'] !== undefined && grades['IT'] !== null) {
        return true;
      }
    }

    return false;
  }

  private normalizeSubjectName(subjectName: string, countryCode: string): string {
    // Basic normalization - match the logic from EligibilityService
    let normalized = subjectName.trim();
    
    // Common variations
    const variations: { [key: string]: string } = {
      'Mathematics': 'Math',
      'Mathematical Literacy': 'MathLiteracy',
      'English Home Language': 'English',
      'English (Home Language)': 'English',
      'English First Additional Language': 'EnglishFAL',
      'English (First Additional Language)': 'EnglishFAL',
      'Information Technology': 'IT',
      'Computer Applications Technology': 'CAT',
      'Computer Application Technology': 'CAT',
      'Business Studies': 'Business',
      'Business': 'Business'
    };

    if (variations[normalized]) {
      return variations[normalized];
    }

    return normalized;
  }

}

