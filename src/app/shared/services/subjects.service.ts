import { Injectable } from '@angular/core';
import { SubjectMapping, getSubjectsForCountry } from '../models/subject.model';
import { FirebaseService } from '../../core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  constructor(private firebaseService: FirebaseService) {}

  /**
   * Get subjects for a country from Firebase or fallback to defaults
   */
  async getSubjectsForCountry(countryCode: string): Promise<SubjectMapping[]> {
    // Try to fetch from Firebase
    if (this.firebaseService.isAvailable()) {
      try {
        const countrySubjects = await this.firebaseService.getDocument('countrySubjects', countryCode);
        if (countrySubjects && countrySubjects.subjects && Array.isArray(countrySubjects.subjects)) {
          return countrySubjects.subjects;
        }
      } catch (error) {
        console.warn(`Error fetching subjects for ${countryCode} from Firebase, using defaults:`, error);
      }
    }

    // Fallback to default
    return getSubjectsForCountry(countryCode);
  }
}

