import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleCallback } from './google-callback';

describe('GoogleCallback', () => {
  let component: GoogleCallback;
  let fixture: ComponentFixture<GoogleCallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleCallback]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleCallback);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
