import { Injectable, OnDestroy } from '@angular/core';
import { Country, DEFAULT_COUNTRIES } from '../models/country.model';
import { FirebaseService } from '../../core/services/firebase.service';
import { CacheService } from '../../core/services/cache.service';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class CountriesService implements OnDestroy {
  private countriesCache: Country[] | null = null;
  private unsubscribeListener: Unsubscribe | null = null;
  private readonly CACHE_KEY = 'countries';
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {
    this.setupRealtimeListener();
  }

  async getCountries(): Promise<Country[]> {
    if (this.countriesCache) {
      return this.countriesCache;
    }

    const cached = this.cacheService.get<Country[]>(this.CACHE_KEY);
    if (cached && this.cacheService.isFresh(this.CACHE_KEY, this.CACHE_TTL)) {
      this.countriesCache = cached;
      this.checkForUpdatesInBackground();
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
          
          this.countriesCache.sort((a, b) => a.name.localeCompare(b.name));
          
          this.cacheService.set(this.CACHE_KEY, this.countriesCache, this.CACHE_TTL);
          return this.countriesCache;
        }
      } catch (error) {
        if (cached) {
          this.countriesCache = cached;
          return this.countriesCache;
        }
        console.warn('Error fetching countries from Firebase, using defaults:', error);
      }
    }

    if (cached) {
      this.countriesCache = cached;
      return this.countriesCache;
    }

    this.countriesCache = DEFAULT_COUNTRIES.filter(c => c.active === true);
    this.countriesCache.sort((a, b) => a.name.localeCompare(b.name));
    this.cacheService.set(this.CACHE_KEY, this.countriesCache, this.CACHE_TTL);
    return this.countriesCache;
  }

  private checkForUpdatesInBackground(): void {
    if (!this.firebaseService.isAvailable()) return;
    
    this.firebaseService.getCollection('countries').then(firebaseCountries => {
      if (firebaseCountries && firebaseCountries.length > 0) {
        const countries = firebaseCountries
          .filter(c => c.active === true)
          .map(c => ({
            code: c.code,
            name: c.name,
            flag: c.flag,
            active: true
          })) as Country[];

        countries.sort((a, b) => a.name.localeCompare(b.name));

        const cached = this.cacheService.get<Country[]>(this.CACHE_KEY);
        if (JSON.stringify(countries) !== JSON.stringify(cached)) {
          this.countriesCache = countries;
          this.cacheService.set(this.CACHE_KEY, countries, this.CACHE_TTL);
        }
      }
    }).catch(() => {
      // Silently fail background update
    });
  }

  private setupRealtimeListener(): void {
    if (!this.firebaseService.isAvailable()) return;

    try {
      const db = getFirestore();
      const countriesRef = collection(db, 'countries');

      this.unsubscribeListener = onSnapshot(countriesRef, (snapshot) => {
        const firebaseCountries = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            code: data['code'],
            name: data['name'],
            flag: data['flag'],
            active: data['active']
          };
        });

        if (firebaseCountries.length > 0) {
          const countries = firebaseCountries
            .filter(c => c.active === true)
            .map(c => ({
              code: c.code,
              name: c.name,
              flag: c.flag,
              active: true
            })) as Country[];

          countries.sort((a, b) => a.name.localeCompare(b.name));

          this.countriesCache = countries;
          this.cacheService.set(this.CACHE_KEY, countries, this.CACHE_TTL);
        }
      }, (error) => {
        console.warn('Error in countries real-time listener:', error);
      });
    } catch (error) {
      console.warn('Failed to setup countries real-time listener:', error);
    }
  }

  getCountriesSync(): Country[] {
    return this.countriesCache || DEFAULT_COUNTRIES.filter(c => c.active === true);
  }

  clearCache(): void {
    this.countriesCache = null;
    this.cacheService.remove(this.CACHE_KEY);
  }

  ngOnDestroy(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }
  }
}

