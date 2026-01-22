import { Component, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { AnnouncementsService } from '../../../core/services/announcements.service';
import { Announcement } from '../../models/announcement.model';
import { Country } from '../../models/country.model';
import { Career } from '../../models/career.model';
import { GradeLevel } from '../../models/grade-level.model';
import { AnalyticsService } from '../../../core/services/analytics.service';

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
  expandedAnnouncements = signal<Set<string>>(new Set());

  constructor(
    private announcementsService: AnnouncementsService,
    private analyticsService: AnalyticsService
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

  toggleExpand(announcementId: string): void {
    const expanded = this.expandedAnnouncements();
    if (expanded.has(announcementId)) {
      expanded.delete(announcementId);
    } else {
      expanded.add(announcementId);
    }
    this.expandedAnnouncements.set(new Set(expanded));
  }

  isExpanded(announcementId: string): boolean {
    return this.expandedAnnouncements().has(announcementId);
  }

  async onActionClick(announcement: Announcement): Promise<void> {
    if (!announcement.id || !announcement.actionButton) {
      return;
    }

    // Track click
    await this.announcementsService.trackClick(announcement.id);
    
    this.analyticsService.trackClick('announcement_clicked', announcement.id, 'button', announcement.actionButton.text, {
      componentName: 'AnnouncementsComponent',
      announcementId: announcement.id,
      announcementType: announcement.type,
      actionUrl: announcement.actionButton.url,
      country: this.selectedCountry?.code,
      career: this.selectedCareer?.name
    });

    // Open URL
    if (announcement.actionButton.type === 'external') {
      window.open(announcement.actionButton.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = announcement.actionButton.url;
    }
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




