import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

export interface BarangayStatusReport {
    barangay: string;
    active_count: number;
    transferred_count: number;
    deceased_count: number;
    total_count: number;
}

export interface BiometricPenetrationReport {
    barangay: string;
    total_male: number;
    total_female: number;
    registered_male: number;
    registered_female: number;
    total_population: number;
    total_with_face_data: number;
}

export interface TodayTrafficReport {
    log_hour: string;
    barangay: string;
    male_visitors: number;
    female_visitors: number;
    total_visitors: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, DecimalPipe], // Correctly exposed to the HTML template compilation step
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    // Component API State Flags
    isLoadingStatus = true;
    isLoadingBiometrics = true;
    isLoadingTraffic = true;

    // Reporting Datasets
    statusReport: BarangayStatusReport[] = [];
    biometricReport: BiometricPenetrationReport[] = [];
    trafficReport: TodayTrafficReport[] = [];

    // Global Aggregate Summary Values
    grandTotalActive = 0;
    grandTotalTransferred = 0;
    grandTotalDeceased = 0;
    grandTotalBiometricsRegistered = 0;
    grandTotalPopulationForBiometrics = 0;

    private apiUrl = 'http://127.0.0.1:8000/api/dashboard';

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.fetchConstituentStatus();
        this.fetchBiometricPenetration();
        this.fetchTodayTraffic();
    }

    fetchConstituentStatus() {
        this.isLoadingStatus = true;
        this.http.get<BarangayStatusReport[]>(`${this.apiUrl}/constituent-status`)
            .subscribe({
                next: (data) => {
                    this.statusReport = data;
                    this.calculateStatusTotals();
                    this.isLoadingStatus = false;
                },
                error: (err) => {
                    console.error('Failed to load status analytics:', err);
                    this.isLoadingStatus = false;
                }
            });
    }

    fetchBiometricPenetration() {
        this.isLoadingBiometrics = true;
        this.http.get<BiometricPenetrationReport[]>(`${this.apiUrl}/biometric-penetration`)
            .subscribe({
                next: (data) => {
                    this.biometricReport = data;
                    this.calculateBiometricTotals();
                    this.isLoadingBiometrics = false;
                },
                error: (err) => {
                    console.error('Failed to load biometric penetration stats:', err);
                    this.isLoadingBiometrics = false;
                }
            });
    }

    fetchTodayTraffic() {
        this.isLoadingTraffic = true;
        this.http.get<TodayTrafficReport[]>(`${this.apiUrl}/today-traffic`)
            .subscribe({
                next: (data) => {
                    this.trafficReport = data;
                    this.isLoadingTraffic = false;
                },
                error: (err) => {
                    console.error('Failed to load real-time hourly traffic:', err);
                    this.isLoadingTraffic = false;
                }
            });
    }

    private calculateStatusTotals() {
        this.grandTotalActive = this.statusReport.reduce((acc, row) => acc + Number(row.active_count), 0);
        this.grandTotalTransferred = this.statusReport.reduce((acc, row) => acc + Number(row.transferred_count), 0);
        this.grandTotalDeceased = this.statusReport.reduce((acc, row) => acc + Number(row.deceased_count), 0);
    }

    private calculateBiometricTotals() {
        this.grandTotalBiometricsRegistered = this.biometricReport.reduce((acc, row) => acc + Number(row.total_with_face_data), 0);
        this.grandTotalPopulationForBiometrics = this.biometricReport.reduce((acc, row) => acc + Number(row.total_population), 0);
    }

    getBiometricPercentage(registered: number, total: number): number {
        if (!total || total === 0) return 0;
        return Math.round((registered / total) * 100);
    }

    getGlobalBiometricPercentage(): number {
        if (!this.grandTotalPopulationForBiometrics) return 0;
        return Math.round((this.grandTotalBiometricsRegistered / this.grandTotalPopulationForBiometrics) * 100);
    }
}