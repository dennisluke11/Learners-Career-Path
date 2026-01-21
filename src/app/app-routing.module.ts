import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./features/career-planning/career-planning.module').then(m => m.CareerPlanningModule)
  },
  {
    path: 'eligibility',
    loadChildren: () => import('./features/eligibility/eligibility.module').then(m => m.EligibilityModule)
  },
  {
    path: 'study-resources',
    loadChildren: () => import('./features/study-resources/study-resources.module').then(m => m.StudyResourcesModule)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

