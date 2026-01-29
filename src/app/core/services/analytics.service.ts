import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { AnalyticsEvent, AnalyticsConfig } from '../../shared/models/analytics-event.model';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private config: AnalyticsConfig = {
    enabled: true,
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
    includeUserData: true
  };

  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: any = null;
  private sessionId: string = this.generateSessionId();
  private sessionStartTime: number = Date.now();
  private sessionInteractions: number = 0;
  private visitCount: number = 0;
  private lastVisitDate: string | null = null;
  private userId: string = this.getOrCreateUserId();

  constructor(
    private firebaseService: FirebaseService,
    private loggingService: LoggingService
  ) {
    this.loadConfig();
    this.initializeSession();
    
    if (this.config.enabled) {
      this.startFlushTimer();
    }

    this.trackEvent('view', 'app_initialized', {
      componentName: 'AppComponent'
    });
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('analytics_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      this.loggingService.warn('Failed to load analytics config', error);
    }
  }

  private initializeSession(): void {
    const lastVisit = localStorage.getItem('last_visit_date');
    const visitCountStr = localStorage.getItem('visit_count');
    
    this.visitCount = visitCountStr ? parseInt(visitCountStr, 10) + 1 : 1;
    this.lastVisitDate = lastVisit;
    
    localStorage.setItem('visit_count', this.visitCount.toString());
    localStorage.setItem('last_visit_date', new Date().toISOString());
    
    let daysSinceLastVisit: number | undefined;
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      const now = new Date();
      daysSinceLastVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    this.trackEvent('engagement', 'session_started', {
      isReturningUser: !!lastVisit,
      visitCount: this.visitCount,
      daysSinceLastVisit: daysSinceLastVisit,
      trafficSource: this.detectTrafficSource(),
      referralSource: this.getReferralSource(),
      deviceType: this.getDeviceType(),
      browserType: this.getBrowserType()
    });
    
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });
  }

  private detectTrafficSource(): 'direct' | 'organic' | 'social' | 'referral' | 'paid' | 'email' | 'unknown' {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    if (urlParams.get('utm_source')) {
      const utmSource = urlParams.get('utm_source')?.toLowerCase() || '';
      if (utmSource.includes('google') || utmSource.includes('facebook') || utmSource.includes('ad')) {
        return 'paid';
      }
    }
    
    if (urlParams.get('gclid') || urlParams.get('fbclid')) {
      return 'paid';
    }
    
    if (!referrer) {
      return 'direct';
    }
    
    const referrerHost = new URL(referrer).hostname.toLowerCase();
    
    if (referrerHost.includes('facebook') || referrerHost.includes('twitter') || 
        referrerHost.includes('instagram') || referrerHost.includes('linkedin') ||
        referrerHost.includes('whatsapp') || referrerHost.includes('telegram')) {
      return 'social';
    }
    
    if (referrerHost.includes('google') || referrerHost.includes('bing') || 
        referrerHost.includes('yahoo') || referrerHost.includes('duckduckgo')) {
      return 'organic';
    }
    
    if (referrerHost.includes('mail') || referrerHost.includes('email')) {
      return 'email';
    }
    
    if (referrerHost) {
      return 'referral';
    }
    
    return 'unknown';
  }

  private getReferralSource(): string | undefined {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref') || urlParams.get('referral') || urlParams.get('source') || undefined;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private getBrowserType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    if (userAgent.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  private trackSessionEnd(): void {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    this.trackEvent('engagement', 'session_ended', {
      sessionDuration: sessionDuration,
      interactionsCount: this.sessionInteractions
    });
    this.forceFlush();
  }

  /**
   * Track a click event
   */
  trackClick(
    eventName: string,
    elementId?: string,
    elementType?: string,
    elementText?: string,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('click', eventName, {
      elementId,
      elementType,
      elementText,
      ...metadata
    });
  }

  trackEvent(
    eventType: AnalyticsEvent['eventType'],
    eventName: string,
    metadata?: {
      componentName?: string;
      elementId?: string;
      elementType?: string;
      elementText?: string;
      url?: string;
      country?: string;
      gradeLevel?: string;
      career?: string;
      sectionName?: string;
      timeOnSection?: number;
      conversionValue?: number;
      affiliateProgram?: string;
      userJourneyStage?: string;
      [key: string]: any;
    }
  ): void {
    if (!this.config.enabled) {
      return;
    }

    this.sessionInteractions++;
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);

    const event: AnalyticsEvent = {
      eventType,
      eventName,
      componentName: metadata?.componentName,
      elementId: metadata?.elementId,
      elementType: metadata?.elementType,
      elementText: metadata?.elementText,
      url: window.location.href,
      metadata: this.sanitizeMetadata(metadata),
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      country: metadata?.country,
      gradeLevel: metadata?.gradeLevel,
      career: metadata?.career,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      deviceType: metadata?.['deviceType'] || this.getDeviceType(),
      browserType: metadata?.['browserType'] || this.getBrowserType(),
      trafficSource: metadata?.['trafficSource'] || this.detectTrafficSource(),
      referralSource: metadata?.['referralSource'] || this.getReferralSource(),
      sessionDuration: sessionDuration,
      isReturningUser: this.visitCount > 1,
      visitCount: this.visitCount,
      daysSinceLastVisit: this.lastVisitDate ? 
        Math.floor((Date.now() - new Date(this.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        undefined,
      sectionName: metadata?.['sectionName'],
      timeOnSection: metadata?.['timeOnSection'],
      interactionsCount: this.sessionInteractions,
      conversionValue: metadata?.['conversionValue'],
      affiliateProgram: metadata?.['affiliateProgram'],
      userJourneyStage: metadata?.['userJourneyStage']
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flushEvents();
    }
  }

  trackChange(
    eventName: string,
    oldValue: any,
    newValue: any,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('change', eventName, {
      oldValue: String(oldValue),
      newValue: String(newValue),
      ...metadata
    });
  }

  trackView(
    viewName: string,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('view', viewName, {
      ...metadata
    });
  }

  trackSelect(
    selectName: string,
    selectedValue: any,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('select', selectName, {
      selectedValue: String(selectedValue),
      ...metadata
    });
  }

  trackSectionView(
    sectionName: string,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('view', 'section_viewed', {
      sectionName: sectionName,
      ...metadata
    });
  }

  trackTimeOnSection(
    sectionName: string,
    timeSpent: number, // in seconds
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('engagement', 'time_on_section', {
      sectionName: sectionName,
      timeOnSection: timeSpent,
      ...metadata
    });
  }

  trackExternalLinkClick(
    linkUrl: string,
    linkText?: string,
    isAffiliate?: boolean,
    affiliateProgram?: string,
    conversionValue?: number,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent(isAffiliate ? 'conversion' : 'click', 
      isAffiliate ? 'affiliate_link_clicked' : 'external_link_clicked', {
      elementText: linkText,
      url: linkUrl,
      affiliateProgram: affiliateProgram,
      conversionValue: conversionValue,
      ...metadata
    });
  }

  trackJourneyStage(
    stage: string,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('engagement', 'journey_stage', {
      userJourneyStage: stage,
      ...metadata
    });
  }

  trackConversion(
    conversionName: string,
    conversionValue?: number,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('conversion', conversionName, {
      conversionValue: conversionValue,
      ...metadata
    });
  }

  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.firebaseService.isAvailable()) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const db = getFirestore();
      const eventsCollection = collection(db, 'userEvents');

      const promises = eventsToFlush.map(event => {
        const cleanedEvent = {
          eventType: event.eventType,
          eventName: event.eventName,
          componentName: event.componentName,
          elementId: event.elementId,
          elementType: event.elementType,
          elementText: event.elementText,
          url: event.url,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: serverTimestamp(),
          userAgent: event.userAgent,
          screenWidth: event.screenWidth,
          screenHeight: event.screenHeight,
          country: event.country || null,
          gradeLevel: event.gradeLevel || null,
          career: event.career || null,
          deviceType: event.deviceType || null,
          browserType: event.browserType || null,
          trafficSource: event.trafficSource || null,
          referralSource: event.referralSource || null,
          adCampaignSource: event.adCampaignSource || null,
          sessionDuration: event.sessionDuration || null,
          isReturningUser: event.isReturningUser !== undefined ? event.isReturningUser : null,
          visitCount: event.visitCount || null,
          daysSinceLastVisit: event.daysSinceLastVisit || null,
          sectionName: event.sectionName || null,
          timeOnSection: event.timeOnSection || null,
          interactionsCount: event.interactionsCount || null,
          conversionValue: event.conversionValue || null,
          affiliateProgram: event.affiliateProgram || null,
          userJourneyStage: event.userJourneyStage || null,
          metadata: event.metadata ? this.removeUndefinedValues(event.metadata) : {}
        };
        
        const eventData = this.removeUndefinedValues(cleanedEvent);
        return addDoc(eventsCollection, eventData);
      });

      await Promise.all(promises);
      console.log(`✅ Flushed ${eventsToFlush.length} analytics events to Firestore`);
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        this.loggingService.warn(`Analytics: Permission denied. Please check Firestore security rules. Discarding ${eventsToFlush.length} events.`);
      } else {
        this.loggingService.error('Error flushing analytics events', error);
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.flushInterval || 5000);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create a persistent user ID
   * This ID persists across sessions and is stored in localStorage
   * It's used to identify unique users for analytics
   */
  private getOrCreateUserId(): string {
    const STORAGE_KEY = 'analytics_user_id';
    
    try {
      let userId = localStorage.getItem(STORAGE_KEY);
      
      if (!userId) {
        // Generate a new unique user ID
        // Format: user_<timestamp>_<random>
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEY, userId);
        this.loggingService.info('Generated new user ID:', userId);
      }
      
      return userId;
    } catch (error) {
      // If localStorage is not available, generate a temporary ID
      // This won't persist but at least we can track the session
      this.loggingService.warn('localStorage not available, using temporary user ID');
      return `temp_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get the current user ID
   * Useful for external components that need to know the user ID
   */
  getUserId(): string {
    return this.userId;
  }

  private removeUndefinedValues(obj: { [key: string]: any }): { [key: string]: any } {
    const cleaned: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        continue;
      } else if (value === null) {
        cleaned[key] = null;
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.removeUndefinedValues(item) 
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.removeUndefinedValues(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  private sanitizeMetadata(metadata?: { [key: string]: any }): { [key: string]: any } {
    if (!metadata) return {};

    const sanitized: { [key: string]: any } = {};
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard'];

    for (const [key, value] of Object.entries(metadata)) {
      if (!sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    localStorage.setItem('analytics_config', JSON.stringify(this.config));

    if (enabled) {
      this.startFlushTimer();
    } else {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      // Flush remaining events before disabling
      this.flushEvents();
    }
  }

  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('analytics_config', JSON.stringify(this.config));

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  async forceFlush(): Promise<void> {
    await this.flushEvents();
  }
}

