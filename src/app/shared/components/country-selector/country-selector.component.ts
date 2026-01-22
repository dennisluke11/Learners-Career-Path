import { Component, Output, EventEmitter, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Country } from '../../models/country.model';
import { CountriesService } from '../../services/countries.service';

@Component({
  selector: 'app-country-selector',
  templateUrl: './country-selector.component.html',
  styleUrls: ['./country-selector.component.scss']
})
export class CountrySelectorComponent implements OnInit, OnChanges {
  @Input() selectedCountry: Country | null = null;
  @Output() countryChange = new EventEmitter<Country>();

  countries: Country[] = [];

  constructor(private countriesService: CountriesService) {}

  async ngOnInit() {
    this.countries = await this.countriesService.getCountries();
    if (!this.selectedCountry && this.countries.length > 0) {
      const defaultCountry = this.countries[0];
      this.selectedCountry = defaultCountry;
      this.countryChange.emit(defaultCountry);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Ensure selectedCountry is synced when parent updates it
    if (changes['selectedCountry'] && this.selectedCountry) {
      // Verify the country exists in our list
      const countryExists = this.countries.find(c => c.code === this.selectedCountry?.code);
      if (!countryExists && this.countries.length > 0) {
        // If the selected country is not in our list, find it or use first
        const found = this.countries.find(c => c.code === this.selectedCountry?.code);
        if (!found) {
          // Country not found, but keep the selected one as is
        }
      }
    }
  }

  onSelectCountry(event: Event) {
    const target = event.target as HTMLSelectElement;
    const countryCode = target.value;
    const country = this.countries.find(c => c.code === countryCode);
    if (country) {
      this.selectedCountry = country; // Update internal state
      this.countryChange.emit(country);
    }
  }
}

