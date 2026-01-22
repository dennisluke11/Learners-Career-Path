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

  constructor(
    private firebaseService: FirebaseService,
    private loggingService: LoggingService
  ) {
    // Load config from localStorage or environment
    this.loadConfig();
    
    // Start flush timer if enabled
    if (this.config.enabled) {
      this.startFlushTimer();
    }

    // Track page view on initialization
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

  /**
   * Track a generic event
   */
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
      [key: string]: any;
    }
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const event: AnalyticsEvent = {
      eventType,
      eventName,
      componentName: metadata?.componentName,
      elementId: metadata?.elementId,
      elementType: metadata?.elementType,
      elementText: metadata?.elementText,
      url: window.location.href,
      metadata: this.sanitizeMetadata(metadata),
      sessionId: this.sessionId,
      timestamp: new Date(),
      country: metadata?.country,
      gradeLevel: metadata?.gradeLevel,
      career: metadata?.career,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };

    // Add to queue
    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flushEvents();
    }
  }

  /**
   * Track a change event (e.g., dropdown selection, input change)
   */
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

  /**
   * Track a view event (e.g., component view, page view)
   */
  trackView(
    viewName: string,
    metadata?: { [key: string]: any }
  ): void {
    this.trackEvent('view', viewName, {
      ...metadata
    });
  }

  /**
   * Track a select event (e.g., career selection, country selection)
   */
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

  /**
   * Flush events to Firestore
   */
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.firebaseService.isAvailable()) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const db = getFirestore();
      const eventsCollection = collection(db, 'userEvents');

      // Add all events to Firestore
      const promises = eventsToFlush.map(event => {
        // Remove undefined values - Firestore doesn't accept them
        // Also ensure metadata is properly cleaned
        const cleanedEvent = {
          eventType: event.eventType,
          eventName: event.eventName,
          componentName: event.componentName,
          elementId: event.elementId,
          elementType: event.elementType,
          elementText: event.elementText,
          url: event.url,
          sessionId: event.sessionId,
          timestamp: serverTimestamp(),
          userAgent: event.userAgent,
          screenWidth: event.screenWidth,
          screenHeight: event.screenHeight,
          country: event.country || null,
          gradeLevel: event.gradeLevel || null,
          career: event.career || null,
          metadata: event.metadata ? this.removeUndefinedValues(event.metadata) : {}
        };
        
        const eventData = this.removeUndefinedValues(cleanedEvent);
        return addDoc(eventsCollection, eventData);
      });

      await Promise.all(promises);
      console.log(`✅ Flushed ${eventsToFlush.length} analytics events to Firestore`);
    } catch (error: any) {
      // Handle permission errors gracefully - don't spam console
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        // Permission denied - clear queue to prevent infinite retries
        this.loggingService.warn(`Analytics: Permission denied. Please check Firestore security rules. Discarding ${eventsToFlush.length} events.`);
        // Don't re-add to queue to avoid infinite retry loop
      } else {
        this.loggingService.error('Error flushing analytics events', error);
        // Re-add events to queue if flush failed (for transient errors)
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
  }

  /**
   * Start automatic flush timer
   */
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

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Remove undefined values from an object (Firestore doesn't accept undefined)
   * Recursively handles nested objects
   */
  private removeUndefinedValues(obj: { [key: string]: any }): { [key: string]: any } {
    const cleaned: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        // Skip undefined values
        continue;
      } else if (value === null) {
        // Keep null values (Firestore accepts null)
        cleaned[key] = null;
      } else if (Array.isArray(value)) {
        // Recursively clean array items
        cleaned[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.removeUndefinedValues(item) 
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively clean nested objects
        cleaned[key] = this.removeUndefinedValues(value);
      } else {
        // Keep primitive values
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Sanitize metadata to remove sensitive data
   */
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

  /**
   * Enable/disable analytics
   */
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

  /**
   * Update analytics configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('analytics_config', JSON.stringify(this.config));

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Manually flush events (useful before page unload)
   */
  async forceFlush(): Promise<void> {
    await this.flushEvents();
  }
}

