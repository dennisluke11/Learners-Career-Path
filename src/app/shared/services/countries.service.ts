import { Injectable } from '@angular/core';
import { Country, DEFAULT_COUNTRIES } from '../models/country.model';
import { FirebaseService } from '../../core/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private countriesCache: Country[] | null = null;

  constructor(private firebaseService: FirebaseService) {}

  async getCountries(): Promise<Country[]> {
    if (this.countriesCache) {
      return this.countriesCache;
    }

    if (this.firebaseService.isAvailable()) {
      try {
        const firebaseCountries = await this.firebaseService.getCollection('countries');
        if (firebaseCountries && firebaseCountries.length > 0) {
          this.countriesCache = firebaseCountries
            .filter(c => c.active === true)
            .map(c => ({
              code: c.code,
              name: c.name,
              flag: c.flag,
              active: true
            })) as Country[];
          
          // Sort countries, but put South Africa (ZA) first
          this.countriesCache.sort((a, b) => {
            if (a.code === 'ZA') return -1;
            if (b.code === 'ZA') return 1;
            return a.name.localeCompare(b.name);
          });
          
          console.log(`✅ Loaded ${this.countriesCache.length} active countries from Firebase`);
          return this.countriesCache;
        }
      } catch (error) {
        console.warn('Error fetching countries from Firebase, using defaults:', error);
      }
    }

    this.countriesCache = DEFAULT_COUNTRIES.filter(c => c.active === true);
    // Sort countries, but put South Africa (ZA) first
    this.countriesCache.sort((a, b) => {
      if (a.code === 'ZA') return -1;
      if (b.code === 'ZA') return 1;
      return a.name.localeCompare(b.name);
    });
    console.log(`📋 Using ${this.countriesCache.length} default countries as fallback`);
    return this.countriesCache;
  }

  getCountriesSync(): Country[] {
    return this.countriesCache || DEFAULT_COUNTRIES.filter(c => c.active === true);
  }

  clearCache() {
    this.countriesCache = null;
  }
}

