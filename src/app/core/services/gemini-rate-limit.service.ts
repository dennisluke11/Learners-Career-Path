import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';

interface RateLimitState {
  requests: number[];
  dailyCount: number;
  lastResetDate: string;
}

@Injectable({ providedIn: 'root' })
export class GeminiRateLimitService {
  private readonly MAX_REQUESTS_PER_MINUTE = 15;
  private readonly MAX_REQUESTS_PER_DAY = 1000;
  
  private state: RateLimitState = {
    requests: [],
    dailyCount: 0,
    lastResetDate: this.getTodayDate()
  };

  constructor() {
    this.loadState();
    this.resetDailyCountIfNeeded();
  }

  canMakeRequest(): { allowed: boolean; waitTime?: number; reason?: string } {
    this.resetDailyCountIfNeeded();
    this.cleanOldRequests();

    if (this.state.dailyCount >= this.MAX_REQUESTS_PER_DAY) {
      return {
        allowed: false,
        reason: `Daily limit reached (${this.MAX_REQUESTS_PER_DAY} requests/day). Reset at midnight.`
      };
    }

    const recentRequests = this.state.requests.filter(
      time => Date.now() - time < 60000
    );

    if (recentRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = 60000 - (Date.now() - oldestRequest);
      return {
        allowed: false,
        waitTime: Math.ceil(waitTime / 1000), // seconds
        reason: `Rate limit: ${this.MAX_REQUESTS_PER_MINUTE} requests/minute. Wait ${Math.ceil(waitTime / 1000)}s.`
      };
    }

    return { allowed: true };
  }

  recordRequest(): void {
    this.state.requests.push(Date.now());
    this.state.dailyCount++;
    this.saveState();
  }

  getUsageStats(): {
    requestsToday: number;
    requestsLastMinute: number;
    dailyLimit: number;
    remainingToday: number;
    resetTime: string;
  } {
    this.resetDailyCountIfNeeded();
    this.cleanOldRequests();

    const recentRequests = this.state.requests.filter(
      time => Date.now() - time < 60000
    );

    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const resetTime = tomorrow.toISOString();

    return {
      requestsToday: this.state.dailyCount,
      requestsLastMinute: recentRequests.length,
      dailyLimit: this.MAX_REQUESTS_PER_DAY,
      remainingToday: Math.max(0, this.MAX_REQUESTS_PER_DAY - this.state.dailyCount),
      resetTime
    };
  }

  private resetDailyCountIfNeeded(): void {
    const today = this.getTodayDate();
    if (this.state.lastResetDate !== today) {
      this.state.dailyCount = 0;
      this.state.lastResetDate = today;
      this.saveState();
    }
  }

  private cleanOldRequests(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.state.requests = this.state.requests.filter(time => time > oneMinuteAgo);
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem('gemini_rate_limit_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastResetDate === this.getTodayDate()) {
          this.state = parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load rate limit state:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem('gemini_rate_limit_state', JSON.stringify(this.state));
    } catch (error) {
      // Silently fail - rate limit tracking may be inaccurate
    }
  }

  reset(): void {
    this.state = {
      requests: [],
      dailyCount: 0,
      lastResetDate: this.getTodayDate()
    };
    this.saveState();
  }
}

