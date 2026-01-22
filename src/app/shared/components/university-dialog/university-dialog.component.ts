import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Career, QualificationLevel } from '../../models/career.model';
import { Grades } from '../../models/grades.model';
import { EligibilityService } from '../../../features/eligibility/services/eligibility.service';

export interface UniversityEligibility {
  institution: string;
  url?: string;
  apsRequired?: number;
  userAps: number;
  status: 'qualified' | 'close' | 'not-eligible';
  apsDifference: number;
  notes?: string;
  verifiedDate?: string;
  qualificationLevel?: QualificationLevel;
  levelStatus?: 'qualified' | 'close' | 'not-eligible';
}

export interface QualificationLevelStatus {
  level: 'Degree' | 'BTech' | 'Diploma' | 'Certificate';
  nqfLevel?: number;
  status: 'qualified' | 'close' | 'not-eligible';
  apsStatus: 'qualified' | 'close' | 'not-eligible';
  subjectStatus: 'qualified' | 'close' | 'not-eligible';
  overallStatus: 'qualified' | 'close' | 'not-eligible';
}

@Component({
  selector: 'app-university-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './university-dialog.component.html',
  styleUrls: ['./university-dialog.component.scss']
})
export class UniversityDialogComponent implements OnInit, OnChanges {
  @Input() career: Career | null = null;
  @Input() qualificationLevel: QualificationLevel | null = null;
  @Input() grades: Grades | null = null;
  @Input() countryCode: string = 'ZA';
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();

  universities: UniversityEligibility[] = [];
  userAps: number = 0;
  qualificationLevelsStatus: QualificationLevelStatus[] = [];

  constructor(private eligibilityService: EligibilityService) {}

  async ngOnInit() {
    await this.calculateEligibility();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (this.isOpen) {
      await this.calculateEligibility();
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
   * Check if learner qualifies for a qualification level based on subject requirements
   */
  async checkSubjectRequirements(qualLevel: QualificationLevel): Promise<'qualified' | 'close' | 'not-eligible'> {
    if (!this.grades || !qualLevel.minGrades) return 'not-eligible';
    
    // Create a temporary career object to use with eligibility service
    const tempCareer: Career = {
      name: this.career?.name || '',
      minGrades: qualLevel.minGrades
    };
    
    const result = await this.eligibilityService.checkEligibility(this.grades, tempCareer, this.countryCode);
    
    if (result.status === 'qualified') return 'qualified';
    if (result.status === 'close') return 'close';
    return 'not-eligible';
  }

  /**
   * Check APS requirements for a qualification level
   */
  checkApsRequirements(apsRequired: number): 'qualified' | 'close' | 'not-eligible' {
    const apsDifference = this.userAps - apsRequired;
    if (apsDifference >= 0) return 'qualified';
    if (apsDifference >= -3) return 'close';
    return 'not-eligible';
  }

  /**
   * Calculate qualification level statuses for all levels
   */
  async calculateQualificationLevelsStatus() {
    this.qualificationLevelsStatus = [];
    
    if (!this.career || !this.grades) return;
    
    const qualLevels = this.career.qualificationLevels?.[this.countryCode] || [];
    
    for (const level of qualLevels) {
      const subjectStatus = await this.checkSubjectRequirements(level);
      const apsRequired = level.aps || 0;
      const apsStatus = apsRequired > 0 ? this.checkApsRequirements(apsRequired) : 'qualified';
      
      // Overall status: must qualify for both subjects AND APS
      let overallStatus: 'qualified' | 'close' | 'not-eligible';
      if (subjectStatus === 'qualified' && apsStatus === 'qualified') {
        overallStatus = 'qualified';
      } else if (subjectStatus === 'qualified' || apsStatus === 'qualified' || 
                 subjectStatus === 'close' || apsStatus === 'close') {
        overallStatus = 'close';
      } else {
        overallStatus = 'not-eligible';
      }
      
      this.qualificationLevelsStatus.push({
        level: level.level,
        nqfLevel: level.nqfLevel,
        status: overallStatus,
        apsStatus,
        subjectStatus,
        overallStatus
      });
    }
    
    // Sort by level priority: Degree, BTech, Diploma, Certificate
    const levelOrder = { 'Degree': 0, 'BTech': 1, 'Diploma': 2, 'Certificate': 3 };
    this.qualificationLevelsStatus.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
  }

  /**
   * Calculate eligibility for each university
   */
  async calculateEligibility() {
    this.universities = [];
    this.qualificationLevelsStatus = [];
    
    if (!this.qualificationLevel || !this.grades) return;
    
    this.userAps = this.calculateAps(this.grades);
    
    // Calculate qualification levels status
    await this.calculateQualificationLevelsStatus();
    
    const sources = this.qualificationLevel.sources;
    if (!sources) {
      // No university sources available
      return;
    }
    
    // Handle both single source (legacy) and array of sources
    const sourceArray: Array<{
      url?: string;
      institution?: string;
      verifiedDate?: string;
      notes?: string;
      aps?: number;
    }> = Array.isArray(sources) ? sources : [sources];
    
    for (const source of sourceArray) {
      if (!source.institution) continue;
      
      const apsRequired = source.aps || this.qualificationLevel.aps || 0;
      const apsDifference = this.userAps - apsRequired;
      
      // Check both APS and subject requirements
      const apsStatus = this.checkApsRequirements(apsRequired);
      const subjectStatus = await this.checkSubjectRequirements(this.qualificationLevel);
      
      // Overall status: must qualify for both subjects AND APS
      let status: 'qualified' | 'close' | 'not-eligible';
      if (apsStatus === 'qualified' && subjectStatus === 'qualified') {
        status = 'qualified';
      } else if (apsStatus === 'qualified' || subjectStatus === 'qualified' || 
                 apsStatus === 'close' || subjectStatus === 'close') {
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
        verifiedDate: source.verifiedDate,
        qualificationLevel: this.qualificationLevel,
        levelStatus: status
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

