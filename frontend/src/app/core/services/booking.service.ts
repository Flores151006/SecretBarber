import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Booking, CrearBookingDto, Barbero, Servicio } from '../../shared/models/booking.model';
import { environment }        from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {

    private readonly http = inject(HttpClient);

    private readonly API           = `${environment.apiUrl}/bookings`;
    private readonly API_BARBEROS  = `${environment.apiUrl}/barberos`;
    private readonly API_SERVICIOS = `${environment.apiUrl}/servicios`;

    getBarberos(): Observable<{ data: Barbero[] }> {
        return this.http.get<{ data: Barbero[] }>(this.API_BARBEROS);
    }

    getServicios(): Observable<{ data: Servicio[] }> {
        return this.http.get<{ data: Servicio[] }>(this.API_SERVICIOS);
    }

    getDisponibilidad(barberoId: string, fecha: string, duracion: number): Observable<{ data: string[] }> {
        return this.http.get<{ data: string[] }>(
            `${this.API}/disponibilidad?barbero=${barberoId}&fecha=${fecha}&duracion=${duracion}`
        );
    }

    getBookings(): Observable<{ data: Booking[] }> {
        return this.http.get<{ data: Booking[] }>(this.API);
    }

    getMisBookings(): Observable<{ data: Booking[] }> {
        return this.http.get<{ data: Booking[] }>(`${this.API}/mis`);
    }

    crearBooking(data: CrearBookingDto): Observable<{ bookingId: string } | { url: string }> {
        return this.http.post<{ bookingId: string } | { url: string }>(this.API, data);
    }

    cancelarBooking(id: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}`, {});
    }

    actualizarEstado(id: string, estado: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}/estado`, { estado });
    }

    actualizarPago(id: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}/pago`, {});
    }

    modificarBooking(id: string, data: CrearBookingDto): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}/modificar`, data);
    }

    getEstadisticas(filtro: string, fechaInicio?: string, fechaFin?: string): Observable<any> {
        let url = `${this.API}/estadisticas?filtro=${filtro}`;
        if (filtro === 'rango' && fechaInicio && fechaFin) {
            url += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
        }
        return this.http.get<any>(url);
    }
}