import { Injectable } from '@angular/core';
import { Career } from '../../../shared/models/career.model';
import { FirebaseService } from '../../../core/services/firebase.service';
import { getAllCareers } from './careers-data.helper';

@Injectable({ providedIn: 'root' })
export class CareersService {
  private careersCache: Career[] | null = null;
  private defaultCareers: Career[] = getAllCareers();

  constructor(private firebaseService: FirebaseService) {}

  async getCareers(): Promise<Career[]> {
    if (this.careersCache) {
      return this.careersCache;
    }

    if (this.firebaseService.isAvailable()) {
      try {
        const firebaseCareers = await this.firebaseService.getCollection('careers');
        if (firebaseCareers && firebaseCareers.length > 0) {
          const mappedCareers = firebaseCareers.map(c => ({
            name: c.name,
            minGrades: c.minGrades || {},
            countryBaselines: c.countryBaselines || {},
            category: c.category || undefined
          })) as Career[];
          
          console.log(`✅ Loaded ${mappedCareers.length} careers from Firebase database`);
          
          if (mappedCareers.length < this.defaultCareers.length) {
            console.warn(`⚠️ Firebase has ${mappedCareers.length} careers, but we have ${this.defaultCareers.length} hardcoded. Using hardcoded to ensure all careers are available.`);
            this.careersCache = this.defaultCareers;
            console.log(`📋 Using ${this.careersCache.length} hardcoded careers (complete set)`);
            return this.careersCache;
          }
          
          this.careersCache = mappedCareers;
          return this.careersCache;
        } else {
          console.warn('⚠️ No careers found in Firebase database, using defaults');
        }
      } catch (error) {
        console.warn('Error fetching careers from Firebase, using defaults:', error);
      }
    } else {
      console.warn('⚠️ Firebase not available, using hardcoded careers');
    }

    this.careersCache = this.defaultCareers;
    console.log(`📋 Using ${this.careersCache.length} hardcoded careers as fallback`);
    return this.careersCache;
  }

  getCareersSync(): Career[] {
    return this.careersCache || this.defaultCareers;
  }

  async getCareerForCountry(careerName: string, countryCode: string): Promise<Career | null> {
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
  }

  async getCareersForCountry(countryCode: string): Promise<Career[]> {
    const careers = await this.getCareers();
    return careers.map(career => {
      if (career.countryBaselines && career.countryBaselines[countryCode]) {
        return {
          ...career,
          minGrades: { ...career.minGrades, ...career.countryBaselines[countryCode] }
        };
      }
      return career;
    });
  }
}

