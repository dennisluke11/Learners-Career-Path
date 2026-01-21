import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Grades } from '../../../../shared/models/grades.model';
import { Country } from '../../../../shared/models/country.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SubjectMapping } from '../../../../shared/models/subject.model';
import { SubjectsService } from '../../../../shared/services/subjects.service';

@Component({
  selector: 'app-grade-input',
  templateUrl: './grade-input.component.html',
  styleUrls: ['./grade-input.component.scss']
})
export class GradeInputComponent implements OnChanges {
  @Input() selectedCountry: Country | null = null;
  @Output() gradesChange = new EventEmitter<Grades>();
  
  gradeForm: FormGroup;
  subjectMappings: SubjectMapping[] = [];
  currentGrades: Grades = {};

  constructor(
    private fb: FormBuilder,
    private subjectsService: SubjectsService
  ) {
    this.gradeForm = this.fb.group({});
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCountry']) {
      if (this.selectedCountry) {
        // Preserve current grades before changing subjects
        this.currentGrades = this.gradeForm.value;
        await this.loadSubjects(this.selectedCountry.code);
      } else {
        // If no country selected, clear subjects
        this.subjectMappings = [];
        this.gradeForm = this.fb.group({});
      }
    }
  }

  private async loadSubjects(countryCode: string) {
    this.subjectMappings = await this.subjectsService.getSubjectsForCountry(countryCode);
    
    // Rebuild form with new subjects
    const newForm = this.fb.group({});
    const previousValues = this.gradeForm.value || {};
    
    this.subjectMappings.forEach(subj => {
      const standardName = subj.standardName;
      // Preserve previous value if subject exists, otherwise use empty
      const previousValue = previousValues[standardName] || previousValues[subj.displayName] || '';
      newForm.addControl(
        standardName,
        this.fb.control(previousValue, [
          subj.required ? Validators.required : Validators.nullValidator,
          Validators.min(0),
          Validators.max(100)
        ])
      );
    });
    
    this.gradeForm = newForm;
    this.onGradesChange(); // Emit updated grades
  }

  onGradesChange() {
    if (this.gradeForm.valid) {
      this.gradesChange.emit(this.gradeForm.value);
    }
  }

  getSubjectDisplayName(standardName: string): string {
    const mapping = this.subjectMappings.find(s => s.standardName === standardName);
    return mapping?.displayName || standardName;
  }

  isSubjectRequired(standardName: string): boolean {
    const mapping = this.subjectMappings.find(s => s.standardName === standardName);
    return mapping?.required || false;
  }
}

