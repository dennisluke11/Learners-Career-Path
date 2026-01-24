import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private readonly TOUR_COMPLETED_KEY = 'career_path_tour_completed';
  private readonly TOUR_DISMISSED_KEY = 'career_path_tour_dismissed';
  
  private isActive$ = new BehaviorSubject<boolean>(false);
  private currentStep$ = new BehaviorSubject<number>(0);
  
  public readonly tourSteps: TourStep[] = [
    {
      id: 'country-selection',
      title: 'Select Your Country',
      description: 'Start by selecting your country. This customizes the app for your educational system (CAPS, KCSE, WAEC, etc.)',
      targetSelector: 'app-country-selector',
      position: 'bottom'
    },
    {
      id: 'grade-level',
      title: 'Choose Your Grade Level',
      description: 'Select your current grade level. The app will automatically select the highest level for your country.',
      targetSelector: 'app-grade-level-selector',
      position: 'bottom'
    },
    {
      id: 'grades-or-career',
      title: 'Two Ways to Use the App',
      description: 'You can either: 1) Enter your grades to see careers you qualify for, OR 2) Select a career first to see what improvements you need. This is our unique reverse eligibility feature!',
      targetSelector: 'app-grade-input',
      position: 'top'
    },
    {
      id: 'improvements',
      title: 'See Your Progress',
      description: 'When you select a career, you\'ll see exactly what improvements are needed per subject. Track your progress in real-time!',
      targetSelector: 'app-improvement-display',
      position: 'top'
    },
    {
      id: 'universities',
      title: 'Find Universities',
      description: 'Click on careers to see universities offering those courses, along with their admission requirements (APS scores).',
      targetSelector: 'app-eligible-careers',
      position: 'top'
    }
  ];

  constructor() {
    // Check if tour was previously dismissed
    const wasDismissed = localStorage.getItem(this.TOUR_DISMISSED_KEY) === 'true';
    const wasCompleted = localStorage.getItem(this.TOUR_COMPLETED_KEY) === 'true';
    
    // Don't auto-start if already dismissed or completed
    if (wasDismissed || wasCompleted) {
      this.isActive$.next(false);
    }
  }

  get isActive(): Observable<boolean> {
    return this.isActive$.asObservable();
  }

  get currentStep(): Observable<number> {
    return this.currentStep$.asObservable();
  }

  startTour(): void {
    this.isActive$.next(true);
    this.currentStep$.next(0);
    localStorage.removeItem(this.TOUR_DISMISSED_KEY);
  }

  nextStep(): void {
    const current = this.currentStep$.value;
    if (current < this.tourSteps.length - 1) {
      this.currentStep$.next(current + 1);
    } else {
      this.completeTour();
    }
  }

  previousStep(): void {
    const current = this.currentStep$.value;
    if (current > 0) {
      this.currentStep$.next(current - 1);
    }
  }

  skipTour(): void {
    this.isActive$.next(false);
    localStorage.setItem(this.TOUR_DISMISSED_KEY, 'true');
  }

  completeTour(): void {
    this.isActive$.next(false);
    this.currentStep$.next(0);
    localStorage.setItem(this.TOUR_COMPLETED_KEY, 'true');
  }

  getCurrentStep(): number {
    return this.currentStep$.value;
  }

  getCurrentStepData(): TourStep | null {
    const stepIndex = this.currentStep$.value;
    return this.tourSteps[stepIndex] || null;
  }

  hasSeenTour(): boolean {
    return localStorage.getItem(this.TOUR_COMPLETED_KEY) === 'true' ||
           localStorage.getItem(this.TOUR_DISMISSED_KEY) === 'true';
  }

  resetTour(): void {
    localStorage.removeItem(this.TOUR_COMPLETED_KEY);
    localStorage.removeItem(this.TOUR_DISMISSED_KEY);
  }
}

