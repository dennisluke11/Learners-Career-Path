export interface AnalyticsEvent {
  id?: string;
  eventType: 'click' | 'view' | 'change' | 'submit' | 'select' | 'custom' | 'engagement' | 'conversion';
  eventName: string;
  componentName?: string;
  elementId?: string;
  elementType?: string;
  elementText?: string;
  url?: string;
  metadata?: {
    [key: string]: any;
  };
  userId?: string;
  sessionId?: string;
  timestamp: Date | string;
  country?: string;
  gradeLevel?: string;
  career?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  // Enhanced tracking fields
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browserType?: string;
  trafficSource?: 'direct' | 'organic' | 'social' | 'referral' | 'paid' | 'email' | 'unknown';
  referralSource?: string; // Specific referral (school, organization, etc.)
  adCampaignSource?: string; // Google Ads, Facebook Ads, etc.
  sessionDuration?: number; // Seconds
  isReturningUser?: boolean;
  visitCount?: number; // Number of times user has visited
  daysSinceLastVisit?: number;
  sectionName?: string; // Which section was viewed
  timeOnSection?: number; // Seconds spent on section
  interactionsCount?: number; // Number of interactions in session
  conversionValue?: number; // Monetary value for conversions
  affiliateProgram?: string; // For affiliate tracking
  userJourneyStage?: string; // Where user is in funnel
}

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number;
  includeUserData?: boolean;
}






