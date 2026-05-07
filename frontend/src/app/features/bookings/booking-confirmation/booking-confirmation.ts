import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-booking-confirmation',
    standalone: true,
    imports: [],
    template: `
        <div class="min-h-screen bg-background flex items-center justify-center px-4">
            <div class="text-center max-w-md">
                <div class="w-20 h-20 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span class="text-4xl">✉️</span>
                </div>
                <h1 class="font-serif text-3xl text-foreground font-bold mb-4">¡Reserva realizada!</h1>
                <p class="text-foreground/60 mb-2">
                    Te enviaremos los datos de tu reserva por correo electrónico.
                </p>
                <p class="text-foreground/40 text-sm mb-8">
                    Serás redirigido a tus reservas en <span class="text-gold font-bold">{{ segundos }}</span> segundos...
                </p>
                <div class="w-full bg-gold/10 rounded-full h-1">
                    <div class="bg-gold h-1 rounded-full transition-all duration-1000"
                         [style.width]="porcentaje + '%'">
                    </div>
                </div>
            </div>
        </div>
    `
})
export class BookingConfirmationComponent implements OnInit {
    segundos   = 5;
    porcentaje = 100;

    constructor(private router: Router, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        const interval = setInterval(() => {
            this.segundos--;
            this.porcentaje = (this.segundos / 5) * 100;
            this.cdr.detectChanges();
            if (this.segundos === 0) {
                clearInterval(interval);
                this.router.navigate(['/mis-reservas']);
            }
        }, 1000);
    }
}