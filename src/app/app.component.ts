import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Grades } from './shared/models/grades.model';
import { Career } from './shared/models/career.model';
import { Country } from './shared/models/country.model';
import { GradeLevel } from './shared/models/grade-level.model';
import { CareersService } from './features/career-planning/services/careers.service';
import { ImprovementService } from './features/career-planning/services/improvement.service';
import { AnalyticsService } from './core/services/analytics.service';
import { PushNotificationService } from './core/services/push-notification.service';
import { TourService } from './core/services/tour.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  grades = signal<Grades>({});
  selectedCareer = signal<Career | null>(null);
  selectedCountry = signal<Country | null>(null);
  selectedGradeLevel = signal<GradeLevel | null>(null);
  selectedSubjects = signal<string[]>([]);
  subjectsNeedingImprovement = signal<string[]>([]);
  logoPath = signal<string>('assets/logo.png');
  showMainContent = signal<boolean>(true);
  private routerSubscription?: Subscription;

  gradesValue = computed(() => this.grades());
  selectedCareerValue = computed(() => this.selectedCareer());
  selectedCountryValue = computed(() => this.selectedCountry());
  selectedGradeLevelValue = computed(() => this.selectedGradeLevel());
  selectedSubjectsValue = computed(() => this.selectedSubjects());
  subjectsNeedingImprovementValue = computed(() => this.subjectsNeedingImprovement());

  constructor(
    private careersService: CareersService,
    private improvementService: ImprovementService,
    private analyticsService: AnalyticsService,
    private pushNotificationService: PushNotificationService,
    private router: Router,
    private tourService: TourService
  ) {}

  ngOnInit() {
    // Check if logo.png exists, fallback to logo.svg
    const img = new Image();
    img.onerror = () => {
      this.logoPath.set('assets/logo.svg');
    };
    img.src = 'assets/logo.png';
    
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const isStandalonePage = event.url === '/privacy' || 
                                event.url === '/terms' || 
                                event.url === '/contact' ||
                                event.url.startsWith('/admin');
        this.showMainContent.set(!isStandalonePage);
        
        this.analyticsService.trackEvent('view', 'page_view', {
          url: event.url,
          componentName: 'AppComponent'
        });
      });
    
    const currentUrl = this.router.url;
    const isStandalonePage = currentUrl === '/privacy' || 
                            currentUrl === '/terms' || 
                            currentUrl === '/contact' ||
                            currentUrl.startsWith('/admin');
    this.showMainContent.set(!isStandalonePage);
    
    this.analyticsService.trackEvent('view', 'page_view', {
      url: currentUrl,
      componentName: 'AppComponent'
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  async onGradesChange(grades: Grades) {
    this.grades.set(grades);
    this.selectedSubjects.set(Object.keys(grades).filter(subject => grades[subject] > 0));
    await this.updateSubjectsNeedingImprovement();
  }

  private async updateSubjectsNeedingImprovement() {
    const career = this.selectedCareer();
    const grades = this.grades();
    if (!career || !grades) {
      this.subjectsNeedingImprovement.set([]);
      return;
    }

    const countryCode = this.selectedCountry()?.code || 'ZA';
    const improvements = await this.improvementService.calculateImprovements(grades, career, countryCode);
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
    
    // Initialize push notifications for the selected country
    if (this.pushNotificationService.isAvailable()) {
      try {
        await this.pushNotificationService.initialize(country.code);
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    }
    
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
    await this.updateSubjectsNeedingImprovement();
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
    
    this.analyticsService.trackSelect('career_selected', career.name, {
      componentName: 'AppComponent',
      career: career.name,
      country: country?.code
    });
    
    await this.updateSubjectsNeedingImprovement();
  }

  onGradeLevelChange(gradeLevel: GradeLevel) {
    this.selectedGradeLevel.set(gradeLevel);
    
    this.analyticsService.trackSelect('grade_level_selected', gradeLevel.displayName, {
      componentName: 'AppComponent',
      gradeLevel: gradeLevel.displayName,
      level: gradeLevel.level,
      country: this.selectedCountry()?.code
    });
  }

  startTour() {
    this.tourService.startTour();
    this.analyticsService.trackClick('tour_started', undefined, 'button', 'Take a Tour', {
      componentName: 'AppComponent'
    });
  }
}

