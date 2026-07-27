import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ==========================================
// CORE COMPONENT MODEL INTERFACES
// ==========================================
export interface ConstituentData {
    resident_id: any;
    ADDRESS: string;
    L_NAME: string;
    F_NAME: string;
    M_NAME: string;
    NAME_EXT?: string;
    BIRTHDAY: string;
    GENDER: string;
    STATUS: string;
}

export interface Barangay {
    brgy_code: string;
    brgy_name: string;
}

@Component({
    selector: 'app-constituent-list',
    templateUrl: './constituent-list.component.html',
    styleUrls: ['./constituent-list.component.css']
})
export class ConstituentListComponent implements OnInit {
    // Data arrays initialized safely
    constituents: ConstituentData[] = [];
    barangays: Barangay[] = [];
    pageSizes: number[] = [5, 10, 25, 50];

    // Filtering & Pagination tracking states
    selectedBrgy: string = '';
    searchTerm: string = '';
    itemsPerPage: number = 10;
    currentPage: number = 1;
    totalEntries: number = 0;
    totalPages: number = 1;
    currentEndEntry: number = 0;

    // Import modal states
    showImportModal: boolean = false;
    isImporting: boolean = false;
    importProgress: number = 0;
    selectedFile: File | null = null;
    fileError: string | null = null;

    // Edit profile modal states
    showEditModal: boolean = false;
    isProcessingEdit: boolean = false;
    selectedConstituentForEdit: ConstituentData | null = null;
    originalFormCopy: any = null;
    editForm: any = {
        ADDRESS: '',
        F_NAME: '',
        M_NAME: '',
        L_NAME: '',
        NAME_EXT: '',
        GENDER: '',
        BIRTHDAY: ''
    };

    // Status update delete modal states
    showDeleteModal: boolean = false;
    isProcessingDelete: boolean = false;
    selectedConstituentForDelete: ConstituentData | null = null;
    deleteReason: 'Transferred' | 'Deceased' | 'Active' | '' = '';

    // =========================================================
    // API BASE ROUTE CONFIGURATIONS
    // =========================================================
    private apiBase = 'http://127.0.0.1:8000/api';
    private constituentsUrl = `${this.apiBase}/constituents`;
    // FIXED: Maps accurately to /api/constituents/barangays to eliminate the 404 exception
    private barangaysUrl = `${this.constituentsUrl}/barangays`;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.loadBarangayDropdownOptions();
        this.fetchConstituentRecords();
    }

    // =========================================================
    // CORE API FETCH SERVICES
    // =========================================================
    fetchConstituentRecords(): void {
        const params: any = {
            page: this.currentPage.toString(),
            per_page: this.itemsPerPage.toString(),
            search: this.searchTerm,
            barangay: this.selectedBrgy
        };

        this.http.get<any>(this.constituentsUrl, { params }).subscribe({
            next: (response) => {
                if (response && response.data) {
                    this.constituents = response.data;
                    this.currentPage = response.current_page;
                    this.totalPages = response.last_page;
                    this.totalEntries = response.total;

                    const calculatedEnd = this.currentPage * this.itemsPerPage;
                    this.currentEndEntry = calculatedEnd > this.totalEntries ? this.totalEntries : calculatedEnd;
                }
            },
            error: (err) => {
                console.error('Failed to load constituents:', err);
            }
        });
    }

    loadBarangayDropdownOptions(): void {
        this.http.get<Barangay[]>(this.barangaysUrl).subscribe({
            next: (res) => {
                this.barangays = res || [];
            },
            error: (err) => console.error('Error fetching barangays:', err)
        });
    }

    // =========================================================
    // FILTER ACTIONS INTERRUPT HANDLERS
    // =========================================================
    onFilterChange(): void {
        this.currentPage = 1;
        this.fetchConstituentRecords();
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.fetchConstituentRecords();
    }

    resetFilters(): void {
        this.selectedBrgy = '';
        this.searchTerm = '';
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.fetchConstituentRecords();
    }

    goToPage(targetPage: number): void {
        if (targetPage >= 1 && targetPage <= this.totalPages) {
            this.currentPage = targetPage;
            this.fetchConstituentRecords();
        }
    }

    // =========================================================
    // SYSTEM IMPORT INTERFACE LAYERS
    // =========================================================
    openImportModal(): void {
        this.showImportModal = true;
        this.selectedFile = null;
        this.fileError = null;
        this.isImporting = false;
        this.importProgress = 0;
    }

    closeImportModal(): void {
        if (!this.isImporting) {
            this.showImportModal = false;
        }
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension !== 'xlsx' && extension !== 'xls') {
                this.fileError = 'Invalid file type. Please upload an Excel sheet (.xlsx or .xls).';
                this.selectedFile = null;
                return;
            }
            this.fileError = null;
            this.selectedFile = file;
        }
    }

    importFile(): void {
        if (!this.selectedFile) return;

        this.isImporting = true;
        this.importProgress = 15;

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('username', 'mis_administrator');

        const checkInterval = setInterval(() => {
            if (this.importProgress < 85) {
                this.importProgress += Math.floor(Math.random() * 12) + 5;
            }
        }, 350);

        this.http.post<any>(`${this.constituentsUrl}/import`, formData).subscribe({
            next: () => {
                clearInterval(checkInterval);
                this.importProgress = 100;
                setTimeout(() => {
                    this.showImportModal = false;
                    this.fetchConstituentRecords();
                }, 600);
            },
            error: (err) => {
                clearInterval(checkInterval);
                this.isImporting = false;
                this.fileError = err?.error?.message || 'Server extraction processing failed.';
            }
        });
    }

    // =========================================================
    // EDIT ROW OPERATIONS LAYER
    // =========================================================
    openEditModal(resident: ConstituentData): void {
        this.selectedConstituentForEdit = resident;
        this.originalFormCopy = { ...resident };

        const exactAddressString = resident.ADDRESS ? resident.ADDRESS.toString().trim() : '';

        const matchedBarangay = this.barangays.find(b =>
            b.brgy_name.trim().toLowerCase() === exactAddressString.toLowerCase()
        );

        this.editForm = {
            ADDRESS: matchedBarangay ? matchedBarangay.brgy_name : exactAddressString,
            F_NAME: resident.F_NAME,
            M_NAME: resident.M_NAME,
            L_NAME: resident.L_NAME,
            NAME_EXT: resident.NAME_EXT || '',
            GENDER: resident.GENDER,
            BIRTHDAY: resident.BIRTHDAY
        };

        this.isProcessingEdit = false;
        this.showEditModal = true;
    }

    closeEditModal(): void {
        if (!this.isProcessingEdit) {
            this.showEditModal = false;
            this.selectedConstituentForEdit = null;
        }
    }

    processEditInfo(): void {
        if (!this.selectedConstituentForEdit) return;

        this.isProcessingEdit = true;
        const payload = {
            resident_id: this.selectedConstituentForEdit.resident_id,
            original: this.originalFormCopy,
            updated: this.editForm
        };

        this.http.post<any>(`${this.constituentsUrl}/update-info`, payload).subscribe({
            next: () => {
                this.isProcessingEdit = false;
                this.showEditModal = false;
                this.fetchConstituentRecords();
            },
            error: (err) => {
                this.isProcessingEdit = false;
                alert(err?.error?.message || 'An error occurred while updating profile.');
            }
        });
    }

    // =========================================================
    // STATUS REGISTRATION DELETION CONTROLS LAYER
    // =========================================================
    openDeleteModal(resident: ConstituentData): void {
        this.selectedConstituentForDelete = resident;
        this.deleteReason = '';
        this.isProcessingDelete = false;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        if (!this.isProcessingDelete) {
            this.showDeleteModal = false;
            this.selectedConstituentForDelete = null;
        }
    }

    processDelete(): void {
        if (!this.selectedConstituentForDelete || !this.deleteReason) return;

        this.isProcessingDelete = true;
        const payload = {
            resident_id: this.selectedConstituentForDelete.resident_id,
            remarks: this.deleteReason
        };

        this.http.post<any>(`${this.constituentsUrl}/update-status`, payload).subscribe({
            next: () => {
                this.isProcessingDelete = false;
                this.showDeleteModal = false;
                this.fetchConstituentRecords();
            },
            error: (err) => {
                this.isProcessingDelete = false;
                alert(err?.error?.message || 'Failed to update registration status.');
            }
        });
    }
}