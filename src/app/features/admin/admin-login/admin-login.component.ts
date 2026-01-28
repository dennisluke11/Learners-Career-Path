import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  async login() {
    this.error = '';
    
    if (!this.username || !this.password) {
      this.error = 'Please enter both username and password';
      return;
    }

    this.loading = true;

    try {
      const authenticated = await this.adminService.authenticateAdmin(this.username, this.password);
      if (authenticated) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.error = 'Invalid username or password';
      }
    } catch (error) {
      this.error = 'Login failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}

