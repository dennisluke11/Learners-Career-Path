import { Injectable } from '@angular/core';
import { Grades } from '../../../shared/models/grades.model';
import { Career } from '../../../shared/models/career.model';

@Injectable({ providedIn: 'root' })
export class ImprovementService {

  calculateImprovements(studentGrades: Grades, career: Career): { [subject: string]: number } {
    const improvements: { [subject: string]: number } = {};
    for (const subject in career.minGrades) {
      const required = career.minGrades[subject];
      const current = studentGrades[subject] || 0;
      if (current < required) {
        improvements[subject] = required - current;
      }
    }
    return improvements;
  }

}

