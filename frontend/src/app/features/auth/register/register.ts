// ─────────────────────────────────────────────────────────────────────────────
// register.ts
//
// Componente de registro de nuevos usuarios en Secret Barber.
// Valida nombre, email y contraseña segura (mínimo 8 caracteres, al menos una
// mayúscula y un dígito). Aplica una validación cruzada a nivel de FormGroup
// para comprobar que ambas contraseñas coinciden antes de enviar los datos.
// Tras un registro exitoso, redirige a la pantalla de verificación de email.
// ─────────────────────────────────────────────────────────────────────────────

// Component: decorador que define metadatos del componente.
// inject(): inyección funcional de servicios (Angular 14+), sin necesidad de constructor.
// ChangeDetectorRef: permite forzar la actualización de la vista tras operaciones asíncronas.
import { Component, inject, ChangeDetectorRef } from '@angular/core';

// FormBuilder: crea FormGroup y FormControl de forma abreviada.
// FormGroup: contenedor de controles que actúa como unidad de validación.
// Validators: validadores estándar de Angular (required, email, minLength, pattern…).
// ReactiveFormsModule: necesario para usar [formGroup]/formControlName en la plantilla.
import { FormBuilder, FormGroup,
         Validators, ReactiveFormsModule }       from '@angular/forms';

// Router: navegación programática. RouterLink: navegación declarativa en plantillas.
import { Router, RouterLink }                    from '@angular/router';

// Servicio centralizado de autenticación: login, register, logout y estado de usuario.
import { AuthService }                           from '../../../core/services/auth.service';

// Wrapper del SDK de Google reCAPTCHA v3. execute(action) devuelve un token
// que el backend valida contra la API de Google para detectar bots.
import { RecaptchaService }                      from '../../../core/services/recaptcha.service';

// CommonModule: *ngIf, *ngFor, pipes integradas, etc. (necesario en standalone).
import { CommonModule }                          from '@angular/common';

// Pipe | translate de ngx-translate para internacionalización ES/EN.
import { TranslateModule }                       from '@ngx-translate/core';

// Componente de iconos SVG de la librería @ng-icons.
import { NgIconComponent }                       from '@ng-icons/core';

@Component({
    selector:    'app-register',
    // standalone: true → el componente se autogestiona sin pertenecer a un NgModule.
    // Esto permite importarlo directamente en rutas con loadComponent() para lazy loading.
    standalone:  true,
    imports:     [ReactiveFormsModule, RouterLink, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './register.html'
})
export class RegisterComponent {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    private fb          = inject(FormBuilder);
    private authService = inject(AuthService);
    private recaptcha   = inject(RecaptchaService);
    private router      = inject(Router);
    // ChangeDetectorRef es necesario porque actualizamos el estado dentro de callbacks
    // de Observable (subscribe), que pueden ejecutarse fuera del ciclo de Angular.
    private cdr         = inject(ChangeDetectorRef);

    // ── Formulario reactivo con validación cruzada ─────────────────────────────
    // El segundo argumento de fb.group() es un objeto de opciones que permite
    // añadir validadores a nivel de GRUPO (no de control individual).
    // Esto es necesario para validaciones que involucran múltiples campos,
    // como comprobar que password === confirmarPass.
    form: FormGroup = this.fb.group({
        name:          ['', [Validators.required, Validators.minLength(3)]],
        email:         ['', [Validators.required, Validators.email]],

        // Validators.pattern() acepta una expresión regular.
        // /(?=.*[A-Z])(?=.*[0-9])/ es un lookahead que exige:
        //   (?=.*[A-Z]) → al menos una letra mayúscula en cualquier posición
        //   (?=.*[0-9]) → al menos un dígito en cualquier posición
        // Combinado con minLength(8), se garantiza una contraseña razonablemente segura.
        password:      ['', [Validators.required, Validators.minLength(8),
                             Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/)]],
        confirmarPass: ['', Validators.required]

    // { validators: this.passwordsIguales } aplica el validador al FormGroup completo.
    // Se ejecuta cada vez que cambia cualquier control del grupo.
    }, { validators: this.passwordsIguales });

    // ── Estado de la UI ────────────────────────────────────────────────────────
    cargando = false; // Activa el spinner mientras el backend procesa el registro
    error    = '';    // Mensaje de error que se muestra al usuario si falla la llamada
    verPass  = false; // Alterna la visibilidad de la contraseña (password ↔ text)

    // ── Validador cruzado de contraseñas ───────────────────────────────────────
    // Esta función actúa como ValidatorFn a nivel de grupo.
    // Recibe el FormGroup completo y devuelve:
    //   null → validación OK (las contraseñas coinciden)
    //   { noCoinciden: true } → error que la plantilla puede leer con
    //                           form.errors?.noCoinciden
    passwordsIguales(group: FormGroup) {
        const pass    = group.get('password')?.value;
        const confirm = group.get('confirmarPass')?.value;
        // Solo reportamos error si ambos campos tienen valor, para no interferir
        // con la validación de campo requerido mientras el usuario escribe.
        return pass === confirm ? null : { noCoinciden: true };
    }

    // ── Envío del formulario ───────────────────────────────────────────────────
    // async porque necesitamos esperar el token de reCAPTCHA antes de llamar al backend.
    async submit(): Promise<void> {
        // form.invalid es true si CUALQUIER control o validador de grupo falla.
        // Incluye tanto los validadores individuales como passwordsIguales().
        if (this.form.invalid) return;

        this.cargando = true;
        this.error    = '';

        // reCAPTCHA v3: acción 'register' se registra en el panel de Google
        // para diferenciar el tráfico de login vs. registro y ajustar umbrales.
        const captchaToken = await this.recaptcha.execute('register');

        // Desestructuramos solo los campos que el backend necesita.
        // confirmarPass es solo UI; no se debe enviar al servidor.
        const { name, email, password } = this.form.value;

        // El cast `as any` evita un error de TypeScript porque el tipo esperado
        // por register() no incluye captchaToken en su definición de interfaz.
        this.authService.register({ name, email, password, captchaToken } as any).subscribe({
            next: () => {
                this.cargando = false;
                this.cdr.detectChanges();
                // Redirigimos a la pantalla informativa de verificación de email,
                // pasando el email como query param para mostrarlo al usuario
                // (ej: "Hemos enviado un correo a usuario@ejemplo.com").
                this.router.navigate(['/verificar-email'], { queryParams: { email } });
            },
            error: (err) => {
                this.cargando = false;
                // err.error?.message viene del cuerpo JSON de la respuesta HTTP 4xx/5xx.
                // El fallback genérico cubre fallos de red u otros errores inesperados.
                this.error    = err.error?.message || 'Error al registrarse';
                this.cdr.detectChanges();
            }
        });
    }
}
