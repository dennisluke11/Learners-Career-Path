export interface AnalyticsEvent {
  id?: string;
  eventType: 'click' | 'view' | 'change' | 'submit' | 'select' | 'custom';
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
}

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number;
  includeUserData?: boolean;
}




