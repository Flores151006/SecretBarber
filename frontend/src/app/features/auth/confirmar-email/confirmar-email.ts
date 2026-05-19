// ─────────────────────────────────────────────────────────────────────────────
// confirmar-email.ts
//
// Componente de confirmación de email de Secret Barber.
//
// El usuario llega aquí haciendo clic en el enlace del email de verificación.
// La URL tiene la forma: /confirmar-email?token=<jwt_de_un_solo_uso>
//
// Flujo automático (sin interacción del usuario):
//   1. ngOnInit() se ejecuta al cargar el componente.
//   2. Extrae el token del query param ?token=...
//   3. Si no hay token → muestra error de enlace inválido.
//   4. Si hay token → llama al backend para validarlo y activar la cuenta.
//   5. El estado cambia a 'exito' o 'error' según la respuesta del servidor.
//
// El estado se modela con un tipo union ('cargando' | 'exito' | 'error') almacenado
// en una Signal, lo que permite a la plantilla renderizar condicionalmente
// el bloque correcto con una sola señal reactiva en lugar de múltiples booleanos.
// ─────────────────────────────────────────────────────────────────────────────

// Component: decorador del componente.
// inject(): inyección funcional de servicios sin constructor.
// OnInit: interfaz del hook ngOnInit(), ejecutado tras inicializar el componente.
// signal(): crea una WritableSignal<T> para estado reactivo granular.
import { Component, inject, OnInit, signal } from '@angular/core';

// CommonModule: @if, @for, pipes básicas en componentes standalone.
import { CommonModule }                       from '@angular/common';

// ActivatedRoute: proporciona acceso a los query params de la ruta activa.
// RouterLink: directiva para el enlace "Ir al login" en la plantilla.
import { ActivatedRoute, RouterLink }         from '@angular/router';

// Servicio de autenticación: expone verificarEmail(token) → Observable.
import { AuthService }                        from '../../../core/services/auth.service';

// NgIconComponent: iconos SVG (check verde, X roja, spinner).
import { NgIconComponent }                    from '@ng-icons/core';

// Tipo union que modela los tres posibles estados de la operación de verificación.
// Usar un tipo en lugar de múltiples booleanos (isLoading, isSuccess, isError)
// hace el código más explícito y evita estados imposibles (ej: success + error a la vez).
type Estado = 'cargando' | 'exito' | 'error';

@Component({
    selector: 'app-confirmar-email',
    standalone: true,
    imports: [CommonModule, RouterLink, NgIconComponent],
    templateUrl: './confirmar-email.html'
})
export class ConfirmarEmailComponent implements OnInit {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    // ActivatedRoute: necesario para leer el token del query param ?token=...
    private route       = inject(ActivatedRoute);
    private authService = inject(AuthService);

    // ── Estado reactivo ────────────────────────────────────────────────────────
    // signal<Estado>('cargando') → WritableSignal tipada con el union type definido arriba.
    // El estado inicial 'cargando' es correcto porque en ngOnInit() lanzamos
    // inmediatamente la petición al backend, por lo que la pantalla nunca debería
    // mostrar el spinner más de un instante.
    estado  = signal<Estado>('cargando');

    // Mensaje descriptivo que complementa el estado (éxito o error).
    // Se muestra junto al icono visual en la plantilla.
    mensaje = signal('');

    // ── Verificación automática al inicializar ─────────────────────────────────
    // Toda la lógica está en ngOnInit() porque la verificación debe ocurrir
    // automáticamente al entrar en la ruta, sin que el usuario pulse ningún botón.
    ngOnInit(): void {
        // snapshot.queryParamMap.get('token') → lee el valor de ?token= de la URL.
        // Si el usuario llega desde el email, este param siempre debería estar presente.
        // Si llega directamente a la URL sin el param, mostramos error.
        const token = this.route.snapshot.queryParamMap.get('token');

        if (!token) {
            // Sin token no podemos verificar nada. Podría ser que:
            //   - El enlace fue cortado/modificado por un cliente de correo.
            //   - El usuario accedió manualmente a la ruta sin el param.
            this.estado.set('error');
            this.mensaje.set('Enlace de verificación inválido.');
            return;
        }

        // Llamada al backend: POST o GET /auth/verificar-email?token=...
        // El servidor valida el JWT de un solo uso, activa la cuenta y responde:
        //   200 OK  → { message: 'Email verificado correctamente' }
        //   4xx/5xx → { message: 'El enlace ha expirado' } o similar
        this.authService.verificarEmail(token).subscribe({
            next: (res) => {
                // La cuenta ha sido activada. El usuario ya puede iniciar sesión.
                this.estado.set('exito');
                // res.message contiene el texto de confirmación del servidor,
                // que mostramos directamente en la pantalla.
                this.mensaje.set(res.message);
            },
            error: (err) => {
                // Errores habituales: token expirado (>24h), token ya usado,
                // o token que no corresponde a ningún usuario.
                this.estado.set('error');
                this.mensaje.set(err.error?.message || 'El enlace es inválido o ha expirado.');
            }
        });
    }
}
