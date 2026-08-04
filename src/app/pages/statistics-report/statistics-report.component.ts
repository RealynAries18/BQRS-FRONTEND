import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { saveAs } from 'file-saver';

// --- Global Type Declarations ---
declare const Buffer: any;

export interface MatrixRow {
  barangay: string;
  active_count: number;
  transferred_count: number;
  deceased_count: number;
  male_count: number;
  female_count: number;
  below_18_count: number;
  above_18_count: number;
}

export interface ConstituentGranularItem {
  lastName: string;
  firstName: string;
  middleName?: string;
  nameExtension?: string;
  gender: string;
  status: string;
  barangay: string;
  birth_date?: string;
}

@Component({
  selector: 'app-statistics-report',
  templateUrl: './statistics-report.component.html',
  styleUrls: ['./statistics-report.component.css']
})
export class StatisticsReportComponent implements OnInit {
  isLoadingStatus = true;
  isLoadingBiometrics = true;
  isLoadingMatrix = true;
  isLoadingList = true;

  barangaySearchTerm: string = '';
  statusSearchTerm: string = '';
  genderSearchTerm: string = '';
  ageSearchTerm: string = '';

  masterStatusReport: any[] = [];
  masterBiometricReport: any[] = [];
  masterMatrixReport: MatrixRow[] = [];
  masterConstituentsList: ConstituentGranularItem[] = [];

  filteredMatrixReport: MatrixRow[] = [];
  filteredConstituentsList: ConstituentGranularItem[] = [];

  barangayOptions: string[] = [];
  statusOptions: string[] = ['Active', 'Transferred', 'Deceased'];
  genderOptions: string[] = ['Male', 'Female'];
  ageBracketOptions: string[] = ['Below 18 yrs.old', '18 yrs.old and Above'];

  selectedBarangays: string[] = [];
  selectedStatuses: string[] = ['Active', 'Transferred', 'Deceased'];
  selectedGenders: string[] = ['Male', 'Female'];
  selectedAgeBrackets: string[] = ['Below 18 yrs.old', '18 yrs.old and Above'];

  dropdownStates: { [key: string]: boolean } = {
    barangay: false,
    status: false,
    gender: false,
    age: false
  };

  matrixTotals = { active: 0, transferred: 0, deceased: 0, male: 0, female: 0, below_18: 0, above_18: 0 };
  baseApiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchConstituentStatus();
    this.fetchBiometricPenetration();
    this.fetchMatrixOverview();
    this.fetchDetailedConstituents();
  }

  // --- Dynamic Column Span Helpers ---
  get statusColspan(): number {
    let count = 0;
    if (this.selectedStatuses.includes('Active')) count++;
    if (this.selectedStatuses.includes('Transferred')) count++;
    if (this.selectedStatuses.includes('Deceased')) count++;
    return count > 0 ? count : 1;
  }

  get biometricColspan(): number {
    let count = 0;
    if (this.selectedGenders.includes('Male')) count++;
    if (this.selectedGenders.includes('Female')) count++;
    return count > 0 ? count : 1;
  }

  get ageColspan(): number {
    let count = 0;
    if (this.selectedAgeBrackets.includes('Below 18 yrs.old')) count++;
    if (this.selectedAgeBrackets.includes('18 yrs.old and Above')) count++;
    return count > 0 ? count : 1;
  }

  calculateAge(birthDateStr?: string): number {
    if (!birthDateStr) return 0;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // --- UI Helpers ---
  toggleDropdown(type: string) {
    const targetState = !this.dropdownStates[type];
    Object.keys(this.dropdownStates).forEach(key => this.dropdownStates[key] = false);
    this.dropdownStates[type] = targetState;
  }

  getSelectedText(type: string): string {
    if (type === 'barangay') return this.selectedBarangays.length === 0 ? '(None Selected)' : this.selectedBarangays.join(', ');
    if (type === 'status') return this.selectedStatuses.length === 0 ? '(None Selected)' : this.selectedStatuses.join(', ');
    if (type === 'gender') return this.selectedGenders.length === 0 ? '(None Selected)' : this.selectedGenders.join(', ');
    if (type === 'age') return this.selectedAgeBrackets.length === 0 ? '(None Selected)' : this.selectedAgeBrackets.join(', ');
    return '';
  }

  @HostListener('document:click', ['$event'])
  closeDropdownsOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.excel-dropdown-container')) {
      Object.keys(this.dropdownStates).forEach(key => this.dropdownStates[key] = false);
    }
  }

  // --- Filter Logic ---
  toggleAllBarangays(checked: boolean) {
    this.selectedBarangays = checked ? [...this.barangayOptions] : [];
    this.applyDataFilters();
  }

  onBarangayToggle(b: string) {
    this.selectedBarangays = this.selectedBarangays.includes(b) ? this.selectedBarangays.filter(item => item !== b) : [...this.selectedBarangays, b];
    this.applyDataFilters();
  }

  toggleAllStatuses(checked: boolean) {
    this.selectedStatuses = checked ? [...this.statusOptions] : [];
    this.applyDataFilters();
  }

  onStatusToggle(status: string) {
    this.selectedStatuses = this.selectedStatuses.includes(status) ? this.selectedStatuses.filter(item => item !== status) : [...this.selectedStatuses, status];
    this.applyDataFilters();
  }

  toggleAllGenders(checked: boolean) {
    this.selectedGenders = checked ? [...this.genderOptions] : [];
    this.applyDataFilters();
  }

  onGenderToggle(gender: string) {
    this.selectedGenders = this.selectedGenders.includes(gender) ? this.selectedGenders.filter(item => item !== gender) : [...this.selectedGenders, gender];
    this.applyDataFilters();
  }

  toggleAllAgeBrackets(checked: boolean) {
    this.selectedAgeBrackets = checked ? [...this.ageBracketOptions] : [];
    this.applyDataFilters();
  }

  onAgeBracketToggle(ageOpt: string) {
    this.selectedAgeBrackets = this.selectedAgeBrackets.includes(ageOpt) ? this.selectedAgeBrackets.filter(item => item !== ageOpt) : [...this.selectedAgeBrackets, ageOpt];
    this.applyDataFilters();
  }

  applyDataFilters() {
    const barangayMap = new Map<string, MatrixRow>();

    this.barangayOptions.forEach(b => {
      barangayMap.set(b, {
        barangay: b,
        active_count: 0,
        transferred_count: 0,
        deceased_count: 0,
        male_count: 0,
        female_count: 0,
        below_18_count: 0,
        above_18_count: 0
      });
    });

    this.masterMatrixReport.forEach(item => {
      if (barangayMap.has(item.barangay)) {
        let row = barangayMap.get(item.barangay)!;
        if (item.active_count !== undefined) row.active_count = Number(item.active_count || 0);
        if (item.transferred_count !== undefined) row.transferred_count = Number(item.transferred_count || 0);
        if (item.deceased_count !== undefined) row.deceased_count = Number(item.deceased_count || 0);
        if (item.male_count !== undefined) row.male_count = Number(item.male_count || 0);
        if (item.female_count !== undefined) row.female_count = Number(item.female_count || 0);
        if (item.below_18_count !== undefined) row.below_18_count = Number(item.below_18_count || 0);
        if (item.above_18_count !== undefined) row.above_18_count = Number(item.above_18_count || 0);
      }
    });

    if (this.masterConstituentsList.length > 0) {
      this.masterConstituentsList.forEach(c => {
        if (barangayMap.has(c.barangay)) {
          let row = barangayMap.get(c.barangay)!;
          const statusLower = (c.status || '').toLowerCase();
          const genderLower = (c.gender || '').toLowerCase();
          const ageVal = this.calculateAge(c.birth_date);

          if (row.active_count === 0 && row.transferred_count === 0 && row.deceased_count === 0) {
            if (statusLower === 'active' || statusLower === 'a') row.active_count++;
            if (statusLower === 'transferred' || statusLower === 't') row.transferred_count++;
            if (statusLower === 'deceased' || statusLower === 'd') row.deceased_count++;
          }
          if (row.male_count === 0 && row.female_count === 0) {
            if (genderLower === 'male' || genderLower === 'm') row.male_count++;
            if (genderLower === 'female' || genderLower === 'f') row.female_count++;
          }
          if (row.below_18_count === 0 && row.above_18_count === 0) {
            if (ageVal < 18) {
              row.below_18_count++;
            } else {
              row.above_18_count++;
            }
          }
        }
      });
    }

    const consolidatedMatrix = Array.from(barangayMap.values());

    this.filteredMatrixReport = consolidatedMatrix.filter(r => this.selectedBarangays.includes(r.barangay));

    this.matrixTotals.active = this.filteredMatrixReport.reduce((acc, r) => acc + r.active_count, 0);
    this.matrixTotals.transferred = this.filteredMatrixReport.reduce((acc, r) => acc + r.transferred_count, 0);
    this.matrixTotals.deceased = this.filteredMatrixReport.reduce((acc, r) => acc + r.deceased_count, 0);
    this.matrixTotals.male = this.filteredMatrixReport.reduce((acc, r) => acc + r.male_count, 0);
    this.matrixTotals.female = this.filteredMatrixReport.reduce((acc, r) => acc + r.female_count, 0);
    this.matrixTotals.below_18 = this.filteredMatrixReport.reduce((acc, r) => acc + r.below_18_count, 0);
    this.matrixTotals.above_18 = this.filteredMatrixReport.reduce((acc, r) => acc + r.above_18_count, 0);

    this.filteredConstituentsList = this.masterConstituentsList.filter(item => {
      const ageVal = this.calculateAge(item.birth_date);
      const matchesAge = (this.selectedAgeBrackets.includes('Below 18 yrs.old') && ageVal < 18) ||
        (this.selectedAgeBrackets.includes('18 yrs.old and Above') && ageVal >= 18);

      return this.selectedBarangays.includes(item.barangay) &&
        this.selectedStatuses.some(s => s.toLowerCase() === item.status.toLowerCase()) &&
        this.selectedGenders.some(g => g.toLowerCase() === item.gender.toLowerCase()) &&
        matchesAge;
    });
  }

  // --- API Methods & Export ---
  fetchConstituentStatus() {
    this.http.get<any[]>(`${this.baseApiUrl}/dashboard/constituent-status`).subscribe(data => {
      this.masterStatusReport = data;
      this.barangayOptions = [...new Set(data.map(r => r.barangay))].sort();
      if (this.selectedBarangays.length === 0) this.selectedBarangays = [...this.barangayOptions];
      this.isLoadingStatus = false;
      this.applyDataFilters();
    });
  }

  fetchBiometricPenetration() {
    this.http.get<any[]>(`${this.baseApiUrl}/dashboard/biometric-penetration`).subscribe(data => {
      this.masterBiometricReport = data;
      this.isLoadingBiometrics = false;
      this.applyDataFilters();
    });
  }

  fetchMatrixOverview() {
    this.http.get<MatrixRow[]>(`${this.baseApiUrl}/statistics-report/matrix`).subscribe(data => {
      this.masterMatrixReport = data;
      this.isLoadingMatrix = false;
      this.applyDataFilters();
    });
  }

  fetchDetailedConstituents() {
    this.http.get<ConstituentGranularItem[]>(`${this.baseApiUrl}/statistics-report/constituents`).subscribe(data => {
      this.masterConstituentsList = data;
      this.isLoadingList = false;
      this.applyDataFilters();
    });
  }

  async exportToExcel() {
    try {
      const workbook = new ExcelJS.Workbook();

      this.buildStatisticsMatrixSheet(workbook);
      this.buildConstituentsSheet(workbook);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Statistics_Matrix_Overview.xlsx');
    } catch (error) {
      console.error('Excel Export failed:', error);
    }
  }

  private buildStatisticsMatrixSheet(workbook: any) {
    const worksheet = workbook.addWorksheet('Statistics Matrix Overview');

    const thin = { style: 'thin', color: { argb: 'FFD1D5DB' } } as any;
    const allBorders = { top: thin, left: thin, bottom: thin, right: thin };
    const centerMiddle = { vertical: 'middle', horizontal: 'center' } as any;
    const groupFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } } as any;

    type ColDef = { header: string; key: keyof MatrixRow; color?: string };
    type GroupDef = { title: string; cols: ColDef[] };

    const statusCols: ColDef[] = [];
    if (this.selectedStatuses.includes('Active')) statusCols.push({ header: 'ACTIVE', key: 'active_count', color: 'FF16A34A' });
    if (this.selectedStatuses.includes('Transferred')) statusCols.push({ header: 'TRANSFERRED', key: 'transferred_count', color: 'FFF97316' });
    if (this.selectedStatuses.includes('Deceased')) statusCols.push({ header: 'DECEASED', key: 'deceased_count', color: 'FFDC2626' });

    const biometricCols: ColDef[] = [];
    if (this.selectedGenders.includes('Male')) biometricCols.push({ header: 'MALE', key: 'male_count', color: 'FF2563EB' });
    if (this.selectedGenders.includes('Female')) biometricCols.push({ header: 'FEMALE', key: 'female_count', color: 'FFDB2777' });

    const ageCols: ColDef[] = [];
    if (this.selectedAgeBrackets.includes('Below 18 yrs.old')) ageCols.push({ header: 'BELOW 18YRS.OLD', key: 'below_18_count' });
    if (this.selectedAgeBrackets.includes('18 yrs.old and Above')) ageCols.push({ header: '18YRS.OLD AND ABOVE', key: 'above_18_count' });

    const groups: GroupDef[] = [
      { title: 'STATUS', cols: statusCols },
      { title: 'GENDER', cols: biometricCols },
      { title: 'AGE BRACKET', cols: ageCols }
    ].filter(g => g.cols.length > 0);

    const dataCols: ColDef[] = groups.flatMap(g => g.cols);
    const totalCols = 1 + dataCols.length;

    worksheet.mergeCells(1, 1, 2, 1);
    worksheet.getCell(1, 1).value = 'BARANGAY';

    let colIndex = 2;
    groups.forEach(g => {
      const startCol = colIndex;
      const endCol = colIndex + g.cols.length - 1;
      if (endCol > startCol) {
        worksheet.mergeCells(1, startCol, 1, endCol);
      }
      worksheet.getCell(1, startCol).value = g.title;

      g.cols.forEach((c, i) => {
        const cell = worksheet.getCell(2, startCol + i);
        cell.value = c.header;
        if (c.color) cell.font = { bold: true, color: { argb: c.color } };
      });

      colIndex = endCol + 1;
    });

    [1, 2].forEach(r => {
      worksheet.getRow(r).eachCell({ includeEmpty: true }, (cell: any) => {
        cell.alignment = centerMiddle;
        cell.fill = groupFill;
        cell.border = allBorders;
        cell.font = { ...(cell.font || {}), bold: true, size: 11 };
      });
    });

    this.filteredMatrixReport.forEach(row => {
      const rowValues = [row.barangay, ...dataCols.map(c => row[c.key])];
      const dataRow = worksheet.addRow(rowValues);
      dataRow.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.border = allBorders;
        cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'center' } as any;
      });
    });

    const totalsMap: Record<string, number> = {
      active_count: this.matrixTotals.active,
      transferred_count: this.matrixTotals.transferred,
      deceased_count: this.matrixTotals.deceased,
      male_count: this.matrixTotals.male,
      female_count: this.matrixTotals.female,
      below_18_count: this.matrixTotals.below_18,
      above_18_count: this.matrixTotals.above_18
    };
    const totalsValues = ['TOTAL', ...dataCols.map(c => totalsMap[c.key])];
    const totalsRow = worksheet.addRow(totalsValues);
    totalsRow.eachCell({ includeEmpty: true }, (cell: any) => {
      cell.font = { bold: true };
      cell.border = allBorders;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } as any;
      cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'center' } as any;
    });

    const groupMinWidths: number[] = new Array(totalCols + 1).fill(0);
    let cursor = 2;
    groups.forEach(g => {
      const start = cursor;
      const end = cursor + g.cols.length - 1;
      const share = Math.ceil((g.title.length + 2) / g.cols.length);
      for (let c = start; c <= end; c++) groupMinWidths[c] = share;
      cursor = end + 1;
    });

    for (let c = 1; c <= totalCols; c++) {
      const column = worksheet.getColumn(c);
      let maxLength = groupMinWidths[c] || 8;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const text = cell.value !== null && cell.value !== undefined ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, text.length);
      });
      column.width = maxLength + 4;
    }

    return worksheet;
  }

  private buildConstituentsSheet(workbook: any) {
    const worksheet = workbook.addWorksheet('Constituents Report');
    const thin = { style: 'thin', color: { argb: 'FFD1D5DB' } } as any;
    const allBorders = { top: thin, left: thin, bottom: thin, right: thin };
    const centerMiddle = { vertical: 'middle', horizontal: 'center' } as any;
    const groupFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } } as any;

    type ColDef = { header: string; getValue: (item: ConstituentGranularItem) => string };

    const cols: ColDef[] = [
      { header: 'BARANGAY', getValue: item => item.barangay },
      { header: 'FULL NAME', getValue: item => this.formatFullName(item) }
    ];

    if (this.selectedStatuses.length > 0) {
      cols.push({ header: 'STATUS', getValue: item => this.formatStatus(item.status) });
    }
    if (this.selectedGenders.length > 0) {
      cols.push({ header: 'GENDER', getValue: item => this.capitalize(item.gender) });
    }
    if (this.selectedAgeBrackets.length > 0) {
      cols.push({ header: 'AGE GROUP', getValue: item => this.formatAgeGroup(item.birth_date) });
    }

    const headers = cols.map(c => c.header);
    worksheet.addRow(headers);

    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell: any) => {
      cell.font = { bold: true, size: 11 };
      cell.fill = groupFill;
      cell.border = allBorders;
      cell.alignment = centerMiddle;
    });

    this.filteredConstituentsList.forEach(item => {
      const rowValues = cols.map(c => c.getValue(item));
      const row = worksheet.addRow(rowValues);
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.border = allBorders;
        cell.alignment = { horizontal: cell.col === 2 ? 'left' : 'center' } as any;
      });
    });

    for (let c = 1; c <= headers.length; c++) {
      const column = worksheet.getColumn(c);
      let maxLength = 8;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const text = cell.value != null ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, text.length);
      });
      column.width = maxLength + 4;
    }

    return worksheet;
  }

  private formatFullName(item: ConstituentGranularItem): string {
    const last = this.capitalize(item.lastName);
    const first = this.capitalize(item.firstName);
    const middle = this.capitalize(item.middleName);
    const ext = this.capitalize(item.nameExtension);
    return [`${last},`, first, middle, ext].filter(Boolean).join(' ');
  }

  private formatStatus(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'A' || s === 'Active') return 'Active';
    if (s === 'T' || s === 'Transferred') return 'Transferred';
    if (s === 'D' || s === 'Deceased') return 'Deceased';
    return status;
  }

  private formatAgeGroup(birthDate?: string): string {
    return this.calculateAge(birthDate) >= 18 ? 'Adult (18+)' : 'Minor';
  }

  private capitalize(str?: string): string {
    if (!str) return '';
    const trimmed = str.trim().toLowerCase();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
}
