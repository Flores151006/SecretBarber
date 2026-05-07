import { Component } from '@angular/core';
import { RouterLink }      from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-booking-success',
    standalone: true,
    imports: [RouterLink, NgIconComponent],
    templateUrl: './booking-success.html'
})
export class BookingSuccessComponent {}