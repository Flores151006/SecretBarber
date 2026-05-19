// ─────────────────────────────────────────────────────────────────────────────
// booking-success.ts
//
// Página de éxito que muestra Stripe al redirigir de vuelta a la aplicación
// tras un pago completado correctamente.
//
// Flujo completo con Stripe:
//   1. El usuario elige pago con tarjeta en el formulario de reserva.
//   2. El backend crea una sesión de Stripe y devuelve { url }.
//   3. window.location.href redirige al checkout de Stripe (fuera del SPA).
//   4. El usuario completa el pago en Stripe.
//   5. Stripe redirige al usuario a success_url (esta página) con el
//      query param ?session_id=xxx en la URL.
//   6. Esta página muestra una confirmación visual al usuario.
//
// El componente es puramente visual (no hay lógica TypeScript).
// La plantilla HTML muestra un mensaje de éxito con un botón RouterLink
// para volver a la sección de reservas.
//
// RouterLink: directiva de Angular que genera un <a href> que navega dentro
// del SPA sin recargar la página. Es equivalente a router.navigate(['/ruta']).
// ─────────────────────────────────────────────────────────────────────────────

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
