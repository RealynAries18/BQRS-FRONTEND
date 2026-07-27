import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AutoLogoutService {
  // 5 minutes in milliseconds (5 * 60 * 1000)
  private readonly INACTIVITY_TIMEOUT = 300000;

  private destroy$ = new Subject<void>();
  private timerSubscription?: Subscription;

  constructor(private router: Router, private ngZone: NgZone) {}

  /**
   * Start tracking user interaction across the application
   */
  startMonitoring() {
    // List of structural interactions to monitor
    const activityEvents = ['mousemove', 'click', 'keypress', 'DOMMouseScroll', 'mousewheel', 'touchmove', 'MSPointerMove'];
    
    // NgZone running outside angular avoids heavy continuous CD loops on every pixel move
    this.ngZone.runOutsideAngular(() => {
      activityEvents.forEach(event => {
        window.addEventListener(event, () => this.resetTimer());
      });
    });

    this.startTimer();
  }

  /**
   * Cancels any running countdown processes (useful upon manual sign out)
   */
  stopMonitoring() {
    this.destroy$.next();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private startTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Fires after exactly 5 minutes of total user radio-silence
    this.timerSubscription = timer(this.INACTIVITY_TIMEOUT)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ngZone.run(() => {
          this.logoutUser();
        });
      });
  }

  private resetTimer() {
    this.startTimer();
  }

  private logoutUser() {
    this.stopMonitoring();
    
    // Clear application session stores
    localStorage.removeItem('user');
    localStorage.removeItem('token'); 

    // Redirect to login view with timeout indicator
    this.router.navigate(['/login'], { queryParams: { status: 'timeout' } });
  }
}