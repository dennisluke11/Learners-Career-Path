import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private loggingService: LoggingService,
    private ngZone: NgZone
  ) {}

  handleError(error: any): void {
    this.ngZone.run(() => {
      const errorMessage = this.getErrorMessage(error);
      
      this.loggingService.error('Global error handler caught an error', error);
      
      if (error?.rejection) {
        this.loggingService.error('Unhandled promise rejection', error.rejection);
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }
}

