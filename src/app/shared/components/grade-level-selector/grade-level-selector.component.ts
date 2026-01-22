import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Country } from '../../models/country.model';
import { GradeLevel } from '../../models/grade-level.model';
import { GradeLevelsService } from '../../services/grade-levels.service';

@Component({
  selector: 'app-grade-level-selector',
  templateUrl: './grade-level-selector.component.html',
  styleUrls: ['./grade-level-selector.component.scss']
})
export class GradeLevelSelectorComponent implements OnChanges {
  @Input() selectedCountry: Country | null = null;
  @Input() selectedGradeLevel: GradeLevel | null = null;
  @Output() gradeLevelChange = new EventEmitter<GradeLevel>();

  gradeLevels: GradeLevel[] = [];
  gradeSystem: string = 'Grade';

  constructor(private gradeLevelsService: GradeLevelsService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCountry']) {
      if (this.selectedCountry) {
        await this.loadGradeLevels(this.selectedCountry.code);
        // Reset selection when country changes
        if (this.gradeLevels.length > 0) {
          // Auto-select the highest level (typically most relevant for career planning)
          const highestLevel = this.gradeLevels[this.gradeLevels.length - 1];
          this.selectedGradeLevel = highestLevel;
          this.gradeLevelChange.emit(highestLevel);
        }
      } else {
        // If no country selected, clear grade levels
        this.gradeLevels = [];
        this.gradeSystem = 'Grade';
      }
    }
  }

  private async loadGradeLevels(countryCode: string) {
    this.gradeLevels = await this.gradeLevelsService.getGradeLevelsForCountry(countryCode);
    this.gradeSystem = await this.gradeLevelsService.getGradeSystemForCountry(countryCode);
  }

  onSelectGradeLevel(event: Event) {
    const target = event.target as HTMLSelectElement;
    const level = parseInt(target.value, 10);
    const gradeLevel = this.gradeLevels.find(g => g.level === level);
    if (gradeLevel) {
      this.selectedGradeLevel = gradeLevel;
      this.gradeLevelChange.emit(gradeLevel);
    }
  }
}

