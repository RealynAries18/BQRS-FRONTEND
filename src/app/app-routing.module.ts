import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent} from "./pages/dashboard/dashboard.component";
import { ConstituentListComponent } from './pages/constituent-list/constituent-list.component';
import { AttendanceListComponent } from './pages/attendance-list/attendance-list.component';
import { StatisticsReportComponent} from "./pages/statistics-report/statistics-report.component";

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [

    // 🔹 Public Route (Login First)
    {
        path: 'login',
        component: LoginComponent
    },

    // 🔹 Protected Routes (Main Layout)
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [AuthGuard], // Protect everything inside layout
        children: [
            { path: 'constituent-list', component: ConstituentListComponent },
            { path: 'statistics-report', component: StatisticsReportComponent },
            { path: 'dashboard', component: DashboardComponent }
        ]
    },

    // 🔹 Fallback
    { path: '**', redirectTo: 'login' }

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
