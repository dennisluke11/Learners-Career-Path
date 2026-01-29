import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService, UsageStats, AnalyticsStats } from '../../../core/services/admin.service';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';
import { DataManagementComponent } from '../data-management/data-management.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsDashboardComponent, DataManagementComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeTab: 'overview' | 'analytics' | 'data' = 'overview';
  usageStats: UsageStats | null = null;
  analyticsStats: AnalyticsStats | null = null;
  loading = true;
  loadingUsers = false;
  errorMessage: string | null = null;
  refreshInterval: any;
  currentUsername: string | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.adminService.isAdminAuthenticated()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.currentUsername = this.adminService.getCurrentAdminUsername();
    this.loadUsageStats();
    this.loadUserStats();
    // DISABLED auto-refresh to save on Firestore reads and costs
    // User must manually refresh if needed
    // Auto-refresh was causing excessive reads (215K+ per day)
    // this.refreshInterval = setInterval(() => {
    //   this.loadUsageStats();
    // }, 15 * 60 * 1000);
  }

  get collectionKeys(): string[] {
    return this.usageStats?.documentCounts ? Object.keys(this.usageStats.documentCounts) : [];
  }

  get totalDocuments(): number {
    if (!this.usageStats?.documentCounts) return 0;
    return Object.values(this.usageStats.documentCounts).reduce((a, b) => a + b, 0);
  }

  get collectionCount(): number {
    if (!this.usageStats?.documentCounts) return 0;
    return Object.keys(this.usageStats.documentCounts).length;
  }

  getDocumentCount(collection: string): number {
    if (!this.usageStats?.documentCounts) return 0;
    return this.usageStats.documentCounts[collection] || 0;
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadUsageStats() {
    try {
      this.loading = true;
      this.errorMessage = null;
      this.usageStats = await this.adminService.getUsageStats();
      
      // Check if all counts are 0 - might indicate an issue
      if (this.usageStats && this.totalDocuments === 0) {
        const hasAnyData = Object.values(this.usageStats.documentCounts).some(count => count > 0);
        if (!hasAnyData) {
          this.errorMessage = 'All collection counts are 0. This might indicate rate limiting or permission issues. Check the browser console for details.';
        }
      }
    } catch (error: any) {
      console.error('Error loading usage stats', error);
      this.errorMessage = error?.message || 'Failed to load usage statistics. Please try again or check the browser console.';
      this.usageStats = null;
    } finally {
      this.loading = false;
    }
  }

  async loadUserStats() {
    try {
      this.loadingUsers = true;
      // Load analytics stats to get unique users count
      // Using undefined date range to get all users
      this.analyticsStats = await this.adminService.getAnalyticsStats();
    } catch (error: any) {
      console.error('Error loading user stats', error);
      // Don't show error for user stats - it's optional
      this.analyticsStats = null;
    } finally {
      this.loadingUsers = false;
    }
  }

  get totalUsers(): number {
    return this.analyticsStats?.uniqueUsers || 0;
  }

  setActiveTab(tab: 'overview' | 'analytics' | 'data') {
    this.activeTab = tab;
    // Reload user stats when switching to overview tab
    if (tab === 'overview' && !this.analyticsStats) {
      this.loadUserStats();
    }
  }

  logout() {
    this.adminService.logoutAdmin();
    this.router.navigate(['/admin/login']);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

