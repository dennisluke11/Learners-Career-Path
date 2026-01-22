import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version?: string;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  constructor(private loggingService: LoggingService) {}
  private readonly CACHE_PREFIX = 'careerPath_';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  set<T>(key: string, data: T, ttl?: number, version?: string): void {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version
      };
      const ttlValue = ttl || this.DEFAULT_TTL;
      const cacheEntry = {
        ...cacheData,
        ttl: ttlValue
      };
      localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      this.loggingService.warn(`Failed to cache ${key}`, error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached) as CachedData<T> & { ttl: number };
      const isExpired = (Date.now() - cacheEntry.timestamp) > cacheEntry.ttl;

      if (isExpired) {
        this.remove(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      this.loggingService.warn(`Failed to retrieve cache for ${key}`, error);
      this.remove(key);
      return null;
    }
  }

  isFresh(key: string, customTTL?: number): boolean {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return false;

      const cacheEntry = JSON.parse(cached) as CachedData<any> & { ttl: number };
      const ttl = customTTL || cacheEntry.ttl || this.DEFAULT_TTL;
      return (Date.now() - cacheEntry.timestamp) <= ttl;
    } catch (error) {
      return false;
    }
  }

  getTimestamp(key: string): number | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached) as CachedData<any>;
      return cacheEntry.timestamp;
    } catch (error) {
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      this.loggingService.warn(`Failed to remove cache for ${key}`, error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      this.loggingService.warn('Failed to clear cache', error);
    }
  }

  clearByPattern(pattern: string): void {
    try {
      const keys = Object.keys(localStorage);
      keys
        .filter(key => key.startsWith(this.CACHE_PREFIX) && key.includes(pattern))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      this.loggingService.warn(`Failed to clear cache for pattern ${pattern}`, error);
    }
  }

  getCacheSize(): number {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .reduce((total, key) => {
          const item = localStorage.getItem(key);
          return total + (item ? item.length : 0);
        }, 0);
    } catch (error) {
      return 0;
    }
  }
}


