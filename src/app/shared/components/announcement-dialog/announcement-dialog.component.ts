import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '../../models/announcement.model';
import { AnnouncementsService } from '../../../core/services/announcements.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-announcement-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcement-dialog.component.html',
  styleUrls: ['./announcement-dialog.component.scss']
})
export class AnnouncementDialogComponent implements OnInit {
  @Input() announcement: Announcement | null = null;
  @Input() isOpen: boolean = false;
  @Input() selectedCountry?: string;
  @Input() selectedCareer?: string;
  @Output() closeDialog = new EventEmitter<void>();

  constructor(
    private announcementsService: AnnouncementsService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
    if (this.announcement?.id) {
      this.announcementsService.trackView(this.announcement.id);
      this.analyticsService.trackView('announcement_dialog_viewed', {
        componentName: 'AnnouncementDialogComponent',
        announcementId: this.announcement.id,
        announcementType: this.announcement.type,
        country: this.selectedCountry,
        career: this.selectedCareer
      });
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  async onActionClick(): Promise<void> {
    if (!this.announcement?.id || !this.announcement.actionButton) {
      return;
    }

    await this.announcementsService.trackClick(this.announcement.id);
    
    this.analyticsService.trackClick('announcement_dialog_clicked', this.announcement.id, 'button', this.announcement.actionButton.text, {
      componentName: 'AnnouncementDialogComponent',
      announcementId: this.announcement.id,
      announcementType: this.announcement.type,
      actionUrl: this.announcement.actionButton.url,
      country: this.selectedCountry,
      career: this.selectedCareer
    });

    if (this.announcement.actionButton.type === 'external') {
      window.open(this.announcement.actionButton.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = this.announcement.actionButton.url;
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

