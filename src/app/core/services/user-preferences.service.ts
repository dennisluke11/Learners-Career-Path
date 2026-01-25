import { Injectable } from '@angular/core';

export interface UserPreferences {
  enforceCompulsorySubjects: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly STORAGE_KEY = 'user_preferences';
  private preferences: UserPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): UserPreferences {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load user preferences', error);
    }
    
    return {
      enforceCompulsorySubjects: true
    };
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save user preferences', error);
    }
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  getEnforceCompulsorySubjects(): boolean {
    return this.preferences.enforceCompulsorySubjects;
  }

  setEnforceCompulsorySubjects(enforce: boolean): void {
    this.preferences.enforceCompulsorySubjects = enforce;
    this.savePreferences();
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
  }

  resetPreferences(): void {
    this.preferences = {
      enforceCompulsorySubjects: true
    };
    this.savePreferences();
  }
}

