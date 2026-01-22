import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { EligibleCareersComponent } from './components/eligible-careers/eligible-careers.component';
import { UniversityDialogComponent } from '../../shared/components/university-dialog/university-dialog.component';

import { EligibilityService } from './services/eligibility.service';

@NgModule({
  declarations: [
    EligibleCareersComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UniversityDialogComponent // Standalone component
  ],
  providers: [
    EligibilityService
  ],
  exports: [
    EligibleCareersComponent
  ]
})
export class EligibilityModule { }

