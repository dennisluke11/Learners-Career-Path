import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CareersService } from '../../services/careers.service';
import { Career } from '../../../../shared/models/career.model';
import { Country } from '../../../../shared/models/country.model';

@Component({
  selector: 'app-career-selector',
  templateUrl: './career-selector.component.html',
  styleUrls: ['./career-selector.component.scss']
})
export class CareerSelectorComponent implements OnChanges {
  @Input() selectedCareer: Career | null = null;
  @Input() selectedCountry: Country | null = null;
  @Output() careerChange = new EventEmitter<Career>();

  careers: Career[] = [];
  loading = false;
  error: string | null = null;
  displayRequirements: { [subject: string]: number } = {};

  getObjectKeys = Object.keys;
  displayQualificationLevels: Array<{
    level: string;
    nqfLevel?: number;
    minGrades: { [subject: string]: number };
    aps?: number;
    notes?: string;
    sources?: {
      url?: string;
      institution?: string;
      verifiedDate?: string;
      notes?: string;
    };
  }> = [];

  constructor(private careersService: CareersService) {
    this.loadCareers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCountry']) {
      this.loadCareers();
    }
  }

  private async loadCareers() {
    this.loading = true;
    this.error = null;
    
    try {
      let allCareers: Career[];
      
      if (this.selectedCountry) {
        allCareers = await this.careersService.getCareersForCountry(this.selectedCountry.code);
      } else {
        allCareers = await this.careersService.getCareers();
      }
      
      this.careers = allCareers.sort((a, b) => a.name.localeCompare(b.name));
      
      if (this.careers.length === 0) {
        this.error = 'No careers found. Please check your database connection.';
      }
    } catch (error) {
      this.error = 'Failed to load careers. Please try again.';
      this.careers = [];
    } finally {
      this.loading = false;
    }
  }

  async onSelectCareer(event: Event) {
    const target = event.target as HTMLSelectElement;
    const careerName = target.value;
    
    if (!careerName) {
      this.careerChange.emit(null as any);
      return;
    }
    
    try {
      let career: Career | null = null;
      
      if (this.selectedCountry) {
        career = await this.careersService.getCareerForCountry(careerName, this.selectedCountry.code);
      } else {
        career = this.careers.find(c => c.name === careerName) || null;
      }
      
      if (career) {
        if (!career.minGrades || Object.keys(career.minGrades).length === 0) {
          if (career.qualificationLevels && this.selectedCountry) {
            const qualLevels = career.qualificationLevels[this.selectedCountry.code];
            if (qualLevels && qualLevels.length > 0) {
              career.minGrades = qualLevels[0].minGrades || {};
            }
          }
        }
        
        this.displayRequirements = this.processRequirementsForDisplay(career.minGrades || {});
        
        if (career.qualificationLevels && this.selectedCountry) {
          const qualLevels = career.qualificationLevels[this.selectedCountry.code] || [];
          this.displayQualificationLevels = qualLevels.map(level => ({
            ...level,
            minGrades: this.processRequirementsForDisplay(level.minGrades || {})
          }));
        } else {
          this.displayQualificationLevels = [];
        }
        
        this.careerChange.emit(career);
      }
    } catch (error) {
      const career = this.careers.find(c => c.name === careerName);
      if (career) {
        this.careerChange.emit(career);
      }
    }
  }

  private processRequirementsForDisplay(requirements: { [subject: string]: number }): { [subject: string]: number } {
    if (!this.selectedCountry || this.selectedCountry.code !== 'ZA') {
      return requirements;
    }

    const processed: { [subject: string]: number } = {};

    if (requirements['Math'] !== undefined && requirements['MathLiteracy'] !== undefined) {
      const minRequired = Math.min(requirements['Math'], requirements['MathLiteracy']);
      processed['Mathematics OR Mathematical Literacy'] = minRequired;
    } else if (requirements['Math'] !== undefined) {
      processed['Mathematics'] = requirements['Math'];
    } else if (requirements['MathLiteracy'] !== undefined) {
      processed['Mathematical Literacy'] = requirements['MathLiteracy'];
    }

    if (requirements['English'] !== undefined && requirements['EnglishFAL'] !== undefined) {
      const minRequired = Math.min(requirements['English'], requirements['EnglishFAL']);
      processed['English (Home Language) OR English (First Additional Language)'] = minRequired;
    } else if (requirements['English'] !== undefined) {
      processed['English (Home Language)'] = requirements['English'];
    } else if (requirements['EnglishFAL'] !== undefined) {
      processed['English (First Additional Language)'] = requirements['EnglishFAL'];
    }

    for (const subject in requirements) {
      if (subject !== 'Math' && subject !== 'MathLiteracy' && 
          subject !== 'English' && subject !== 'EnglishFAL') {
        processed[subject] = requirements[subject];
      }
    }

    return processed;
  }
}

