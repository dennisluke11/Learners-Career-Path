import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { Grades } from '../../../../shared/models/grades.model';
import { Career } from '../../../../shared/models/career.model';
import { ImprovementService } from '../../services/improvement.service';
import { SubjectsService } from '../../../../shared/services/subjects.service';
import { EitherOrGroup } from '../../../../shared/models/subject.model';
import { AnalyticsService } from '../../../../core/services/analytics.service';

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
  @Input() selectedCountry: { code: string } | null = null;
  @ViewChild('improvementChart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  improvements: { [subject: string]: number } = {};
  private improvementChart: Chart<'bar'> | null = null;
  private eitherOrGroups: EitherOrGroup[] = [];
  Object = Object;

  constructor(
    private improvementService: ImprovementService,
    private subjectsService: SubjectsService
  ) {}

  async ngAfterViewInit() {
    setTimeout(async () => {
      if (this.grades && this.career) {
        const countryCode = this.selectedCountry?.code || 'ZA';
        await this.loadEitherOrGroups(countryCode);
        this.improvements = await this.improvementService.calculateImprovements(this.grades, this.career, countryCode);
      }
      this.updateOrCreateChart();
    }, 0);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (this.grades && this.career) {
      const countryCode = this.selectedCountry?.code || 'ZA';
      await this.loadEitherOrGroups(countryCode);
      this.improvements = await this.improvementService.calculateImprovements(this.grades, this.career, countryCode);
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.updateOrCreateChart();
        }, 0);
      });
    } else {
      this.improvements = {};
      this.destroyChart();
    }
  }

  private async loadEitherOrGroups(countryCode: string): Promise<void> {
    try {
      this.eitherOrGroups = await this.subjectsService.getEitherOrGroups(countryCode);
    } catch (error) {
      this.eitherOrGroups = [];
    }
  }

  private updateOrCreateChart() {
    if (!this.chartCanvas) {
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

  /**
   * Check if user has entered actual grades (not just empty object)
   */
  private hasEnteredGrades(): boolean {
    if (!this.grades) return false;
    // Check if there are any grade values entered (greater than 0)
    return Object.values(this.grades).some(grade => 
      grade !== null && grade !== undefined && grade > 0
    );
  }

  meetsAllRequirements(): boolean {
    // Only show congratulations if:
    // 1. User has actually entered grades (not empty object)
    // 2. A career is selected
    // 3. There are no improvements needed
    return this.hasEnteredGrades() && !!this.career && !this.hasImprovements();
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
              
              // Handle either/or subjects using backend-driven groups
              let current = 0;
              let required = 0;
              
              // Check if this subject is part of an either/or group
              // The improvement service uses group.description or group.subjects.join(' OR ') as the key
              const eitherOrGroup = this.eitherOrGroups.find(group => {
                const groupKey = group.description || group.subjects.join(' OR ');
                return groupKey === subject;
              });
              
              if (eitherOrGroup) {
                // Find the best grade from the group
                const gradesForGroup = eitherOrGroup.subjects
                  .map(subj => this.getGradeForSubject(subj))
                  .filter(g => g > 0);
                
                // Find the minimum required from the group
                const requirementsForGroup = eitherOrGroup.subjects
                  .map(subj => this.career!.minGrades[subj] || 0)
                  .filter(r => r > 0);
                
                current = gradesForGroup.length > 0 ? Math.max(...gradesForGroup) : 0;
                required = requirementsForGroup.length > 0 ? Math.min(...requirementsForGroup) : 0;
              } else {
                // Regular subject (not in either/or group)
                current = this.getGradeForSubject(subject);
                required = this.career!.minGrades[subject] || 0;
              }
              
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

  /**
   * Get grade for a subject, handling either/or groups and IT/CAT mapping
   */
  private getGradeForSubject(subjectName: string): number {
    if (!this.grades) return 0;

    // Check exact match
    if (this.grades[subjectName] !== undefined && this.grades[subjectName] !== null) {
      return this.grades[subjectName] || 0;
    }

    // Handle IT/CAT mapping
    if (subjectName === 'IT' && this.grades['CAT'] !== undefined && this.grades['CAT'] !== null) {
      return this.grades['CAT'] || 0;
    }
    if (subjectName === 'CAT' && this.grades['IT'] !== undefined && this.grades['IT'] !== null) {
      return this.grades['IT'] || 0;
    }

    // Check case-insensitive match
    const normalizedLower = subjectName.toLowerCase();
    for (const gradeKey in this.grades) {
      if (this.grades[gradeKey] === undefined || this.grades[gradeKey] === null) continue;
      if (gradeKey.toLowerCase() === normalizedLower) {
        return this.grades[gradeKey] || 0;
      }
    }

    return 0;
  }
}

