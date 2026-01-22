import { Injectable } from '@angular/core';
import { SubjectMapping, getSubjectsForCountry, CountrySubjectsData, EitherOrGroup } from '../models/subject.model';
import { FirebaseService } from '../../core/services/firebase.service';
import { CacheService } from '../../core/services/cache.service';

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private countryDataCache: { [countryCode: string]: CountrySubjectsData } = {};

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {}

  async getSubjectsForCountry(countryCode: string): Promise<SubjectMapping[]> {
    const data = await this.getCountrySubjectsData(countryCode);
    return data.subjects;
  }

  async getCountrySubjectsData(countryCode: string): Promise<CountrySubjectsData> {
    const cacheKey = `countrySubjectsData_${countryCode}`;
    
    // Check in-memory cache first
    if (this.countryDataCache[countryCode]) {
      return this.countryDataCache[countryCode];
    }
    
    const cached = this.cacheService.get<CountrySubjectsData>(cacheKey);
    if (cached && this.cacheService.isFresh(cacheKey, this.CACHE_TTL)) {
      this.countryDataCache[countryCode] = cached;
      return cached;
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
          
          this.cacheService.set(cacheKey, data, this.CACHE_TTL);
          this.countryDataCache[countryCode] = data;
          return data;
        }
      } catch (error) {
        if (cached) {
          this.countryDataCache[countryCode] = cached;
          return cached;
        }
        console.error(`Error fetching subjects for ${countryCode} from Firebase:`, error);
        throw new Error(`Subjects not found for ${countryCode} in Firestore. Please ensure countrySubjects collection is populated.`);
      }
    }

    throw new Error(`Subjects not found for ${countryCode} in Firestore. Please ensure countrySubjects collection is populated.`);
  }

  async getEitherOrGroups(countryCode: string): Promise<EitherOrGroup[]> {
    const data = await this.getCountrySubjectsData(countryCode);
    return data.eitherOrGroups || [];
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

