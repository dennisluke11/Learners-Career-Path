import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../../core/services/firebase.service';

export interface RequirementFeedback {
  careerName: string;
  countryCode: string;
  feedbackType: 'correct' | 'incorrect' | 'outdated';
  userComment?: string;
  actualRequirement?: string;
  university?: string;
  yearApplied?: number;
  wasAccepted?: boolean;
  submittedAt: Date;
}

@Component({
  selector: 'app-data-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-feedback.component.html',
  styleUrls: ['./data-feedback.component.scss']
})
export class DataFeedbackComponent {
  @Input() careerName: string = '';
  @Input() countryCode: string = 'ZA';
  @Output() feedbackSubmitted = new EventEmitter<RequirementFeedback>();

  showFeedbackForm = false;
  feedbackType: 'correct' | 'incorrect' | 'outdated' | null = null;
  userComment = '';
  actualRequirement = '';
  university = '';
  yearApplied: number | null = null;
  wasAccepted: boolean | null = null;
  
  isSubmitting = false;
  submitted = false;
  error = '';

  currentYear = new Date().getFullYear();
  years: number[] = [];

  constructor(private firebaseService: FirebaseService) {
    // Generate years for dropdown (current year back to 5 years ago)
    for (let i = 0; i <= 5; i++) {
      this.years.push(this.currentYear - i);
    }
  }

  openFeedbackForm(type: 'correct' | 'incorrect' | 'outdated') {
    this.feedbackType = type;
    this.showFeedbackForm = true;
    this.resetForm();
  }

  closeFeedbackForm() {
    this.showFeedbackForm = false;
    this.feedbackType = null;
    this.resetForm();
  }

  resetForm() {
    this.userComment = '';
    this.actualRequirement = '';
    this.university = '';
    this.yearApplied = null;
    this.wasAccepted = null;
    this.error = '';
  }

  async submitFeedback() {
    if (!this.feedbackType) return;

    this.isSubmitting = true;
    this.error = '';

    const feedback: RequirementFeedback = {
      careerName: this.careerName,
      countryCode: this.countryCode,
      feedbackType: this.feedbackType,
      userComment: this.userComment || undefined,
      actualRequirement: this.actualRequirement || undefined,
      university: this.university || undefined,
      yearApplied: this.yearApplied || undefined,
      wasAccepted: this.wasAccepted !== null ? this.wasAccepted : undefined,
      submittedAt: new Date()
    };

    try {
      // Submit to Firestore
      await this.firebaseService.addDocument('careerFeedback', feedback);
      
      this.submitted = true;
      this.feedbackSubmitted.emit(feedback);
      
      // Auto-close after success
      setTimeout(() => {
        this.closeFeedbackForm();
        this.submitted = false;
      }, 2000);

    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      this.error = 'Failed to submit feedback. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  setAccepted(value: boolean) {
    this.wasAccepted = value;
  }
}

