import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { StudyResourcesComponent } from './components/study-resources/study-resources.component';

import { StudyResourcesService } from './services/study-resources.service';
import { AITipsService } from './services/ai-tips.service';

@NgModule({
  declarations: [
    StudyResourcesComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  providers: [
    StudyResourcesService,
    AITipsService
  ],
  exports: [
    StudyResourcesComponent
  ]
})
export class StudyResourcesModule { }

