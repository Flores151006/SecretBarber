// ─────────────────────────────────────────────────────────────────────────────
// verificar-email.ts
//
// Pantalla informativa post-registro de Secret Barber.
//
// Se muestra inmediatamente después de que el usuario se registra con éxito.
// Su propósito es comunicar que:
//   1. El registro se completó correctamente.
//   2. Se ha enviado un email con un enlace de confirmación a la dirección indicada.
//   3. El usuario debe hacer clic en ese enlace antes de poder iniciar sesión.
//
// El email se recupera del query param (?email=...) que el componente de registro
// adjunta al navegar aquí, para poder mostrárselo al usuario y que sepa a qué
// bandeja de entrada debe ir a mirar.
//
// Además ofrece un botón "Reenviar correo" por si el email tardó o fue a spam,
// que llama al backend para generar y enviar un nuevo enlace de verificación.
// ─────────────────────────────────────────────────────────────────────────────

// Component: decorador que convierte la clase en un componente Angular.
// inject(): inyección funcional de servicios (alternativa moderna al constructor).
// OnInit: interfaz con el hook ngOnInit(), ejecutado tras la inicialización del componente.
// signal(): crea una WritableSignal<T> — valor reactivo que actualiza la vista automáticamente.
import { Component, inject, OnInit, signal } from '@angular/core';

// CommonModule: necesario para @if, @for y pipes en componentes standalone.
import { CommonModule }                       from '@angular/common';

// ActivatedRoute: permite acceder a los parámetros de la ruta activa.
//                 Aquí lo usamos para leer el query param ?email=...
// RouterLink: directiva declarativa para el enlace "Ir al login" en la plantilla.
import { ActivatedRoute, RouterLink }         from '@angular/router';

// Servicio centralizado de autenticación. Aquí usamos reenviarVerificacion(email).
import { AuthService }                        from '../../../core/services/auth.service';

// NgIconComponent: iconos SVG decorativos (sobre, check, etc.).
import { NgIconComponent }                    from '@ng-icons/core';

@Component({
    selector: 'app-verificar-email',
    standalone: true,
    imports: [CommonModule, RouterLink, NgIconComponent],
    templateUrl: './verificar-email.html'
})
export class VerificarEmailComponent implements OnInit {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    // ActivatedRoute da acceso a snapshot (parámetros en el momento de la navegación)
    // y a observables que emiten cuando los parámetros cambian dinámicamente.
    private route       = inject(ActivatedRoute);
    private authService = inject(AuthService);

    // ── Estado reactivo con Signals ────────────────────────────────────────────
    // signal<string>('') → WritableSignal inicializada con cadena vacía.
    // Se actualiza con .set(valor) y se lee con .() tanto en TS como en la plantilla.
    email        = signal('');    // Dirección de email del usuario recién registrado
    reenviando   = signal(false); // true mientras el backend procesa el reenvío
    reenviado    = signal(false); // true cuando el reenvío fue exitoso → cambia el texto del botón
    errorReenvio = signal('');    // Mensaje de error si el reenvío falla

    // ── Hook de ciclo de vida ──────────────────────────────────────────────────
    // ngOnInit() es el lugar estándar para leer parámetros de ruta porque en ese
    // momento Angular ya ha configurado la ruta y el snapshot está disponible.
    // No conviene hacerlo en el constructor porque este no tiene acceso a la ruta aún.
    ngOnInit(): void {
        // queryParamMap.get('email') lee el valor de ?email= de la URL.
        // El componente de registro navega con: router.navigate(['/verificar-email'], { queryParams: { email } })
        // Por lo tanto, si venimos del flujo normal, emailParam siempre tendrá valor.
        const emailParam = this.route.snapshot.queryParamMap.get('email');
        if (emailParam) this.email.set(emailParam);
    }

    // ── Reenvío del correo de verificación ────────────────────────────────────
    reenviar(): void {
        // Doble guardia: no hacemos nada si no hay email conocido o si ya hay
        // una petición en vuelo, para evitar múltiples envíos accidentales.
        if (!this.email() || this.reenviando()) return;

        this.reenviando.set(true);
        this.errorReenvio.set('');

        // this.email() lee el valor actual de la Signal.
        this.authService.reenviarVerificacion(this.email()).subscribe({
            next: () => {
                this.reenviando.set(false);
                // reenviado = true cambia el estado visual del botón en la plantilla
                // (ej: deshabilita el botón y muestra "Correo reenviado").
                this.reenviado.set(true);
            },
            error: (err) => {
                this.reenviando.set(false);
                this.errorReenvio.set(err.error?.message || 'Error al reenviar el correo');
            }
        });
    }
}
