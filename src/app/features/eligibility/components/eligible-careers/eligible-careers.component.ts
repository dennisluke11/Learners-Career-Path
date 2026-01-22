import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Grades } from '../../../../shared/models/grades.model';
import { Career, QualificationLevel } from '../../../../shared/models/career.model';
import { Country } from '../../../../shared/models/country.model';
import { EligibilityService, EligibleCareer } from '../../services/eligibility.service';
import { CareersService } from '../../../career-planning/services/careers.service';
import { CareerMarketService, CareerMarketData } from '../../../../core/services/career-market.service';
import { ImprovementService } from '../../../career-planning/services/improvement.service';
import { SubjectsService } from '../../../../shared/services/subjects.service';
import { EitherOrGroup } from '../../../../shared/models/subject.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-eligible-careers',
  templateUrl: './eligible-careers.component.html',
  styleUrls: ['./eligible-careers.component.scss']
})
export class EligibleCareersComponent implements OnChanges, OnDestroy {
  @Input() grades: Grades | null = null;
  @Input() selectedCountry: Country | null = null;

  eligibleCareers: EligibleCareer[] = [];
  qualifiedCareers: EligibleCareer[] = [];
  closeCareers: EligibleCareer[] = [];
  closeCareersByCategory: { [category: string]: EligibleCareer[] } = {};
  marketData: { [careerName: string]: CareerMarketData } = {};
  loading = false;
  loadingMarketData: { [careerName: string]: boolean } = {};
  Object = Object;
  private filteredSubjectsCache: { [key: string]: string[] } = {};
  showUniversityDialog = false;
  selectedCareerForDialog: Career | null = null;
  selectedQualificationLevel: QualificationLevel | null = null;

  private eitherOrGroupsCache: { [countryCode: string]: EitherOrGroup[] } = {};
  private destroy$ = new Subject<void>();

  constructor(
    private eligibilityService: EligibilityService,
    private careersService: CareersService,
    private marketService: CareerMarketService,
    private improvementService: ImprovementService,
    private subjectsService: SubjectsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['grades'] || changes['selectedCountry']) {
      await this.updateEligibleCareers();
    }
  }

  private async updateEligibleCareers() {
    if (!this.grades || Object.keys(this.grades).length === 0) {
      this.eligibleCareers = [];
      this.qualifiedCareers = [];
      this.closeCareers = [];
      return;
    }

    this.loading = true;

    try {
      let careers: Career[];
      if (this.selectedCountry) {
        careers = await this.careersService.getCareersForCountry(this.selectedCountry.code);
      } else {
        careers = await this.careersService.getCareers();
      }

      this.eligibleCareers = await this.eligibilityService.getEligibleCareers(
        this.grades, 
        careers,
        this.selectedCountry?.code
      );
      
      this.qualifiedCareers = this.eligibleCareers.filter(ec => ec.status === 'qualified');
      this.closeCareers = this.eligibleCareers.filter(ec => ec.status === 'close');
      
      await this.preFilterSubjects();
      this.groupCloseCareersByCategory();
      this.loadMarketDataForCareers();
    } catch (error) {
      console.error('Error updating eligible careers:', error);
      this.eligibleCareers = [];
      this.qualifiedCareers = [];
      this.closeCareers = [];
    } finally {
      this.loading = false;
    }
  }

  private loadMarketDataForCareers() {
    this.qualifiedCareers.forEach(eligible => {
      this.loadMarketData(eligible.career.name);
    });
    this.closeCareers.forEach(eligible => {
      this.loadMarketData(eligible.career.name);
    });
  }

  private loadMarketData(careerName: string) {
    if (this.loadingMarketData[careerName] || this.marketData[careerName]) {
      return;
    }

    this.loadingMarketData[careerName] = true;

    this.marketService.getMarketData(
      careerName,
      this.selectedCountry?.code
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.marketData[careerName] = data;
        this.loadingMarketData[careerName] = false;
      },
      error: (error) => {
        this.loadingMarketData[careerName] = false;
        this.marketData[careerName] = {
          careerName,
          jobOpenings: [],
          salaryRange: null,
          marketTrend: 'unknown',
          lastUpdated: new Date(),
          loading: false,
          error: true
        };
      }
    });
  }

  getMarketData(careerName: string): CareerMarketData | null {
    return this.marketData[careerName] || null;
  }

  isMarketDataLoading(careerName: string): boolean {
    return this.loadingMarketData[careerName] || false;
  }

  formatSalaryRange(salaryRange: any): string {
    if (!salaryRange) return 'Not available';
    
    const min = this.formatCurrency(salaryRange.min, salaryRange.currency);
    const max = this.formatCurrency(salaryRange.max, salaryRange.currency);
    const period = salaryRange.period === 'yearly' ? 'per year' : 'per month';
    
    return `${min} - ${max} ${period}`;
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  getMarketTrendIcon(trend: string): string {
    switch (trend) {
      case 'growing':
        return '📈';
      case 'stable':
        return '➡️';
      case 'declining':
        return '📉';
      default:
        return '❓';
    }
  }

  getMarketTrendLabel(trend: string): string {
    switch (trend) {
      case 'growing':
        return 'Growing Market';
      case 'stable':
        return 'Stable Market';
      case 'declining':
        return 'Declining Market';
      default:
        return 'Market Trend Unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'qualified':
        return '✅';
      case 'close':
        return '🎯';
      case 'needs-improvement':
        return '📈';
      default:
        return '📋';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'qualified':
        return 'Fully Qualified';
      case 'close':
        return 'Close to Qualifying';
      case 'needs-improvement':
        return 'Needs Improvement';
      default:
        return 'Unknown';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'qualified':
        return 'status-qualified';
      case 'close':
        return 'status-close';
      case 'needs-improvement':
        return 'status-needs-improvement';
      default:
        return '';
    }
  }

  private groupCloseCareersByCategory() {
    this.closeCareersByCategory = {};
    
    this.closeCareers.forEach(eligible => {
      const category = eligible.career.category || 'Other';
      if (!this.closeCareersByCategory[category]) {
        this.closeCareersByCategory[category] = [];
      }
      this.closeCareersByCategory[category].push(eligible);
    });
    
    Object.keys(this.closeCareersByCategory).forEach(category => {
      this.closeCareersByCategory[category].sort((a, b) => b.matchScore - a.matchScore);
    });
  }

  getCategoryKeys(): string[] {
    return Object.keys(this.closeCareersByCategory).sort();
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Medicine': '🏥',
      'Engineering': '⚙️',
      'IT/Computer Science': '💻',
      'Business': '💼',
      'Law': '⚖️',
      'Education': '📚',
      'Science': '🔬',
      'Arts/Design': '🎨',
      'Social Sciences': '🤝',
      'Agriculture': '🌾',
      'Environmental Science': '🌍',
      'Aviation': '✈️',
      'Maritime': '🚢',
      'Food Science': '🍎',
      'Public Service': '🛡️',
      'Sports Science': '🏃'
    };
    return icons[category] || '📋';
  }

  private async getEitherOrGroups(countryCode: string): Promise<EitherOrGroup[]> {
    if (this.eitherOrGroupsCache[countryCode]) {
      return this.eitherOrGroupsCache[countryCode];
    }
    
    try {
      const groups = await this.subjectsService.getEitherOrGroups(countryCode);
      this.eitherOrGroupsCache[countryCode] = groups;
      return groups;
    } catch (error) {
      console.warn(`[EligibleCareersComponent] Could not fetch either/or groups for ${countryCode}:`, error);
      return [];
    }
  }

  private async preFilterSubjects(): Promise<void> {
    if (!this.grades || !this.selectedCountry) {
      this.filteredSubjectsCache = {};
      return;
    }

    const countryCode = this.selectedCountry.code || 'ZA';
    const eitherOrGroups = await this.getEitherOrGroups(countryCode);

    this.filteredSubjectsCache = {};

    for (const eligible of this.eligibleCareers) {
      const cacheKey = `${eligible.career.name}_close`;
      const missingKey = `${eligible.career.name}_missing`;

      this.filteredSubjectsCache[cacheKey] = eligible.closeSubjects.filter(subject => {
        const group = eitherOrGroups.find(g => 
          g.description === subject || 
          g.subjects.join(' OR ') === subject ||
          g.subjects.join('/') === subject
        );
        
        if (group) {
          return group.subjects.some(subj => this.isSubjectEntered(subj, countryCode));
        }
        return this.isSubjectEntered(subject, countryCode);
      });

      this.filteredSubjectsCache[missingKey] = eligible.missingSubjects.filter(subject => {
        const group = eitherOrGroups.find(g => 
          g.description === subject || 
          g.subjects.join(' OR ') === subject ||
          g.subjects.join('/') === subject
        );
        
        if (group) {
          return group.subjects.some(subj => this.isSubjectEntered(subj, countryCode));
        }
        return this.isSubjectEntered(subject, countryCode);
      });
    }
  }

  getEnteredSubjects(subjects: string[], careerName: string, type: 'close' | 'missing'): string[] {
    const cacheKey = `${careerName}_${type}`;
    const filtered = this.filteredSubjectsCache[cacheKey] || subjects;
    
    if (!this.grades || !this.selectedCountry || Object.keys(this.grades).length === 0) {
      return [];
    }
    
    const countryCode = this.selectedCountry.code || 'ZA';
    return filtered.filter(subject => {
      if (this.grades!.hasOwnProperty(subject)) {
        const value = this.grades![subject];
        if (value !== undefined && value !== null) {
          return true;
        }
      }
      
      const normalized = this.normalizeSubjectName(subject, countryCode);
      if (this.grades!.hasOwnProperty(normalized)) {
        const value = this.grades![normalized];
        if (value !== undefined && value !== null) {
          return true;
        }
      }
      
      const subjectLower = subject.toLowerCase();
      const normalizedLower = normalized.toLowerCase();
      for (const key in this.grades) {
        if (!this.grades.hasOwnProperty(key)) continue;
        const value = this.grades[key];
        if (value === undefined || value === null) continue;
        
        if (key.toLowerCase() === subjectLower || key.toLowerCase() === normalizedLower) {
          return true;
        }
      }
      
      const eitherOrGroups = this.eitherOrGroupsCache[countryCode] || [];
      for (const group of eitherOrGroups) {
        if (group.subjects.includes(subject) || group.subjects.includes(normalized)) {
          for (const groupSubject of group.subjects) {
            if (this.grades!.hasOwnProperty(groupSubject)) {
              const value = this.grades![groupSubject];
              if (value !== undefined && value !== null) {
                return true;
              }
            }
          }
        }
      }
      
      return false;
      
      return false;
    });
  }

  getImprovementDetails(eligible: EligibleCareer, subject: string): { current: number; required: number; improvement: number } | null {
    if (!this.grades || !this.selectedCountry || Object.keys(this.grades).length === 0) {
      return null;
    }

    const countryCode = this.selectedCountry.code || 'ZA';
    const eitherOrGroups = this.eitherOrGroupsCache[countryCode] || [];
    const group = eitherOrGroups.find(g => 
      g.description === subject || 
      g.subjects.join(' OR ') === subject ||
      g.subjects.join('/') === subject
    );
    
    let keyExists = false;
    let actualGradeValue: number | null = null;
    let actualSubjectName = subject;
    
    if (group) {
      for (const groupSubject of group.subjects) {
        if (this.grades.hasOwnProperty(groupSubject)) {
          const value = this.grades[groupSubject];
          if (value !== undefined && value !== null) {
            keyExists = true;
            actualGradeValue = value;
            actualSubjectName = groupSubject;
            break;
          }
        }
      }
      
      if (!keyExists) {
        for (const groupSubject of group.subjects) {
          const normalized = this.normalizeSubjectName(groupSubject, countryCode);
          if (this.grades.hasOwnProperty(normalized)) {
            const value = this.grades[normalized];
            if (value !== undefined && value !== null) {
              keyExists = true;
              actualGradeValue = value;
              actualSubjectName = normalized;
              break;
            }
          }
        }
      }
      
      if (!keyExists || actualGradeValue === null || actualGradeValue === undefined) {
        return null;
      }
    } else {
      if (this.grades.hasOwnProperty(subject)) {
        const value = this.grades[subject];
        if (value !== undefined && value !== null) {
          keyExists = true;
          actualGradeValue = value;
        }
      }
      
      if (!keyExists) {
        const normalized = this.normalizeSubjectName(subject, countryCode);
        if (this.grades.hasOwnProperty(normalized)) {
          const value = this.grades[normalized];
          if (value !== undefined && value !== null) {
            keyExists = true;
            actualGradeValue = value;
            actualSubjectName = normalized;
          }
        }
        
        if (!keyExists) {
          const normalizedLower = normalized.toLowerCase();
          for (const gradeKey in this.grades) {
            if (!this.grades.hasOwnProperty(gradeKey)) continue;
            const value = this.grades[gradeKey];
            if (value === undefined || value === null) continue;
            
            if (gradeKey.toLowerCase() === normalizedLower || 
                gradeKey.toLowerCase() === subject.toLowerCase()) {
              keyExists = true;
              actualGradeValue = value;
              actualSubjectName = gradeKey;
              break;
            }
          }
        }
      }
    }
    
    if (!keyExists || actualGradeValue === null || actualGradeValue === undefined) {
      return null;
    }
    
    const current = typeof actualGradeValue === 'number' ? actualGradeValue : Number(actualGradeValue);
    if (isNaN(current) || current === null || current === undefined) {
      return null;
    }
    
    let required = 0;
    
    if (group) {
      const requirements = group.subjects
        .map(subj => eligible.career.minGrades[subj] || 0)
        .filter(req => req > 0);
      required = requirements.length > 0 ? Math.min(...requirements) : 0;
    } else {
      required = eligible.career.minGrades[actualSubjectName] || 0;
      
      if (required === 0) {
        required = eligible.career.minGrades[subject] || 0;
      }
      
      if (required === 0) {
        const normalized = this.normalizeSubjectName(subject, countryCode);
        required = eligible.career.minGrades[normalized] || 0;
      }
    }

    if (required === 0) {
      return null;
    }

    const improvement = Math.max(0, required - current);

    if (current === undefined || current === null || isNaN(current)) {
      return null;
    }

    return {
      current,
      required,
      improvement
    };
  }

  private isSubjectEntered(subjectName: string, countryCode: string): boolean {
    if (!this.grades || Object.keys(this.grades).length === 0) {
      return false;
    }

    if (subjectName.includes(' OR ') || subjectName.includes('/')) {
      const eitherOrGroups = this.eitherOrGroupsCache[countryCode] || [];
      for (const group of eitherOrGroups) {
        if (group.description === subjectName || group.subjects.join(' OR ') === subjectName) {
          return group.subjects.some(subj => this.isSubjectEntered(subj, countryCode));
        }
      }
    }

    if (this.grades.hasOwnProperty(subjectName) && this.grades[subjectName] !== undefined && this.grades[subjectName] !== null) {
      return true;
    }

    const normalized = this.normalizeSubjectName(subjectName, countryCode);
    if (this.grades.hasOwnProperty(normalized) && this.grades[normalized] !== undefined && this.grades[normalized] !== null) {
      return true;
    }

    const normalizedLower = normalized.toLowerCase();
    for (const gradeKey in this.grades) {
      if (!this.grades.hasOwnProperty(gradeKey)) continue;
      if (this.grades[gradeKey] === undefined || this.grades[gradeKey] === null) continue;
      
      const normalizedGradeKey = this.normalizeSubjectName(gradeKey, countryCode);
      if (normalizedGradeKey.toLowerCase() === normalizedLower) {
        return true;
      }
      if (gradeKey.toLowerCase() === normalizedLower) {
        return true;
      }
    }

    const eitherOrGroups = this.eitherOrGroupsCache[countryCode] || [];
    for (const group of eitherOrGroups) {
      if (group.subjects.includes(subjectName) || group.subjects.includes(normalized)) {
        for (const groupSubject of group.subjects) {
          if (groupSubject !== subjectName && groupSubject !== normalized) {
            if (this.grades.hasOwnProperty(groupSubject) && this.grades[groupSubject] !== undefined && this.grades[groupSubject] !== null) {
              return true;
            }
          }
        }
      }
    }

    if (subjectName === 'IT' || normalized === 'IT') {
      if (this.grades.hasOwnProperty('CAT') && this.grades['CAT'] !== undefined && this.grades['CAT'] !== null) {
        return true;
      }
    }
    if (subjectName === 'CAT' || normalized === 'CAT') {
      if (this.grades.hasOwnProperty('IT') && this.grades['IT'] !== undefined && this.grades['IT'] !== null) {
        return true;
      }
    }

    return false;
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
      if (gradeKey.toLowerCase() === normalizedLower) {
        return this.grades[gradeKey] || 0;
      }
    }

    const eitherOrGroups = this.eitherOrGroupsCache[countryCode] || [];
    for (const group of eitherOrGroups) {
      if (group.subjects.includes(subjectName) || group.subjects.includes(normalized)) {
        for (const groupSubject of group.subjects) {
          if (groupSubject !== subjectName && groupSubject !== normalized) {
            if (this.grades[groupSubject] !== undefined && this.grades[groupSubject] !== null) {
              return this.grades[groupSubject] || 0;
            }
          }
        }
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
    let normalized = subjectName.trim();
    const variations: { [key: string]: string } = {
      'Mathematics': 'Math',
      'Mathematical Literacy': 'MathLiteracy',
      'English Home Language': 'English',
      'English (Home Language)': 'English',
      'English First Additional Language': 'EnglishFAL',
      'English (First Additional Language)': 'EnglishFAL',
      'Information Technology': 'IT',
      'Computer Applications Technology': 'CAT',
      'Computer Application Technology': 'CAT',
      'Business Studies': 'Business',
      'Business': 'Business',
      'Economics': 'Economics'
    };

    if (variations[normalized]) {
      return variations[normalized];
    }

    return normalized;
  }

  hasUniversitySources(career: Career): boolean {
    if (!career || !career.qualificationLevels) return false;
    
    const countryCode = this.selectedCountry?.code || 'ZA';
    const qualLevels = career.qualificationLevels[countryCode] || [];
    
    return qualLevels.some(level => {
      if (!level.sources) return false;
      if (Array.isArray(level.sources)) {
        return level.sources.length > 0 && level.sources.some((s: any) => s && s.institution);
      }
      return !!level.sources.institution;
    });
  }

  getFirstQualificationLevelWithSources(career: Career): QualificationLevel | null {
    if (!career || !career.qualificationLevels) return null;
    
    const countryCode = this.selectedCountry?.code || 'ZA';
    const qualLevels = career.qualificationLevels[countryCode] || [];
    
    for (const level of qualLevels) {
      if (level.sources) {
        if (Array.isArray(level.sources)) {
          if (level.sources.length > 0 && level.sources.some((s: any) => s && s.institution)) {
            return level;
          }
        } else if (level.sources.institution) {
          return level;
        }
      }
    }
    
    return null;
  }

  openUniversityDialog(eligible: EligibleCareer) {
    const qualLevel = this.getFirstQualificationLevelWithSources(eligible.career);
    if (qualLevel) {
      this.selectedCareerForDialog = eligible.career;
      this.selectedQualificationLevel = qualLevel;
      this.showUniversityDialog = true;
    }
  }

  closeUniversityDialog() {
    this.showUniversityDialog = false;
    this.selectedCareerForDialog = null;
    this.selectedQualificationLevel = null;
  }
}

