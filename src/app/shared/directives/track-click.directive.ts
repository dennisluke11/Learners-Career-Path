import { Directive, HostListener, Input, ElementRef } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

@Directive({
  selector: '[appTrackClick]',
  standalone: true
})
export class TrackClickDirective {
  @Input() appTrackClick?: string; // Event name
  @Input() trackMetadata?: { [key: string]: any }; // Additional metadata

  constructor(
    private analyticsService: AnalyticsService,
    private elementRef: ElementRef
  ) {}

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    const element = this.elementRef.nativeElement;
    const eventName = this.appTrackClick || this.getDefaultEventName(element);
    
    this.analyticsService.trackClick(
      eventName,
      element.id || undefined,
      element.tagName?.toLowerCase() || undefined,
      this.getElementText(element),
      {
        ...this.trackMetadata,
        componentName: this.getComponentName(element)
      }
    );
  }

  private getDefaultEventName(element: HTMLElement): string {
    // Try to get meaningful name from element
    if (element.id) {
      return `click_${element.id}`;
    }
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('ng-'));
      if (classes.length > 0) {
        return `click_${classes[0]}`;
      }
    }
    return `click_${element.tagName?.toLowerCase() || 'unknown'}`;
  }

  private getElementText(element: HTMLElement): string {
    // Get text content, limit to 100 chars
    const text = element.textContent?.trim() || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }

  private getComponentName(element: HTMLElement): string | undefined {
    // Try to find Angular component name from parent
    let current: any = element;
    for (let i = 0; i < 5 && current; i++) {
      if (current.__ngContext__) {
        const component = current.__ngContext__[8]; // Component instance
        if (component?.constructor?.name) {
          return component.constructor.name;
        }
      }
      current = current.parentElement;
    }
    return undefined;
  }
}



