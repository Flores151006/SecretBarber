// ─────────────────────────────────────────────────────────────────────────────
// user.service.ts
//
// Servicio Angular que encapsula todas las llamadas HTTP relacionadas con
// la gestión de usuarios: listado admin, perfil del usuario autenticado,
// cambio de contraseña, avatar y eliminación de cuenta.
//
// ENDPOINTS QUE USA:
//   GET    /users              → lista todos los usuarios (solo admin)
//   GET    /users/:id          → obtiene un usuario por ID (admin)
//   POST   /users              → crea un usuario (admin)
//   PUT    /users/:id          → actualiza un usuario (admin)
//   DELETE /users/:id          → elimina un usuario por ID (admin)
//   GET    /users/perfil       → perfil del usuario autenticado
//   PATCH  /users/perfil       → actualiza nombre del usuario autenticado
//   PATCH  /users/perfil/password → cambia la contraseña del usuario autenticado
//   DELETE /users/perfil       → elimina la propia cuenta
//   PATCH  /users/perfil/avatar → actualiza el avatar (imagen base64)
//
// CONCEPTO CLAVE — Avatar como base64:
// El avatar no se sube como archivo multipart/form-data sino como una cadena
// base64 en el body JSON. El frontend convierte la imagen con FileReader.readAsDataURL()
// y envía la cadena resultante (data:image/jpeg;base64,...). Esto simplifica
// la implementación del servidor (no necesita almacenamiento de ficheros externo)
// pero aumenta el tamaño del documento en MongoDB.
//
// CONCEPTO CLAVE — Partial<User>:
// Partial<T> es un tipo utilitario de TypeScript que hace OPCIONALES todos los
// campos de T. Se usa en crearUsuario y actualizarUsuario porque no siempre
// se envían todos los campos de User (p.ej. no se envía createdAt al crear).
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { User }               from '../../shared/models/user.model';
import { environment }        from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {

    private readonly http = inject(HttpClient);

    // URL base del recurso. Todos los endpoints se construyen concatenando
    // esta constante con el sub-recurso correspondiente.
    private readonly API  = `${environment.apiUrl}/users`;

    // ─── Endpoints de administración ──────────────────────────────────────────

    // Lista todos los usuarios registrados. El backend comprueba el rol Admin
    // en el JWT; si no lo tiene, devuelve 403 Forbidden.
    getUsuarios(): Observable<{ data: User[] }> {
        return this.http.get<{ data: User[] }>(this.API);
    }

    // Obtiene un usuario concreto por su ID de MongoDB.
    getUsuario(id: string): Observable<{ data: User }> {
        return this.http.get<{ data: User }>(`${this.API}/${id}`);
    }

    // Crea un usuario desde el panel de admin. Partial<User> permite enviar
    // solo los campos necesarios sin tener que completar todos los del modelo.
    crearUsuario(data: Partial<User>): Observable<{ id: string }> {
        return this.http.post<{ id: string }>(this.API, data);
    }

    // Actualiza los datos de un usuario (p.ej. cambio de rol o activación).
    // Se usa PUT (reemplaza todo el recurso) en lugar de PATCH (modificación parcial).
    actualizarUsuario(id: string, data: Partial<User>): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.API}/${id}`, data);
    }

    // Elimina permanentemente un usuario. Acción irreversible, solo para admins.
    eliminarUsuario(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API}/${id}`);
    }

    // ─── Endpoints de perfil (usuario autenticado) ────────────────────────────

    // Obtiene el perfil del usuario que está logueado.
    // El backend extrae el ID del token JWT, no hay que pasarlo en la URL.
    getPerfil(): Observable<{ data: User }> {
        return this.http.get<{ data: User }>(`${this.API}/perfil`);
    }

    // Actualiza el nombre del usuario autenticado.
    // Devuelve tanto el mensaje de éxito como el objeto User actualizado,
    // para que el componente pueda refrescar el estado local sin re-petición.
    updatePerfil(data: { name: string }): Observable<{ message: string; data: User }> {
        return this.http.patch<{ message: string; data: User }>(`${this.API}/perfil`, data);
    }

    // Cambia la contraseña. Se requiere la contraseña actual para verificar
    // que es el propio usuario quien hace el cambio (evita que un atacante
    // con la sesión abierta cambie la contraseña sin conocer la original).
    cambiarPassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/perfil/password`, { passwordActual, passwordNueva });
    }

    // Elimina la cuenta del usuario autenticado. Acción irreversible.
    // Tras eliminar, el componente cierra la sesión y redirige al inicio.
    eliminarCuenta(): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API}/perfil`);
    }

    // Actualiza el avatar del usuario. El parámetro "avatar" es una cadena
    // base64 (data:image/jpeg;base64,...) o null para eliminar el avatar actual.
    // El backend almacena este string directamente en el campo avatar del documento MongoDB.
    updateAvatar(avatar: string | null): Observable<{ message: string; data: User }> {
        return this.http.patch<{ message: string; data: User }>(`${this.API}/perfil/avatar`, { avatar });
    }
}
