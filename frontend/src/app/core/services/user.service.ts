import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { User }               from '../../shared/models/user.model';
import { environment }        from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {

    private readonly http = inject(HttpClient);
    private readonly API  = `${environment.apiUrl}/users`;

    getUsuarios(): Observable<{ data: User[] }> {
        return this.http.get<{ data: User[] }>(this.API);
    }

    getUsuario(id: string): Observable<{ data: User }> {
        return this.http.get<{ data: User }>(`${this.API}/${id}`);
    }

    crearUsuario(data: Partial<User>): Observable<{ id: string }> {
        return this.http.post<{ id: string }>(this.API, data);
    }

    actualizarUsuario(id: string, data: Partial<User>): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.API}/${id}`, data);
    }

    eliminarUsuario(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API}/${id}`);
    }

    getPerfil(): Observable<{ data: User }> {
        return this.http.get<{ data: User }>(`${this.API}/perfil`);
    }

    updatePerfil(data: { name: string }): Observable<{ message: string; data: User }> {
        return this.http.patch<{ message: string; data: User }>(`${this.API}/perfil`, data);
    }

    cambiarPassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/perfil/password`, { passwordActual, passwordNueva });
    }

    eliminarCuenta(): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API}/perfil`);
    }
}