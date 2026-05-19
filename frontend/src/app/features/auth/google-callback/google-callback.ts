// ─────────────────────────────────────────────────────────────────────────────
// google-callback.ts
//
// Componente de destino del flujo OAuth 2.0 con Google en Secret Barber.
//
// FLUJO COMPLETO:
//   1. El usuario pulsa "Continuar con Google" en la pantalla de login.
//   2. El frontend redirige al backend: GET /auth/google
//   3. El backend (Passport.js + estrategia Google OAuth2) redirige a Google.
//   4. Google muestra su pantalla de selección de cuenta / consentimiento.
//   5. Google redirige al backend con un código de autorización.
//   6. El backend intercambia el código por tokens de Google, busca o crea
//      al usuario en la base de datos, genera un JWT propio y redirige al
//      frontend hacia esta ruta: /google-callback?token=<jwt_de_acceso>
//   7. Este componente extrae el token del query param, lo almacena y
//      carga el perfil del usuario para completar la sesión.
//
// NOTA DE SEGURIDAD:
//   El token viaja como query param solo en este redirect inicial desde el backend.
//   Es un compromiso práctico del flujo server-side OAuth. Una vez aquí,
//   el token se guarda en localStorage y los posteriores requests usan
//   la cabecera Authorization: Bearer <token>.
// ─────────────────────────────────────────────────────────────────────────────

// Component: decorador del componente.
// OnInit: interfaz del hook ngOnInit(), donde ejecutamos la lógica de extracción del token.
// inject(): inyección funcional de dependencias (Angular 14+).
import { Component, OnInit, inject } from '@angular/core';

// Router: navegación programática para redirigir al home o al login.
// ActivatedRoute: acceso a los query params de la ruta activa (?token=...).
import { Router, ActivatedRoute }    from '@angular/router';

// Servicio central de autenticación:
//   setToken(token): guarda el JWT en localStorage.
//   cargarUsuarioDesdeToken(): decodifica el JWT y actualiza el estado global del usuario.
import { AuthService }               from '../../../core/services/auth.service';

@Component({
    selector: 'app-google-callback',
    standalone: true,
    // imports: [] vacío porque la plantilla es mínima (solo un texto de espera)
    // y no necesita módulos adicionales.
    imports: [],
    // La plantilla es inline (template en lugar de templateUrl) porque es muy simple:
    // solo muestra un mensaje de "Iniciando sesión..." mientras se procesa el token.
    // El usuario ve esta pantalla menos de un segundo antes de ser redirigido.
    template: `
        <div class="min-h-screen bg-background flex items-center justify-center">
            <p class="text-foreground/50">Iniciando sesión con Google...</p>
        </div>
    `
})
export class GoogleCallbackComponent implements OnInit {

    // ── Inyección de dependencias ──────────────────────────────────────────────
    // ActivatedRoute permite leer el query param ?token= que el backend incluyó
    // en la URL de redirección al final del flujo OAuth.
    private route       = inject(ActivatedRoute);
    private router      = inject(Router);
    private authService = inject(AuthService);

    // ── Procesamiento automático del token OAuth ───────────────────────────────
    // ngOnInit() es el lugar correcto porque en el constructor la ruta aún no está
    // inicializada y snapshot.queryParamMap no tendría datos.
    ngOnInit(): void {
        // Extraemos el JWT de acceso del query param ?token=...
        // Este token fue generado por el backend tras verificar la identidad
        // del usuario con Google y crear/recuperar su cuenta en la base de datos.
        const token = this.route.snapshot.queryParamMap.get('token');

        if (token) {
            // 1. Persistimos el access token en localStorage para que el
            //    interceptor HTTP lo adjunte en futuras peticiones autenticadas.
            this.authService.setToken(token);

            // 2. Decodificamos el payload del JWT para extraer los datos del usuario
            //    (id, nombre, email, rol) y actualizar el estado global de la app.
            //    Esto hace que la navbar muestre el nombre del usuario inmediatamente.
            this.authService.cargarUsuarioDesdeToken();

            // 3. Redirigimos al home. El usuario ya está autenticado.
            this.router.navigate(['/']);
        } else {
            // Si no hay token en la URL, algo salió mal en el flujo OAuth
            // (error en el backend, el usuario canceló en Google, etc.).
            // Enviamos al usuario de vuelta al login para que intente de nuevo.
            this.router.navigate(['/login']);
        }
    }
}
