// ─────────────────────────────────────────────────────────────────────────────
// forgot-password.ts
//
// Componente "¿Olvidaste tu contraseña?" de Secret Barber.
//
// Flujo en dos pasos:
//   1. El usuario introduce su email y pulsa "Enviar".
//   2. La UI cambia a una pantalla de confirmación que indica que, si el email
//      existe en el sistema, recibirá un enlace de recuperación.
//
// SEGURIDAD — Anti-enumeración de usuarios:
//   El backend SIEMPRE responde con éxito (HTTP 200) independientemente de si
//   el email está registrado o no. Esto impide que un atacante descubra qué
//   emails tienen cuenta en la aplicación simplemente probando direcciones.
//   Por eso el frontend muestra siempre la pantalla de confirmación en el bloque
//   `next`, incluso aunque el email no exista en la base de datos.
// ─────────────────────────────────────────────────────────────────────────────

// Component: decorador que define metadatos del componente Angular.
// inject(): inyección funcional de dependencias (sin constructor explícito).
// signal(): crea una señal reactiva — un valor que, al cambiar, notifica
//           automáticamente a la plantilla para que se re-renderice.
//           Es la alternativa moderna a las propiedades de clase normales + ChangeDetectorRef.
import { Component, inject, signal } from '@angular/core';

// CommonModule: aporta @if, @for y pipes básicas en componentes standalone.
import { CommonModule }              from '@angular/common';

// ReactiveFormsModule + helpers para el formulario reactivo de email.
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// RouterLink: directiva para el enlace "Volver al login" en la plantilla.
import { RouterLink }                from '@angular/router';

// NgIconComponent: iconos SVG decorativos (sobre, flecha de retorno, etc.).
import { NgIconComponent }           from '@ng-icons/core';

// TranslateModule: pipe | translate para textos internacionalizados ES/EN.
// TranslateService: permite obtener traducciones de forma programática en el TS
//                   cuando necesitamos el texto traducido en código (no en plantilla).
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Servicio central de autenticación; expone forgotPassword(email) que hace
// POST /auth/forgot-password al backend.
import { AuthService }               from '../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent, TranslateModule],
    templateUrl: './forgot-password.html'
})
export class ForgotPasswordComponent {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    // TranslateService se inyecta para usar translate.instant() en el bloque error
    // y obtener la traducción del mensaje genérico de error en tiempo de ejecución.
    private translate   = inject(TranslateService);

    // ── Formulario reactivo ────────────────────────────────────────────────────
    // Solo tiene un campo: el email al que enviar el enlace de recuperación.
    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    });

    // ── Estado reactivo con Signals ────────────────────────────────────────────
    // signal<T>(valorInicial) crea una WritableSignal<T>.
    // Para leer el valor en TypeScript: this.cargando()
    // Para actualizar el valor:         this.cargando.set(true)
    // En la plantilla se usa igual que una propiedad: {{ cargando() }} o @if(cargando())
    // La ventaja sobre una propiedad normal es que Angular detecta el cambio
    // de forma granular, sin necesitar ChangeDetectorRef ni zone.js.
    cargando = signal(false); // true mientras espera la respuesta del servidor
    enviado  = signal(false); // true cuando el servidor responde OK → muestra confirmación
    error    = signal('');    // mensaje de error si la petición falla (raro, ver nota de seguridad)

    // ── Envío del formulario ───────────────────────────────────────────────────
    submit(): void {
        // markAllAsTouched() activa los estilos y mensajes de error de todos los
        // controles para que el usuario vea qué campos son inválidos al pulsar enviar
        // sin haber tocado los campos previamente.
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.cargando.set(true);
        this.error.set('');

        // El operador ! (non-null assertion) indica a TypeScript que sabemos que
        // email tiene valor porque acabamos de validar que el formulario es válido.
        this.authService.forgotPassword(this.form.value.email!).subscribe({
            next: () => {
                // El servidor devolvió 200. Mostramos la pantalla de confirmación.
                // NOTA: esto ocurre TANTO si el email existe como si no (anti-enumeración).
                // La UI no debe dar pistas sobre si el email está registrado.
                this.enviado.set(true);
                this.cargando.set(false);
            },
            error: (err) => {
                // Este bloque solo debería ejecutarse ante errores de servidor (5xx)
                // o de red, ya que el backend devuelve 200 incluso para emails inexistentes.
                // translate.instant() obtiene sincrónicamente la traducción de la clave.
                this.error.set(err.error?.message || this.translate.instant('COMUN.ERROR'));
                this.cargando.set(false);
            }
        });
    }
}
