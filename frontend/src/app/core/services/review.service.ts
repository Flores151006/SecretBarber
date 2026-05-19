// ─────────────────────────────────────────────────────────────────────────────
// review.service.ts
//
// Servicio Angular que encapsula todas las llamadas HTTP al endpoint /reviews
// de la API REST. Centraliza la comunicación con el backend para que los
// componentes no tengan que conocer las URLs ni los detalles de HTTP.
//
// ENDPOINTS QUE USA:
//   GET    /reviews           → reseñas visibles (página pública de reseñas)
//   GET    /reviews/admin     → TODAS las reseñas, incluidas las ocultas (solo admin)
//   POST   /reviews           → crea una nueva reseña (cliente autenticado)
//   PATCH  /reviews/:id       → toggle de visibilidad visible/oculta (admin)
//   DELETE /reviews/:id       → elimina permanentemente una reseña (admin)
//
// CONCEPTO CLAVE — Observable:
// Todos los métodos devuelven Observable<T> de RxJS en lugar de Promise<T>.
// La petición HTTP NO se ejecuta hasta que alguien llama a .subscribe() o
// el template usa el pipe | async. Esto permite cancelar peticiones en curso,
// encadenar operadores (map, catchError…) y combinar múltiples llamadas.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Review, CrearReviewDto } from '../../shared/models/review.model';
import { environment }            from '../../../environments/environment';

// Singleton a nivel de aplicación: una única instancia compartida por
// todos los componentes que inyecten ReviewService.
@Injectable({ providedIn: 'root' })
export class ReviewService {

    private readonly http = inject(HttpClient);

    // URL base del recurso. Se construye una vez al instanciar el servicio.
    private readonly API  = `${environment.apiUrl}/reviews`;

    // Obtiene solo las reseñas con visible:true para mostrarlas en la página pública.
    // No requiere autenticación (ruta pública del backend).
    getReviews(): Observable<{ data: Review[] }> {
        return this.http.get<{ data: Review[] }>(this.API);
    }

    // Obtiene TODAS las reseñas (visibles y ocultas) para el panel de moderación.
    // El backend comprueba el rol del token JWT; si no es Admin, devuelve 403.
    getReviewsAdmin(): Observable<{ data: Review[] }> {
        return this.http.get<{ data: Review[] }>(`${this.API}/admin`);
    }

    // Crea una nueva reseña. El backend extrae el ID del cliente del JWT
    // para asegurarse de que el cliente no puede suplantar a otro usuario.
    // Solo se permite crear reseñas de reservas con estado 'completada'.
    crearReview(data: CrearReviewDto): Observable<{ id: string }> {
        return this.http.post<{ id: string }>(this.API, data);
    }

    // Alterna la visibilidad de una reseña (visible ↔ oculta).
    // Usa PATCH porque es una modificación parcial (solo el campo 'visible').
    // El cuerpo vacío {} es intencionado: el backend decide el nuevo estado
    // basándose en el valor actual en la base de datos (toggle en el servidor).
    toggleVisibilidad(id: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}`, {});
    }

    // Elimina permanentemente una reseña. Acción irreversible, solo para admins.
    eliminarReview(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API}/${id}`);
    }
}
