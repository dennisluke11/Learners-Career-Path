import { Injectable } from '@angular/core';
import { Career } from '../../../shared/models/career.model';
import { FirebaseService } from '../../../core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class CareersService {
  private careersCache: Career[] | null = null;

  constructor(private firebaseService: FirebaseService) {}

  async getCareers(): Promise<Career[]> {
    if (this.careersCache) {
      return this.careersCache;
    }

    if (!this.firebaseService.isAvailable()) {
      throw new Error('Firebase is not available. Please check your connection and Firebase configuration.');
    }

    try {
      const firebaseCareers = await this.firebaseService.getCollection('careers');
      
      if (!firebaseCareers || firebaseCareers.length === 0) {
        throw new Error('No careers found in Firebase database. Please run the setup script to populate careers.');
      }

      const mappedCareers = firebaseCareers.map(c => ({
        name: c.name,
        minGrades: c.minGrades || {},
        countryBaselines: c.countryBaselines || {},
        qualificationLevels: c.qualificationLevels || {},
        category: c.category || undefined,
        verificationStatus: c.verificationStatus,
        lastVerified: c.lastVerified,
        sources: c.sources || {}
      })) as Career[];
      
      console.log(`✅ Loaded ${mappedCareers.length} careers from Firebase database`);
      this.careersCache = mappedCareers;
      return this.careersCache;
    } catch (error: any) {
      console.error('❌ Error fetching careers from Firebase:', error);
      throw new Error(`Failed to load careers: ${error.message || error}`);
    }
  }

  getCareersSync(): Career[] {
    return this.careersCache || [];
  }

  async getCareerForCountry(careerName: string, countryCode: string): Promise<Career | null> {
    try {
      const careers = await this.getCareers();
      const career = careers.find(c => c.name === careerName);
      if (!career) return null;

      if (career.countryBaselines && career.countryBaselines[countryCode]) {
        return {
          ...career,
          minGrades: { ...career.minGrades, ...career.countryBaselines[countryCode] }
        };
      }

      return career;
    } catch (error) {
      console.error('Error getting career for country:', error);
      return null;
    }
  }

  async getCareersForCountry(countryCode: string): Promise<Career[]> {
    try {
      const careers = await this.getCareers();
      return careers.map(career => {
        // Priority: qualificationLevels > countryBaselines > minGrades
        if (career.qualificationLevels && career.qualificationLevels[countryCode] && career.qualificationLevels[countryCode].length > 0) {
          // Use the first qualification level (usually Degree) for eligibility checking
          // This ensures we check against the highest qualification level requirements
          const firstQualLevel = career.qualificationLevels[countryCode][0];
          const requirements = firstQualLevel.minGrades || {};
          
          // Only use if we have actual requirements
          if (Object.keys(requirements).length > 0) {
            return {
              ...career,
              minGrades: requirements
            };
          }
        }
        
        // Fallback to countryBaselines
        if (career.countryBaselines && career.countryBaselines[countryCode]) {
          const baselineRequirements = career.countryBaselines[countryCode];
          if (Object.keys(baselineRequirements).length > 0) {
            return {
              ...career,
              minGrades: { ...career.minGrades, ...baselineRequirements }
            };
          }
        }
        
        // Return as-is if no country-specific requirements found
        return career;
      });
    } catch (error) {
      console.error('Error getting careers for country:', error);
      return [];
    }
  }

  clearCache(): void {
    this.careersCache = null;
  }
}

