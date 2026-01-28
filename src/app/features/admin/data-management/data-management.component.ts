import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { Career } from '../../../shared/models/career.model';
import { Announcement } from '../../../shared/models/announcement.model';

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.scss']
})
export class DataManagementComponent implements OnInit {
  activeSection: 'careers' | 'announcements' = 'careers';
  careers: Career[] = [];
  announcements: Announcement[] = [];
  loading = false;
  selectedCareer: Career | null = null;
  selectedAnnouncement: Announcement | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadCareers();
  }

  async loadCareers() {
    try {
      this.loading = true;
      this.careers = await this.adminService.getCareers();
    } catch (error) {
      console.error('Error loading careers', error);
    } finally {
      this.loading = false;
    }
  }

  async loadAnnouncements() {
    try {
      this.loading = true;
      this.announcements = await this.adminService.getAnnouncements();
    } catch (error) {
      console.error('Error loading announcements', error);
    } finally {
      this.loading = false;
    }
  }

  setActiveSection(section: 'careers' | 'announcements') {
    this.activeSection = section;
    if (section === 'careers') {
      this.loadCareers();
    } else {
      this.loadAnnouncements();
    }
  }

  selectCareer(career: Career) {
    this.selectedCareer = career;
  }

  selectAnnouncement(announcement: Announcement) {
    this.selectedAnnouncement = announcement;
  }

  closeDetails() {
    this.selectedCareer = null;
    this.selectedAnnouncement = null;
  }

  getCareerCountries(career: Career): string[] {
    if (career.countryBaselines) {
      return Object.keys(career.countryBaselines);
    }
    if (career.qualificationLevels) {
      return Object.keys(career.qualificationLevels);
    }
    return [];
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }
}

