import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  private installPromptShown = false;
  private readonly INSTALL_PROMPT_DISMISSED_KEY = 'pwa_install_prompt_dismissed';
  private readonly INSTALL_PROMPT_SHOWN_KEY = 'pwa_install_prompt_shown';

  constructor() {
    this.setupBeforeInstallPrompt();
  }

  /**
   * Check if the app is already installed (running in standalone mode)
   */
  isInstalled(): boolean {
    // Check if running in standalone mode (iOS/Android)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Check for iOS standalone mode
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // Check if launched from home screen (Android)
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return true;
    }

    return false;
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if device is iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  /**
   * Check if device is Android
   */
  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  /**
   * Check if browser is Safari (iOS)
   */
  isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  /**
   * Check if user has dismissed the install prompt before
   */
  hasDismissedPrompt(): boolean {
    return localStorage.getItem(this.INSTALL_PROMPT_DISMISSED_KEY) === 'true';
  }

  /**
   * Check if install prompt has been shown before
   */
  hasShownPrompt(): boolean {
    return localStorage.getItem(this.INSTALL_PROMPT_SHOWN_KEY) === 'true';
  }

  /**
   * Mark install prompt as shown
   */
  markPromptAsShown(): void {
    localStorage.setItem(this.INSTALL_PROMPT_SHOWN_KEY, 'true');
    this.installPromptShown = true;
  }

  /**
   * Mark install prompt as dismissed
   */
  dismissPrompt(): void {
    localStorage.setItem(this.INSTALL_PROMPT_DISMISSED_KEY, 'true');
  }

  /**
   * Check if install prompt should be shown
   */
  shouldShowInstallPrompt(): boolean {
    // Don't show if already installed
    if (this.isInstalled()) {
      return false;
    }

    // Don't show if dismissed
    if (this.hasDismissedPrompt()) {
      return false;
    }

    // Only show on mobile devices
    if (!this.isMobileDevice()) {
      return false;
    }

    // Show for iOS Safari or Android Chrome
    return this.isIOS() || this.isAndroid();
  }

  /**
   * Setup beforeinstallprompt event listener (Android/Chrome)
   */
  private setupBeforeInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  /**
   * Get the deferred install prompt (Android/Chrome)
   */
  getDeferredPrompt(): any {
    return this.deferredPrompt;
  }

  /**
   * Show native install prompt (Android/Chrome)
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      } else {
        this.dismissPrompt();
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Clear deferred prompt after installation
   */
  clearDeferredPrompt(): void {
    this.deferredPrompt = null;
  }
}


