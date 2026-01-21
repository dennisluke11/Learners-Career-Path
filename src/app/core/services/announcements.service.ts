import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Announcement } from '../../shared/models/announcement.model';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private cache: Announcement[] = [];
  private cacheTimestamp: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  constructor(private firebaseService: FirebaseService) {}

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
      console.log(`[AnnouncementsService] Using cache: ${this.cache.length} announcements, filtered to ${filtered.length} for country: ${country}, career: ${career}, gradeLevel: ${gradeLevel}`);
      return filtered;
    }

    try {
      const db = getFirestore();
      const announcementsRef = collection(db, 'announcements');
      
      // Query: active announcements, within date range
      // Note: We sort by priority in memory to avoid composite index requirements
      const currentDate = new Date();
      const q = query(
        announcementsRef,
        where('isActive', '==', true),
        where('startDate', '<=', Timestamp.fromDate(currentDate)),
        where('endDate', '>=', Timestamp.fromDate(currentDate)),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const announcements: Announcement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const startDate = data['startDate']?.toDate ? data['startDate'].toDate() : new Date();
        const endDate = data['endDate']?.toDate ? data['endDate'].toDate() : new Date();
        const createdAt = data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date();
        const updatedAt = data['updatedAt']?.toDate ? data['updatedAt'].toDate() : new Date();
        
        announcements.push({
          id: doc.id,
          ...data,
          startDate: startDate,
          endDate: endDate,
          createdAt: createdAt,
          updatedAt: updatedAt
        } as Announcement);
      });

      // Update cache
      this.cache = announcements;
      this.cacheTimestamp = Date.now();

      console.log(`[AnnouncementsService] Raw announcements from Firestore:`, announcements.map(a => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        targetCountries: a.targetCountries,
        targetGradeLevels: a.targetGradeLevels,
        isActive: a.isActive
      })));

      const filtered = this.filterAnnouncements(announcements, country, career, gradeLevel);
      console.log(`[AnnouncementsService] Fetched ${announcements.length} announcements, filtered to ${filtered.length} for country: ${country}, career: ${career}, gradeLevel: ${gradeLevel}`);
      console.log(`[AnnouncementsService] Filtered announcements:`, filtered.map(a => ({
        id: a.id,
        title: a.title,
        priority: a.priority
      })));
      return filtered;
    } catch (error: any) {
      // Handle permission errors gracefully - use defaults instead of spamming console
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.warn('[AnnouncementsService] Permission denied - using default announcements. Please check Firestore security rules.');
      } else {
        console.error('[AnnouncementsService] Error fetching announcements:', error);
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
    console.log(`[AnnouncementsService] Filtering ${announcements.length} announcements with filters:`, {
      country,
      career,
      gradeLevel
    });

    return announcements.filter(announcement => {
      let passesFilter = true;
      const reasons: string[] = [];

      // Filter by country - if announcement specifies countries, user must match
      // If announcement has no country restrictions, show to all
      if (announcement.targetCountries && announcement.targetCountries.length > 0) {
        // Announcement has country restrictions
        if (!country) {
          // User hasn't selected country, don't show country-specific announcements
          passesFilter = false;
          reasons.push('no country selected but announcement requires country');
        } else if (!announcement.targetCountries.includes(country)) {
          // User's country doesn't match announcement's target countries
          passesFilter = false;
          reasons.push(`country ${country} not in ${announcement.targetCountries.join(', ')}`);
        }
      }
      // If announcement has no country restrictions, show to all (including when country is selected)

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
        console.log(`[AnnouncementsService] Filtered out "${announcement.title}":`, reasons.join('; '));
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
      // Silently fail for permission errors to avoid console spam
      // The app should work even if analytics tracking fails
      if (error?.code !== 'permission-denied' && !error?.message?.includes('permissions')) {
        console.warn('[AnnouncementsService] Error tracking announcement view:', error);
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
      // Silently fail for permission errors to avoid console spam
      // The app should work even if analytics tracking fails
      if (error?.code !== 'permission-denied' && !error?.message?.includes('permissions')) {
        console.warn('[AnnouncementsService] Error tracking announcement click:', error);
      }
    }
  }

  /**
   * Get default announcements (fallback)
   */
  private getDefaultAnnouncements(): Announcement[] {
    return [
      {
        id: 'default-1',
        title: 'Welcome to Learner\'s Career Path',
        content: 'Start your career journey by selecting your country, grade level, and entering your grades to discover your path to success.',
        type: 'general',
        priority: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true,
        isPaid: false,
        actionButton: {
          text: 'For More Details',
          url: '#',
          type: 'internal'
        }
      }
    ];
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = [];
    this.cacheTimestamp = 0;
  }
}

