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

    private refreshing = false;
    private refreshSubject = new BehaviorSubject<string | null>(null);

    private readonly rutasPublicas = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh-token'
    ];

    constructor(private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.esRutaPublica(req.url)) {
            return next.handle(req);
        }

        const reqConToken = this.añadirToken(req);

        return next.handle(reqConToken).pipe(
            catchError(error => {
                // Solo hacer refresh si es 401
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    return this.manejarTokenExpirado(req, next);
                }
                // 403, 409, 500... pasan directamente al componente
                return throwError(() => error);
            })
        );
    }

    private esRutaPublica(url: string): boolean {
        return this.rutasPublicas.some(ruta => url.includes(ruta));
    }

    private añadirToken(req: HttpRequest<any>): HttpRequest<any> {
        const token = this.authService.getToken();
        if (!token) return req;
        return req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    private manejarTokenExpirado(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.refreshing) {
            return this.refreshSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap(() => next.handle(this.añadirToken(req)))
            );
        }

        this.refreshing = true;
        this.refreshSubject.next(null);

        return this.authService.refreshToken().pipe(
            switchMap(res => {
                this.refreshing = false;
                this.refreshSubject.next(res.accessToken);
                return next.handle(this.añadirToken(req));
            }),
            catchError(error => {
                this.refreshing = false;
                this.authService.logout();
                return throwError(() => error);
            })
        );
    }
}   