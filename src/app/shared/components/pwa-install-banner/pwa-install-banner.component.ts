import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install-banner.component.html',
  styleUrls: ['./pwa-install-banner.component.scss']
})
export class PwaInstallBannerComponent implements OnInit, OnDestroy {
  showBanner = signal<boolean>(false);
  showIOSInstructions = signal<boolean>(false);
  isIOS = signal<boolean>(false);
  isAndroid = signal<boolean>(false);
  private checkInterval: any;

  constructor(private pwaInstallService: PwaInstallService) {}

  ngOnInit(): void {
    this.checkInstallStatus();
    
    // Check periodically in case user installs the app
    this.checkInterval = setInterval(() => {
      this.checkInstallStatus();
    }, 5000);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.showBanner.set(false);
      this.pwaInstallService.clearDeferredPrompt();
    });
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkInstallStatus(): void {
    if (this.pwaInstallService.shouldShowInstallPrompt()) {
      this.isIOS.set(this.pwaInstallService.isIOS());
      this.isAndroid.set(this.pwaInstallService.isAndroid());
      
      // Show banner after a short delay (better UX)
      setTimeout(() => {
        if (!this.pwaInstallService.isInstalled()) {
          this.showBanner.set(true);
          this.pwaInstallService.markPromptAsShown();
        }
      }, 3000); // Show after 3 seconds
    } else {
      this.showBanner.set(false);
    }
  }

  async installApp(): Promise<void> {
    if (this.isAndroid()) {
      // Android/Chrome - use native prompt
      const installed = await this.pwaInstallService.showInstallPrompt();
      if (installed) {
        this.showBanner.set(false);
      }
    } else if (this.isIOS()) {
      // iOS - show instructions
      this.showIOSInstructions.set(true);
    }
  }

  dismissBanner(): void {
    this.showBanner.set(false);
    this.pwaInstallService.dismissPrompt();
  }
}

