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
  Object = Object;

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
    } catch (error: any) {
      console.error('Error loading careers:', error);
      this.error = 'Failed to load careers. Please try again.';
      this.careers = [];
    } finally {
      this.loading = false;
    }
  }

  onSelectCareer(event: Event) {
    const target = event.target as HTMLSelectElement;
    const careerName = target.value;
    const career = this.careers.find(c => c.name === careerName);
    if (career) {
      this.careerChange.emit(career);
    }
  }
}

