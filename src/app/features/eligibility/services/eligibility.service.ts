import { Injectable } from '@angular/core';
import { Grades } from '../../../shared/models/grades.model';
import { Career } from '../../../shared/models/career.model';

export interface EligibleCareer {
  career: Career;
  status: 'qualified' | 'close' | 'needs-improvement';
  matchScore: number;
  missingSubjects: string[];
  closeSubjects: string[];
}

@Injectable({ providedIn: 'root' })
export class EligibilityService {

  checkEligibility(grades: Grades, career: Career): EligibleCareer {
    const missingSubjects: string[] = [];
    const closeSubjects: string[] = [];
    let totalRequirements = 0;
    let metRequirements = 0;

    for (const subject in career.minGrades) {
      const required = career.minGrades[subject];
      const current = grades[subject] || 0;
      
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
    if (missingSubjects.length === 0 && closeSubjects.length === 0) {
      status = 'qualified';
    } else if (missingSubjects.length === 0 && closeSubjects.length > 0) {
      status = 'close';
    } else if (matchScore >= 70) {
      status = 'close';
    } else {
      status = 'needs-improvement';
    }

    return {
      career,
      status,
      matchScore: Math.round(matchScore),
      missingSubjects,
      closeSubjects
    };
  }

  getEligibleCareers(grades: Grades, careers: Career[]): EligibleCareer[] {
    if (!grades || Object.keys(grades).length === 0) {
      return [];
    }

    const eligibleCareers = careers.map(career => 
      this.checkEligibility(grades, career)
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

