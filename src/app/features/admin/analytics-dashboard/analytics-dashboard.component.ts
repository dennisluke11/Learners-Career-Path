import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AnalyticsStats } from '../../../core/services/admin.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('eventsByTypeChart') eventsByTypeChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('eventsByCountryChart') eventsByCountryChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('eventsByDeviceChart') eventsByDeviceChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyEventsChart') dailyEventsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyUniqueUsersChart') dailyUniqueUsersChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trafficSourceChart') trafficSourceChart!: ElementRef<HTMLCanvasElement>;

  stats: AnalyticsStats | null = null;
  loading = true;
  dateRange: { start: Date; end: Date } | undefined = undefined; // undefined = load all events by default

  // String versions for date inputs (HTML date inputs need YYYY-MM-DD format)
  get startDateString(): string {
    if (!this.dateRange) return '';
    return this.dateRange.start.toISOString().split('T')[0];
  }

  get endDateString(): string {
    if (!this.dateRange) return '';
    return this.dateRange.end.toISOString().split('T')[0];
  }

  set startDateString(value: string) {
    if (value) {
      if (!this.dateRange) {
        this.dateRange = { start: new Date(), end: new Date() };
      }
      this.dateRange.start = new Date(value);
    } else {
      this.dateRange = undefined; // Clear date range to load all events
    }
  }

  set endDateString(value: string) {
    if (value) {
      if (!this.dateRange) {
        this.dateRange = { start: new Date(), end: new Date() };
      }
      this.dateRange.end = new Date(value);
    } else {
      this.dateRange = undefined; // Clear date range to load all events
    }
  }

  private charts: Chart[] = [];

  constructor(private adminService: AdminService) {}

  hasTrafficSourceData(): boolean {
    return this.stats ? Object.keys(this.stats.eventsByTrafficSource).length > 0 : false;
  }

  ngOnInit() {
    this.loadAnalytics();
  }

  ngAfterViewInit() {
    // Charts will be created after data loads
  }

  errorMessage: string | null = null;

  async loadAnalytics() {
    try {
      this.loading = true;
      this.errorMessage = null;
      this.stats = await this.adminService.getAnalyticsStats(this.dateRange);
      setTimeout(() => this.createCharts(), 100); // Small delay to ensure DOM is ready
    } catch (error: any) {
      console.error('Error loading analytics', error);
      this.errorMessage = error?.message || 'Failed to load analytics data. Please check the browser console for details.';
      this.stats = null;
    } finally {
      this.loading = false;
    }
  }

  async loadAllEvents() {
    // Clear date range to load all events
    this.dateRange = undefined;
    await this.loadAnalytics();
  }
  
  async loadLast90Days() {
    // Set date range to last 90 days
    this.dateRange = {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date()
    };
    await this.loadAnalytics();
  }
  
  async loadLast30Days() {
    // Set date range to last 30 days
    this.dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };
    await this.loadAnalytics();
  }

  async onDateRangeChange() {
    // If both dates are cleared, load all events
    if (!this.startDateString && !this.endDateString) {
      this.dateRange = undefined;
    }
    await this.loadAnalytics();
  }

  private createCharts() {
    if (!this.stats) return;

    // Destroy existing charts
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    // Events by Type Chart
    if (this.eventsByTypeChart) {
      const ctx = this.eventsByTypeChart.nativeElement.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(this.stats.eventsByType),
            datasets: [{
              data: Object.values(this.stats.eventsByType),
              backgroundColor: [
                '#667eea',
                '#764ba2',
                '#f093fb',
                '#4facfe',
                '#00f2fe',
                '#43e97b',
                '#fa709a'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
        this.charts.push(chart);
      }
    }

    // Events by Country Chart
    if (this.eventsByCountryChart) {
      const ctx = this.eventsByCountryChart.nativeElement.getContext('2d');
      if (ctx) {
        const topCountries = Object.entries(this.stats.eventsByCountry)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: topCountries.map(([country]) => country || 'Unknown'),
            datasets: [{
              label: 'Events',
              data: topCountries.map(([, count]) => count),
              backgroundColor: '#667eea'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
        this.charts.push(chart);
      }
    }

    // Events by Device Chart
    if (this.eventsByDeviceChart) {
      const ctx = this.eventsByDeviceChart.nativeElement.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: Object.keys(this.stats.eventsByDevice),
            datasets: [{
              data: Object.values(this.stats.eventsByDevice),
              backgroundColor: ['#667eea', '#764ba2', '#f093fb']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
        this.charts.push(chart);
      }
    }

    // Daily Events Chart (with unique users if available)
    if (this.dailyEventsChart) {
      const ctx = this.dailyEventsChart.nativeElement.getContext('2d');
      if (ctx) {
        const labels = this.stats.dailyEvents.map(e => {
          const date = new Date(e.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const datasets: any[] = [{
          label: 'Events',
          data: this.stats.dailyEvents.map(e => e.count),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        }];
        
        // Add unique users dataset if available
        const dailyUniqueUsers = this.stats.dailyUniqueUsers;
        if (dailyUniqueUsers && dailyUniqueUsers.length > 0) {
          // Match daily unique users with daily events by date
          const uniqueUsersData = this.stats.dailyEvents.map(dailyEvent => {
            const matchingDay = dailyUniqueUsers.find(du => du.date === dailyEvent.date);
            return matchingDay ? matchingDay.count : 0;
          });
          
          datasets.push({
            label: 'Unique Users',
            data: uniqueUsersData,
            borderColor: '#43e97b',
            backgroundColor: 'rgba(67, 233, 123, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          });
        }
        
        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Events'
                }
              },
              y1: {
                type: 'linear',
                display: datasets.length > 1,
                position: 'right',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Unique Users'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }
        });
        this.charts.push(chart);
      }
    }

    // Daily Unique Users Chart (separate chart)
    if (this.dailyUniqueUsersChart && this.stats.dailyUniqueUsers && this.stats.dailyUniqueUsers.length > 0) {
      const ctx = this.dailyUniqueUsersChart.nativeElement.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: this.stats.dailyUniqueUsers.map(e => {
              const date = new Date(e.date);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
              label: 'Unique Users',
              data: this.stats.dailyUniqueUsers.map(e => e.count),
              backgroundColor: '#43e97b',
              borderColor: '#2dd4bf',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
        this.charts.push(chart);
      }
    }

    // Traffic Source Chart
    if (this.trafficSourceChart && Object.keys(this.stats.eventsByTrafficSource).length > 0) {
      const ctx = this.trafficSourceChart.nativeElement.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(this.stats.eventsByTrafficSource),
            datasets: [{
              label: 'Events',
              data: Object.values(this.stats.eventsByTrafficSource),
              backgroundColor: '#764ba2'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
        this.charts.push(chart);
      }
    }
  }
}

