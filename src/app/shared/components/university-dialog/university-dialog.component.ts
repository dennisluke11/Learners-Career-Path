import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Career, QualificationLevel } from '../../models/career.model';
import { formatQualificationLevel } from '../../models/qualification-frameworks';
import { Grades } from '../../models/grades.model';
import { EligibilityService } from '../../../features/eligibility/services/eligibility.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

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
  nqfLevel?: number; // Deprecated, use frameworkLevel
  frameworkName?: string;
  frameworkLevel?: string | number;
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
  showQualificationLevels: boolean = true;

  constructor(
    private eligibilityService: EligibilityService,
    private analyticsService: AnalyticsService
  ) {
    if (window.innerWidth <= 400) {
      this.showQualificationLevels = false;
    }
  }

  async ngOnInit() {
    this.analyticsService.trackSectionView('university_dialog', {
      componentName: 'UniversityDialogComponent',
      country: this.countryCode,
      career: this.career?.name
    });
    
    this.analyticsService.trackConversion('university_research_started', undefined, {
      componentName: 'UniversityDialogComponent',
      country: this.countryCode,
      career: this.career?.name,
      userJourneyStage: 'university_research'
    });
    
    await this.calculateEligibility();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (this.isOpen) {
      await this.calculateEligibility();
    }
  }

  private normalizeInstitutionName(name: string): string {
    if (!name) return '';
    
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,\-]/g, '')
      .replace(/\buniversity\b/g, 'univ')
      .replace(/\bof\b/g, 'of')
      .replace(/\bthe\b/g, '')
      .trim();
  }

  calculateAps(grades: Grades): number {
    if (!grades) return 0;
    
    let totalPoints = 0;
    let subjectCount = 0;
    
    const gradeEntries = Object.entries(grades)
      .filter(([subject, _]) => subject.toLowerCase() !== 'lifeorientation' && subject.toLowerCase() !== 'life orientation')
      .map(([subject, grade]) => ({ subject, grade: grade || 0 }))
      .sort((a, b) => b.grade - a.grade)
      .slice(0, 6);
    
    for (const { grade } of gradeEntries) {
      totalPoints += this.gradeToApsPoints(grade);
      subjectCount++;
    }
    
    const loGrade = grades['LifeOrientation'] || grades['Life Orientation'] || 0;
    if (loGrade > 0) {
      totalPoints += Math.min(this.gradeToApsPoints(loGrade), 6);
    }
    
    return totalPoints;
  }

  gradeToApsPoints(percentage: number): number {
    if (percentage >= 80) return 7;
    if (percentage >= 70) return 6;
    if (percentage >= 60) return 5;
    if (percentage >= 50) return 4;
    if (percentage >= 40) return 3;
    if (percentage >= 30) return 2;
    return 1;
  }

  async checkSubjectRequirements(qualLevel: QualificationLevel): Promise<'qualified' | 'close' | 'not-eligible'> {
    if (!this.grades || !qualLevel.minGrades) return 'not-eligible';
    
    const tempCareer: Career = {
      name: this.career?.name || '',
      minGrades: qualLevel.minGrades
    };
    
    const result = await this.eligibilityService.checkEligibility(this.grades, tempCareer, this.countryCode);
    
    if (result.status === 'qualified') return 'qualified';
    if (result.status === 'close') return 'close';
    return 'not-eligible';
  }

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
    
    // Track seen levels to avoid duplicates
    const seenLevels = new Set<string>();
    
    for (const level of qualLevels) {
      // Create unique key from level, nqfLevel, and frameworkLevel to identify duplicates
      const levelKey = `${level.level}-${level.nqfLevel || ''}-${level.frameworkLevel || ''}-${level.frameworkName || ''}`;
      
      // Skip if we've already processed this level
      if (seenLevels.has(levelKey)) {
        continue;
      }
      seenLevels.add(levelKey);
      
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
        nqfLevel: level.nqfLevel, // Keep for backward compatibility
        frameworkName: level.frameworkName,
        frameworkLevel: level.frameworkLevel,
        status: overallStatus,
        apsStatus,
        subjectStatus,
        overallStatus
      });
    }
    
    // Final deduplication pass: remove any remaining duplicates based on level and framework display
    const finalDeduplicated: QualificationLevelStatus[] = [];
    const finalSeenKeys = new Set<string>();
    
    for (const status of this.qualificationLevelsStatus) {
      const displayKey = `${status.level}-${status.frameworkLevel || status.nqfLevel || ''}-${status.frameworkName || ''}`;
      if (!finalSeenKeys.has(displayKey)) {
        finalSeenKeys.add(displayKey);
        finalDeduplicated.push(status);
      }
    }
    
    this.qualificationLevelsStatus = finalDeduplicated;
    
    const levelOrder: { [key: string]: number } = { 'Degree': 0, 'BTech': 1, 'Diploma': 2, 'Certificate': 3 };
    this.qualificationLevelsStatus.sort((a, b) => {
      const orderA = levelOrder[a.level] ?? 999;
      const orderB = levelOrder[b.level] ?? 999;
      return orderA - orderB;
    });
    
    if (this.qualificationLevelsStatus.length >= 3) {
      this.showQualificationLevels = false;
    }
  }

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
    
    // Track seen institutions to avoid duplicates
    const seenInstitutions = new Set<string>();
    const seenInstitutionsOriginal = new Map<string, string>(); // Map normalized -> original for debugging
    
    for (const source of sourceArray) {
      if (!source.institution) continue;
      
      // Normalize institution name for comparison
      // Remove extra spaces, convert to lowercase, remove common punctuation variations
      const normalizedInstitution = this.normalizeInstitutionName(source.institution);
      
      // Skip if we've already processed this institution
      if (seenInstitutions.has(normalizedInstitution)) {
        // Log duplicate for debugging (can be removed in production)
        console.debug(`Skipping duplicate university: "${source.institution}" (normalized: "${normalizedInstitution}")`);
        continue;
      }
      
      seenInstitutions.add(normalizedInstitution);
      seenInstitutionsOriginal.set(normalizedInstitution, source.institution);
      
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
    
    // Additional deduplication pass to catch any edge cases
    // This ensures no duplicates slip through
    // Use a Map to keep track of best version (lowest APS requirement)
    const finalUniversitiesMap = new Map<string, typeof this.universities[0]>();
    
    for (const uni of this.universities) {
      // Use the same normalization function for consistency
      const normalized = this.normalizeInstitutionName(uni.institution);
      
      const existing = finalUniversitiesMap.get(normalized);
      
      if (!existing) {
        // First time seeing this university
        finalUniversitiesMap.set(normalized, uni);
      } else {
        // Duplicate found - keep the one with lower APS requirement (more accessible)
        const existingAps = existing.apsRequired ?? 999;
        const currentAps = uni.apsRequired ?? 999;
        
        if (currentAps < existingAps) {
          // Current university has lower APS, replace it
          finalUniversitiesMap.set(normalized, uni);
          console.debug(`Replacing duplicate "${existing.institution}" (APS ${existingAps}) with "${uni.institution}" (APS ${currentAps})`);
        } else {
          console.debug(`Skipping duplicate "${uni.institution}" (APS ${currentAps}) - keeping "${existing.institution}" (APS ${existingAps})`);
        }
      }
    }
    
    // Convert map back to array
    this.universities = Array.from(finalUniversitiesMap.values());
    
    // Sort: qualified first, then close, then not-eligible
    // Secondary sort by APS required (lower is better for user)
    this.universities.sort((a, b) => {
      const statusOrder: { [key: string]: number } = { 'qualified': 0, 'close': 1, 'not-eligible': 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      // If same status, sort by APS required (ascending)
      // Handle undefined APS values (treat as 0 for sorting)
      const apsA = a.apsRequired ?? 0;
      const apsB = b.apsRequired ?? 0;
      return apsA - apsB;
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
      // Track external link click (potential affiliate revenue)
      // Note: This will be tracked as affiliate when you set up university partnerships
      this.analyticsService.trackExternalLinkClick(
        url,
        'University Website',
        false, // Set to true when you have affiliate partnerships
        undefined, // Affiliate program name
        undefined, // Conversion value
        {
          componentName: 'UniversityDialogComponent',
          university: this.career?.name,
          country: this.countryCode
        }
      );
      
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  formatQualificationDisplay(level: QualificationLevel): string {
    return formatQualificationLevel(
      level.level,
      this.countryCode,
      level.nqfLevel,
      level.frameworkName,
      level.frameworkLevel
    );
  }

  getFrameworkDisplay(levelStatus: QualificationLevelStatus): string | null {
    // For South Africa, show NQF
    if (this.countryCode === 'ZA') {
      if (levelStatus.nqfLevel) {
        return `NQF ${levelStatus.nqfLevel}`;
      }
      if (levelStatus.frameworkLevel) {
        return `NQF ${levelStatus.frameworkLevel}`;
      }
      return null;
    }

    // For other countries, show their framework
    if (levelStatus.frameworkName && levelStatus.frameworkLevel) {
      return `${levelStatus.frameworkName} ${levelStatus.frameworkLevel}`;
    }

    return null;
  }
}

