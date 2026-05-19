// ─────────────────────────────────────────────────────────────────────────────
// auth.interceptor.ts
//
// Interceptor HTTP de Angular: se "cuela" en TODAS las peticiones HTTP que hace
// la aplicación y les añade automáticamente el token JWT en la cabecera.
//
// ¿Qué es un interceptor?
//   Es como un filtro que se ejecuta antes (y después) de cada petición HTTP.
//   Sin el interceptor, habría que añadir el token manualmente en cada servicio.
//   Con él, todas las peticiones a la API llevan el token sin que los componentes
//   se preocupen por ello.
//
// ¿Qué hace exactamente?
//   1. Añade el header "Authorization: Bearer <token>" a cada petición protegida
//   2. Si el servidor devuelve 401 (token expirado), pide un token nuevo al servidor
//      (/auth/refresh-token) y reintenta la petición original automáticamente
//   3. Si el refresh también falla, cierra la sesión del usuario
//
// Problema que resuelve — Race condition (peticiones simultáneas):
//   Si hay 3 peticiones en vuelo cuando el token expira, las 3 recibirán 401 a la vez.
//   Sin control, las 3 intentarían hacer refresh a la vez, y las 2 últimas fallarían
//   porque el primero ya renovó el token. La solución usa un BehaviorSubject como
//   "sala de espera": solo la primera petición hace el refresh, las demás esperan.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable }                from '@angular/core';
import { HttpRequest, HttpHandler,
         HttpEvent, HttpInterceptor,
         HttpErrorResponse }          from '@angular/common/http';
import { Observable, throwError,
         BehaviorSubject }            from 'rxjs';
import { catchError, filter,
         switchMap, take }            from 'rxjs/operators';
import { AuthService }               from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    // Flag que indica si ya hay un proceso de refresh en curso
    // Evita que varias peticiones intenten hacer refresh simultáneamente
    private refreshing = false;

    // "Cola de espera" — las peticiones que llegaron mientras se hacía el refresh
    // se suscriben aquí y se reanudan cuando el nuevo token llega (next())
    // BehaviorSubject emite el último valor a cualquier nuevo suscriptor
    private refreshSubject = new BehaviorSubject<string | null>(null);

    // Rutas que NO necesitan token (son públicas)
    // El interceptor las deja pasar sin añadir Authorization header
    private readonly rutasPublicas = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh-token'
    ];

    constructor(private authService: AuthService) {}

    // intercept() es el método principal — Angular lo llama para CADA petición HTTP
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Si es una ruta pública, pasar sin tocar nada
        if (this.esRutaPublica(req.url)) {
            return next.handle(req);
        }

        // Añadir el token a la petición y enviarla
        const reqConToken = this.añadirToken(req);

        return next.handle(reqConToken).pipe(
            // catchError intercepta los errores de la petición HTTP
            catchError(error => {
                // Solo actuar si el servidor devolvió 401 (no autenticado / token expirado)
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    return this.manejarTokenExpirado(req, next);
                }
                // Otros errores (403, 404, 500...) los propagamos al componente que hizo la petición
                return throwError(() => error);
            })
        );
    }

    // Comprueba si la URL pertenece a una de las rutas públicas
    private esRutaPublica(url: string): boolean {
        return this.rutasPublicas.some(ruta => url.includes(ruta));
    }

    // Crea una copia de la petición original con el header de autorización añadido
    // req.clone() es necesario porque los HttpRequest son inmutables en Angular
    private añadirToken(req: HttpRequest<any>): HttpRequest<any> {
        const token = this.authService.getToken();
        if (!token) return req; // Si no hay token, devolver la petición sin modificar
        return req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    // Gestiona el caso en que el access token ha expirado (respuesta 401)
    private manejarTokenExpirado(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // ── Caso: ya hay un refresh en curso (otra petición llegó primero) ──────
        if (this.refreshing) {
            // Ponerse en "sala de espera": esperar a que refreshSubject emita un token real
            return this.refreshSubject.pipe(
                filter(token => token !== null), // Ignorar el null inicial
                take(1),                          // Solo necesitamos el primer valor (el nuevo token)
                // Cuando llega el nuevo token, reintentar la petición original con él
                switchMap(() => next.handle(this.añadirToken(req)))
            );
        }

        // ── Caso: somos los primeros en detectar el 401 → hacer el refresh ──────
        this.refreshing = true;
        this.refreshSubject.next(null); // Señal de "refresh iniciado" para los que lleguen después

        return this.authService.refreshToken().pipe(
            switchMap(res => {
                this.refreshing = false;
                // Notificar a todas las peticiones en espera que ya hay un token nuevo
                this.refreshSubject.next(res.accessToken);
                // Reintentar la petición original con el nuevo access token
                return next.handle(this.añadirToken(req));
            }),
            catchError(error => {
                // El refresh token también expiró (o era inválido) → cerrar sesión
                this.refreshing = false;
                this.authService.logout();
                return throwError(() => error);
            })
        );
    }
}
