import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AutoLogoutService } from '../../services/auto-logout.service'; // 👈 Adjusted relative path mapping

interface LoginResponse {
    user: any;
    token?: string;
}

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {

    username: string = '';
    password: string = '';
    loading: boolean = false;
    errorMessage: string = '';
    showPassword: boolean = false;

    constructor(
        private authService: AuthService,
        private autoLogoutService: AutoLogoutService, // 👈 Injected inactivity tracker
        private router: Router
    ) {}

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    login(): void {
        // Basic validation
        if (!this.username || !this.password) {
            this.errorMessage = 'Username and password are required';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        this.authService.login(this.username, this.password)
            .subscribe({
                next: (res: LoginResponse) => {
                    // Save token if exists
                    if (res.token) {
                        localStorage.setItem('token', res.token);
                    }

                    // Save user data
                    localStorage.setItem('user', JSON.stringify(res.user));

                    // 🚀 Start tracking the 5-minute idle countdown immediately on authentication
                    this.autoLogoutService.startMonitoring();

                    this.loading = false;

                    // Redirect to main layout (Statistics page)
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.loading = false;
                    this.errorMessage =
                        err?.error?.message || 'Login failed. Please try again.';
                }
            });
    }
}