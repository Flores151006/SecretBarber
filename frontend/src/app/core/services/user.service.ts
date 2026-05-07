import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { User }               from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {

    private readonly http = inject(HttpClient);
    private readonly API  = 'http://localhost:4000/api/users';

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
}