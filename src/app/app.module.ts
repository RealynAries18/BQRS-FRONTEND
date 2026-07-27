import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { StatisticsComponent } from './pages/statistics/statistics.component';
import { ConstituentListComponent } from './pages/constituent-list/constituent-list.component';
import { AttendanceListComponent } from './pages/attendance-list/attendance-list.component';
import {HttpClientModule} from "@angular/common/http";
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { StatisticsReportComponent } from './pages/statistics-report/statistics-report.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    StatisticsComponent,
    ConstituentListComponent,
    AttendanceListComponent,
    MainLayoutComponent,
    StatisticsReportComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
      FormsModule,
      HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
