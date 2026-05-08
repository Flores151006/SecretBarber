import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink }                from '@angular/router';
import { CommonModule }              from '@angular/common';
import { TranslateModule }           from '@ngx-translate/core';
import { FormBuilder, FormGroup,
         Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent }           from '@ng-icons/core';
import { BookingService }            from '../../../core/services/booking.service';
import { ReviewService }             from '../../../core/services/review.service';
import { LanguageService } from '../../../core/services/languaje.service';
import { Booking, Barbero, Servicio } from '../../../shared/models/booking.model';
import Swal                          from 'sweetalert2';

@Component({
    selector: 'app-mis-bookings',
    standalone: true,
    imports: [RouterLink, CommonModule, ReactiveFormsModule, TranslateModule, NgIconComponent],
    templateUrl: './mis-bookings.html'
})
export class MisBookingsComponent implements OnInit {
    private bookingService = inject(BookingService);
    private reviewService  = inject(ReviewService);
    private fb             = inject(FormBuilder);
    private cdr            = inject(ChangeDetectorRef);
    languageService        = inject(LanguageService);

    bookings: Booking[]             = [];
    barberos: Barbero[]             = [];
    servicios: Servicio[]           = [];
    horasEdicion: string[]          = [];
    cargando                        = true;
    error                           = '';
    reservaResena: string | null    = null;
    reservasReseniadas: Set<string> = new Set();
    reservaEditando: string | null  = null;
    enviandoResena                  = false;
    errorResena                     = '';
    enviandoEdicion                 = false;
    errorEdicion                    = '';
    fechaMin                        = new Date().toISOString().split('T')[0];
    precioEdicion                   = 0;

    private serviciosTraducidos: Record<string, string> = {
        'Corte':                       'Haircut',
        'Barba':                       'Beard trim',
        'Corte y barba':               'Haircut & beard',
        'Tinte completo':              'Full dye',
        'Mechas':                      'Highlights',
        'Mechas blancas':              'White highlights',
        'Tinte blanco entero':         'Full bleach',
        'Tinte blanco entero + color': 'Full bleach + color'
    };

    formResena: FormGroup = this.fb.group({
        puntuacion: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
        comentario: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    formEditar: FormGroup = this.fb.group({
        barbero:    ['', Validators.required],
        servicios:  [[], Validators.required],
        fecha:      ['', Validators.required],
        hora:       ['', Validators.required],
        metodoPago: ['', Validators.required],
        cejas:      [false],
        notas:      ['']
    });

    ngOnInit(): void {
        this.bookingService.getMisBookings().subscribe({
            next: (res) => { this.bookings = res.data; this.cargando = false; this.cdr.detectChanges(); },
            error: (err) => { this.error = err.error?.message || 'Error al cargar las reservas'; this.cargando = false; this.cdr.detectChanges(); }
        });
        this.bookingService.getBarberos().subscribe({ next: (res) => { this.barberos = res.data; } });
        this.bookingService.getServicios().subscribe({ next: (res) => { this.servicios = res.data; } });
    }

    getNombresServicios(booking: Booking): string {
        const servicios = booking.servicios as any[];
        if (!servicios?.length) return '';
        return servicios.map(s => {
            const nombre = s.nombre || s;
            return this.languageService.idioma() === 'en'
                ? (this.serviciosTraducidos[nombre] || nombre)
                : nombre;
        }).join(', ');
    }

    getNombreBarbero(booking: Booking): string {
        const b = booking.barbero as any;
        return b?.nombre || '';
    }

    getNombreServicioEdicion(nombre: string): string {
        return this.languageService.idioma() === 'en'
            ? (this.serviciosTraducidos[nombre] || nombre)
            : nombre;
    }

    abrirFormResena(bookingId: string): void {
        this.reservaResena = bookingId;
        this.formResena.reset({ puntuacion: 0, comentario: '' });
        this.errorResena = '';
    }

    cerrarFormResena(): void { this.reservaResena = null; this.errorResena = ''; }

    setPuntuacion(valor: number): void { this.formResena.get('puntuacion')?.setValue(valor); }

    enviarResena(): void {
        if (this.formResena.invalid || !this.reservaResena) return;
        this.enviandoResena = true;
        this.reviewService.crearReview({
            reserva: this.reservaResena,
            puntuacion: this.formResena.value.puntuacion,
            comentario: this.formResena.value.comentario
        }).subscribe({
            next: () => {
                this.enviandoResena = false;
                if (this.reservaResena) this.reservasReseniadas.add(this.reservaResena);
                this.reservaResena = null;
                this.cdr.detectChanges();
                Swal.fire({
                    icon: 'success',
                    title: this.languageService.idioma() === 'es' ? '¡Reseña enviada!' : 'Review sent!',
                    text: this.languageService.idioma() === 'es' ? 'Gracias por compartir tu opinión' : 'Thank you for sharing your opinion',
                    background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2500, showConfirmButton: false
                });
            },
            error: (err) => { this.enviandoResena = false; this.errorResena = err.error?.message || 'Error'; this.cdr.detectChanges(); }
        });
    }

    private aplicarAutoSeleccion(ids: string[]): string[] {
        const corte      = this.servicios.find(s => s.nombre === 'Corte')?._id;
        const barba      = this.servicios.find(s => s.nombre === 'Barba')?._id;
        const corteBarba = this.servicios.find(s => s.nombre === 'Corte y barba')?._id;
        if (corte && barba && corteBarba && ids.includes(corte) && ids.includes(barba))
            return [...ids.filter(id => id !== corte && id !== barba), corteBarba];
        return ids;
    }

    private getIncompatibles(id: string): string[] {
        const s = this.servicios.find(s => s._id === id);
        if (!s) return [];
        const nombre = s.nombre;
        const grupoTintes     = ['Tinte completo', 'Tinte blanco entero', 'Tinte blanco entero + color'];
        const grupoMechas     = ['Mechas', 'Mechas blancas'];
        const grupoTinteMecha = [...grupoTintes, ...grupoMechas];
        if (nombre === 'Corte y barba')
            return this.servicios.filter(s => ['Corte', 'Barba'].includes(s.nombre)).map(s => s._id);
        if (['Corte', 'Barba'].includes(nombre))
            return this.servicios.filter(s => s.nombre === 'Corte y barba').map(s => s._id);
        if (grupoTintes.includes(nombre))
            return this.servicios.filter(s => grupoTinteMecha.includes(s.nombre) && s._id !== id).map(s => s._id);
        if (grupoMechas.includes(nombre))
            return this.servicios.filter(s => grupoTinteMecha.includes(s.nombre) && s._id !== id).map(s => s._id);
        return [];
    }

    toggleServicioEdicion(id: string): void {
        const actuales: string[] = this.formEditar.get('servicios')?.value || [];
        let nuevos: string[];
        if (actuales.includes(id)) {
            nuevos = actuales.filter(s => s !== id);
        } else {
            const incompatibles = this.getIncompatibles(id);
            nuevos = [...actuales.filter(s => !incompatibles.includes(s)), id];
        }
        nuevos = this.aplicarAutoSeleccion(nuevos);
        this.formEditar.get('servicios')?.setValue(nuevos);
        this.actualizarPrecioEdicion();
        this.actualizarHorasEdicion();
    }

    servicioEdicionSeleccionado(id: string): boolean {
        return (this.formEditar.get('servicios')?.value || []).includes(id);
    }

    actualizarPrecioEdicion(): void {
        const ids: string[] = this.formEditar.get('servicios')?.value || [];
        const precio = this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.precio, 0);
        this.precioEdicion = precio + (this.formEditar.get('cejas')?.value ? 1 : 0);
        this.cdr.detectChanges();
    }

    get duracionEdicion(): number {
        const ids: string[] = this.formEditar.get('servicios')?.value || [];
        return this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.duracion, 0);
    }

    actualizarHorasEdicion(): void {
        const barberoId = this.formEditar.get('barbero')?.value;
        const fecha     = this.formEditar.get('fecha')?.value;
        const duracion  = this.duracionEdicion;
        if (!barberoId || !fecha || duracion === 0) return;
        this.bookingService.getDisponibilidad(barberoId, fecha, duracion).subscribe({
            next: (res) => { this.horasEdicion = res.data; this.cdr.detectChanges(); }
        });
    }

    abrirEdicion(booking: Booking): void {
        this.reservaEditando = booking._id;
        this.errorEdicion    = '';
        const serviciosIds = (booking.servicios as any[]).map(s => s._id || s);
        const barberoId    = (booking.barbero as any)?._id || booking.barbero;
        this.formEditar.setValue({
            barbero: barberoId, servicios: serviciosIds,
            fecha: new Date(booking.fecha).toISOString().split('T')[0],
            hora: booking.hora, metodoPago: booking.metodoPago,
            cejas: booking.cejas || false, notas: booking.notas || ''
        });
        this.actualizarPrecioEdicion();
        this.actualizarHorasEdicion();
    }

    cerrarEdicion(): void { this.reservaEditando = null; this.errorEdicion = ''; this.horasEdicion = []; }

    guardarEdicion(): void {
        if (this.formEditar.invalid || !this.reservaEditando) return;
        this.enviandoEdicion = true;
        this.bookingService.modificarBooking(this.reservaEditando, this.formEditar.value).subscribe({
            next: () => {
                this.enviandoEdicion = false;
                this.reservaEditando = null;
                this.horasEdicion    = [];
                this.bookingService.getMisBookings().subscribe({ next: (res) => { this.bookings = res.data; this.cdr.detectChanges(); } });
                Swal.fire({
                    icon: 'success',
                    title: this.languageService.idioma() === 'es' ? '¡Reserva modificada!' : 'Booking modified!',
                    text: this.languageService.idioma() === 'es' ? 'El barbero deberá confirmar tu nueva cita' : 'The barber will need to confirm your new appointment',
                    background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2500, showConfirmButton: false
                });
            },
            error: (err) => { this.enviandoEdicion = false; this.errorEdicion = err.error?.message || 'Error'; this.cdr.detectChanges(); }
        });
    }

    cancelarReserva(id: string): void {
        Swal.fire({
            title: this.languageService.idioma() === 'es' ? '¿Cancelar esta reserva?' : 'Cancel this booking?',
            text:  this.languageService.idioma() === 'es' ? 'Esta acción no se puede deshacer' : 'This action cannot be undone',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: this.languageService.idioma() === 'es' ? 'Sí, cancelar' : 'Yes, cancel',
            cancelButtonText:  this.languageService.idioma() === 'es' ? 'Volver' : 'Go back',
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.bookingService.cancelarBooking(id).subscribe({
                next: () => {
                    const booking = this.bookings.find(b => b._id === id);
                    if (booking) booking.estado = 'cancelada' as any;
                    this.cdr.detectChanges();
                    Swal.fire({ icon: 'success', title: this.languageService.idioma() === 'es' ? 'Reserva cancelada' : 'Booking cancelled',
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    getEstadoColor(estado: string): string {
        switch (estado) {
            case 'confirmada': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pendiente':  return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'cancelada':  return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'completada': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default:           return 'text-foreground/50';
        }
    }

    getPagoColor(estado: string): string {
        switch (estado) {
            case 'pagado':    return 'text-green-400';
            case 'pendiente': return 'text-yellow-400';
            case 'fallido':   return 'text-red-400';
            default:          return 'text-foreground/50';
        }
    }
}