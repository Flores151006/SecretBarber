import { Injectable, signal, inject } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { Router }                     from '@angular/router';
import { Observable, tap }            from 'rxjs';
import { AuthResponse, LoginDto, RegisterDto } from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly http   = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly API = 'http://localhost:4000/api/auth';

    currentUser = signal<AuthResponse['user'] | null>(null);

    constructor() {
        this.cargarUsuarioDesdeToken();
    }

    register(data: RegisterDto): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API}/register`, data);
    }

    verificarEmail(token: string): Observable<{ message: string }> {
        return this.http.get<{ message: string }>(`${this.API}/verify-email?token=${token}`);
    }

    reenviarVerificacion(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.API}/resend-verification`, { email });
    }

    login(data: LoginDto): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API}/login`, data, {
            withCredentials: true
        }).pipe(
            tap(res => {
                localStorage.setItem('accessToken', res.accessToken);
                this.currentUser.set(res.user);
            })
        );
    }

    logout(): void {
        this.http.post(`${this.API}/logout`, {}, { withCredentials: true }).subscribe();
        localStorage.removeItem('accessToken');
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<{ accessToken: string }> {
        return this.http.post<{ accessToken: string }>(`${this.API}/refresh-token`, {}, {
            withCredentials: true
        }).pipe(
            tap(res => localStorage.setItem('accessToken', res.accessToken))
        );
    }

    getToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    isAdmin(): boolean {
        return this.currentUser()?.role === 'Admin';
    }

    cargarUsuarioDesdeToken(): void {
        const token = this.getToken();
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
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
            localStorage.removeItem('accessToken');
        }
    }

    setToken(token: string): void {
        localStorage.setItem('accessToken', token);
    }
}