import { Injectable } from '@angular/core';
import { GradeLevel, getGradeLevelsForCountry, getGradeSystemForCountry } from '../models/grade-level.model';
import { FirebaseService } from '../../core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class GradeLevelsService {
  constructor(private firebaseService: FirebaseService) {}

  /**
   * Get grade levels for a country from Firebase or fallback to defaults
   */
  async getGradeLevelsForCountry(countryCode: string): Promise<GradeLevel[]> {
    // Try to fetch from Firebase
    if (this.firebaseService.isAvailable()) {
      try {
        const countryGradeLevels = await this.firebaseService.getDocument('countryGradeLevels', countryCode);
        if (countryGradeLevels && countryGradeLevels.levels && Array.isArray(countryGradeLevels.levels)) {
          return countryGradeLevels.levels;
        }
      } catch (error) {
        console.warn(`Error fetching grade levels for ${countryCode} from Firebase, using defaults:`, error);
      }
    }

    // Fallback to default
    return getGradeLevelsForCountry(countryCode);
  }

  /**
   * Get grade system name for a country
   */
  async getGradeSystemForCountry(countryCode: string): Promise<string> {
    if (this.firebaseService.isAvailable()) {
      try {
        const countryGradeLevels = await this.firebaseService.getDocument('countryGradeLevels', countryCode);
        if (countryGradeLevels && countryGradeLevels.system) {
          return countryGradeLevels.system;
        }
      } catch (error) {
        console.warn(`Error fetching grade system for ${countryCode} from Firebase, using defaults:`, error);
      }
    }

    // Fallback to default
    return getGradeSystemForCountry(countryCode);
  }
}

