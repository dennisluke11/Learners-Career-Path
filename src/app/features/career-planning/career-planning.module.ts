import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { GradeInputComponent } from './components/grade-input/grade-input.component';
import { CareerSelectorComponent } from './components/career-selector/career-selector.component';
import { ImprovementDisplayComponent } from './components/improvement-display/improvement-display.component';
import { ProgressChartsComponent } from './components/progress-charts/progress-charts.component';

import { CareersService } from './services/careers.service';
import { ImprovementService } from './services/improvement.service';

@NgModule({
  declarations: [
    GradeInputComponent,
    CareerSelectorComponent,
    ImprovementDisplayComponent,
    ProgressChartsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [
    CareersService,
    ImprovementService
  ],
  exports: [
    GradeInputComponent,
    CareerSelectorComponent,
    ImprovementDisplayComponent,
    ProgressChartsComponent
  ]
})
export class CareerPlanningModule { }

