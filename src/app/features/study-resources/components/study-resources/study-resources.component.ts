import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Country } from '../../../../shared/models/country.model';
import { GradeLevel } from '../../../../shared/models/grade-level.model';
import { Career } from '../../../../shared/models/career.model';
import { StudyResourcesService } from '../../services/study-resources.service';
import { StudyResource } from '../../../../shared/models/study-resource.model';
import { SubjectsService } from '../../../../shared/services/subjects.service';

@Component({
  selector: 'app-study-resources',
  templateUrl: './study-resources.component.html',
  styleUrls: ['./study-resources.component.scss']
})
export class StudyResourcesComponent implements OnChanges {
  @Input() selectedCountry: Country | null = null;
  @Input() selectedGradeLevel: GradeLevel | null = null;
  @Input() selectedSubjects: string[] = [];
  @Input() subjectsNeedingImprovement: string[] = [];
  @Input() selectedCareer: Career | null = null;

  studyResources: { [subject: string]: StudyResource } = {};
  loadingSubjects: { [subject: string]: boolean } = {};
  expandedSubjects: { [subject: string]: boolean } = {};

  constructor(
    private studyResourcesService: StudyResourcesService,
    private subjectsService: SubjectsService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['selectedCountry'] || changes['selectedGradeLevel'] || changes['selectedSubjects'] || 
         changes['subjectsNeedingImprovement'] || changes['selectedCareer']) 
        && this.selectedCountry && this.selectedGradeLevel) {
      this.loadStudyResources();
    }
  }

  async loadStudyResources() {
    if (!this.selectedCountry || !this.selectedGradeLevel) return;

    // Focus on subjects that need improvement for the selected career
    let subjects: string[] = [];
    
    if (this.subjectsNeedingImprovement.length > 0 && this.selectedCareer) {
      // Highest priority: subjects that need improvement for the selected career
      subjects = this.subjectsNeedingImprovement;
    } else if (this.selectedCareer && this.selectedCareer.minGrades) {
      // If career selected but no improvements needed, show all career-required subjects
      subjects = Object.keys(this.selectedCareer.minGrades);
    } else if (this.selectedSubjects.length > 0) {
      // Second priority: subjects that have grades entered
      subjects = this.selectedSubjects;
    } else {
      // Fallback: all subjects for the country
      const countrySubjects = await this.subjectsService.getSubjectsForCountry(this.selectedCountry.code);
      subjects = countrySubjects
        .map(s => s.standardName)
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
    }

    // Only load resources for subjects that haven't been loaded yet
    const subjectsToLoad = subjects.filter(subj => !this.studyResources[subj] || this.studyResources[subj].loading);

    subjectsToLoad.forEach(subject => {
      this.loadingSubjects[subject] = true;
      this.studyResources[subject] = {
        subject,
        topics: [],
        recommendedSites: [],
        pastPapers: [],
        loading: true,
        error: false
      };

      this.studyResourcesService.generateStudyResources(
        subject,
        this.selectedGradeLevel!,
        this.selectedCountry!,
        this.selectedCareer
      ).subscribe({
        next: (resource) => {
          this.studyResources[subject] = resource;
          this.loadingSubjects[subject] = false;
        },
        error: () => {
          this.studyResources[subject] = {
            subject,
            topics: [],
            recommendedSites: [],
            pastPapers: [],
            loading: false,
            error: true
          };
          this.loadingSubjects[subject] = false;
        }
      });
    });
  }

  toggleSubject(subject: string) {
    this.expandedSubjects[subject] = !this.expandedSubjects[subject];
  }

  isExpanded(subject: string): boolean {
    return this.expandedSubjects[subject] === true;
  }

  isLoading(subject: string): boolean {
    return this.loadingSubjects[subject] === true;
  }

  hasResources(subject: string): boolean {
    const resource = this.studyResources[subject];
    return !!(resource && (resource.topics.length > 0 || resource.recommendedSites.length > 0 || resource.pastPapers.length > 0));
  }

  getSubjects(): string[] {
    return Object.keys(this.studyResources);
  }

  hasAnyLoading(): boolean {
    return this.getSubjects().some(subject => this.isLoading(subject));
  }

  hasAnyResources(): boolean {
    return this.getSubjects().some(subject => !this.isLoading(subject) && this.hasResources(subject));
  }

  getAllUrls(): string[] {
    const allUrls: string[] = [];
    
    for (const subject of this.getSubjects()) {
      if (!this.isLoading(subject) && this.hasResources(subject)) {
        const resource = this.studyResources[subject];
        if (resource) {
          // Add recommended sites URLs
          resource.recommendedSites?.forEach(site => {
            if (site.url) allUrls.push(site.url);
          });
          // Add past papers URLs
          resource.pastPapers?.forEach(paper => {
            if (paper.url) allUrls.push(paper.url);
          });
        }
      }
    }
    
    // Return only first 4 URLs
    return allUrls.slice(0, 4);
  }
}

