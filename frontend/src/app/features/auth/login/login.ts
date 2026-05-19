// ─────────────────────────────────────────────────────────────────────────────
// login.ts
//
// Componente de inicio de sesión de Secret Barber.
// Gestiona el formulario reactivo de email/contraseña, la protección anti-bots
// mediante reCAPTCHA v3 invisible y la redirección post-login según el rol
// del usuario o la URL de retorno guardada por el guard de autenticación.
// ─────────────────────────────────────────────────────────────────────────────

// Angular core: Component para declarar el componente, inject() para inyección
// funcional (alternativa moderna a los parámetros del constructor), y
// ChangeDetectorRef para forzar la detección de cambios cuando el estado
// se actualiza fuera del ciclo estándar de Angular (p. ej. dentro de callbacks).
import { Component, inject, ChangeDetectorRef } from '@angular/core';

// FormBuilder: servicio que simplifica la creación de formularios reactivos.
// FormGroup: agrupa los controles del formulario como una unidad.
// Validators: colección de validadores predefinidos (required, email, minLength…).
// ReactiveFormsModule: directivas necesarias para usar [formGroup] y formControlName en la plantilla.
import { FormBuilder, FormGroup,
         Validators, ReactiveFormsModule }       from '@angular/forms';

// Router: permite la navegación programática entre rutas.
// RouterLink: directiva para enlazar rutas en la plantilla.
// ActivatedRoute: da acceso a los parámetros y query params de la ruta activa.
import { Router, RouterLink, ActivatedRoute }    from '@angular/router';

// Servicio propio que expone login(), register(), logout() y el estado del usuario.
import { AuthService }                           from '../../../core/services/auth.service';

// Servicio que envuelve la librería de Google reCAPTCHA v3.
// execute(action) devuelve una Promise con el token que el backend verificará.
import { RecaptchaService }                      from '../../../core/services/recaptcha.service';

// CommonModule: incluye *ngIf, *ngFor, async pipe, etc. en componentes standalone.
import { CommonModule }                          from '@angular/common';

// TranslateModule: pipe | translate y directiva translate de ngx-translate para i18n.
import { TranslateModule }                       from '@ngx-translate/core';

// NgIconComponent: componente para renderizar iconos SVG de @ng-icons.
import { NgIconComponent }                       from '@ng-icons/core';

// @Component convierte la clase en un componente Angular.
// standalone: true → no pertenece a ningún NgModule; gestiona sus propias dependencias
//             en el array imports, lo que facilita la carga diferida (lazy loading).
@Component({
    selector:    'app-login',
    standalone:  true,
    // Al ser standalone, declaramos aquí todos los módulos y componentes
    // que necesita la plantilla en lugar de hacerlo en un NgModule compartido.
    imports:     [ReactiveFormsModule, RouterLink, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './login.html'
})
export class LoginComponent {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    // inject() es la forma moderna (Angular 14+) de inyectar servicios sin
    // declararlos en el constructor. Equivale a: constructor(private fb: FormBuilder).
    private fb          = inject(FormBuilder);
    private authService = inject(AuthService);
    private recaptcha   = inject(RecaptchaService);
    private router      = inject(Router);
    private route       = inject(ActivatedRoute);   // Necesario para leer returnUrl
    private cdr         = inject(ChangeDetectorRef); // Forzar re-renderizado tras callbacks asíncronos

    // ── Formulario reactivo ────────────────────────────────────────────────────
    // fb.group() crea un FormGroup donde cada clave es un FormControl.
    // El array tiene la forma: [valorInicial, [validadores]].
    // Validators.required → el campo no puede estar vacío.
    // Validators.email    → el valor debe tener formato de email válido.
    form: FormGroup = this.fb.group({
        email:    ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
    });

    // ── Estado de la UI ────────────────────────────────────────────────────────
    // Variables de clase simples (sin signal) porque este componente usa
    // ChangeDetectorRef.detectChanges() explícitamente para sincronizar la vista.
    cargando          = false;  // Muestra el spinner mientras espera la respuesta del servidor
    error             = '';     // Mensaje de error visible para el usuario
    verPass           = false;  // Alterna entre input[type=password] e input[type=text]
    emailNoVerificado = false;  // Flag especial: el usuario existe pero no confirmó su email

    // ── Método principal: envío del formulario ─────────────────────────────────
    // Es async porque necesitamos await para obtener el token de reCAPTCHA
    // antes de llamar al backend.
    async submit(): Promise<void> {
        // Salida temprana: si algún validador del formulario falla, no hacemos nada.
        // La plantilla muestra los errores gracias a form.controls.email.invalid, etc.
        if (this.form.invalid) return;

        this.cargando          = true;
        this.error             = '';
        this.emailNoVerificado = false;

        // reCAPTCHA v3 invisible: el usuario no ve ningún desafío.
        // execute('login') identifica la acción para el panel de Google reCAPTCHA,
        // permitiendo monitorizar la puntuación de riesgo por acción.
        // El token tiene validez de 2 minutos; se envía junto con las credenciales.
        const captchaToken = await this.recaptcha.execute('login');

        // spread operator (...this.form.value) extrae { email, password } del formulario
        // y añadimos captchaToken para que el backend lo valide con la API de Google.
        this.authService.login({ ...this.form.value, captchaToken }).subscribe({
            next: (res) => {
                this.cargando = false;
                // detectChanges() es necesario porque estamos dentro de un callback
                // asíncrono (zona fuera del ciclo de detección automático de Angular).
                this.cdr.detectChanges();

                // returnUrl: el AuthGuard guarda la ruta solicitada antes de redirigir
                // al login. Por ejemplo, si el usuario intenta ir a /mis-reservas sin
                // estar autenticado, se le redirige a /login?returnUrl=/mis-reservas.
                // Aquí recuperamos ese valor para devolverle a donde quería ir.
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
                if (returnUrl) {
                    this.router.navigateByUrl(returnUrl);
                } else if (res.user.role === 'Admin') {
                    // Los administradores tienen su propio panel, los demás van al home.
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: (err) => {
                this.cargando = false;

                // El backend devuelve emailNoVerificado: true cuando el usuario existe
                // pero no ha hecho clic en el enlace del correo de confirmación.
                // En ese caso mostramos un aviso con opción de reenviar el email,
                // en lugar del mensaje genérico de credenciales incorrectas.
                if (err.error?.emailNoVerificado) {
                    this.emailNoVerificado = true;
                    this.error             = err.error.message;
                } else {
                    // Mensaje genérico: no diferenciamos si el email no existe o si
                    // la contraseña es incorrecta para evitar la enumeración de usuarios.
                    this.error = err.error?.message || 'Email o contraseña incorrectos';
                }
                this.cdr.detectChanges();
            }
        });
    }

    // ── Getter auxiliar ────────────────────────────────────────────────────────
    // Expone el email del formulario a la plantilla de forma limpia,
    // sin tener que acceder directamente a form.get('email')?.value en el HTML.
    // Se usa para mostrar el email en el mensaje de "revisa tu bandeja de entrada".
    get emailDelForm(): string {
        return this.form.get('email')?.value || '';
    }
}
