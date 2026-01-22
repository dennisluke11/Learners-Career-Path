import { Component, signal, computed } from '@angular/core';
import { Grades } from './shared/models/grades.model';
import { Career } from './shared/models/career.model';
import { Country } from './shared/models/country.model';
import { GradeLevel } from './shared/models/grade-level.model';
import { CareersService } from './features/career-planning/services/careers.service';
import { ImprovementService } from './features/career-planning/services/improvement.service';
import { AnalyticsService } from './core/services/analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  grades = signal<Grades>({});
  selectedCareer = signal<Career | null>(null);
  selectedCountry = signal<Country | null>(null);
  selectedGradeLevel = signal<GradeLevel | null>(null);
  selectedSubjects = signal<string[]>([]);
  subjectsNeedingImprovement = signal<string[]>([]);
  logoPath = signal<string>('assets/logo.svg');

  gradesValue = computed(() => this.grades());
  selectedCareerValue = computed(() => this.selectedCareer());
  selectedCountryValue = computed(() => this.selectedCountry());
  selectedGradeLevelValue = computed(() => this.selectedGradeLevel());
  selectedSubjectsValue = computed(() => this.selectedSubjects());
  subjectsNeedingImprovementValue = computed(() => this.subjectsNeedingImprovement());

  constructor(
    private careersService: CareersService,
    private improvementService: ImprovementService,
    private analyticsService: AnalyticsService
  ) {}

  onGradesChange(grades: Grades) {
    this.grades.set(grades);
    this.selectedSubjects.set(Object.keys(grades).filter(subject => grades[subject] > 0));
    this.updateSubjectsNeedingImprovement();
  }

  private updateSubjectsNeedingImprovement() {
    const career = this.selectedCareer();
    const grades = this.grades();
    if (!career || !grades) {
      this.subjectsNeedingImprovement.set([]);
      return;
    }

    const countryCode = this.selectedCountry()?.code || 'ZA';
    const improvements = this.improvementService.calculateImprovements(grades, career, countryCode);
    this.subjectsNeedingImprovement.set(Object.keys(improvements));
  }

  async onCountryChange(country: Country) {
    this.selectedCountry.set(country);
    // Reset grade level when country changes
    this.selectedGradeLevel.set(null);
    // Clear grades when country changes (subjects will change)
    this.grades.set({});
    this.selectedSubjects.set([]);
    
    // Track country selection
    this.analyticsService.trackSelect('country_selected', country.code, {
      componentName: 'AppComponent',
      country: country.name,
      countryCode: country.code
    });
    
    const career = this.selectedCareer();
    if (career && country) {
      const countrySpecificCareer = await this.careersService.getCareerForCountry(
        career.name,
        country.code
      );
      if (countrySpecificCareer) {
        this.selectedCareer.set(countrySpecificCareer);
      }
    }
    this.updateSubjectsNeedingImprovement();
  }

  async onCareerChange(career: Career) {
    const country = this.selectedCountry();
    if (country) {
      const countrySpecificCareer = await this.careersService.getCareerForCountry(
        career.name,
        country.code
      );
      this.selectedCareer.set(countrySpecificCareer || career);
    } else {
      this.selectedCareer.set(career);
    }
    
    // Track career selection
    this.analyticsService.trackSelect('career_selected', career.name, {
      componentName: 'AppComponent',
      career: career.name,
      country: country?.code
    });
    
    this.updateSubjectsNeedingImprovement();
  }

  onGradeLevelChange(gradeLevel: GradeLevel) {
    this.selectedGradeLevel.set(gradeLevel);
    
    // Track grade level selection
    this.analyticsService.trackSelect('grade_level_selected', gradeLevel.displayName, {
      componentName: 'AppComponent',
      gradeLevel: gradeLevel.displayName,
      level: gradeLevel.level,
      country: this.selectedCountry()?.code
    });
  }
}

