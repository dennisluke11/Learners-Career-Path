import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TourService, TourStep } from '../../../core/services/tour.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.scss']
})
export class TourComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tourOverlay', { static: false }) tourOverlay!: ElementRef;
  @ViewChild('tourTooltip', { static: false }) tourTooltip!: ElementRef;

  isActive = false;
  currentStepIndex = 0;
  currentStep: TourStep | null = null;
  tooltipPosition = { top: 0, left: 0 };
  
  private subscriptions = new Subscription();

  constructor(public tourService: TourService) {}

  ngOnInit() {
    this.subscriptions.add(
      this.tourService.isActive.subscribe(active => {
        this.isActive = active;
        if (active) {
          this.updateCurrentStep();
        }
      })
    );

    this.subscriptions.add(
      this.tourService.currentStep.subscribe(step => {
        this.currentStepIndex = step;
        this.updateCurrentStep();
        if (this.isActive) {
          setTimeout(() => this.positionTooltip(), 100);
        }
      })
    );
  }

  ngAfterViewInit() {
    if (this.isActive) {
      setTimeout(() => this.positionTooltip(), 200);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private updateCurrentStep() {
    this.currentStep = this.tourService.getCurrentStepData();
  }

  private positionTooltip() {
    if (!this.currentStep || !this.tourTooltip) {
      return;
    }

    const targetElement = document.querySelector(this.currentStep.targetSelector);
    if (!targetElement) {
      // If target not found, center the tooltip
      this.tooltipPosition = {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2
      };
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tourTooltip.nativeElement?.getBoundingClientRect() || { width: 300, height: 200 };
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (this.currentStep.position) {
      case 'top':
        top = targetRect.top + scrollY - tooltipRect.height - 20;
        left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + scrollY + 20;
        left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left + scrollX - tooltipRect.width - 20;
        break;
      case 'right':
        top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + scrollX + 20;
        break;
      case 'center':
        top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
    }

    // Ensure tooltip stays within viewport
    const padding = 20;
    top = Math.max(padding + scrollY, Math.min(top, window.innerHeight + scrollY - tooltipRect.height - padding));
    left = Math.max(padding + scrollX, Math.min(left, window.innerWidth + scrollX - tooltipRect.width - padding));

    this.tooltipPosition = { top, left };

    // Scroll target into view if needed
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  nextStep() {
    this.tourService.nextStep();
    setTimeout(() => this.positionTooltip(), 100);
  }

  previousStep() {
    this.tourService.previousStep();
    setTimeout(() => this.positionTooltip(), 100);
  }

  skipTour() {
    this.tourService.skipTour();
  }

  completeTour() {
    this.tourService.completeTour();
  }

  get progress(): number {
    return ((this.currentStepIndex + 1) / this.tourService.tourSteps.length) * 100;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex === this.tourService.tourSteps.length - 1;
  }
}

