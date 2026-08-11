// dashboard.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    imports: [CommonModule, DecimalPipe, FormsModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    isLoadingStatus = true;
    isLoadingBiometrics = true;
    isLoadingTraffic = true;

    statusReport: BarangayStatusReport[] = [];
    biometricReport: BiometricPenetrationReport[] = [];
    trafficReport: TodayTrafficReport[] = [];
    rawTrafficReport: TodayTrafficReport[] = [];

    // Pagination State for Traffic Attendance
    currentTrafficPage = 1;
    trafficPageSize = 10;
    pageSizes = [10, 25, 50, 100];
    totalTrafficEntries = 0;
    totalTrafficPages = 1;
    currentTrafficEndEntry = 0;

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
                    this.rawTrafficReport = data || [];
                    this.totalTrafficEntries = this.rawTrafficReport.length;
                    this.currentTrafficPage = 1;
                    this.updateTrafficPagination();
                    this.isLoadingTraffic = false;
                },
                error: (err) => {
                    console.error('Failed to load real-time hourly traffic:', err);
                    this.isLoadingTraffic = false;
                }
            });
    }

    updateTrafficPagination() {
        this.totalTrafficPages = Math.ceil(this.totalTrafficEntries / this.trafficPageSize) || 1;
        if (this.currentTrafficPage > this.totalTrafficPages) {
            this.currentTrafficPage = this.totalTrafficPages;
        }
        if (this.currentTrafficPage < 1) {
            this.currentTrafficPage = 1;
        }

        const startIndex = (this.currentTrafficPage - 1) * this.trafficPageSize;
        const endIndex = startIndex + Number(this.trafficPageSize);

        this.trafficReport = this.rawTrafficReport.slice(startIndex, endIndex);
        this.currentTrafficEndEntry = Math.min(endIndex, this.totalTrafficEntries);
    }

    goToTrafficPage(page: number) {
        if (page >= 1 && page <= this.totalTrafficPages) {
            this.currentTrafficPage = page;
            this.updateTrafficPagination();
        }
    }

    onTrafficPageSizeChange() {
        this.currentTrafficPage = 1;
        this.updateTrafficPagination();
    }

    // Helper method to check if the current log_hour should be hidden due to row-spanning
    isSameAsPreviousHour(index: number): boolean {
        if (index === 0) return false;
        const currentItem = this.trafficReport[index];
        const previousItem = this.trafficReport[index - 1];
        return currentItem.log_hour === previousItem.log_hour;
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