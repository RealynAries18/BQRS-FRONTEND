import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsReportComponent } from './statistics-report.component';

describe('StatisticsReportComponent', () => {
  let component: StatisticsReportComponent;
  let fixture: ComponentFixture<StatisticsReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StatisticsReportComponent]
    });
    fixture = TestBed.createComponent(StatisticsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
