import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
    private subjectsService: SubjectsService,
    private cdr: ChangeDetectorRef
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
    
    // Special handling for South Africa: Math OR MathLiteracy, English OR EnglishFAL (not both for each pair)
    if (countryCode === 'ZA') {
      this.setupEitherOrValidation(this.gradeForm, 'Math', 'MathLiteracy');
      this.setupEitherOrValidation(this.gradeForm, 'English', 'EnglishFAL');
    }
    
    this.onGradesChange(); // Emit updated grades
    this.cdr.detectChanges(); // Force change detection after form rebuild
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
    control1.valueChanges.subscribe(() => {
      handleEitherOr();
      this.cdr.detectChanges(); // Trigger change detection
      this.onGradesChange();
    });
    
    control2.valueChanges.subscribe(() => {
      handleEitherOr();
      this.cdr.detectChanges(); // Trigger change detection
      this.onGradesChange();
    });
    
    // Initial state: if one has value, disable the other
    handleEitherOr();
  }

  handleEitherOrInput(standardName: string) {
    // Immediately handle the either/or logic when user types
    if (this.selectedCountry?.code === 'ZA') {
      // Handle Math/MathLiteracy pair
      if (standardName === 'Math' || standardName === 'MathLiteracy') {
        this.handleEitherOrPair('Math', 'MathLiteracy', standardName);
      }
      // Handle English/EnglishFAL pair
      if (standardName === 'English' || standardName === 'EnglishFAL') {
        this.handleEitherOrPair('English', 'EnglishFAL', standardName);
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
    // For South Africa: Validate that at least one of each pair is filled
    if (this.selectedCountry?.code === 'ZA') {
      // Validate Math/MathLiteracy pair
      this.validateEitherOrPair('Math', 'MathLiteracy', 'mathOrMathLiteracyRequired');
      // Validate English/EnglishFAL pair
      this.validateEitherOrPair('English', 'EnglishFAL', 'englishOrEnglishFALRequired');
    }
    
    if (this.gradeForm.valid) {
      this.gradesChange.emit(this.gradeForm.value);
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
    const mapping = this.subjectMappings.find(s => s.standardName === standardName);
    return mapping?.required || false;
  }

  getPlaceholder(standardName: string): string {
    if (standardName === 'Math' || standardName === 'MathLiteracy') {
      return 'Enter grade (0-100) - One required';
    }
    if (standardName === 'English' || standardName === 'EnglishFAL') {
      return 'Enter grade (0-100) - One required';
    }
    return 'Enter grade (0-100) - Required';
  }

  getRequiredSubjects(): SubjectMapping[] {
    // For South Africa, include Math, MathLiteracy, English, and EnglishFAL in required section (even though individually not required)
    if (this.selectedCountry?.code === 'ZA') {
      return this.subjectMappings.filter(s => 
        s.required || 
        s.standardName === 'Math' || 
        s.standardName === 'MathLiteracy' ||
        s.standardName === 'English' ||
        s.standardName === 'EnglishFAL'
      );
    }
    return this.subjectMappings.filter(s => s.required);
  }

  getElectiveSubjects(): SubjectMapping[] {
    // For South Africa, exclude Math, MathLiteracy, English, and EnglishFAL from elective section
    if (this.selectedCountry?.code === 'ZA') {
      return this.subjectMappings.filter(s => 
        !s.required && 
        s.standardName !== 'Math' && 
        s.standardName !== 'MathLiteracy' &&
        s.standardName !== 'English' &&
        s.standardName !== 'EnglishFAL'
      );
    }
    return this.subjectMappings.filter(s => !s.required);
  }


  isSubjectHidden(standardName: string): boolean {
    // For South Africa: hide one field if the other in the pair has a value
    if (this.selectedCountry?.code === 'ZA') {
      // Handle Math/MathLiteracy pair
      if (standardName === 'MathLiteracy') {
        const mathControl = this.gradeForm.get('Math');
        if (mathControl) {
          const mathValue = mathControl.value;
          return !!(mathValue && mathValue !== '' && mathValue !== null && mathValue !== undefined);
        }
      }
      if (standardName === 'Math') {
        const mathLiteracyControl = this.gradeForm.get('MathLiteracy');
        if (mathLiteracyControl) {
          const mathLiteracyValue = mathLiteracyControl.value;
          return !!(mathLiteracyValue && mathLiteracyValue !== '' && mathLiteracyValue !== null && mathLiteracyValue !== undefined);
        }
      }
      
      // Handle English/EnglishFAL pair
      if (standardName === 'EnglishFAL') {
        const englishControl = this.gradeForm.get('English');
        if (englishControl) {
          const englishValue = englishControl.value;
          return !!(englishValue && englishValue !== '' && englishValue !== null && englishValue !== undefined);
        }
      }
      if (standardName === 'English') {
        const englishFALControl = this.gradeForm.get('EnglishFAL');
        if (englishFALControl) {
          const englishFALValue = englishFALControl.value;
          return !!(englishFALValue && englishFALValue !== '' && englishFALValue !== null && englishFALValue !== undefined);
        }
      }
    }
    return false;
  }
}

