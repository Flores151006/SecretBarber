// ─────────────────────────────────────────────────────────────────────────────
// booking-cancel.ts
//
// Página que muestra Stripe cuando el usuario cancela o abandona el proceso
// de pago antes de completarlo.
//
// Flujo:
//   1. El usuario llega al checkout de Stripe (redirigido desde la app).
//   2. En lugar de pagar, hace clic en "Cancelar" o cierra la pestaña.
//   3. Stripe redirige al usuario a cancel_url (esta página).
//   4. Se muestra un mensaje informativo indicando que el pago fue cancelado.
//
// La reserva NO se crea en la base de datos si el pago no se completa,
// ya que el backend solo confirma la reserva tras recibir el webhook de Stripe.
//
// El componente es puramente visual (sin lógica TypeScript).
// RouterLink permite al usuario volver al formulario de reserva o al inicio.
// ─────────────────────────────────────────────────────────────────────────────

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
