import { Injectable } from '@angular/core';
import { Country, DEFAULT_COUNTRIES } from '../models/country.model';
import { FirebaseService } from '../../core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private countriesCache: Country[] | null = null;

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Get countries dynamically from Firebase
   * Any country with active: true will be shown
   * Falls back to defaults if Firebase unavailable
   */
  async getCountries(): Promise<Country[]> {
    // Return cached data if available
    if (this.countriesCache) {
      return this.countriesCache;
    }

    // Try to fetch from Firebase first (dynamic - any active country will show)
    if (this.firebaseService.isAvailable()) {
      try {
        const firebaseCountries = await this.firebaseService.getCollection('countries');
        if (firebaseCountries && firebaseCountries.length > 0) {
          // Filter only active countries (dynamic - no hardcoded list)
          this.countriesCache = firebaseCountries
            .filter(c => c.active === true)
            .map(c => ({
              code: c.code,
              name: c.name,
              flag: c.flag,
              active: true
            })) as Country[];
          
          // Sort alphabetically by name for consistent display
          this.countriesCache.sort((a, b) => a.name.localeCompare(b.name));
          
          console.log(`✅ Loaded ${this.countriesCache.length} active countries from Firebase`);
          return this.countriesCache;
        }
      } catch (error) {
        console.warn('Error fetching countries from Firebase, using defaults:', error);
      }
    }

    // Fallback to default countries (only active ones)
    this.countriesCache = DEFAULT_COUNTRIES.filter(c => c.active === true);
    console.log(`📋 Using ${this.countriesCache.length} default countries as fallback`);
    return this.countriesCache;
  }

  /**
   * Get countries synchronously (for backwards compatibility)
   */
  getCountriesSync(): Country[] {
    return this.countriesCache || DEFAULT_COUNTRIES.filter(c => c.active === true);
  }

  /**
   * Clear cache to force refresh from Firebase
   */
  clearCache() {
    this.countriesCache = null;
  }
}

