// ─────────────────────────────────────────────────────────────────────────────
// bookings.ts
//
// Componente de gestión de reservas del panel de administración.
//
// Responsabilidades:
//   - Cargar todas las reservas desde el backend al inicializar la vista.
//   - Filtrar reservas por fecha (hoy, mañana, semana, todas) y por estado
//     (pendiente, confirmada, completada, cancelada).
//   - Buscar reservas por nombre o email del cliente.
//   - Cambiar el estado de una reserva con confirmación SweetAlert2.
//   - Marcar una reserva como pagada.
//   - Cancelar una reserva (DELETE en el backend) y eliminarla de la lista
//     localmente con splice, sin recargar toda la colección.
//
// Conceptos clave:
//   - ChangeDetectorRef.detectChanges(): fuerza a Angular a re-evaluar la vista
//     tras actualizar datos en callbacks asíncronos (subscribe).
//   - get bookingsFiltradas(): getter computado que devuelve la lista filtrada
//     cada vez que se accede; equivale a un computed() pero usando JS nativo.
//   - splice(idx, 1): elimina 1 elemento del array en la posición idx.
//     Al mutar el array existente la vista se actualiza sin petición extra.
//   - Swal.fire(): diálogo modal de SweetAlert2. Devuelve una Promise;
//     result.isConfirmed es true solo si el usuario pulsó "Confirmar".
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { NgIconComponent }   from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BookingService }    from '../../../core/services/booking.service';
import { Booking }           from '../../../shared/models/booking.model';
import Swal                  from 'sweetalert2';

@Component({
    selector: 'app-admin-bookings',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIconComponent, TranslateModule],
    templateUrl: './bookings.html'
})
export class AdminBookingsComponent implements OnInit {

    // Servicios inyectados:
    //   bookingService → peticiones HTTP para reservas
    //   translate      → traducciones i18n con ngx-translate
    //   cdr            → detección de cambios manual (necesaria en callbacks async)
    private bookingService = inject(BookingService);
    private translate      = inject(TranslateService);
    private cdr            = inject(ChangeDetectorRef);

    // Array maestro con todas las reservas que llegan del backend.
    // bookingsFiltradas (getter) derivará un subconjunto de este array.
    bookings: Booking[] = [];

    // Estado de carga y error para mostrar spinners o mensajes en la plantilla
    cargando     = true;
    error        = '';

    // Filtros que el administrador puede cambiar desde la UI:
    //   filtro      → estado de la reserva ('todas' | 'pendiente' | 'confirmada' | ...)
    //   filtroFecha → ventana temporal ('hoy' | 'manana' | 'semana' | 'todas')
    //   busqueda    → texto libre que busca por nombre o email del cliente
    filtro       = 'todas';
    filtroFecha  = 'hoy';
    busqueda     = '';

    // ngOnInit se ejecuta una sola vez justo después de crear el componente.
    // Es el lugar ideal para lanzar la carga inicial de datos.
    ngOnInit(): void {
        this.cargarBookings();
    }

    // Solicita al backend la lista completa de reservas.
    // Al recibir la respuesta almacena los datos y desactiva el indicador de carga.
    // detectChanges() es necesario porque el callback se ejecuta fuera del ciclo
    // de detección de cambios de Angular (zona asíncrona externa).
    cargarBookings(): void {
        this.bookingService.getBookings().subscribe({
            next: (res) => {
                this.bookings = res.data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error    = err.error?.message || 'Error al cargar reservas';
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Getter que Angular evalúa cada vez que renderiza la plantilla.
    // Aplica los filtros activos (fecha → estado → búsqueda) en cascada
    // y devuelve la lista filtrada sin modificar el array original.
   get bookingsFiltradas(): Booking[] {
    // Calculamos fechas de referencia al inicio del día (horas a 0)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Mañana = hoy + 1 día
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Fin de semana = hoy + 7 días
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);

    // Límite del pasado para el filtro "todas" (últimos 30 días + futuro)
    const hace30dias = new Date(hoy);
    hace30dias.setDate(hace30dias.getDate() - 30);

    let resultado = this.bookings;

    // ── Filtro por fecha ────────────────────────────────────────────────────
    if (this.filtroFecha === 'hoy') {
        // Normalizamos la hora de la reserva y comparamos con hoy
        resultado = resultado.filter(b => {
            const fecha = new Date(b.fecha);
            fecha.setHours(0, 0, 0, 0);
            return fecha.getTime() === hoy.getTime();
        });
    } else if (this.filtroFecha === 'manana') {
        resultado = resultado.filter(b => {
            const fecha = new Date(b.fecha);
            fecha.setHours(0, 0, 0, 0);
            return fecha.getTime() === manana.getTime();
        });
    } else if (this.filtroFecha === 'semana') {
        // Incluye desde hoy hasta dentro de 7 días
        resultado = resultado.filter(b => {
            const fecha = new Date(b.fecha);
            fecha.setHours(0, 0, 0, 0);
            return fecha >= hoy && fecha <= finSemana;
        });
    } else if (this.filtroFecha === 'todas') {
        // Mostrar solo últimos 30 días + futuro por defecto
        resultado = resultado.filter(b => {
            const fecha = new Date(b.fecha);
            return fecha >= hace30dias;
        });
    }

    // ── Filtro por estado ───────────────────────────────────────────────────
    // Solo filtra si el admin eligió un estado concreto (no 'todas')
    if (this.filtro !== 'todas') {
        resultado = resultado.filter(b => b.estado === this.filtro);
    }

    // ── Filtro por búsqueda de texto ────────────────────────────────────────
    if (this.busqueda.trim()) {
        const termino = this.busqueda.toLowerCase().trim();
        // El campo cliente puede ser un objeto populado (mongoose populate)
        // o simplemente un ID; usamos 'as any' para acceder a sus propiedades
        resultado = resultado.filter(b => {
            const cliente = b.cliente as any;
            return (cliente?.name || '').toLowerCase().includes(termino) ||
                   (cliente?.email || '').toLowerCase().includes(termino);
        });
    }

    return resultado;
}

    // Cambia el estado de una reserva (confirmada / completada / cancelada).
    //
    // Lógica de bifurcación:
    //   - Si el nuevo estado es 'cancelada' → llama a cancelarBooking (DELETE).
    //     Tras el éxito usa splice para eliminar la reserva del array local,
    //     evitando así una petición extra de recarga al servidor.
    //   - Para cualquier otro estado → llama a actualizarEstado (PATCH).
    //     Solo actualiza la propiedad 'estado' del objeto en memoria.
    //
    // El flujo siempre pide confirmación con Swal.fire antes de ejecutar la acción.
    cambiarEstado(id: string, estado: string): void {
        // Atajo para traducir claves sin repetir boilerplate
        const t = (k: string) => this.translate.instant(k);

        // Mapa de claves i18n según el estado destino
        const keyMap: Record<string, { titulo: string, texto: string }> = {
            confirmada: { titulo: 'ADMIN.RESERVAS.SWAL_CONF_TITULO', texto: 'ADMIN.RESERVAS.SWAL_CONF_TEXTO' },
            completada: { titulo: 'ADMIN.RESERVAS.SWAL_COMP_TITULO', texto: 'ADMIN.RESERVAS.SWAL_COMP_TEXTO' },
            cancelada:  { titulo: 'ADMIN.RESERVAS.SWAL_CANC_TITULO', texto: 'ADMIN.RESERVAS.SWAL_CANC_TEXTO' }
        };
        const keys = keyMap[estado] || { titulo: 'ADMIN.RESERVAS.SWAL_CONF_TITULO', texto: '' };

        // Diálogo de confirmación SweetAlert2.
        // El icono cambia a 'warning' (naranja) cuando se va a cancelar.
        // El color del botón de confirmar también cambia a rojo en cancelación.
        Swal.fire({
            title: t(keys.titulo), text: t(keys.texto),
            icon: estado === 'cancelada' ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: t('ADMIN.RESERVAS.SWAL_SI'),
            cancelButtonText:  t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5',
            confirmButtonColor: estado === 'cancelada' ? '#ef4444' : '#C9A84C',
            cancelButtonColor: '#374151'
        }).then(result => {
            // Si el usuario cerró el diálogo sin confirmar, no hacemos nada
            if (!result.isConfirmed) return;

            if (estado === 'cancelada') {
                // Cancelación: DELETE en el backend
                this.bookingService.cancelarBooking(id).subscribe({
                    next: () => {
                        // splice(idx, 1): elimina el elemento en posición idx
                        // del array original. Esto actualiza la vista sin recargar.
                        const idx = this.bookings.findIndex(b => b._id === id);
                        if (idx !== -1) this.bookings.splice(idx, 1);
                        this.cdr.detectChanges();
                        Swal.fire({ icon: 'success', title: t('ADMIN.RESERVAS.SWAL_CANC_TITULO'),
                            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                    },
                    error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message,
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
                });
                return;
            }

            // Cambio a confirmada / completada: PATCH en el backend
            this.bookingService.actualizarEstado(id, estado).subscribe({
                next: () => {
                    // Actualizamos solo la propiedad 'estado' del objeto en memoria
                    // para no recargar toda la lista desde el servidor
                    const booking = this.bookings.find(b => b._id === id);
                    if (booking) booking.estado = estado as any;
                    this.cdr.detectChanges();
                    Swal.fire({ icon: 'success', title: `${t('ADMIN.RESERVAS.SWAL_RESERVA')} ${estado}`,
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message,
                    background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Marca una reserva como pagada tras confirmación del administrador.
    // Solo actualiza la propiedad estadoPago en el objeto local para reflejar
    // el cambio en la UI sin recargar la lista completa.
    marcarPagado(id: string): void {
        const t = (k: string) => this.translate.instant(k);
        Swal.fire({
            title: t('ADMIN.RESERVAS.SWAL_PAGO_TITULO'), text: t('ADMIN.RESERVAS.SWAL_PAGO_TEXTO'),
            icon: 'question', showCancelButton: true,
            confirmButtonText: t('ADMIN.RESERVAS.SWAL_SI_PAGADO'),
            cancelButtonText:  t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.bookingService.actualizarPago(id).subscribe({
                next: () => {
                    // Mutamos solo la propiedad estadoPago del objeto encontrado
                    const booking = this.bookings.find(b => b._id === id);
                    if (booking) booking.estadoPago = 'pagado' as any;
                    this.cdr.detectChanges();
                    Swal.fire({ icon: 'success', title: t('ADMIN.RESERVAS.SWAL_PAGADA_OK'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message,
                    background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Devuelve los nombres de los servicios de una reserva como string separado por comas.
    // El campo 'servicios' puede ser un array de objetos populados (con .nombre)
    // o un array de IDs (strings), por eso usamos 'as any[]' y el operador || s.
    getNombresServicios(booking: Booking): string {
    const servicios = booking.servicios as any[];
    if (!servicios?.length) return '';
    return servicios.map(s => s.nombre || s).join(', ');
}

    // Devuelve el nombre del barbero asignado a la reserva.
    // El campo 'barbero' puede ser un objeto populado o un simple ID.
getNombreBarbero(booking: Booking): string {
    const b = booking.barbero as any;
    return b?.nombre || '';
}

    // Devuelve las clases CSS de Tailwind correspondientes al estado de la reserva,
    // permitiendo colorear el badge de estado en la tabla de forma dinámica.
    getEstadoColor(estado: string): string {
        switch (estado) {
            case 'confirmada':  return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pendiente':   return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'completada':  return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default:            return 'text-foreground/50';
        }
    }
}
