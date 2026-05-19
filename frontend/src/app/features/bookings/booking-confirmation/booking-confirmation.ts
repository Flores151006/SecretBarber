// ─────────────────────────────────────────────────────────────────────────────
// booking-confirmation.ts
//
// Página de confirmación para reservas pagadas en EFECTIVO.
// Se navega aquí desde bookings.ts cuando el backend no devuelve res.url
// (es decir, cuando el método de pago es 'efectivo' en lugar de 'tarjeta').
//
// Funcionalidad:
//   - Muestra un mensaje de confirmación con icono de correo (✉️).
//   - Informa al usuario de que recibirá los datos de la reserva por email.
//   - Incluye una barra de progreso que se vacía en 5 segundos.
//   - Al llegar a 0, navega automáticamente a /mis-reservas.
//
// Puntos técnicos:
//   - setInterval: función de JavaScript que ejecuta un callback cada N ms.
//     Aquí se usa cada 1000 ms (1 segundo) para decrementar el contador.
//   - clearInterval: cancela el intervalo cuando el contador llega a 0.
//   - ChangeDetectorRef.detectChanges(): fuerza a Angular a actualizar la vista
//     tras cada tick del intervalo, ya que el componente no usa detección automática.
//   - Router.navigate: navega a otra ruta del SPA sin recargar la página.
//   - porcentaje: valor calculado como (segundosRestantes / 5) * 100,
//     usado para el ancho de la barra de progreso con [style.width].
//   - constructor: aquí se usa constructor en lugar de inject() porque el
//     componente implementa una interfaz clásica de Angular (OnInit con deps).
// ─────────────────────────────────────────────────────────────────────────────

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
    // Contador regresivo: empieza en 5 y baja 1 por segundo
    segundos   = 5;
    // Porcentaje de la barra de progreso: empieza al 100% y baja proporcionalmente
    porcentaje = 100;

    constructor(private router: Router, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        // setInterval ejecuta la función cada 1000 ms (1 segundo)
        const interval = setInterval(() => {
            this.segundos--;
            // Recalcula el ancho de la barra: (segundos restantes / total) * 100
            this.porcentaje = (this.segundos / 5) * 100;
            // Forzamos la actualización de la vista porque setInterval corre fuera
            // del ciclo de detección de cambios de Angular
            this.cdr.detectChanges();
            if (this.segundos === 0) {
                clearInterval(interval); // Cancela el intervalo para evitar pérdidas de memoria
                this.router.navigate(['/mis-reservas']); // Navega a la lista de reservas del usuario
            }
        }, 1000);
    }
}
