import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AutoLogoutService } from './services/auto-logout.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

    sidebarOpen = true;

    constructor(
        private router: Router,
        private autoLogoutService: AutoLogoutService // 👈 Injected inactivity tracker
    ) {}

    ngOnInit() {
        // Automatically resume tracking user activity if a session is already present on page load/refresh
        if (localStorage.getItem('user')) {
            this.autoLogoutService.startMonitoring();
        }
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    logout() {
        // Safely kill running timer background thread before tearing down state
        this.autoLogoutService.stopMonitoring();

        // Clear local storage session states
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        this.router.navigate(['/login']);
    }

    ngOnDestroy() {
        // Fallback cleanup to prevent hanging intervals or memory leaks
        this.autoLogoutService.stopMonitoring();
    }
}