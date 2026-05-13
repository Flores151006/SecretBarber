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
    private bookingService = inject(BookingService);
    private translate      = inject(TranslateService);
    private cdr            = inject(ChangeDetectorRef);

    bookings: Booking[] = [];
    cargando     = true;
    error        = '';
    filtro       = 'todas';
    filtroFecha  = 'hoy';
    busqueda     = '';

    ngOnInit(): void {
        this.cargarBookings();
    }

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

   get bookingsFiltradas(): Booking[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);

    const hace30dias = new Date(hoy);
    hace30dias.setDate(hace30dias.getDate() - 30);

    let resultado = this.bookings;

    if (this.filtroFecha === 'hoy') {
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

    if (this.filtro !== 'todas') {
        resultado = resultado.filter(b => b.estado === this.filtro);
    }

    if (this.busqueda.trim()) {
        const termino = this.busqueda.toLowerCase().trim();
        resultado = resultado.filter(b => {
            const cliente = b.cliente as any;
            return (cliente?.name || '').toLowerCase().includes(termino) ||
                   (cliente?.email || '').toLowerCase().includes(termino);
        });
    }

    return resultado;
}
    cambiarEstado(id: string, estado: string): void {
        const t = (k: string) => this.translate.instant(k);
        const keyMap: Record<string, { titulo: string, texto: string }> = {
            confirmada: { titulo: 'ADMIN.RESERVAS.SWAL_CONF_TITULO', texto: 'ADMIN.RESERVAS.SWAL_CONF_TEXTO' },
            completada: { titulo: 'ADMIN.RESERVAS.SWAL_COMP_TITULO', texto: 'ADMIN.RESERVAS.SWAL_COMP_TEXTO' },
            cancelada:  { titulo: 'ADMIN.RESERVAS.SWAL_CANC_TITULO', texto: 'ADMIN.RESERVAS.SWAL_CANC_TEXTO' }
        };
        const keys = keyMap[estado] || { titulo: 'ADMIN.RESERVAS.SWAL_CONF_TITULO', texto: '' };

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
            if (!result.isConfirmed) return;
            if (estado === 'cancelada') {
                this.bookingService.cancelarBooking(id).subscribe({
                    next: () => {
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
            this.bookingService.actualizarEstado(id, estado).subscribe({
                next: () => {
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

    getNombresServicios(booking: Booking): string {
    const servicios = booking.servicios as any[];
    if (!servicios?.length) return '';
    return servicios.map(s => s.nombre || s).join(', ');
}

getNombreBarbero(booking: Booking): string {
    const b = booking.barbero as any;
    return b?.nombre || '';
}

    getEstadoColor(estado: string): string {
        switch (estado) {
            case 'confirmada':  return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pendiente':   return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'completada':  return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default:            return 'text-foreground/50';
        }
    }
}