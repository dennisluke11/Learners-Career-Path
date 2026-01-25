import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseService } from './firebase.service';
import { LoggingService } from './logging.service';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';

export interface NotificationPayload {
  title: string;
  body: string;
  image?: string;
  data?: {
    announcementId?: string;
    type?: string;
    [key: string]: any;
  };
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private messaging: Messaging | null = null;
  private fcmToken: string | null = null;
  private currentCountry: string | null = null;
  private isInitialized = false;

  constructor(
    private firebaseService: FirebaseService,
    private loggingService: LoggingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Initialize push notifications
   * Should be called when app starts and country is selected
   */
  async initialize(countryCode: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.isInitialized && this.currentCountry === countryCode) {
      this.loggingService.debug('Push notifications already initialized for this country');
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform (iOS/Android) - use Capacitor
        await this.initializeNative(countryCode);
      } else {
        // Web platform - use Firebase Web SDK
        await this.initializeWeb(countryCode);
      }

      this.currentCountry = countryCode;
      this.isInitialized = true;
      this.loggingService.debug(`Push notifications initialized for country: ${countryCode}`);
    } catch (error) {
      this.loggingService.error('Failed to initialize push notifications', error);
    }
  }

  /**
   * Initialize for native platforms (iOS/Android)
   */
  private async initializeNative(countryCode: string): Promise<void> {
    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        this.loggingService.warn('Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', async (token) => {
        this.fcmToken = token.value;
        this.loggingService.debug('Push registration success, token:', token.value);
        await this.subscribeToCountryTopic(countryCode);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        this.loggingService.error('Error on registration:', error);
      });

      // Listen for push notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        this.loggingService.debug('Push notification received:', notification);
        this.handleNotification(notification);
      });

      // Listen for push notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        this.loggingService.debug('Push notification action performed:', action);
        this.handleNotificationAction(action.notification);
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && this.fcmToken && this.currentCountry) {
          // Re-subscribe when app becomes active
          this.subscribeToCountryTopic(this.currentCountry);
        }
      });

    } catch (error) {
      this.loggingService.error('Failed to initialize native push notifications', error);
      throw error;
    }
  }

  /**
   * Initialize for web platform
   */
  private async initializeWeb(countryCode: string): Promise<void> {
    if (!this.firebaseService.isAvailable()) {
      this.loggingService.warn('Firebase not available, cannot initialize web push notifications');
      return;
    }

    try {
      const app = getApp();
      this.messaging = getMessaging(app);

      // Request permission and get token
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.loggingService.warn('Notification permission denied');
        return;
      }

      // Get FCM token
      const vapidKey = this.getVapidKey();
      if (!vapidKey) {
        this.loggingService.warn('VAPID key not configured');
        return;
      }

      this.fcmToken = await getToken(this.messaging, { vapidKey });
      if (this.fcmToken) {
        this.loggingService.debug('FCM registration token:', this.fcmToken);
        await this.subscribeToCountryTopic(countryCode);
      } else {
        this.loggingService.warn('No registration token available');
      }

      // Listen for foreground messages
      onMessage(this.messaging, (payload) => {
        this.loggingService.debug('Message received in foreground:', payload);
        this.handleWebNotification(payload);
      });

    } catch (error) {
      this.loggingService.error('Failed to initialize web push notifications', error);
      throw error;
    }
  }

  /**
   * Subscribe to country-specific FCM topic
   */
  private async subscribeToCountryTopic(countryCode: string): Promise<void> {
    if (!this.fcmToken) {
      this.loggingService.warn('No FCM token available, cannot subscribe to topic');
      return;
    }

    try {
      // Store token in Firestore for server-side targeting
      // This allows the Firebase Function to send to specific users
      if (this.firebaseService.isAvailable()) {
        const { getFirestore, collection, doc, setDoc } = await import('firebase/firestore');
        const db = getFirestore();
        const tokensRef = collection(db, 'fcmTokens');
        await setDoc(doc(tokensRef, this.fcmToken), {
          token: this.fcmToken,
          country: countryCode,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        this.loggingService.debug(`Stored FCM token for country: ${countryCode}`);
      }
    } catch (error) {
      this.loggingService.error('Failed to subscribe to country topic', error);
    }
  }

  /**
   * Handle notification received in foreground (native)
   */
  private handleNotification(notification: any): void {
    // Show local notification or update UI
    // You can customize this based on your needs
    this.loggingService.debug('Handling notification:', notification);
  }

  /**
   * Handle notification action (native)
   */
  private handleNotificationAction(notification: any): void {
    const data = notification.data;
    if (data?.announcementId) {
      // Navigate to announcement
      // You can inject Router here if needed
      this.loggingService.debug('Opening announcement:', data.announcementId);
    }
  }

  /**
   * Handle web notification
   */
  private handleWebNotification(payload: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(payload.notification?.title || 'New Notification', {
        body: payload.notification?.body,
        icon: payload.notification?.icon || '/assets/logo.png',
        badge: '/assets/logo.png',
        tag: payload.data?.announcementId,
        data: payload.data
      });

      notification.onclick = () => {
        window.focus();
        if (payload.data?.announcementId) {
          // Navigate to announcement
          this.loggingService.debug('Opening announcement:', payload.data.announcementId);
        }
        notification.close();
      };
    }
  }

  /**
   * Get VAPID key from environment or Firebase config
   * You'll need to add this to your Firebase project
   */
  private getVapidKey(): string | null {
    // For web, you need to generate a VAPID key in Firebase Console
    // Go to Project Settings > Cloud Messaging > Web Push certificates
    // For now, return null - you'll need to add this
    return null; // TODO: Add VAPID key from Firebase Console
  }

  /**
   * Update country subscription when user changes country
   */
  async updateCountry(countryCode: string): Promise<void> {
    if (this.currentCountry === countryCode) {
      return;
    }

    // Unsubscribe from old country (optional - topics handle this automatically)
    // Subscribe to new country
    await this.initialize(countryCode);
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if push notifications are available
   */
  isAvailable(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (Capacitor.isNativePlatform()) {
      return true; // Capacitor handles this
    }

    return 'Notification' in window && 'serviceWorker' in navigator;
  }
}

