import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Grades } from '../../../../shared/models/grades.model';
import { Career, QualificationLevel } from '../../../../shared/models/career.model';
import { Country } from '../../../../shared/models/country.model';
import { EligibilityService, EligibleCareer } from '../../services/eligibility.service';
import { CareersService } from '../../../career-planning/services/careers.service';
import { CareerMarketService, CareerMarketData } from '../../../../core/services/career-market.service';
import { ImprovementService } from '../../../career-planning/services/improvement.service';

@Component({
  selector: 'app-eligible-careers',
  templateUrl: './eligible-careers.component.html',
  styleUrls: ['./eligible-careers.component.scss']
})
export class EligibleCareersComponent implements OnChanges {
  @Input() grades: Grades | null = null;
  @Input() selectedCountry: Country | null = null;

  eligibleCareers: EligibleCareer[] = [];
  qualifiedCareers: EligibleCareer[] = [];
  closeCareers: EligibleCareer[] = [];
  closeCareersByCategory: { [category: string]: EligibleCareer[] } = {};
  marketData: { [careerName: string]: CareerMarketData } = {};
  loading = false;
  loadingMarketData: { [careerName: string]: boolean } = {};
  Object = Object; // Expose Object to template

  // University Dialog state
  showUniversityDialog = false;
  selectedCareerForDialog: Career | null = null;
  selectedQualificationLevel: QualificationLevel | null = null;

  constructor(
    private eligibilityService: EligibilityService,
    private careersService: CareersService,
    private marketService: CareerMarketService,
    private improvementService: ImprovementService
  ) {}

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
      // Get careers with country-specific requirements
      let careers: Career[];
      if (this.selectedCountry) {
        careers = await this.careersService.getCareersForCountry(this.selectedCountry.code);
      } else {
        careers = await this.careersService.getCareers();
      }

      // Debug logging
      console.log('[EligibleCareers] Checking eligibility with:', {
        grades: this.grades,
        careersCount: careers.length,
        country: this.selectedCountry?.code,
        sampleCareer: careers.find(c => c.name === 'IT Specialist')
      });

      // Get eligible careers with country code for subject name normalization
      this.eligibleCareers = this.eligibilityService.getEligibleCareers(
        this.grades, 
        careers,
        this.selectedCountry?.code
      );
      
      // Separate into qualified and close
      this.qualifiedCareers = this.eligibleCareers.filter(ec => ec.status === 'qualified');
      this.closeCareers = this.eligibleCareers.filter(ec => ec.status === 'close');

      // Debug logging
      console.log('[EligibleCareers] Results:', {
        total: this.eligibleCareers.length,
        qualified: this.qualifiedCareers.length,
        close: this.closeCareers.length,
        qualifiedNames: this.qualifiedCareers.map(ec => ec.career.name),
        itCareers: this.eligibleCareers.filter(ec => 
          ec.career.name.includes('IT') || 
          ec.career.name.includes('Computer') || 
          ec.career.name.includes('Software') ||
          ec.career.name.includes('Cybersecurity') ||
          ec.career.name.includes('Network')
        ).map(ec => ({
          name: ec.career.name,
          status: ec.status,
          matchScore: ec.matchScore
        }))
      });
      
      // Group close careers by curriculum category
      this.groupCloseCareersByCategory();
      
      // Load market data for all eligible careers
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

  /**
   * Load market data (job openings and salary) for all eligible careers
   */
  private loadMarketDataForCareers() {
    // Load for qualified careers
    this.qualifiedCareers.forEach(eligible => {
      this.loadMarketData(eligible.career.name);
    });

    // Load for close careers
    this.closeCareers.forEach(eligible => {
      this.loadMarketData(eligible.career.name);
    });
  }

  /**
   * Load market data for a specific career
   */
  private loadMarketData(careerName: string) {
    // Skip if already loading or loaded
    if (this.loadingMarketData[careerName] || this.marketData[careerName]) {
      return;
    }

    this.loadingMarketData[careerName] = true;

    this.marketService.getMarketData(
      careerName,
      this.selectedCountry?.code
    ).subscribe({
      next: (data) => {
        this.marketData[careerName] = data;
        this.loadingMarketData[careerName] = false;
      },
      error: (error) => {
        console.error(`Error loading market data for ${careerName}:`, error);
        this.loadingMarketData[careerName] = false;
        // Set default data on error
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

  /**
   * Get market data for a career
   */
  getMarketData(careerName: string): CareerMarketData | null {
    return this.marketData[careerName] || null;
  }

  /**
   * Check if market data is loading for a career
   */
  isMarketDataLoading(careerName: string): boolean {
    return this.loadingMarketData[careerName] || false;
  }

  /**
   * Format salary range for display
   */
  formatSalaryRange(salaryRange: any): string {
    if (!salaryRange) return 'Not available';
    
    const min = this.formatCurrency(salaryRange.min, salaryRange.currency);
    const max = this.formatCurrency(salaryRange.max, salaryRange.currency);
    const period = salaryRange.period === 'yearly' ? 'per year' : 'per month';
    
    return `${min} - ${max} ${period}`;
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Get market trend icon
   */
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

  /**
   * Get market trend label
   */
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
    
    // Sort careers within each category by match score (highest first)
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

  /**
   * Get improvement details for a subject in a career
   */
  getImprovementDetails(eligible: EligibleCareer, subject: string): { current: number; required: number; improvement: number } | null {
    if (!this.grades || !eligible.career.minGrades[subject]) {
      return null;
    }

    const current = this.grades[subject] || 0;
    const required = eligible.career.minGrades[subject];
    const improvement = Math.max(0, required - current);

    return {
      current,
      required,
      improvement
    };
  }

  /**
   * Get qualification levels for a career in the selected country
   */
  getQualificationLevels(career: Career): QualificationLevel[] {
    if (!career.qualificationLevels || !this.selectedCountry) {
      return [];
    }
    return career.qualificationLevels[this.selectedCountry.code] || [];
  }

  /**
   * Check if a career has university data
   */
  hasUniversityData(career: Career): boolean {
    const levels = this.getQualificationLevels(career);
    return levels.some(level => {
      if (!level.sources) return false;
      const sources = Array.isArray(level.sources) ? level.sources : [level.sources];
      return sources.some(s => s.institution);
    });
  }

  /**
   * Get count of universities for a career
   */
  getUniversityCount(career: Career): number {
    const levels = this.getQualificationLevels(career);
    let count = 0;
    levels.forEach(level => {
      if (level.sources) {
        const sources = Array.isArray(level.sources) ? level.sources : [level.sources];
        count += sources.filter(s => s.institution).length;
      }
    });
    return count;
  }

  /**
   * Open university dialog for a career
   */
  openUniversityDialog(career: Career) {
    const levels = this.getQualificationLevels(career);
    if (levels.length > 0) {
      this.selectedCareerForDialog = career;
      this.selectedQualificationLevel = levels[0]; // Default to first (usually Degree)
      this.showUniversityDialog = true;
    }
  }

  /**
   * Close university dialog
   */
  closeUniversityDialog() {
    this.showUniversityDialog = false;
    this.selectedCareerForDialog = null;
    this.selectedQualificationLevel = null;
  }

  /**
   * Change qualification level in dialog
   */
  selectQualificationLevel(level: QualificationLevel) {
    this.selectedQualificationLevel = level;
  }
}

