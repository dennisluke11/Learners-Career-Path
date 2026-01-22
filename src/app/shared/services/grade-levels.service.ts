import { Injectable } from '@angular/core';
import { GradeLevel, getGradeLevelsForCountry, getGradeSystemForCountry } from '../models/grade-level.model';
import { FirebaseService } from '../../core/services/firebase.service';
import { CacheService } from '../../core/services/cache.service';

@Injectable({ providedIn: 'root' })
export class GradeLevelsService {
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {}

  async getGradeLevelsForCountry(countryCode: string): Promise<GradeLevel[]> {
    const cacheKey = `countryGradeLevels_${countryCode}`;
    
    const cached = this.cacheService.get<GradeLevel[]>(cacheKey);
    if (cached && this.cacheService.isFresh(cacheKey, this.CACHE_TTL)) {
      return cached;
    }

    if (this.firebaseService.isAvailable()) {
      try {
        const countryGradeLevels = await this.firebaseService.getDocument('countryGradeLevels', countryCode);
        if (countryGradeLevels && countryGradeLevels.levels && Array.isArray(countryGradeLevels.levels)) {
          this.cacheService.set(cacheKey, countryGradeLevels.levels, this.CACHE_TTL);
          return countryGradeLevels.levels;
        }
      } catch (error) {
        if (cached) {
          return cached;
        }
        console.warn(`Error fetching grade levels for ${countryCode} from Firebase, using defaults:`, error);
      }
    }

    const defaultLevels = getGradeLevelsForCountry(countryCode);
    this.cacheService.set(cacheKey, defaultLevels, this.CACHE_TTL);
    return defaultLevels;
  }

  async getGradeSystemForCountry(countryCode: string): Promise<string> {
    const cacheKey = `gradeSystem_${countryCode}`;
    
    const cached = this.cacheService.get<string>(cacheKey);
    if (cached && this.cacheService.isFresh(cacheKey, this.CACHE_TTL)) {
      return cached;
    }

    if (this.firebaseService.isAvailable()) {
      try {
        const countryGradeLevels = await this.firebaseService.getDocument('countryGradeLevels', countryCode);
        if (countryGradeLevels && countryGradeLevels.system) {
          this.cacheService.set(cacheKey, countryGradeLevels.system, this.CACHE_TTL);
          return countryGradeLevels.system;
        }
      } catch (error) {
        if (cached) {
          return cached;
        }
        console.warn(`Error fetching grade system for ${countryCode} from Firebase, using defaults:`, error);
      }
    }

    const defaultSystem = getGradeSystemForCountry(countryCode);
    this.cacheService.set(cacheKey, defaultSystem, this.CACHE_TTL);
    return defaultSystem;
  }
}

