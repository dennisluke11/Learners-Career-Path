import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { CareerPlanningModule } from './features/career-planning/career-planning.module';
import { EligibilityModule } from './features/eligibility/eligibility.module';
import { StudyResourcesModule } from './features/study-resources/study-resources.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    AppRoutingModule,
    CareerPlanningModule,
    EligibilityModule,
    StudyResourcesModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

