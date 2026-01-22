import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Announcement } from '../../shared/models/announcement.model';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private cache: Announcement[] = [];
  private cacheTimestamp: number = 0;
  private cacheDuration: number = 5 * 60 * 1000;

  constructor(
    private firebaseService: FirebaseService,
    private loggingService: LoggingService
  ) {}

  /**
   * Get announcements filtered by user context
   */
  async getAnnouncements(
    country?: string,
    career?: string,
    gradeLevel?: number
  ): Promise<Announcement[]> {
    if (!this.firebaseService.isAvailable()) {
      return this.getDefaultAnnouncements();
    }

    // Check cache
    const now = Date.now();
    if (this.cache.length > 0 && (now - this.cacheTimestamp) < this.cacheDuration) {
      const filtered = this.filterAnnouncements(this.cache, country, career, gradeLevel);
      this.loggingService.debug(`Using cache: ${this.cache.length} announcements, filtered to ${filtered.length}`, { country, career, gradeLevel });
      return filtered;
    }

    try {
      const db = getFirestore();
      const announcementsRef = collection(db, 'announcements');
      
      // Query: active announcements only (filter dates in memory to avoid composite index)
      // This avoids needing a composite index for multiple range filters
      const currentDate = new Date();
      const q = query(
        announcementsRef,
        where('isActive', '==', true),
        limit(100) // Fetch more to account for date filtering
      );

      const querySnapshot = await getDocs(q);
      const announcements: Announcement[] = [];

      if (querySnapshot.empty) {
        this.loggingService.warn('No active announcements found in Firestore');
        return [];
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const startDate = data['startDate']?.toDate ? data['startDate'].toDate() : new Date();
        const endDate = data['endDate']?.toDate ? data['endDate'].toDate() : new Date();
        const createdAt = data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date();
        const updatedAt = data['updatedAt']?.toDate ? data['updatedAt'].toDate() : new Date();
        
        // Filter by date range in memory
        if (startDate <= currentDate && endDate >= currentDate) {
          announcements.push({
            id: doc.id,
            ...data,
            startDate: startDate,
            endDate: endDate,
            createdAt: createdAt,
            updatedAt: updatedAt
          } as Announcement);
        }
      });

      // Update cache
      this.cache = announcements;
      this.cacheTimestamp = Date.now();

      this.loggingService.debug(`Fetched ${querySnapshot.size} active announcements from Firestore, ${announcements.length} within date range`);
      if (querySnapshot.size > 0 && announcements.length === 0) {
        this.loggingService.warn(`Found ${querySnapshot.size} active announcements but none are within the current date range`);
      }

      const filtered = this.filterAnnouncements(announcements, country, career, gradeLevel);
      this.loggingService.debug(`Filtered ${announcements.length} announcements to ${filtered.length}`, { country, career, gradeLevel });
      if (filtered.length === 0 && announcements.length > 0) {
        this.loggingService.warn('All announcements were filtered out. Check if country/career/gradeLevel filters are too restrictive');
      }
      return filtered;
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        this.loggingService.warn('Permission denied - using default announcements. Please check Firestore security rules');
      } else {
        this.loggingService.error('Error fetching announcements', error);
      }
      return this.getDefaultAnnouncements();
    }
  }

  /**
   * Filter announcements by user context
   * Country is the primary filter - grade level and career are optional
   */
  private filterAnnouncements(
    announcements: Announcement[],
    country?: string,
    career?: string,
    gradeLevel?: number
  ): Announcement[] {
    this.loggingService.debug(`Filtering ${announcements.length} announcements`, { country, career, gradeLevel });

    return announcements.filter(announcement => {
      let passesFilter = true;
      const reasons: string[] = [];

      if (announcement.targetCountries && announcement.targetCountries.length > 0) {
        if (!country) {
          passesFilter = false;
          reasons.push('no country selected but announcement requires country');
        } else if (!announcement.targetCountries.includes(country)) {
          passesFilter = false;
          reasons.push(`country ${country} not in ${announcement.targetCountries.join(', ')}`);
        }
      }

      // Filter by career - only if both user selected career AND announcement specifies careers
      if (career && announcement.targetCareers && announcement.targetCareers.length > 0) {
        if (!announcement.targetCareers.includes(career)) {
          passesFilter = false;
          reasons.push(`career ${career} not in ${announcement.targetCareers.join(', ')}`);
        }
      }
      // If announcement has no career restrictions, show to all careers

      // Filter by grade level - grade level is optional
      // If user hasn't selected grade level, show announcement anyway (they might be the right grade)
      // If user has selected grade level AND announcement specifies grade levels, they must match
      if (gradeLevel !== undefined && announcement.targetGradeLevels && announcement.targetGradeLevels.length > 0) {
        // User has selected a grade level AND announcement has grade level restrictions
        if (!announcement.targetGradeLevels.includes(gradeLevel)) {
          // User's grade level doesn't match, don't show
          passesFilter = false;
          reasons.push(`grade level ${gradeLevel} not in ${announcement.targetGradeLevels.join(', ')}`);
        }
      }
      // If user hasn't selected grade level, show announcement anyway (grade level is optional)
      // If announcement has no grade level restrictions, show to all grade levels

      if (!passesFilter) {
        this.loggingService.debug(`Filtered out "${announcement.title}"`, { reasons: reasons.join('; ') });
      }

      return passesFilter;
    }).sort((a, b) => {
      // Sort by priority (higher first), then by date (newer first)
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // If priorities are equal, sort by creation date (newer first)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  /**
   * Track announcement view
   */
  async trackView(announcementId: string): Promise<void> {
    if (!this.firebaseService.isAvailable() || !announcementId) {
      return;
    }

    try {
      const db = getFirestore();
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        views: increment(1)
      });
    } catch (error: any) {
      if (error?.code !== 'permission-denied' && !error?.message?.includes('permissions')) {
        this.loggingService.warn('Error tracking announcement view', error);
      }
    }
  }

  /**
   * Track announcement click
   */
  async trackClick(announcementId: string): Promise<void> {
    if (!this.firebaseService.isAvailable() || !announcementId) {
      return;
    }

    try {
      const db = getFirestore();
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        clicks: increment(1)
      });
    } catch (error: any) {
      if (error?.code !== 'permission-denied' && !error?.message?.includes('permissions')) {
        this.loggingService.warn('Error tracking announcement click', error);
      }
    }
  }

  /**
   * Get default announcements (fallback) - Returns empty array to enforce Firestore-only data
   */
  private getDefaultAnnouncements(): Announcement[] {
    this.loggingService.warn('No announcements available. Possible reasons: no announcements in Firestore, permission errors, all filtered out, or outside date range');
    return [];
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = [];
    this.cacheTimestamp = 0;
  }
}

