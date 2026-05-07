import { Component } from '@angular/core';
import { RouterLink }      from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-booking-cancel',
    standalone: true,
    imports: [RouterLink, NgIconComponent],
    templateUrl: './booking-cancel.html'
})
export class BookingCancelComponent {}