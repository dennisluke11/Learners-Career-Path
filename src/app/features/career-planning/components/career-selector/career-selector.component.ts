import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CareersService } from '../../services/careers.service';
import { Career, QualificationLevel } from '../../../../shared/models/career.model';
import { Country } from '../../../../shared/models/country.model';
import { Grades } from '../../../../shared/models/grades.model';
import { UniversityDialogComponent } from '../../../../shared/components/university-dialog/university-dialog.component';
import { SubjectsService } from '../../../../shared/services/subjects.service';
import { EitherOrGroup } from '../../../../shared/models/subject.model';
import { formatQualificationLevel } from '../../../../shared/models/qualification-frameworks';

@Component({
  selector: 'app-career-selector',
  templateUrl: './career-selector.component.html',
  styleUrls: ['./career-selector.component.scss']
})
export class CareerSelectorComponent implements OnChanges {
  @Input() selectedCareer: Career | null = null;
  @Input() selectedCountry: Country | null = null;
  @Input() grades: Grades | null = null;
  @Output() careerChange = new EventEmitter<Career>();

  careers: Career[] = [];
  loading = false;
  error: string | null = null;
  displayRequirements: { [subject: string]: number } = {};
  
  // University dialog state
  showUniversityDialog = false;
  selectedQualificationLevel: QualificationLevel | null = null;
  hasEitherOrGroups = false;

  getObjectKeys = Object.keys;
  isArray = Array.isArray;
  private eitherOrGroupsCache: { [countryCode: string]: EitherOrGroup[] } = {};

  /**
   * Check if displayRequirements contains any either/or subjects
   * Helper method for template (can't use arrow functions in Angular templates)
   */
  hasEitherOrSubjects(): boolean {
    if (!this.displayRequirements || !this.hasEitherOrGroups) {
      return false;
    }
    const keys = Object.keys(this.displayRequirements);
    return keys.some(key => key.includes(' OR '));
  }
  
  hasUniversitySources(level: any): boolean {
    if (!level || !level.sources) return false;
    if (Array.isArray(level.sources)) {
      return level.sources.length > 0 && level.sources.some((s: any) => s && s.institution);
    }
    return !!level.sources.institution;
  }
  
  displayQualificationLevels: Array<{
    level: string;
    nqfLevel?: number;
    frameworkName?: string;
    frameworkLevel?: string | number;
    minGrades: { [subject: string]: number };
    aps?: number;
    notes?: string;
    sources?: {
      url?: string;
      institution?: string;
      verifiedDate?: string;
      notes?: string;
    };
  }> = [];

  constructor(
    private careersService: CareersService,
    private subjectsService: SubjectsService
  ) {
    this.loadCareers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCountry']) {
      this.loadCareers();
    }
  }

  private async loadCareers() {
    this.loading = true;
    this.error = null;
    
    try {
      let allCareers: Career[];
      
      if (this.selectedCountry) {
        allCareers = await this.careersService.getCareersForCountry(this.selectedCountry.code);
      } else {
        allCareers = await this.careersService.getCareers();
      }
      
      this.careers = allCareers.sort((a, b) => a.name.localeCompare(b.name));
      
      if (this.careers.length === 0) {
        this.error = 'No careers found. Please check your database connection.';
      }
    } catch (error) {
      this.error = 'Failed to load careers. Please try again.';
      this.careers = [];
    } finally {
      this.loading = false;
    }
  }

  async onSelectCareer(event: Event) {
    const target = event.target as HTMLSelectElement;
    const careerName = target.value;
    
    if (!careerName) {
      this.careerChange.emit(null as any);
      return;
    }
    
    try {
      let career: Career | null = null;
      
      if (this.selectedCountry) {
        career = await this.careersService.getCareerForCountry(careerName, this.selectedCountry.code);
      } else {
        career = this.careers.find(c => c.name === careerName) || null;
      }
      
      if (career) {
        if (!career.minGrades || Object.keys(career.minGrades).length === 0) {
          if (career.qualificationLevels && this.selectedCountry) {
            const qualLevels = career.qualificationLevels[this.selectedCountry.code];
            if (qualLevels && qualLevels.length > 0) {
              career.minGrades = qualLevels[0].minGrades || {};
            }
          }
        }
        
        this.displayRequirements = await this.processRequirementsForDisplay(career.minGrades || {});
        
        // Check if there are either/or groups for this country
        const countryCode = this.selectedCountry?.code || 'ZA';
        let eitherOrGroups = this.eitherOrGroupsCache[countryCode];
        if (!eitherOrGroups) {
          try {
            eitherOrGroups = await this.subjectsService.getEitherOrGroups(countryCode);
            this.eitherOrGroupsCache[countryCode] = eitherOrGroups;
          } catch (error) {
            eitherOrGroups = [];
          }
        }
        this.hasEitherOrGroups = eitherOrGroups.length > 0;
        
        if (career.qualificationLevels && this.selectedCountry) {
          const qualLevels = career.qualificationLevels[this.selectedCountry.code] || [];
          const processedLevels = await Promise.all(
            qualLevels.map(async level => ({
              level: level.level,
              nqfLevel: level.nqfLevel,
              frameworkName: level.frameworkName,
              frameworkLevel: level.frameworkLevel,
              minGrades: await this.processRequirementsForDisplay(level.minGrades || {}),
              aps: level.aps,
              notes: level.notes,
              sources: level.sources // Preserve sources for university dialog
            }))
          );
          this.displayQualificationLevels = processedLevels;
        } else {
          this.displayQualificationLevels = [];
        }
        
        this.careerChange.emit(career);
      }
    } catch (error) {
      const career = this.careers.find(c => c.name === careerName);
      if (career) {
        this.careerChange.emit(career);
      }
    }
  }

  private async processRequirementsForDisplay(requirements: { [subject: string]: number }): Promise<{ [subject: string]: number }> {
    if (!this.selectedCountry) {
      return requirements;
    }

    const countryCode = this.selectedCountry.code || 'ZA';
    
    // Get either/or groups for this country (backend-driven)
    let eitherOrGroups = this.eitherOrGroupsCache[countryCode];
    if (!eitherOrGroups) {
      try {
        eitherOrGroups = await this.subjectsService.getEitherOrGroups(countryCode);
        this.eitherOrGroupsCache[countryCode] = eitherOrGroups;
      } catch (error) {
        console.warn(`[CareerSelectorComponent] Could not fetch either/or groups for ${countryCode}:`, error);
        eitherOrGroups = [];
      }
    }

    const processed: { [subject: string]: number } = {};
    const processedSubjects = new Set<string>();

    // Process either/or groups first
    for (const group of eitherOrGroups) {
      const groupSubjectsInRequirements = group.subjects.filter(subj => requirements[subj] !== undefined);
      
      if (groupSubjectsInRequirements.length > 0) {
        // Calculate minimum required grade from the group
        const minRequired = Math.min(...groupSubjectsInRequirements.map(subj => requirements[subj]));
        processed[group.description || group.subjects.join(' OR ')] = minRequired;
        
        // Mark all subjects in group as processed
        group.subjects.forEach(subj => processedSubjects.add(subj));
      }
    }

    // Add remaining subjects (not in either/or groups)
    for (const subject in requirements) {
      if (!processedSubjects.has(subject)) {
        processed[subject] = requirements[subject];
      }
    }

    return processed;
  }

  openUniversityDialog(level: any) {
    // Convert display level to QualificationLevel format
    this.selectedQualificationLevel = {
      level: level.level as 'Degree' | 'BTech' | 'Diploma' | 'Certificate',
      nqfLevel: level.nqfLevel,
      minGrades: level.minGrades,
      aps: level.aps,
      notes: level.notes,
      sources: level.sources
    };
    this.showUniversityDialog = true;
  }

  closeUniversityDialog() {
    this.showUniversityDialog = false;
    this.selectedQualificationLevel = null;
  }

  formatQualificationLevel(level: { level: string; nqfLevel?: number; frameworkName?: string; frameworkLevel?: string | number }): string {
    const countryCode = this.selectedCountry?.code || 'ZA';
    return formatQualificationLevel(
      level.level,
      countryCode,
      level.nqfLevel,
      level.frameworkName,
      level.frameworkLevel
    );
  }
}

