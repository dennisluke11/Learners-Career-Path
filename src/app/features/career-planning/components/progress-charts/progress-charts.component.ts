import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Grades } from '../../../../shared/models/grades.model';
import { Career } from '../../../../shared/models/career.model';
import { ImprovementService } from '../../services/improvement.service';
import { SubjectsService } from '../../../../shared/services/subjects.service';
import { EitherOrGroup } from '../../../../shared/models/subject.model';

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
  private eitherOrGroups: EitherOrGroup[] = [];

  constructor(
    private improvementService: ImprovementService,
    private subjectsService: SubjectsService
  ) {}

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
    
    // Load either/or groups for backend-driven processing
    try {
      this.eitherOrGroups = await this.subjectsService.getEitherOrGroups(countryCode);
    } catch (error) {
      this.eitherOrGroups = [];
    }
    
    const improvements = await this.improvementService.calculateImprovements(this.grades, this.career, countryCode);
    const requirements = this.career.minGrades || {};
    const processedRequirements = await this.processRequirementsForDisplay(requirements, countryCode);
    
    this.subjectProgress = Object.keys(processedRequirements).map(subject => {
      const required = processedRequirements[subject];
      
      let current = 0;
      if (subject.includes(' OR ')) {
        // Find the either/or group that matches this subject description
        const matchingGroup = this.eitherOrGroups.find(group => 
          group.description === subject || group.subjects?.some(s => subject.includes(s))
        );
        
        if (matchingGroup && matchingGroup.subjects) {
          // Get the maximum grade from all subjects in the either/or group
          current = Math.max(...matchingGroup.subjects.map(s => this.getGradeForSubject(s, countryCode)));
        } else {
          // Fallback: try to extract subject names from the "OR" description
          const subjectNames = subject.split(' OR ').map(s => s.trim());
          current = Math.max(...subjectNames.map(s => this.getGradeForSubject(s, countryCode)));
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

  private async processRequirementsForDisplay(requirements: { [subject: string]: number }, countryCode: string): Promise<{ [subject: string]: number }> {
    // If no either/or groups, return requirements as-is
    if (!this.eitherOrGroups || this.eitherOrGroups.length === 0) {
      return requirements;
    }

    const processed: { [subject: string]: number } = {};
    const processedSubjects = new Set<string>();

    // Process each either/or group
    for (const group of this.eitherOrGroups) {
      if (!group.subjects || group.subjects.length < 2) continue;

      // Check if all subjects in the group are in requirements
      const groupSubjectsInRequirements = group.subjects.filter(subj => requirements[subj] !== undefined);
      
      if (groupSubjectsInRequirements.length > 0) {
        // Calculate minimum required grade for the group
        const minRequired = Math.min(...groupSubjectsInRequirements.map(subj => requirements[subj]));
        
        // Use group description or create a description from subject names
        const displayName = group.description || group.subjects.join(' OR ');
        processed[displayName] = minRequired;
        
        // Mark all subjects in this group as processed
        group.subjects.forEach(subj => processedSubjects.add(subj));
      }
    }

    // Add remaining subjects that aren't in any either/or group
    for (const subject in requirements) {
      if (!processedSubjects.has(subject)) {
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

