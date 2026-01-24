import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CountrySelectorComponent } from './components/country-selector/country-selector.component';
import { GradeLevelSelectorComponent } from './components/grade-level-selector/grade-level-selector.component';
import { AnnouncementsComponent } from './components/announcements/announcements.component';
import { AnnouncementDialogComponent } from './components/announcement-dialog/announcement-dialog.component';
import { AppFooterComponent } from './components/app-footer/app-footer.component';

@NgModule({
  declarations: [
    CountrySelectorComponent,
    GradeLevelSelectorComponent,
    AnnouncementsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AnnouncementDialogComponent,
    AppFooterComponent
  ],
  exports: [
    CountrySelectorComponent,
    GradeLevelSelectorComponent,
    AnnouncementsComponent,
    AppFooterComponent,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }


