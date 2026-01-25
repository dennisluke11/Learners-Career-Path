import { Component, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { AnnouncementsService } from '../../../core/services/announcements.service';
import { Announcement } from '../../models/announcement.model';
import { Country } from '../../models/country.model';
import { Career } from '../../models/career.model';
import { GradeLevel } from '../../models/grade-level.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AnnouncementDialogComponent } from '../announcement-dialog/announcement-dialog.component';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss']
})
export class AnnouncementsComponent implements OnInit, OnChanges {
  @Input() selectedCountry: Country | null = null;
  @Input() selectedCareer: Career | null = null;
  @Input() selectedGradeLevel: GradeLevel | null = null;

  announcements = signal<Announcement[]>([]);
  isLoading = signal<boolean>(false);
  selectedAnnouncement = signal<Announcement | null>(null);
  showDialog = signal<boolean>(false);

  constructor(
    private announcementsService: AnnouncementsService,
    private analyticsService: AnalyticsService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCountry'] || changes['selectedCareer'] || changes['selectedGradeLevel']) {
      this.loadAnnouncements();
    }
  }

  async loadAnnouncements(): Promise<void> {
    this.isLoading.set(true);
    
    const country = this.selectedCountry?.code;
    const career = this.selectedCareer?.name;
    const gradeLevel = this.selectedGradeLevel?.level;

    const announcements = await this.announcementsService.getAnnouncements(
      country,
      career,
      gradeLevel
    );
    this.announcements.set(announcements);
    this.isLoading.set(false);

    // Track view for each announcement
    announcements.forEach(announcement => {
      if (announcement.id) {
        this.announcementsService.trackView(announcement.id);
        this.analyticsService.trackView('announcement_viewed', {
          componentName: 'AnnouncementsComponent',
          announcementId: announcement.id,
          announcementType: announcement.type,
          country: country,
          career: career
        });
      }
    });
  }

  openDialog(announcement: Announcement): void {
    this.selectedAnnouncement.set(announcement);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.selectedAnnouncement.set(null);
  }

  getVisibleAnnouncements(): Announcement[] {
    return this.announcements().slice(0, 5);
  }

  hasMoreAnnouncements(): boolean {
    return this.announcements().length > 5;
  }


  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'university_admission': '🎓',
      'scholarship': '💰',
      'training': '📚',
      'job': '💼',
      'event': '📅',
      'general': '📢'
    };
    return icons[type] || '📢';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'university_admission': 'University Admission',
      'scholarship': 'Scholarship',
      'training': 'Training Program',
      'job': 'Job Opportunity',
      'event': 'Event',
      'general': 'Announcement'
    };
    return labels[type] || 'Announcement';
  }
}





