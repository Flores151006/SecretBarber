// ─────────────────────────────────────────────────────────────────────────────
// reset-password.ts
//
// Componente de restablecimiento de contraseña de Secret Barber.
//
// Flujo:
//   1. El usuario llega desde el enlace del email de recuperación.
//      La URL tiene la forma: /reset-password?token=<jwt_de_un_solo_uso>
//   2. ngOnInit() extrae el token del query param y lo almacena en una Signal.
//      Si no hay token, muestra un error inmediatamente.
//   3. El usuario introduce y confirma su nueva contraseña.
//   4. Al enviar, se llama al backend con el token + nueva contraseña.
//   5. Si el backend responde OK, se muestra éxito y se redirige al login
//      tras 3 segundos para que el usuario pueda leer el mensaje de confirmación.
// ─────────────────────────────────────────────────────────────────────────────

// Component: decorador del componente.
// inject(): inyección funcional sin constructor.
// signal(): señal reactiva WritableSignal<T>.
// OnInit: interfaz que obliga a implementar ngOnInit(), el hook de inicialización
//         que se ejecuta una vez, después de que Angular haya creado el componente.
import { Component, inject, signal, OnInit } from '@angular/core';

// CommonModule: @if, @for, pipes básicas para componentes standalone.
import { CommonModule }                       from '@angular/common';

// ReactiveFormsModule: directivas [formGroup] y formControlName en la plantilla.
// FormBuilder: crea el FormGroup de forma abreviada.
// Validators: validadores estándar (required, minLength…).
// AbstractControl: tipo base de FormGroup/FormControl, usado en el validador cruzado
//                  para que el método sea compatible con grupos y controles.
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';

// RouterLink: enlace declarativo en la plantilla.
// ActivatedRoute: acceso a los parámetros de la ruta activa (token en query param).
// Router: navegación programática para redirigir al login tras el éxito.
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

// NgIconComponent: iconos SVG decorativos.
import { NgIconComponent }                    from '@ng-icons/core';

// TranslateModule: internacionalización ES/EN.
import { TranslateModule }                    from '@ngx-translate/core';

// Servicio de autenticación: expone resetPassword(token, newPassword).
import { AuthService }                        from '../../../core/services/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent, TranslateModule],
    templateUrl: './reset-password.html'
})
export class ResetPasswordComponent implements OnInit {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    // ActivatedRoute da acceso a snapshot (estado actual de la ruta) y
    // a observables params/queryParams para cambios dinámicos de ruta.
    private route       = inject(ActivatedRoute);
    private router      = inject(Router);

    // ── Estado reactivo ────────────────────────────────────────────────────────
    // signal('') crea una WritableSignal<string> con valor inicial cadena vacía.
    // Al llamar this.token.set('abc'), Angular actualiza automáticamente
    // cualquier parte de la plantilla que lea token().
    token    = signal('');     // JWT de un solo uso extraído del query param
    cargando = signal(false);  // Controla el spinner durante la llamada al backend
    exito    = signal(false);  // true → muestra el mensaje de éxito en la plantilla
    error    = signal('');     // Mensaje de error visible para el usuario

    // Controlan la visibilidad de cada campo de contraseña (password ↔ text)
    verPass  = false;
    verPass2 = false;

    // ── Formulario reactivo con validación cruzada ─────────────────────────────
    form = this.fb.group({
        password:        ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', Validators.required]
    // { validators: this.passwordsMatch } aplica el validador al FormGroup completo.
    // Se ejecuta cada vez que cambia cualquiera de los dos campos.
    }, { validators: this.passwordsMatch });

    // ── Hook de ciclo de vida: ngOnInit ────────────────────────────────────────
    // Se ejecuta una vez tras la creación del componente, cuando la ruta ya está
    // disponible. Es el lugar correcto para leer parámetros de la URL.
    ngOnInit(): void {
        // route.snapshot es la "foto" inmutable de la ruta en el momento de la navegación.
        // queryParamMap.get('token') lee el valor del query param ?token=...
        // El operador ?? '' proporciona un string vacío si el param no existe.
        const t = this.route.snapshot.queryParamMap.get('token') ?? '';

        if (!t) {
            // Si no hay token en la URL, el enlace es inválido o fue manipulado.
            // Mostramos el error de forma inmediata sin esperar al envío del formulario.
            this.error.set('Token no proporcionado');
            return;
        }

        // Guardamos el token en la Signal para usarlo en submit().
        this.token.set(t);
    }

    // ── Validador cruzado a nivel de FormGroup ─────────────────────────────────
    // Recibe AbstractControl (el FormGroup completo) y compara los dos campos.
    // Devuelve null si coinciden (válido) o { noMatch: true } si difieren (error).
    // La plantilla puede leer el error con: form.errors?.['noMatch']
    private passwordsMatch(group: AbstractControl) {
        const p1 = group.get('password')?.value;
        const p2 = group.get('passwordConfirm')?.value;
        return p1 === p2 ? null : { noMatch: true };
    }

    // ── Envío del formulario ───────────────────────────────────────────────────
    submit(): void {
        // form.markAllAsTouched() provoca que los controles muestren sus errores
        // aunque el usuario no haya interactuado con ellos todavía.
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.cargando.set(true);
        this.error.set('');

        // this.token() lee el valor de la Signal (notación de llamada a función).
        // this.form.value.password! → el ! asegura a TypeScript que no es null/undefined
        // porque ya validamos que el formulario es válido.
        this.authService.resetPassword(this.token(), this.form.value.password!).subscribe({
            next: () => {
                this.exito.set(true);
                this.cargando.set(false);
                // Damos 3 segundos al usuario para leer el mensaje de éxito antes de
                // redirigirlo automáticamente al login. setTimeout() es nativo de JS;
                // no necesitamos RxJS timer() para algo tan sencillo.
                setTimeout(() => this.router.navigate(['/login']), 3000);
            },
            error: (err) => {
                // Errores típicos: token expirado (>1 hora), token ya usado, token inválido.
                this.error.set(err.error?.message || 'Error al restablecer la contraseña');
                this.cargando.set(false);
            }
        });
    }
}
