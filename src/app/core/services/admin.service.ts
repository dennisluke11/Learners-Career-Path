import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  getCountFromServer,
  getFirestore
} from 'firebase/firestore';
import { AnalyticsEvent } from '../../shared/models/analytics-event.model';
import { Career } from '../../shared/models/career.model';
import { Announcement } from '../../shared/models/announcement.model';
import { LoggingService } from './logging.service';
import { environment } from '../../../environments/environment';
import { getApp } from 'firebase/app';

export interface UsageStats {
  totalReads: number;
  totalWrites: number;
  totalStorage: number;
  documentCounts: { [collection: string]: number };
}

export interface AnalyticsStats {
  totalEvents: number;
  eventsByType: { [type: string]: number };
  eventsByCountry: { [country: string]: number };
  eventsByDevice: { [device: string]: number };
  eventsByTrafficSource: { [source: string]: number };
  recentEvents: AnalyticsEvent[];
  dailyEvents: { date: string; count: number }[];
  topEvents: { eventName: string; count: number }[];
  conversionRate: number;
  averageSessionDuration: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly ADMIN_KEY = 'admin_access_token';
  private readonly ADMIN_USERNAME_KEY = 'admin_username';
  private readonly SESSION_EXPIRY_KEY = 'admin_session_expiry';
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  
  // Cache for reducing Firestore reads
  private collectionCountsCache: { data: { [collection: string]: number } | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache (increased to reduce reads)
  private readonly MAX_ANALYTICS_DOCS = 500; // Reduced from 2000 to 500 to save on reads
  private readonly ANALYTICS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache for analytics
  private analyticsCache: { data: AnalyticsStats | null; timestamp: number; dateRange?: string } = { data: null, timestamp: 0 };

  constructor(
    private firebaseService: FirebaseService,
    private loggingService: LoggingService
  ) {}

  /**
   * Authenticate admin using Firestore adminUsers collection
   * Admin users are stored in Firestore with username and hashed password
   */
  async authenticateAdmin(username: string, password: string): Promise<boolean> {
    try {
      const db = this.getDb();
      if (!db) {
        this.loggingService.error('Firestore not initialized');
        return false;
      }

      // Query adminUsers collection for matching username
      const adminUsersRef = collection(db, 'adminUsers');
      const q = query(adminUsersRef, where('username', '==', username), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        this.loggingService.warn(`Admin user not found: ${username}`);
        return false;
      }

      const adminDoc = snapshot.docs[0];
      const adminData = adminDoc.data();

      // Check if admin is active
      if (adminData['active'] === false) {
        this.loggingService.warn(`Admin account is inactive: ${username}`);
        return false;
      }

      // Simple password comparison (in production, use proper hashing like bcrypt)
      // For now, we'll store passwords in Firestore (consider hashing in production)
      if (adminData['password'] === password) {
        const expiryTime = Date.now() + this.SESSION_DURATION;
        localStorage.setItem(this.ADMIN_KEY, 'authenticated');
        localStorage.setItem(this.ADMIN_USERNAME_KEY, username);
        localStorage.setItem(this.SESSION_EXPIRY_KEY, expiryTime.toString());
        this.loggingService.info(`Admin authenticated: ${username}`);
        return true;
      } else {
        this.loggingService.warn(`Invalid password for admin: ${username}`);
        return false;
      }
    } catch (error: any) {
      this.loggingService.error('Error authenticating admin', error);
      // If adminUsers collection doesn't exist or has permission issues, fall back to default
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        this.loggingService.warn('AdminUsers collection not accessible, using fallback authentication');
        // Fallback: Allow default admin if collection doesn't exist
        if (username === 'admin' && password === 'admin123') {
          const expiryTime = Date.now() + this.SESSION_DURATION;
          localStorage.setItem(this.ADMIN_KEY, 'authenticated');
          localStorage.setItem(this.ADMIN_USERNAME_KEY, username);
          localStorage.setItem(this.SESSION_EXPIRY_KEY, expiryTime.toString());
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Get current admin username
   */
  getCurrentAdminUsername(): string | null {
    return localStorage.getItem(this.ADMIN_USERNAME_KEY);
  }

  isAdminAuthenticated(): boolean {
    const authToken = localStorage.getItem(this.ADMIN_KEY);
    const expiryTime = localStorage.getItem(this.SESSION_EXPIRY_KEY);

    // Check if token exists
    if (authToken !== 'authenticated') {
      return false;
    }

    // Check if session has expired
    if (expiryTime) {
      const expiry = parseInt(expiryTime, 10);
      if (Date.now() > expiry) {
        // Session expired, clear it
        this.logoutAdmin();
        return false;
      }
    }

    return true;
  }

  logoutAdmin(): void {
    localStorage.removeItem(this.ADMIN_KEY);
    localStorage.removeItem(this.ADMIN_USERNAME_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
  }

  /**
   * Get remaining session time in minutes
   */
  getSessionTimeRemaining(): number {
    const expiryTime = localStorage.getItem(this.SESSION_EXPIRY_KEY);
    if (!expiryTime) {
      return 0;
    }

    const expiry = parseInt(expiryTime, 10);
    const remaining = expiry - Date.now();
    return Math.max(0, Math.floor(remaining / (60 * 1000))); // Convert to minutes
  }

  /**
   * Get Firestore instance
   */
  private getDb() {
    try {
      const app = getApp();
      return getFirestore(app);
    } catch (error) {
      this.loggingService.error('Error getting Firestore instance', error);
      return null;
    }
  }

  /**
   * Get collection counts for all major collections
   * Uses getCountFromServer when possible, falls back to getDocs estimation if rate limited
   * Implements caching to reduce Firestore reads
   * 
   * COST OPTIMIZATION: This method uses minimal reads by:
   * - Caching results for 30 minutes
   * - Using getCountFromServer (1 read per collection) when available
   * - Falling back to limited getDocs queries (max 100 docs per collection) if needed
   */
  async getCollectionCounts(): Promise<{ [collection: string]: number }> {
    // Check cache first
    const now = Date.now();
    if (this.collectionCountsCache.data && (now - this.collectionCountsCache.timestamp) < this.CACHE_DURATION) {
      this.loggingService.info('Using cached collection counts (saving Firestore reads)');
      return this.collectionCountsCache.data;
    }

    const db = this.getDb();
    if (!db) {
      this.loggingService.warn('Firestore not initialized - cannot get collection counts');
      return {};
    }

    const collections = [
      'userEvents',
      'careers',
      'countries',
      'announcements',
      'marketData',
      'studyResources',
      'fcmTokens'
    ];

    // Initialize all collections to 0 (will be updated if queries succeed)
    const counts: { [collection: string]: number } = {};
    collections.forEach(coll => {
      counts[coll] = 0;
    });
    
    let useFallbackMethod = false; // Track if we should use fallback for all collections

    // Process all collections
    for (let i = 0; i < collections.length; i++) {
      const collName = collections[i];
      
      // Add delay between queries to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      }
      
      // Try getCountFromServer first (unless we've already determined to use fallback)
      if (!useFallbackMethod) {
        try {
          const collRef = collection(db, collName);
          const snapshot = await getCountFromServer(collRef);
          counts[collName] = snapshot.data().count;
          if (i === 0) {
            this.loggingService.info(`✅ getCountFromServer works - got ${counts[collName]} for ${collName}`);
          }
        } catch (error: any) {
          // If getCountFromServer fails, switch to fallback method
          if (error?.code === 'resource-exhausted' || error?.code === 429 || 
              error?.code === 'permission-denied' || error?.message?.includes('permission')) {
            this.loggingService.warn(`getCountFromServer not available for ${collName} (${error?.code || 'error'}) - using fallback method`);
            useFallbackMethod = true;
            // Fall through to fallback method below
          } else {
            this.loggingService.error(`Error counting ${collName}`, error);
            counts[collName] = 0;
            continue; // Skip to next collection
          }
        }
      }
      
      // Use fallback method if getCountFromServer failed or was rate limited
      if (useFallbackMethod) {
        // Fallback: Use getDocs with minimal limit to reduce reads
        // Only fetch 100 documents to estimate (much cheaper than 5000)
        try {
          const collRef = collection(db, collName);
          // Use very small limit to minimize reads - this is just for estimation
          const docsQuery = query(collRef, limit(100));
          const docsSnapshot = await getDocs(docsQuery);
          const docCount = docsSnapshot.docs.length;
          
          if (docCount === 100) {
            // If we got 100, there are likely more - show as "100+"
            counts[collName] = 100; // Show minimum count
            this.loggingService.info(`⚠️ ${collName}: 100+ documents (estimated, actual count may be higher - using minimal reads)`);
          } else {
            counts[collName] = docCount;
            if (i === 0 || docCount > 0) {
              this.loggingService.info(`✅ Fallback method: ${collName} has ${docCount} documents (estimated)`);
            }
          }
        } catch (error: any) {
          if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
            this.loggingService.warn(`Cannot access ${collName} - permission denied`);
          } else if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
            this.loggingService.warn(`Quota exceeded while counting ${collName} - skipping remaining collections`);
            // Set remaining to 0 and break
            for (let j = i; j < collections.length; j++) {
              counts[collections[j]] = 0;
            }
            break;
          } else {
            this.loggingService.error(`Error estimating count for ${collName}`, error);
          }
          counts[collName] = 0;
        }
      }
      // If useFallbackMethod is false, we already got the count from getCountFromServer above
    }

    this.loggingService.info('Collection counts:', counts);
    
    // Cache the results
    this.collectionCountsCache = {
      data: counts,
      timestamp: Date.now()
    };
    
    return counts;
  }

  /**
   * Get analytics statistics from userEvents
   * Implements caching and strict limits to reduce Firestore reads
   */
  async getAnalyticsStats(dateRange?: { start: Date; end: Date }): Promise<AnalyticsStats> {
    // Check cache first
    const now = Date.now();
    const dateRangeKey = dateRange ? `${dateRange.start.getTime()}-${dateRange.end.getTime()}` : 'all';
    if (this.analyticsCache.data && 
        this.analyticsCache.dateRange === dateRangeKey &&
        (now - this.analyticsCache.timestamp) < this.ANALYTICS_CACHE_DURATION) {
      this.loggingService.info('Using cached analytics data');
      return this.analyticsCache.data;
    }

    try {
      const db = this.getDb();
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const eventsRef = collection(db, 'userEvents');
      
      // IMPORTANT: Limit query to prevent quota exceeded errors
      // Reduced to 500 documents to minimize Firestore reads and costs
      // For large datasets, use date range filters to get specific periods
      this.loggingService.info(`Fetching userEvents with limit of ${this.MAX_ANALYTICS_DOCS} documents (cost optimization)`);
      
      // If date range is provided and reasonable, try to use it in query
      let q;
      if (dateRange) {
        const rangeDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
        // Only use date filter if range is less than 90 days (to avoid index issues)
        if (rangeDays < 90) {
          try {
            const startTimestamp = Timestamp.fromDate(dateRange.start);
            const endTimestamp = Timestamp.fromDate(dateRange.end);
            q = query(
              eventsRef,
              where('timestamp', '>=', startTimestamp),
              where('timestamp', '<=', endTimestamp),
              orderBy('timestamp', 'desc'),
              limit(this.MAX_ANALYTICS_DOCS)
            );
            this.loggingService.info('Using date-filtered query to reduce reads');
          } catch (indexError: any) {
            // If index doesn't exist, fall back to simple query
            this.loggingService.warn('Date filter query failed, using simple query with limit');
            q = query(eventsRef, limit(this.MAX_ANALYTICS_DOCS));
          }
        } else {
          q = query(eventsRef, limit(this.MAX_ANALYTICS_DOCS));
        }
      } else {
        q = query(eventsRef, limit(this.MAX_ANALYTICS_DOCS));
      }

      let snapshot;
      try {
        snapshot = await getDocs(q);
        this.loggingService.info(`✅ Query successful! Returned ${snapshot.docs.length} documents`);
        
        if (snapshot.docs.length === 0) {
          this.loggingService.warn('⚠️ Query returned 0 documents');
          this.loggingService.warn('This might mean the collection is empty or there is a permissions issue');
          
          // Try with a small limit to test basic access
          try {
            const testQuery = query(eventsRef, limit(10));
            const testSnapshot = await getDocs(testQuery);
            if (testSnapshot.docs.length > 0) {
              this.loggingService.info(`✅ Can access collection - got ${testSnapshot.docs.length} test documents`);
              snapshot = testSnapshot; // Use the test results
            } else {
              this.loggingService.warn('⚠️ Even limit(10) query returns 0 documents - collection may be empty');
            }
          } catch (testError: any) {
            this.loggingService.error('❌ Test query failed:', testError);
            if (testError?.code === 'permission-denied') {
              throw new Error('Permission denied: Cannot read userEvents collection. Check Firestore rules.');
            }
          }
        } else {
          this.loggingService.info(`✅ Successfully fetched ${snapshot.docs.length} documents`);
        }
      } catch (queryError: any) {
        // If query fails, log detailed error
        this.loggingService.error('❌ Query failed with error:', queryError);
        this.loggingService.error('Error code:', queryError?.code);
        this.loggingService.error('Error message:', queryError?.message);
        
        // Try with a limited query
        try {
          const limitedQuery = query(eventsRef, limit(this.MAX_ANALYTICS_DOCS));
          snapshot = await getDocs(limitedQuery);
          this.loggingService.info(`✅ Fallback query (limited to ${this.MAX_ANALYTICS_DOCS}) returned ${snapshot.docs.length} documents`);
        } catch (simpleError: any) {
          // Check if it's a quota error
          if (simpleError?.code === 'resource-exhausted' || simpleError?.message?.includes('quota') || simpleError?.message?.includes('Quota')) {
            this.loggingService.error('❌ Firestore quota exceeded - please wait before making more queries');
            throw new Error('Firestore quota exceeded. Please wait a few minutes before refreshing. Consider using a date range filter to reduce the number of documents queried.');
          }
          // If even the simplest query fails, it's definitely a permissions issue
          this.loggingService.error('❌ Query failed - this may be a permissions or quota issue', simpleError);
          throw new Error(`Query failed: ${simpleError.message || 'Missing or insufficient permissions. Please ensure Firestore rules allow reading userEvents collection.'}`);
        }
      }

      let events: AnalyticsEvent[] = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        
        // Handle timestamp conversion - it could be Firestore Timestamp, Date, number, or string
        let timestamp: Date;
        const ts = data['timestamp'];
        
        if (!ts) {
          timestamp = new Date();
        } else if (ts._methodName === 'serverTimestamp') {
          // This is a sentinel value - timestamp wasn't processed by server yet
          // This happens when documents are written but server timestamp hasn't been resolved
          // Use current time as fallback - these events will be included
          if (index < 5) {
            this.loggingService.warn(`Document ${doc.id} has unprocessed serverTimestamp sentinel - using fallback`);
          }
          timestamp = new Date();
        } else if (ts.toDate && typeof ts.toDate === 'function') {
          // Firestore Timestamp
          timestamp = ts.toDate();
        } else if (ts instanceof Date) {
          // Already a Date object
          timestamp = ts;
        } else if (typeof ts === 'number') {
          // Unix timestamp (milliseconds or seconds)
          timestamp = new Date(ts > 1000000000000 ? ts : ts * 1000);
        } else if (typeof ts === 'string') {
          // ISO string
          timestamp = new Date(ts);
        } else if (ts.seconds !== undefined) {
          // Firestore Timestamp object (alternative format)
          timestamp = new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
        } else {
          // Fallback - log first few unexpected formats
          if (index < 5) {
            this.loggingService.warn('Unexpected timestamp format', { timestamp: ts, type: typeof ts, docId: doc.id });
          }
          timestamp = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp: timestamp
        } as AnalyticsEvent;
      });

      this.loggingService.info(`Fetched ${events.length} events from Firestore before date filtering`);
      
      // Warn if we hit the limit
      if (events.length >= this.MAX_ANALYTICS_DOCS) {
        this.loggingService.warn(`⚠️ Query limit reached (${this.MAX_ANALYTICS_DOCS} documents). Results may be incomplete. Consider using a date range filter.`);
      }

      // Filter out events with completely invalid timestamps (NaN dates)
      const validEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return !isNaN(eventDate.getTime());
      });
      
      const invalidCount = events.length - validEvents.length;
      if (invalidCount > 0) {
        this.loggingService.warn(`Filtered out ${invalidCount} events with invalid timestamps`);
      }
      
      events = validEvents;

      // Sort by timestamp in memory if we couldn't use orderBy in query
      events.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      // Filter by date range in memory (always do this since we can't rely on query filters)
      if (dateRange) {
        const beforeFilter = events.length;
        
        // Check if date range is very wide (more than 2 years) - if so, don't filter
        const rangeDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
        const isWideRange = rangeDays > 730; // More than 2 years
        
        if (isWideRange) {
          this.loggingService.info(`Date range is very wide (${Math.round(rangeDays)} days) - including all events`);
          // Don't filter, use all events
        } else {
          events = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= dateRange.start && eventDate <= dateRange.end;
          });
          this.loggingService.info(`After date range filter (${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}): ${events.length} events (filtered out ${beforeFilter - events.length})`);
          
          // If all events were filtered out, warn user and show actual event dates
          if (events.length === 0 && beforeFilter > 0) {
            this.loggingService.warn(`⚠️ All ${beforeFilter} events were filtered out by date range. Events may be outside the selected range.`);
            
            // Find the actual date range of ALL events (before filtering)
            const allEventDates = validEvents.map(e => new Date(e.timestamp).getTime()).filter(d => !isNaN(d));
            if (allEventDates.length > 0) {
              const minDate = new Date(Math.min(...allEventDates));
              const maxDate = new Date(Math.max(...allEventDates));
              this.loggingService.warn(`📅 All events date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
              this.loggingService.warn(`📅 Selected date range: ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}`);
              this.loggingService.warn(`💡 Tip: Click "Load All Events" to see all ${beforeFilter} events regardless of date range`);
            }
          }
        }
      } else {
        // Filter last 90 days in memory if needed
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const beforeFilter = events.length;
        events = events.filter(event => {
          const eventDate = new Date(event.timestamp);
          return eventDate >= ninetyDaysAgo;
        });
        this.loggingService.info(`After 90-day filter: ${events.length} events (filtered out ${beforeFilter - events.length})`);
        
        // If no events in last 90 days, but we have events, warn user
        if (events.length === 0 && beforeFilter > 0) {
          this.loggingService.warn(`No events in last 90 days, but ${beforeFilter} total events exist. Consider expanding date range or clicking "Load All Events".`);
          
          // Find the actual date range of events
          const eventDates = validEvents.map(e => new Date(e.timestamp).getTime()).filter(d => !isNaN(d));
          if (eventDates.length > 0) {
            const minDate = new Date(Math.min(...eventDates));
            const maxDate = new Date(Math.max(...eventDates));
            this.loggingService.warn(`Events date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
          }
        }
      }

      // Calculate statistics
      const stats: AnalyticsStats = {
        totalEvents: events.length,
        eventsByType: {},
        eventsByCountry: {},
        eventsByDevice: {},
        eventsByTrafficSource: {},
        recentEvents: events.slice(0, 50),
        dailyEvents: [],
        topEvents: [],
        conversionRate: 0,
        averageSessionDuration: 0
      };

      // Group by type
      events.forEach(event => {
        stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
        
        if (event.country) {
          stats.eventsByCountry[event.country] = (stats.eventsByCountry[event.country] || 0) + 1;
        }
        
        if (event.deviceType) {
          stats.eventsByDevice[event.deviceType] = (stats.eventsByDevice[event.deviceType] || 0) + 1;
        }
        
        if (event.trafficSource) {
          stats.eventsByTrafficSource[event.trafficSource] = 
            (stats.eventsByTrafficSource[event.trafficSource] || 0) + 1;
        }
      });

      // Calculate daily events
      const dailyMap: { [date: string]: number } = {};
      events.forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        dailyMap[date] = (dailyMap[date] || 0) + 1;
      });
      stats.dailyEvents = Object.entries(dailyMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate top events
      const eventNameMap: { [name: string]: number } = {};
      events.forEach(event => {
        eventNameMap[event.eventName] = (eventNameMap[event.eventName] || 0) + 1;
      });
      stats.topEvents = Object.entries(eventNameMap)
        .map(([eventName, count]) => ({ eventName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate conversion rate (conversion events / total events)
      const conversionEvents = events.filter(e => e.eventType === 'conversion').length;
      stats.conversionRate = events.length > 0 ? (conversionEvents / events.length) * 100 : 0;

      // Calculate average session duration
      const sessionsWithDuration = events.filter(e => e.sessionDuration).map(e => e.sessionDuration!);
      if (sessionsWithDuration.length > 0) {
        stats.averageSessionDuration = 
          sessionsWithDuration.reduce((a, b) => a + b, 0) / sessionsWithDuration.length;
      }

      // Cache the results
      this.analyticsCache = {
        data: stats,
        timestamp: Date.now(),
        dateRange: dateRangeKey
      };

      return stats;
    } catch (error: any) {
      this.loggingService.error('Error fetching analytics stats', error);
      
      // Check for quota errors and provide helpful message
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota') || error?.message?.includes('Quota')) {
        throw new Error('Firestore quota exceeded. Please wait a few minutes before refreshing. Try using a date range filter to reduce the number of documents queried.');
      }
      
      throw error;
    }
  }

  /**
   * Get all careers
   */
  async getCareers(): Promise<Career[]> {
    return await this.firebaseService.getCollection('careers');
  }

  /**
   * Get all announcements
   */
  async getAnnouncements(): Promise<Announcement[]> {
    return await this.firebaseService.getCollection('announcements');
  }

  /**
   * Get user events with pagination
   */
  async getUserEvents(limitCount: number = 100): Promise<AnalyticsEvent[]> {
    try {
      const db = this.getDb();
      if (!db) {
        return [];
      }

      const eventsRef = collection(db, 'userEvents');
      const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc, index) => {
        const data = doc.data();
        
        // Handle timestamp conversion - it could be Firestore Timestamp, Date, number, or string
        let timestamp: Date;
        const ts = data['timestamp'];
        
        if (!ts) {
          timestamp = new Date();
        } else if (ts._methodName === 'serverTimestamp') {
          // This is a sentinel value - timestamp wasn't processed by server yet
          // Use current time as fallback
          if (index < 3) {
            this.loggingService.warn(`Document ${doc.id} has unprocessed serverTimestamp - using fallback`);
          }
          timestamp = new Date();
        } else if (ts.toDate && typeof ts.toDate === 'function') {
          // Firestore Timestamp
          timestamp = ts.toDate();
        } else if (ts instanceof Date) {
          // Already a Date object
          timestamp = ts;
        } else if (typeof ts === 'number') {
          // Unix timestamp (milliseconds or seconds)
          timestamp = new Date(ts > 1000000000000 ? ts : ts * 1000);
        } else if (typeof ts === 'string') {
          // ISO string
          timestamp = new Date(ts);
        } else if (ts.seconds !== undefined) {
          // Firestore Timestamp object (alternative format)
          timestamp = new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
        } else {
          // Fallback
          if (index < 3) {
            this.loggingService.warn('Unexpected timestamp format', { timestamp: ts, type: typeof ts, docId: doc.id });
          }
          timestamp = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp: timestamp
        } as AnalyticsEvent;
      });
    } catch (error) {
      this.loggingService.error('Error fetching user events', error);
      return [];
    }
  }

  /**
   * Get usage statistics
   * Note: Actual Firebase usage stats require Admin SDK or Firebase Console API
   * This provides document counts as a proxy
   */
  async getUsageStats(): Promise<UsageStats> {
    const documentCounts = await this.getCollectionCounts();
    
    // Calculate approximate storage (rough estimate: 1KB per document)
    const totalStorage = Object.values(documentCounts).reduce((sum, count) => sum + count, 0) * 1024;

    return {
      totalReads: 0, // Requires Admin SDK or Firebase Console API
      totalWrites: 0, // Requires Admin SDK or Firebase Console API
      totalStorage,
      documentCounts
    };
  }
}

