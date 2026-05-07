import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisBookings } from './mis-bookings';

describe('MisBookings', () => {
  let component: MisBookings;
  let fixture: ComponentFixture<MisBookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisBookings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisBookings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
