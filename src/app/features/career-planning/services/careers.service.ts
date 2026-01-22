import { Injectable, OnDestroy } from '@angular/core';
import { Career } from '../../../shared/models/career.model';
import { FirebaseService } from '../../../core/services/firebase.service';
import { CacheService } from '../../../core/services/cache.service';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class CareersService implements OnDestroy {
  private careersCache: Career[] | null = null;
  private unsubscribeListener: Unsubscribe | null = null;
  private readonly CACHE_KEY = 'careers';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {
    this.setupRealtimeListener();
  }

  async getCareers(): Promise<Career[]> {
    if (this.careersCache) {
      return this.careersCache;
    }

    const cached = this.cacheService.get<Career[]>(this.CACHE_KEY);
    if (cached && this.cacheService.isFresh(this.CACHE_KEY, this.CACHE_TTL)) {
      this.careersCache = cached;
      this.checkForUpdatesInBackground();
      return this.careersCache;
    }

    if (!this.firebaseService.isAvailable()) {
      if (cached) {
        this.careersCache = cached;
        return this.careersCache;
      }
      throw new Error('Firebase is not available. Please check your connection and Firebase configuration.');
    }

    try {
      const firebaseCareers = await this.firebaseService.getCollection('careers');
      
      if (!firebaseCareers || firebaseCareers.length === 0) {
        if (cached) {
          this.careersCache = cached;
          return this.careersCache;
        }
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
      
      this.careersCache = mappedCareers;
      this.cacheService.set(this.CACHE_KEY, mappedCareers, this.CACHE_TTL);
      return this.careersCache;
    } catch (error: any) {
      if (cached) {
        this.careersCache = cached;
        return this.careersCache;
      }
      console.error('❌ Error fetching careers from Firebase:', error);
      throw new Error(`Failed to load careers: ${error.message || error}`);
    }
  }

  private checkForUpdatesInBackground(): void {
    if (!this.firebaseService.isAvailable()) return;
    
    this.firebaseService.getCollection('careers').then(firebaseCareers => {
      if (firebaseCareers && firebaseCareers.length > 0) {
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

        const cached = this.cacheService.get<Career[]>(this.CACHE_KEY);
        if (JSON.stringify(mappedCareers) !== JSON.stringify(cached)) {
          this.careersCache = mappedCareers;
          this.cacheService.set(this.CACHE_KEY, mappedCareers, this.CACHE_TTL);
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
      const careersRef = collection(db, 'careers');

      this.unsubscribeListener = onSnapshot(careersRef, (snapshot) => {
        const firebaseCareers = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data['name'],
            minGrades: data['minGrades'] || {},
            countryBaselines: data['countryBaselines'] || {},
            qualificationLevels: data['qualificationLevels'] || {},
            category: data['category'],
            verificationStatus: data['verificationStatus'],
            lastVerified: data['lastVerified'],
            sources: data['sources'] || {}
          };
        });

        if (firebaseCareers.length > 0) {
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

          this.careersCache = mappedCareers;
          this.cacheService.set(this.CACHE_KEY, mappedCareers, this.CACHE_TTL);
        }
      }, (error) => {
        console.warn('Error in careers real-time listener:', error);
      });
    } catch (error) {
      console.warn('Failed to setup careers real-time listener:', error);
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
    this.cacheService.remove(this.CACHE_KEY);
  }

  ngOnDestroy(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }
  }
}

