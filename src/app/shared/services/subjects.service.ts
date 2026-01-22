import { Injectable } from '@angular/core';
import { SubjectMapping, getSubjectsForCountry, CountrySubjectsData, EitherOrGroup } from '../models/subject.model';
import { FirebaseService } from '../../core/services/firebase.service';
import { CacheService } from '../../core/services/cache.service';
import { LoggingService } from '../../core/services/logging.service';

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private countryDataCache: { [countryCode: string]: CountrySubjectsData } = {};

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService,
    private loggingService: LoggingService
  ) {}

  async getSubjectsForCountry(countryCode: string): Promise<SubjectMapping[]> {
    const data = await this.getCountrySubjectsData(countryCode);
    return data.subjects;
  }

  async getCountrySubjectsData(countryCode: string): Promise<CountrySubjectsData> {
    const cacheKey = `countrySubjectsData_${countryCode}`;
    
    // Check in-memory cache first, but verify it has eitherOrGroups
    if (this.countryDataCache[countryCode]) {
      const cached = this.countryDataCache[countryCode];
      // If cache exists but eitherOrGroups is missing, refresh from Firestore
      if (cached.eitherOrGroups === undefined || (Array.isArray(cached.eitherOrGroups) && cached.eitherOrGroups.length === 0)) {
        this.loggingService.debug(`[SubjectsService] Cache for ${countryCode} missing eitherOrGroups, refreshing from Firestore...`);
        // Clear cache and fetch fresh
        delete this.countryDataCache[countryCode];
        this.cacheService.remove(cacheKey);
      } else {
        return cached;
      }
    }
    
    const cached = this.cacheService.get<CountrySubjectsData>(cacheKey);
    if (cached && this.cacheService.isFresh(cacheKey, this.CACHE_TTL)) {
      // Verify cached data has eitherOrGroups
      if (!cached.eitherOrGroups || cached.eitherOrGroups.length === 0) {
        this.loggingService.debug(`[SubjectsService] Cached data for ${countryCode} missing eitherOrGroups, refreshing...`);
        this.cacheService.remove(cacheKey);
      } else {
        this.countryDataCache[countryCode] = cached;
        return cached;
      }
    }

    if (this.firebaseService.isAvailable()) {
      try {
        const countrySubjects = await this.firebaseService.getDocument('countrySubjects', countryCode);
        if (countrySubjects) {
          const data: CountrySubjectsData = {
            subjects: countrySubjects.subjects || [],
            subjectAliases: countrySubjects.subjectAliases || {},
            eitherOrGroups: countrySubjects.eitherOrGroups || [],
            mandatorySubjects: countrySubjects.mandatorySubjects || []
          };
          
          this.loggingService.debug(`[SubjectsService] Loaded data for ${countryCode}:`, {
            subjectsCount: data.subjects.length,
            eitherOrGroupsCount: data.eitherOrGroups?.length || 0
          });
          
          this.cacheService.set(cacheKey, data, this.CACHE_TTL);
          this.countryDataCache[countryCode] = data;
          return data;
        }
      } catch (error) {
        if (cached) {
          this.countryDataCache[countryCode] = cached;
          return cached;
        }
        this.loggingService.error(`Error fetching subjects for ${countryCode} from Firebase:`, error);
        throw new Error(`Subjects not found for ${countryCode} in Firestore. Please ensure countrySubjects collection is populated.`);
      }
    }

    throw new Error(`Subjects not found for ${countryCode} in Firestore. Please ensure countrySubjects collection is populated.`);
  }

  async getEitherOrGroups(countryCode: string): Promise<EitherOrGroup[]> {
    const data = await this.getCountrySubjectsData(countryCode);
    return (data.eitherOrGroups && Array.isArray(data.eitherOrGroups)) ? data.eitherOrGroups : [];
  }

  async getMandatorySubjects(countryCode: string): Promise<string[]> {
    const data = await this.getCountrySubjectsData(countryCode);
    // Combine mandatorySubjects array with subjects marked as required: true
    const mandatoryFromArray = data.mandatorySubjects || [];
    const mandatoryFromRequired = data.subjects
      .filter(s => s.required)
      .map(s => s.standardName);
    
    // Merge and deduplicate
    return Array.from(new Set([...mandatoryFromArray, ...mandatoryFromRequired]));
  }
}

