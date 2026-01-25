import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Grades } from '../../../../shared/models/grades.model';
import { Country } from '../../../../shared/models/country.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SubjectMapping, EitherOrGroup } from '../../../../shared/models/subject.model';
import { SubjectsService } from '../../../../shared/services/subjects.service';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-grade-input',
  templateUrl: './grade-input.component.html',
  styleUrls: ['./grade-input.component.scss']
})
export class GradeInputComponent implements OnChanges, OnDestroy {
  @Input() selectedCountry: Country | null = null;
  @Output() gradesChange = new EventEmitter<Grades>();
  
  gradeForm: FormGroup;
  subjectMappings: SubjectMapping[] = [];
  currentGrades: Grades = {};
  eitherOrGroups: EitherOrGroup[] = [];
  enforceCompulsorySubjects: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private subjectsService: SubjectsService,
    private userPreferencesService: UserPreferencesService,
    private cdr: ChangeDetectorRef
  ) {
    this.gradeForm = this.fb.group({});
    this.enforceCompulsorySubjects = this.userPreferencesService.getEnforceCompulsorySubjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCountry']) {
      if (this.selectedCountry) {
        this.currentGrades = this.gradeForm.value;
        this.enforceCompulsorySubjects = this.userPreferencesService.getEnforceCompulsorySubjects();
        await this.loadSubjects(this.selectedCountry.code);
      } else {
        this.subjectMappings = [];
        this.gradeForm = this.fb.group({});
      }
    }
  }

  private async loadSubjects(countryCode: string) {
    // Load subjects first
    this.subjectMappings = await this.subjectsService.getSubjectsForCountry(countryCode);
    
    // Load either/or groups separately to catch any errors
    try {
      this.eitherOrGroups = await this.subjectsService.getEitherOrGroups(countryCode);
    } catch (error) {
      this.eitherOrGroups = [];
    }
    
    // Rebuild form with new subjects
    const newForm = this.fb.group({});
    const previousValues = this.gradeForm.value || {};
    
    this.subjectMappings.forEach(subj => {
      const standardName = subj.standardName;
      const previousValue = previousValues[standardName] || previousValues[subj.displayName] || '';
      
      const shouldRequire = this.enforceCompulsorySubjects && subj.required;
      
      newForm.addControl(
        standardName,
        this.fb.control(previousValue, [
          shouldRequire ? Validators.required : Validators.nullValidator,
          Validators.min(0),
          Validators.max(100)
        ])
      );
    });
    
    this.gradeForm = newForm;
    
    // Set up either/or validation
    for (const group of this.eitherOrGroups) {
      if (group.subjects && group.subjects.length >= 2) {
        const maxAllowed = group.maxAllowed ?? 1;
        
        if (maxAllowed === 1) {
          // Only one subject allowed - set up mutual exclusivity
          for (let i = 0; i < group.subjects.length; i++) {
            for (let j = i + 1; j < group.subjects.length; j++) {
              this.setupEitherOrValidation(this.gradeForm, group.subjects[i], group.subjects[j]);
            }
          }
        }
      }
    }
    
    // Emit updated grades
    this.onGradesChange();
    
    // Force change detection ONCE after everything is loaded
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  private setupEitherOrValidation(form: FormGroup, control1Name: string, control2Name: string) {
    const control1 = form.get(control1Name);
    const control2 = form.get(control2Name);
    
    if (!control1 || !control2) return;
    
    // Helper function to handle the either/or logic
    const handleEitherOr = () => {
      const value1 = control1.value;
      const value2 = control2.value;
      
      // If control1 has a value, clear and disable control2
      if (value1 && value1 !== '' && value1 !== null) {
        if (control2.enabled) {
          control2.setValue('', { emitEvent: false });
          control2.disable({ emitEvent: false });
        }
      } 
      // If control2 has a value, clear and disable control1
      else if (value2 && value2 !== '' && value2 !== null) {
        if (control1.enabled) {
          control1.setValue('', { emitEvent: false });
          control1.disable({ emitEvent: false });
        }
      }
      // If both are empty, enable both
      else {
        if (control1.disabled) {
          control1.enable({ emitEvent: false });
        }
        if (control2.disabled) {
          control2.enable({ emitEvent: false });
        }
      }
    };
    
    // Set up valueChanges subscriptions
    control1.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      handleEitherOr();
      this.cdr.detectChanges();
      this.onGradesChange();
    });
    
    control2.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      handleEitherOr();
      this.cdr.detectChanges();
      this.onGradesChange();
    });
    
    // Initial state: if one has value, disable the other
    handleEitherOr();
  }

  handleEitherOrInput(standardName: string) {
    for (const group of this.eitherOrGroups) {
      if (group.subjects.includes(standardName)) {
        for (const otherSubject of group.subjects) {
          if (otherSubject !== standardName) {
            this.handleEitherOrPair(standardName, otherSubject, standardName);
          }
        }
        break;
      }
    }
  }

  private handleEitherOrPair(control1Name: string, control2Name: string, changedControlName: string) {
    // Use setTimeout to ensure the form value is updated first
    setTimeout(() => {
      const control1 = this.gradeForm.get(control1Name);
      const control2 = this.gradeForm.get(control2Name);
      
      if (!control1 || !control2) return;
      
      const value1 = control1.value;
      const value2 = control2.value;
      
      // If control1 has a value, clear and disable control2
      if (changedControlName === control1Name && value1 && value1 !== '' && value1 !== null) {
        control2.setValue('', { emitEvent: false });
        control2.disable({ emitEvent: false });
      }
      // If control2 has a value, clear and disable control1
      else if (changedControlName === control2Name && value2 && value2 !== '' && value2 !== null) {
        control1.setValue('', { emitEvent: false });
        control1.disable({ emitEvent: false });
      }
      // If the field is cleared, enable the other
      else {
        if (changedControlName === control1Name && (!value1 || value1 === '' || value1 === null)) {
          control2.enable({ emitEvent: false });
        }
        if (changedControlName === control2Name && (!value2 || value2 === '' || value2 === null)) {
          control1.enable({ emitEvent: false });
        }
      }
      
      // Trigger change detection to update the view
      this.cdr.detectChanges();
    }, 0);
  }

  onGradesChange() {
    for (const group of this.eitherOrGroups) {
      if (group.subjects.length >= 2) {
        const errorKey = `${group.subjects.join('_')}_required`;
        for (let i = 0; i < group.subjects.length; i++) {
          for (let j = i + 1; j < group.subjects.length; j++) {
            this.validateEitherOrPair(group.subjects[i], group.subjects[j], errorKey);
          }
        }
      }
    }
    
    const formValues = this.gradeForm.value;
    const hasGrades = Object.keys(formValues).some(key => {
      const value = formValues[key];
      return value !== null && value !== undefined && value !== '' && (typeof value === 'number' ? value > 0 : parseFloat(value) > 0);
    });
    
    if (hasGrades) {
      this.gradesChange.emit(formValues);
    }
  }

  private validateEitherOrPair(control1Name: string, control2Name: string, errorKey: string) {
    const control1 = this.gradeForm.get(control1Name);
    const control2 = this.gradeForm.get(control2Name);
    
    if (!control1 || !control2) return;
    
    const value1 = control1.value;
    const value2 = control2.value;
    
    // Custom validation: at least one must be filled
    const hasEitherOr = (value1 && value1 !== '' && value1 !== null) || 
                        (value2 && value2 !== '' && value2 !== null);
    
    if (!hasEitherOr) {
      // Set custom error if neither is filled
      control1.setErrors({ [errorKey]: true });
      control2.setErrors({ [errorKey]: true });
    } else {
      // Clear the custom error if at least one is filled
      if (control1.hasError(errorKey)) {
        const errors = { ...control1.errors };
        delete errors[errorKey];
        control1.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      if (control2.hasError(errorKey)) {
        const errors = { ...control2.errors };
        delete errors[errorKey];
        control2.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  getSubjectDisplayName(standardName: string): string {
    const mapping = this.subjectMappings.find(s => s.standardName === standardName);
    return mapping?.displayName || standardName;
  }

  isSubjectRequired(standardName: string): boolean {
    if (!this.enforceCompulsorySubjects) {
      return false;
    }
    const mapping = this.subjectMappings.find(s => s.standardName === standardName);
    return mapping?.required || false;
  }

  onToggleEnforceCompulsorySubjects(event: Event): void {
    const target = event.target as HTMLInputElement;
    const enforce = target.checked;
    this.enforceCompulsorySubjects = enforce;
    this.userPreferencesService.setEnforceCompulsorySubjects(enforce);
    
    this.rebuildFormWithNewValidation();
  }

  private rebuildFormWithNewValidation(): void {
    const currentValues = this.gradeForm.value || {};
    const newForm = this.fb.group({});
    
    this.subjectMappings.forEach(subj => {
      const standardName = subj.standardName;
      const currentValue = currentValues[standardName] || '';
      
      const shouldRequire = this.enforceCompulsorySubjects && subj.required;
      
      newForm.addControl(
        standardName,
        this.fb.control(currentValue, [
          shouldRequire ? Validators.required : Validators.nullValidator,
          Validators.min(0),
          Validators.max(100)
        ])
      );
    });
    
    for (const group of this.eitherOrGroups) {
      if (group.subjects && group.subjects.length >= 2) {
        const maxAllowed = group.maxAllowed ?? 1;
        
        if (maxAllowed === 1) {
          for (let i = 0; i < group.subjects.length; i++) {
            for (let j = i + 1; j < group.subjects.length; j++) {
              this.setupEitherOrValidation(newForm, group.subjects[i], group.subjects[j]);
            }
          }
        }
      }
    }
    
    this.gradeForm = newForm;
    this.cdr.detectChanges();
    
    this.onGradesChange();
  }

  getPlaceholder(standardName: string): string {
    for (const group of this.eitherOrGroups) {
      if (group.subjects.includes(standardName)) {
        return 'Enter grade (0-100) - One required';
      }
    }
    return 'Enter grade (0-100) - Required';
  }

  getRequiredSubjects(): SubjectMapping[] {
    // Include all subjects that are either:
    // 1. Marked as required: true, OR
    // 2. Part of an either/or group (even if required: false)
    const subjectsInEitherOrGroups = new Set<string>();
    
    // Build set of subjects in either/or groups
    if (this.eitherOrGroups && this.eitherOrGroups.length > 0) {
      for (const group of this.eitherOrGroups) {
        if (group.subjects && Array.isArray(group.subjects)) {
          group.subjects.forEach(subj => subjectsInEitherOrGroups.add(subj));
        }
      }
    }
    
    // Filter subjects: include if required OR in an either/or group
    return this.subjectMappings.filter(s => 
      s.required || subjectsInEitherOrGroups.has(s.standardName)
    );
  }

  getElectiveSubjects(): SubjectMapping[] {
    const subjectsInEitherOrGroups = new Set<string>();
    for (const group of this.eitherOrGroups) {
      group.subjects.forEach(subj => subjectsInEitherOrGroups.add(subj));
    }
    
    return this.subjectMappings.filter(s => 
      !s.required && !subjectsInEitherOrGroups.has(s.standardName)
    );
  }


  isSubjectHidden(standardName: string): boolean {
    // Don't hide if either/or groups aren't loaded yet
    if (!this.eitherOrGroups || this.eitherOrGroups.length === 0) {
      return false;
    }
    
    // Don't hide if form isn't ready
    if (!this.gradeForm) {
      return false;
    }
    
    // Only hide if the subject is in an either/or group AND another subject in that group has a value
    for (const group of this.eitherOrGroups) {
      if (group.subjects && group.subjects.includes(standardName)) {
        for (const otherSubject of group.subjects) {
          if (otherSubject !== standardName) {
            const otherControl = this.gradeForm.get(otherSubject);
            if (otherControl) {
              const otherValue = otherControl.value;
              // Check if the other subject has a non-empty, non-zero value
              if (otherValue !== null && otherValue !== undefined && otherValue !== '' && otherValue !== 0) {
                return true; // Hide this subject because the other one has a value
              }
            }
          }
        }
      }
    }
    return false; // Don't hide - either not in an either/or group, or no other subject has a value
  }
}

