import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Review, CrearReviewDto } from '../../shared/models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {

    private readonly http = inject(HttpClient);
    private readonly API  = 'http://localhost:4000/api/reviews';

    getReviews(): Observable<{ data: Review[] }> {
        return this.http.get<{ data: Review[] }>(this.API);
    }

    getReviewsAdmin(): Observable<{ data: Review[] }> {
        return this.http.get<{ data: Review[] }>(`${this.API}/admin`);
    }

    crearReview(data: CrearReviewDto): Observable<{ id: string }> {
        return this.http.post<{ id: string }>(this.API, data);
    }

    toggleVisibilidad(id: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}`, {});
    }

    eliminarReview(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API}/${id}`);
    }
}