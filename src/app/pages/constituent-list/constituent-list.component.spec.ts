import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstituentListComponent } from './constituent-list.component';

describe('ConstituentListComponent', () => {
  let component: ConstituentListComponent;
  let fixture: ComponentFixture<ConstituentListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConstituentListComponent]
    });
    fixture = TestBed.createComponent(ConstituentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
