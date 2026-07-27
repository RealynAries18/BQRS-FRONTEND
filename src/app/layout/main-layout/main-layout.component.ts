import { Component } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {

    sidebarOpen: boolean = true;

    constructor(private router: Router) {}

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    logout(): void {
        localStorage.clear();
        this.router.navigate(['/login']);
    }
}
