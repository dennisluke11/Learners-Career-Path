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

  subjectProgress: SubjectProgress[] = [];
  overallProgress: number = 0;

  constructor(private improvementService: ImprovementService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.grades && this.career) {
      this.calculateProgress();
    } else {
      this.subjectProgress = [];
      this.overallProgress = 0;
    }
  }

  private calculateProgress() {
    if (!this.grades || !this.career) return;

    const improvements = this.improvementService.calculateImprovements(this.grades, this.career);
    const allSubjects = new Set<string>();
    Object.keys(this.grades).forEach(subj => allSubjects.add(subj));
    Object.keys(this.career.minGrades).forEach(subj => allSubjects.add(subj));

    this.subjectProgress = Array.from(allSubjects)
      .filter(subject => this.career!.minGrades[subject]) // Only show subjects with requirements
      .map(subject => {
        const current = this.grades![subject] || 0;
        const required = this.career!.minGrades[subject];
        const progress = (current / required) * 100;
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
          progress: Math.min(progress, 100), // Cap at 100% for display
          status,
          improvementNeeded
        };
      })
      .sort((a, b) => a.progress - b.progress); // Sort by progress (lowest first)

    // Calculate overall progress
    if (this.subjectProgress.length > 0) {
      const totalProgress = this.subjectProgress.reduce((sum, sp) => sum + sp.progress, 0);
      this.overallProgress = totalProgress / this.subjectProgress.length;
    }
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
    if (status === 'met') return 'var(--status-success)'; // Green
    if (status === 'close') return 'var(--status-warning)'; // Orange
    return 'var(--status-danger)'; // Red
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

