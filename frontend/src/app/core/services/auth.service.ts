// ─────────────────────────────────────────────────────────────────────────────
// auth.service.ts
//
// Servicio central de autenticación en Angular. Gestiona el estado del usuario
// logueado, el access token y el avatar de perfil a lo largo de toda la app.
//
// ¿Qué es un "servicio" en Angular?
//   Es una clase que se instancia UNA sola vez para toda la aplicación (singleton).
//   Cualquier componente puede inyectarlo con inject() para compartir el mismo estado.
//   Así, cuando el usuario hace login en el componente Login, el Navbar y el perfil
//   se enteran automáticamente sin pasarse datos entre componentes.
//
// ¿Qué son los "signals" de Angular?
//   Son una forma moderna (Angular 17+) de manejar estado reactivo.
//   Un signal es como una variable que notifica automáticamente a todos los que
//   la están "observando" cuando su valor cambia.
//   signal(null)    → crea un signal con valor inicial null
//   signal.set(x)   → actualiza el valor y notifica a los observadores
//   signal()        → lee el valor actual
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { Router }                     from '@angular/router';
import { Observable, tap }            from 'rxjs';
import { AuthResponse, LoginDto, RegisterDto } from '../../shared/models/auth.model';
import { environment }                from '../../../environments/environment';

@Injectable({ providedIn: 'root' }) // Singleton: una sola instancia para toda la app
export class AuthService {

    private readonly http   = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly API = `${environment.apiUrl}/auth`;

    // ── Estado reactivo con Signals ────────────────────────────────────────────
    // currentUser: datos del usuario logueado (null si no hay sesión)
    // Cuando cambia, todos los componentes que lo lean se actualizan automáticamente
    currentUser = signal<AuthResponse['user'] | null>(null);

    // avatarUrl: URL de la foto de perfil (null si no tiene foto)
    readonly avatarUrl = signal<string | null>(null);

    constructor() {
        // Al arrancar la app, recuperar la sesión guardada
        // (si el usuario recarga la página o vuelve al día siguiente)
        this.cargarUsuarioDesdeToken();

        // Restaurar el avatar desde localStorage para evitar el parpadeo visual
        // donde aparecería la inicial y luego se cargaría la foto
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) this.avatarUrl.set(savedAvatar);
    }

    // ── Registro ───────────────────────────────────────────────────────────────
    register(data: RegisterDto): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API}/register`, data);
    }

    // ── Verificación de email ──────────────────────────────────────────────────
    verificarEmail(token: string): Observable<{ message: string }> {
        return this.http.get<{ message: string }>(`${this.API}/verify-email?token=${token}`);
    }

    // ── Reenviar correo de verificación ───────────────────────────────────────
    reenviarVerificacion(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API}/resend-verification`, { email });
    }

    // ── Login ──────────────────────────────────────────────────────────────────
    // tap() ejecuta un efecto secundario al recibir la respuesta sin modificar el Observable
    // withCredentials:true → el navegador guarda la cookie httpOnly del refresh token
    login(data: LoginDto): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API}/login`, data, {
            withCredentials: true
        }).pipe(
            tap(res => {
                // Guardar el access token en localStorage y actualizar el signal del usuario
                localStorage.setItem('accessToken', res.accessToken);
                this.currentUser.set(res.user);
            })
        );
    }

    // ── Logout ─────────────────────────────────────────────────────────────────
    logout(): void {
        // Llamar al backend para que elimine la cookie del refresh token
        this.http.post(`${this.API}/logout`, {}, { withCredentials: true }).subscribe();
        // Limpiar todo el estado local
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userAvatar');
        this.avatarUrl.set(null);
        this.currentUser.set(null); // El navbar detecta este cambio y actualiza la UI
        this.router.navigate(['/login']);
    }

    // ── Refresh Token ──────────────────────────────────────────────────────────
    // El interceptor llama a este método automáticamente cuando recibe un 401
    // withCredentials:true → envía la cookie del refresh token al backend
    refreshToken(): Observable<{ accessToken: string }> {
        return this.http.post<{ accessToken: string }>(`${this.API}/refresh-token`, {}, {
            withCredentials: true
        }).pipe(
            tap(res => localStorage.setItem('accessToken', res.accessToken))
        );
    }

    // ── Helpers de token ───────────────────────────────────────────────────────
    getToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    isLoggedIn(): boolean {
        return !!this.getToken(); // !! convierte a boolean: null→false, "token"→true
    }

    isAdmin(): boolean {
        return this.currentUser()?.role === 'Admin'; // ?. evita error si no hay usuario
    }

    // ── Cargar usuario desde el token guardado ─────────────────────────────────
    // Al recargar la página el signal se reinicia a null.
    // Este método restaura el estado decodificando el JWT del localStorage.
    //
    // Un JWT tiene 3 partes: header.payload.signature
    // El payload (parte central) está en Base64 con los datos del usuario.
    // atob() decodifica Base64 a texto, JSON.parse lo convierte en objeto.
    cargarUsuarioDesdeToken(): void {
        const token = this.getToken();
        if (!token) return;
        try {
            // split('.')[1] → segunda parte del JWT (el payload con los datos)
            const payload = JSON.parse(atob(token.split('.')[1]));

            // exp está en segundos, Date.now() en milisegundos → multiplicar por 1000
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('accessToken');
                return;
            }
            this.currentUser.set({
                id:    payload.id,
                email: payload.email,
                role:  payload.role,
                name:  payload.name ?? ''
            });
        } catch {
            // Token corrupto o mal formado → eliminar
            localStorage.removeItem('accessToken');
        }
    }

    // Usado por el flujo de Google OAuth para guardar el token recibido del callback
    setToken(token: string): void {
        localStorage.setItem('accessToken', token);
    }

    // ── Olvidé mi contraseña ───────────────────────────────────────────────────
    forgotPassword(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API}/forgot-password`, { email });
    }

    // ── Restablecer contraseña ─────────────────────────────────────────────────
    resetPassword(token: string, password: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API}/reset-password`, { token, password });
    }

    // ── Actualizar nombre localmente ───────────────────────────────────────────
    // Al cambiar el nombre en Settings, el navbar se actualiza al instante
    // sin necesidad de recargar la página ni volver a llamar al backend
    actualizarNombreLocal(name: string): void {
        const user = this.currentUser();
        // spread operator {...user}: copia todos los campos y solo sobreescribe "name"
        if (user) this.currentUser.set({ ...user, name });
    }

    // ── Actualizar avatar localmente ───────────────────────────────────────────
    // Guarda la URL del avatar en el signal Y en localStorage.
    // localStorage persiste entre recargas — así la foto no desaparece al hacer F5.
    actualizarAvatarLocal(avatar: string | null): void {
        this.avatarUrl.set(avatar);
        if (avatar) {
            localStorage.setItem('userAvatar', avatar);
        } else {
            localStorage.removeItem('userAvatar');
        }
    }
}
