import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Career, QualificationLevel, RequirementSource } from '../../models/career.model';
import { Grades } from '../../models/grades.model';

export interface UniversityEligibility {
  institution: string;
  url?: string;
  apsRequired?: number;
  userAps: number;
  status: 'qualified' | 'close' | 'not-eligible';
  apsDifference: number;
  notes?: string;
  verifiedDate?: string;
}

@Component({
  selector: 'app-university-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './university-dialog.component.html',
  styleUrls: ['./university-dialog.component.scss']
})
export class UniversityDialogComponent implements OnInit {
  @Input() career: Career | null = null;
  @Input() qualificationLevel: QualificationLevel | null = null;
  @Input() grades: Grades | null = null;
  @Input() countryCode: string = 'ZA';
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();

  universities: UniversityEligibility[] = [];
  userAps: number = 0;

  ngOnInit() {
    this.calculateEligibility();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.calculateEligibility();
    }
  }

  /**
   * Calculate APS (Admission Point Score) from grades
   * South African APS System:
   * 80-100% = 7 points
   * 70-79%  = 6 points
   * 60-69%  = 5 points
   * 50-59%  = 4 points
   * 40-49%  = 3 points
   * 30-39%  = 2 points
   * 0-29%   = 1 point
   */
  calculateAps(grades: Grades): number {
    if (!grades) return 0;
    
    let totalPoints = 0;
    let subjectCount = 0;
    
    // Get top 6 subjects (excluding Life Orientation which counts differently)
    const gradeEntries = Object.entries(grades)
      .filter(([subject, _]) => subject.toLowerCase() !== 'lifeorientation' && subject.toLowerCase() !== 'life orientation')
      .map(([subject, grade]) => ({ subject, grade: grade || 0 }))
      .sort((a, b) => b.grade - a.grade)
      .slice(0, 6);
    
    for (const { grade } of gradeEntries) {
      totalPoints += this.gradeToApsPoints(grade);
      subjectCount++;
    }
    
    // Add Life Orientation (capped at different value)
    const loGrade = grades['LifeOrientation'] || grades['Life Orientation'] || 0;
    if (loGrade > 0) {
      // Life Orientation is typically weighted less or capped
      totalPoints += Math.min(this.gradeToApsPoints(loGrade), 6);
    }
    
    return totalPoints;
  }

  /**
   * Convert percentage grade to APS points
   */
  gradeToApsPoints(percentage: number): number {
    if (percentage >= 80) return 7;
    if (percentage >= 70) return 6;
    if (percentage >= 60) return 5;
    if (percentage >= 50) return 4;
    if (percentage >= 40) return 3;
    if (percentage >= 30) return 2;
    return 1;
  }

  /**
   * Calculate eligibility for each university
   */
  calculateEligibility() {
    this.universities = [];
    
    if (!this.qualificationLevel || !this.grades) return;
    
    this.userAps = this.calculateAps(this.grades);
    
    const sources = this.qualificationLevel.sources;
    if (!sources) {
      // No university sources available
      return;
    }
    
    // Handle both single source (legacy) and array of sources
    const sourceArray: RequirementSource[] = Array.isArray(sources) ? sources : [sources];
    
    for (const source of sourceArray) {
      if (!source.institution) continue;
      
      const apsRequired = source.aps || this.qualificationLevel.aps || 0;
      const apsDifference = this.userAps - apsRequired;
      
      let status: 'qualified' | 'close' | 'not-eligible';
      if (apsDifference >= 0) {
        status = 'qualified';
      } else if (apsDifference >= -3) {
        status = 'close';
      } else {
        status = 'not-eligible';
      }
      
      this.universities.push({
        institution: source.institution,
        url: source.url,
        apsRequired,
        userAps: this.userAps,
        status,
        apsDifference,
        notes: source.notes,
        verifiedDate: source.verifiedDate
      });
    }
    
    // Sort: qualified first, then close, then not-eligible
    this.universities.sort((a, b) => {
      const statusOrder = { 'qualified': 0, 'close': 1, 'not-eligible': 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'qualified': return '✅';
      case 'close': return '⚠️';
      case 'not-eligible': return '❌';
      default: return '❓';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'qualified': return 'QUALIFIED';
      case 'close': return 'CLOSE';
      case 'not-eligible': return 'NOT ELIGIBLE';
      default: return 'UNKNOWN';
    }
  }

  getApsDifferenceText(diff: number): string {
    if (diff > 0) return `${diff} points above`;
    if (diff < 0) return `${Math.abs(diff)} points short`;
    return 'Exact match';
  }

  onClose() {
    this.closeDialog.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.onClose();
    }
  }

  openUniversityWebsite(url: string | undefined) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

