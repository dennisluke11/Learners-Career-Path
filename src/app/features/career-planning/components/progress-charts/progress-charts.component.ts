import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Grades } from '../../../../shared/models/grades.model';
import { Career } from '../../../../shared/models/career.model';
import { ImprovementService } from '../../services/improvement.service';

export interface SubjectProgress {
  subject: string;
  current: number;
  required: number;
  progress: number; // Percentage of requirement met (0-100+)
  status: 'met' | 'close' | 'needs-work';
  improvementNeeded: number;
}

@Component({
  selector: 'app-progress-charts',
  templateUrl: './progress-charts.component.html',
  styleUrls: ['./progress-charts.component.scss']
})
export class ProgressChartsComponent implements OnChanges {
  @Input() grades: Grades | null = null;
  @Input() career: Career | null = null;
  @Input() selectedCountry: { code: string } | null = null;

  subjectProgress: SubjectProgress[] = [];
  overallProgress = 0;

  constructor(private improvementService: ImprovementService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (this.grades && this.career) {
      await this.calculateProgress();
    } else {
      this.subjectProgress = [];
      this.overallProgress = 0;
    }
  }

  private async calculateProgress() {
    if (!this.grades || !this.career) return;

    const countryCode = this.selectedCountry?.code || 'ZA';
    const improvements = await this.improvementService.calculateImprovements(this.grades, this.career, countryCode);
    const requirements = this.career.minGrades || {};
    const processedRequirements = this.processRequirementsForDisplay(requirements, countryCode);
    
    this.subjectProgress = Object.keys(processedRequirements).map(subject => {
      const required = processedRequirements[subject];
      
      let current = 0;
      if (subject.includes(' OR ')) {
        if (subject.includes('Mathematics') || subject.includes('Mathematical Literacy')) {
          const mathGrade = this.getGradeForSubject('Math', countryCode);
          const mathLitGrade = this.getGradeForSubject('MathLiteracy', countryCode);
          current = Math.max(mathGrade, mathLitGrade);
        } else if (subject.includes('English')) {
          const engGrade = this.getGradeForSubject('English', countryCode);
          const engFALGrade = this.getGradeForSubject('EnglishFAL', countryCode);
          current = Math.max(engGrade, engFALGrade);
        }
      } else {
        current = this.getGradeForSubject(subject, countryCode);
      }
      
      const progress = required > 0 ? (current / required) * 100 : 0;
      const improvementNeeded = improvements[subject] || 0;

      let status: 'met' | 'close' | 'needs-work';
      if (current >= required) {
        status = 'met';
      } else if (current >= required * 0.8) {
        status = 'close';
      } else {
        status = 'needs-work';
      }

      return {
        subject,
        current,
        required,
        progress: Math.min(progress, 100),
        status,
        improvementNeeded
      };
    })
    .sort((a, b) => a.progress - b.progress);

    if (this.subjectProgress.length > 0) {
      const totalProgress = this.subjectProgress.reduce((sum, sp) => sum + sp.progress, 0);
      this.overallProgress = totalProgress / this.subjectProgress.length;
    }
  }

  private processRequirementsForDisplay(requirements: { [subject: string]: number }, countryCode: string): { [subject: string]: number } {
    if (countryCode !== 'ZA') {
      return requirements;
    }

    const processed: { [subject: string]: number } = {};

    if (requirements['Math'] !== undefined && requirements['MathLiteracy'] !== undefined) {
      const minRequired = Math.min(requirements['Math'], requirements['MathLiteracy']);
      processed['Mathematics OR Mathematical Literacy'] = minRequired;
    } else if (requirements['Math'] !== undefined) {
      processed['Mathematics'] = requirements['Math'];
    } else if (requirements['MathLiteracy'] !== undefined) {
      processed['Mathematical Literacy'] = requirements['MathLiteracy'];
    }

    if (requirements['English'] !== undefined && requirements['EnglishFAL'] !== undefined) {
      const minRequired = Math.min(requirements['English'], requirements['EnglishFAL']);
      processed['English (Home Language) OR English (First Additional Language)'] = minRequired;
    } else if (requirements['English'] !== undefined) {
      processed['English (Home Language)'] = requirements['English'];
    } else if (requirements['EnglishFAL'] !== undefined) {
      processed['English (First Additional Language)'] = requirements['EnglishFAL'];
    }

    for (const subject in requirements) {
      if (subject !== 'Math' && subject !== 'MathLiteracy' && 
          subject !== 'English' && subject !== 'EnglishFAL') {
        processed[subject] = requirements[subject];
      }
    }

    return processed;
  }

  private getGradeForSubject(subjectName: string, countryCode: string): number {
    if (!this.grades) return 0;
    
    if (this.grades[subjectName] !== undefined && this.grades[subjectName] !== null) {
      return this.grades[subjectName] || 0;
    }

    const normalized = this.normalizeSubjectName(subjectName, countryCode);
    if (this.grades[normalized] !== undefined && this.grades[normalized] !== null) {
      return this.grades[normalized] || 0;
    }

    const normalizedLower = normalized.toLowerCase();
    for (const gradeKey in this.grades) {
      if (this.grades[gradeKey] === undefined || this.grades[gradeKey] === null) continue;
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      if (normalizedGradeKey.toLowerCase() === normalizedLower) {
        return this.grades[gradeKey] || 0;
      }
    }

    if (subjectName === 'IT' || normalized === 'IT') {
      if (this.grades['CAT'] !== undefined && this.grades['CAT'] !== null) {
        return this.grades['CAT'] || 0;
      }
    }
    if (subjectName === 'CAT' || normalized === 'CAT') {
      if (this.grades['IT'] !== undefined && this.grades['IT'] !== null) {
        return this.grades['IT'] || 0;
      }
    }

    return 0;
  }

  private normalizeSubjectName(subjectName: string, countryCode: string): string {
    const nameLower = subjectName.toLowerCase().replace(/\s+/g, '');
    
    const standardNameMap: { [key: string]: string } = {
      'mathematics': 'Math',
      'math': 'Math',
      'maths': 'Math',
      'mathliteracy': 'MathLiteracy',
      'mathematicalliteracy': 'MathLiteracy',
      'english': 'English',
      'englishfal': 'EnglishFAL',
      'englishfirstadditionallanguage': 'EnglishFAL',
      'physics': 'Physics',
      'physicalsciences': 'Physics',
      'biology': 'Biology',
      'cat': 'CAT',
      'computerapplicationstechnology': 'CAT',
      'it': 'IT',
      'informationtechnology': 'IT',
      'lifeorientation': 'LifeOrientation'
    };

    return standardNameMap[nameLower] || subjectName;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'met': return '✅';
      case 'close': return '⚠️';
      case 'needs-work': return '❌';
      default: return '📊';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'met': return 'Requirement Met!';
      case 'close': return 'Almost There';
      case 'needs-work': return 'Needs Improvement';
      default: return '';
    }
  }

  getProgressColor(progress: number, status: string): string {
    if (status === 'met') return 'var(--status-success)';
    if (status === 'close') return 'var(--status-warning)';
    return 'var(--status-danger)';
  }

  getMetCount(): number {
    return this.subjectProgress.filter(s => s.status === 'met').length;
  }

  getCloseCount(): number {
    return this.subjectProgress.filter(s => s.status === 'close').length;
  }

  getNeedsWorkCount(): number {
    return this.subjectProgress.filter(s => s.status === 'needs-work').length;
  }
}

