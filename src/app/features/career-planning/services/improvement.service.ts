import { Injectable } from '@angular/core';
import { Grades } from '../../../shared/models/grades.model';
import { Career } from '../../../shared/models/career.model';

@Injectable({ providedIn: 'root' })
export class ImprovementService {

  calculateImprovements(studentGrades: Grades, career: Career, countryCode: string = 'ZA'): { [subject: string]: number } {
    const improvements: { [subject: string]: number } = {};
    const requirements = career.minGrades || {};

    if (!requirements || Object.keys(requirements).length === 0) {
      return improvements;
    }

    const processedSubjects = new Set<string>();

    if (countryCode === 'ZA' && requirements['Math'] !== undefined && requirements['MathLiteracy'] !== undefined) {
      const mathGrade = this.getGradeForSubject(studentGrades, 'Math', countryCode);
      const mathLitGrade = this.getGradeForSubject(studentGrades, 'MathLiteracy', countryCode);
      const bestGrade = Math.max(mathGrade, mathLitGrade);
      const mathRequired = requirements['Math'];
      const mathLitRequired = requirements['MathLiteracy'];
      const minRequired = Math.min(mathRequired, mathLitRequired);

      processedSubjects.add('Math');
      processedSubjects.add('MathLiteracy');

      if (bestGrade < minRequired) {
        improvements['Mathematics OR Mathematical Literacy'] = minRequired - bestGrade;
      }
    }

    if (countryCode === 'ZA' && requirements['English'] !== undefined && requirements['EnglishFAL'] !== undefined) {
      const engGrade = this.getGradeForSubject(studentGrades, 'English', countryCode);
      const engFALGrade = this.getGradeForSubject(studentGrades, 'EnglishFAL', countryCode);
      const bestGrade = Math.max(engGrade, engFALGrade);
      const engRequired = requirements['English'];
      const engFALRequired = requirements['EnglishFAL'];
      const minRequired = Math.min(engRequired, engFALRequired);

      processedSubjects.add('English');
      processedSubjects.add('EnglishFAL');

      if (bestGrade < minRequired) {
        improvements['English (Home Language) OR English (First Additional Language)'] = minRequired - bestGrade;
      }
    }

    for (const subject in requirements) {
      if (processedSubjects.has(subject)) {
        continue;
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

    if (countryCode === 'ZA') {
      if (subjectName === 'Math' && grades['MathLiteracy'] !== undefined && grades['MathLiteracy'] !== null) {
        return grades['MathLiteracy'] || 0;
      }
      if (subjectName === 'MathLiteracy' && grades['Math'] !== undefined && grades['Math'] !== null) {
        return grades['Math'] || 0;
      }
      if (subjectName === 'English' && grades['EnglishFAL'] !== undefined && grades['EnglishFAL'] !== null) {
        return grades['EnglishFAL'] || 0;
      }
      if (subjectName === 'EnglishFAL' && grades['English'] !== undefined && grades['English'] !== null) {
        return grades['English'] || 0;
      }
    }

    return 0;
  }

}

