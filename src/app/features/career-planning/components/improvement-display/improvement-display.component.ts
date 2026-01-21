import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { Grades } from '../../../../shared/models/grades.model';
import { Career } from '../../../../shared/models/career.model';
import { ImprovementService } from '../../services/improvement.service';
import { AITipsService, AITip } from '../../../study-resources/services/ai-tips.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-improvement-display',
  templateUrl: './improvement-display.component.html',
  styleUrls: ['./improvement-display.component.scss']
})
export class ImprovementDisplayComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() grades: Grades | null = null;
  @Input() career: Career | null = null;
  @ViewChild('improvementChart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  improvements: { [subject: string]: number } = {};
  aiTips: { [subject: string]: AITip } = {};
  loadingTips: { [subject: string]: boolean } = {};
  private improvementChart: Chart<'bar'> | null = null;
  Object = Object;

  constructor(
    private improvementService: ImprovementService,
    private aiTipsService: AITipsService
  ) {}

  ngAfterViewInit() {
    // Wait a tick to ensure view is fully initialized
    setTimeout(() => {
      if (this.grades && this.career) {
        this.improvements = this.improvementService.calculateImprovements(this.grades, this.career);
      }
      this.updateOrCreateChart();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.grades && this.career) {
      this.improvements = this.improvementService.calculateImprovements(this.grades, this.career);
      this.loadAITips();
      
      // Wait for view to be ready before creating/updating chart
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.updateOrCreateChart();
        }, 0);
      });
    } else {
      this.improvements = {};
      this.aiTips = {};
      this.destroyChart();
    }
  }

  private updateOrCreateChart() {
    if (!this.chartCanvas) {
      // If canvas not ready yet, try again after a short delay
      setTimeout(() => {
        this.updateOrCreateChart();
      }, 50);
      return;
    }

    if (this.hasImprovements()) {
      if (this.improvementChart) {
        this.updateImprovementChart();
      } else {
        this.createImprovementChart();
      }
    } else {
      this.destroyChart();
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  hasImprovements(): boolean {
    return Object.keys(this.improvements).length > 0;
  }

  meetsAllRequirements(): boolean {
    return !!this.grades && !!this.career && !this.hasImprovements();
  }

  loadAITips() {
    if (!this.hasImprovements() || !this.grades || !this.career) {
      return;
    }

    Object.keys(this.improvements).forEach(subject => {
      this.loadingTips[subject] = true;
      const currentGrade = this.grades![subject] || 0;
      const requiredGrade = this.career!.minGrades[subject];
      const improvementNeeded = this.improvements[subject];

      this.aiTipsService.generateTip(
        subject,
        currentGrade,
        requiredGrade,
        improvementNeeded,
        this.career!.name
      ).subscribe({
        next: (tip) => {
          this.aiTips[subject] = {
            subject,
            improvement: improvementNeeded,
            tip,
            loading: false,
            error: false
          };
          this.loadingTips[subject] = false;
        },
        error: () => {
          this.aiTips[subject] = {
            subject,
            improvement: improvementNeeded,
            tip: '',
            loading: false,
            error: true
          };
          this.loadingTips[subject] = false;
        }
      });
    });
  }

  getTipForSubject(subject: string): string {
    return this.aiTips[subject]?.tip || '';
  }

  isLoadingTip(subject: string): boolean {
    return this.loadingTips[subject] === true;
  }

  hasTip(subject: string): boolean {
    return !!this.aiTips[subject]?.tip;
  }

  private createImprovementChart() {
    if (!this.chartCanvas || !this.hasImprovements()) return;

    // Destroy existing chart if any
    if (this.improvementChart) {
      this.improvementChart.destroy();
    }

    const chartData = this.getImprovementChartData();
    const chartOptions: ChartConfiguration<'bar'>['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Horizontal bars
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Improvement Needed by Subject',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              if (!chartData.labels) return '';
              const subject = chartData.labels[context.dataIndex] as string;
              const improvement = this.improvements[subject];
              const current = this.grades![subject] || 0;
              const required = this.career!.minGrades[subject];
              return [
                `Current: ${current}%`,
                `Required: ${required}%`,
                `Need: +${improvement}%`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: Math.max(...Object.values(this.improvements)) * 1.2 || 20,
          title: {
            display: true,
            text: 'Points Needed (%)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            stepSize: 5
          }
        },
        y: {
          title: {
            display: true,
            text: 'Subjects',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        }
      }
    };

    this.improvementChart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: chartData,
      options: chartOptions
    });
  }

  private updateImprovementChart() {
    if (!this.improvementChart || !this.hasImprovements()) return;

    const chartData = this.getImprovementChartData();
    this.improvementChart.data = chartData;
    
    // Update max value for scale
    const maxImprovement = Math.max(...Object.values(this.improvements));
    if (this.improvementChart.options.scales) {
      const xScale = this.improvementChart.options.scales['x'];
      if (xScale) {
        xScale.max = maxImprovement * 1.2 || 20;
      }
    }
    
    this.improvementChart.update();
  }

  private getImprovementChartData(): ChartData<'bar'> {
    const subjects = Object.keys(this.improvements).sort((a, b) => 
      this.improvements[b] - this.improvements[a] // Sort by improvement amount (descending)
    );
    
    const improvements = subjects.map(subject => this.improvements[subject]);
    const colors = improvements.map(imp => {
      // Color gradient using status colors: red for high, orange for medium, yellow for low
      if (imp >= 15) return 'rgba(231, 76, 60, 0.8)'; // Red - status-danger
      if (imp >= 10) return 'rgba(243, 156, 18, 0.8)'; // Orange - status-warning
      if (imp >= 5) return 'rgba(244, 162, 97, 0.8)'; // Accent color for medium-low
      return 'rgba(39, 174, 96, 0.8)'; // Green - status-success for small improvements
    });
    const borderColors = improvements.map(imp => {
      if (imp >= 15) return 'rgba(231, 76, 60, 1)';
      if (imp >= 10) return 'rgba(243, 156, 18, 1)';
      if (imp >= 5) return 'rgba(244, 162, 97, 1)';
      return 'rgba(39, 174, 96, 1)';
    });

    return {
      labels: subjects,
      datasets: [
        {
          label: 'Improvement Needed (%)',
          data: improvements,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2
        }
      ]
    };
  }

  private destroyChart() {
    if (this.improvementChart) {
      this.improvementChart.destroy();
      this.improvementChart = null;
    }
  }
}

