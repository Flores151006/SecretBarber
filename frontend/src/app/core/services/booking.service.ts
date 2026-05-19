// ─────────────────────────────────────────────────────────────────────────────
// booking.service.ts
//
// Servicio Angular que encapsula TODAS las llamadas HTTP relacionadas con
// reservas, barberos y servicios. Es el intermediario entre los componentes
// y la API REST del backend.
//
// CONCEPTO CLAVE — @Injectable({ providedIn: 'root' }):
// Hace que este servicio sea un SINGLETON a nivel de aplicación: Angular crea
// una única instancia y la reutiliza en todos los componentes que la inyecten.
// Esto garantiza que el estado (si lo hubiera) sea coherente en toda la app.
// "providedIn: 'root'" también hace que Angular lo incluya en el bundle
// solo si algún componente realmente lo usa (tree-shakeable).
//
// CONCEPTO CLAVE — Observable:
// Los métodos del HttpClient devuelven Observables (de RxJS), no Promises.
// Un Observable es "perezoso": la petición HTTP NO se ejecuta hasta que
// alguien hace .subscribe() o el template usa el pipe async (| async).
// Esto permite cancelar peticiones, transformarlas con operadores (map, filter…)
// y componer flujos reactivos.
//
// DECISIÓN DE DISEÑO — URLs base como constantes privadas:
// En lugar de repetir environment.apiUrl + '/bookings' en cada método,
// se define una constante privada (API). Si la URL cambia, solo hay que
// modificarla en un único lugar. "readonly" evita que se reasigne
// accidentalmente en algún método.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Booking, CrearBookingDto, Barbero, Servicio } from '../../shared/models/booking.model';
import { environment }        from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {

    // inject(HttpClient) es la forma moderna de inyección de dependencias.
    // HttpClient permite hacer peticiones GET, POST, PATCH, DELETE al backend.
    // El AuthInterceptor añade automáticamente el JWT en las peticiones privadas.
    private readonly http = inject(HttpClient);

    // URLs base de los tres recursos que gestiona este servicio.
    // Se construyen una sola vez al crear el servicio (son readonly).
    private readonly API           = `${environment.apiUrl}/bookings`;
    private readonly API_BARBEROS  = `${environment.apiUrl}/barberos`;
    private readonly API_SERVICIOS = `${environment.apiUrl}/servicios`;

    // Obtiene la lista de barberos activos para el selector del formulario de reserva.
    getBarberos(): Observable<{ data: Barbero[] }> {
        return this.http.get<{ data: Barbero[] }>(this.API_BARBEROS);
    }

    // Obtiene la lista de servicios activos con su precio y duración.
    getServicios(): Observable<{ data: Servicio[] }> {
        return this.http.get<{ data: Servicio[] }>(this.API_SERVICIOS);
    }

    // Consulta las horas disponibles para un barbero, fecha y duración concretos.
    // Usa query string params (?barbero=...&fecha=...&duracion=...) en lugar del body
    // porque es una petición GET (solo lectura, sin efectos secundarios).
    getDisponibilidad(barberoId: string, fecha: string, duracion: number): Observable<{ data: string[] }> {
        return this.http.get<{ data: string[] }>(
            `${this.API}/disponibilidad?barbero=${barberoId}&fecha=${fecha}&duracion=${duracion}`
        );
    }

    // Obtiene TODAS las reservas (endpoint del admin, protegido por rol).
    getBookings(): Observable<{ data: Booking[] }> {
        return this.http.get<{ data: Booking[] }>(this.API);
    }

    // Obtiene solo las reservas del usuario autenticado (el backend extrae el ID del JWT).
    getMisBookings(): Observable<{ data: Booking[] }> {
        return this.http.get<{ data: Booking[] }>(`${this.API}/mis`);
    }

    // Crea una nueva reserva. El tipo de retorno es una unión porque:
    // - Si metodoPago es 'efectivo' → el backend devuelve { bookingId }
    // - Si metodoPago es 'tarjeta'  → el backend devuelve { url } (URL de Stripe Checkout)
    crearBooking(data: CrearBookingDto): Observable<{ bookingId: string } | { url: string }> {
        return this.http.post<{ bookingId: string } | { url: string }>(this.API, data);
    }

    // Cancela la reserva del cliente autenticado (PATCH porque es una modificación parcial).
    cancelarBooking(id: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}`, {});
    }

    // Permite al admin cambiar el estado de una reserva (pendiente → confirmada, etc.).
    actualizarEstado(id: string, estado: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}/estado`, { estado });
    }

    // Marca el pago de una reserva como 'pagado' (usado para reservas en efectivo).
    actualizarPago(id: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}/pago`, {});
    }

    // Permite al cliente modificar una reserva existente (barbero, servicios, fecha, hora).
    // El admin deberá volver a confirmarla después de una modificación.
    modificarBooking(id: string, data: CrearBookingDto): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.API}/${id}/modificar`, data);
    }

    // Obtiene estadísticas de reservas e ingresos para el panel de admin.
    // - filtro: 'hoy' | 'semana' | 'mes' | 'anio' | 'rango'
    // - fechaInicio / fechaFin: solo se añaden a la URL cuando filtro === 'rango'
    //   porque el backend los ignora para los otros filtros predefinidos.
    getEstadisticas(filtro: string, fechaInicio?: string, fechaFin?: string): Observable<any> {
        let url = `${this.API}/estadisticas?filtro=${filtro}`;
        if (filtro === 'rango' && fechaInicio && fechaFin) {
            url += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
        }
        return this.http.get<any>(url);
    }
}
