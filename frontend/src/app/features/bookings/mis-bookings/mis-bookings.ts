// ─────────────────────────────────────────────────────────────────────────────
// mis-bookings.ts
//
// Componente "Mis reservas": muestra al usuario todas sus reservas, permite
// cancelarlas o modificarlas (si están en estado pendiente/confirmada) y
// dejar una reseña cuando la reserva está completada.
//
// Puntos clave:
//  - inject() inyecta los servicios sin constructor.
//  - FormBuilder construye dos formularios reactivos:
//      · formResena: puntuación (1-5) + comentario
//      · formEditar: todos los campos de una reserva (igual que bookings.ts)
//  - SweetAlert2 (Swal) muestra ventanas de confirmación y notificaciones
//    con diseño personalizado (fondo oscuro, color dorado para confirmar).
//  - cancelarReserva: tras confirmar con Swal, llama al backend y elimina
//    la reserva del array local con splice (actualización sin recargar).
//  - getEstadoColor: devuelve clases Tailwind CSS para el badge de estado.
//  - reservasReseniadas: Set que guarda los IDs de reservas ya reseñadas
//    en esta sesión, para ocultar el botón de reseña tras enviarla.
// ─────────────────────────────────────────────────────────────────────────────

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
    // Servicios inyectados con inject() — alternativa moderna al constructor
    private bookingService = inject(BookingService);
    private reviewService  = inject(ReviewService);
    private fb             = inject(FormBuilder);
    private cdr            = inject(ChangeDetectorRef);
    languageService        = inject(LanguageService); // público para usarlo en la plantilla

    // Estado del componente
    bookings: Booking[]             = []; // lista de reservas del usuario
    barberos: Barbero[]             = []; // necesarios para el formulario de edición
    servicios: Servicio[]           = []; // necesarios para el formulario de edición
    horasEdicion: string[]          = []; // horas disponibles al editar una reserva
    cargando                        = true;  // muestra spinner mientras carga
    error                           = '';    // error al cargar las reservas

    // Control del modal de reseña
    reservaResena: string | null    = null;  // ID de la reserva que se está reseñando
    // Set: estructura que guarda valores únicos; aquí guarda IDs de reservas ya reseñadas
    reservasReseniadas: Set<string> = new Set();
    enviandoResena                  = false;
    errorResena                     = '';

    // Control del modal de edición
    reservaEditando: string | null  = null; // ID de la reserva en edición
    enviandoEdicion                 = false;
    errorEdicion                    = '';
    precioEdicion                   = 0;    // precio calculado dinámicamente al editar

    // Fecha mínima para el input date en el formulario de edición
    fechaMin                        = new Date().toISOString().split('T')[0];

    // Tabla de traducción para nombres de servicios en inglés
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

    // Formulario de reseña: puntuación obligatoria entre 1 y 5, comentario entre 10 y 500 caracteres
    formResena: FormGroup = this.fb.group({
        puntuacion: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
        comentario: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    // Formulario de edición de reserva: mismos campos que el formulario de nueva reserva
    formEditar: FormGroup = this.fb.group({
        barbero:    ['', Validators.required],
        servicios:  [[], Validators.required],
        fecha:      ['', Validators.required],
        hora:       ['', Validators.required],
        metodoPago: ['', Validators.required],
        cejas:      [false],
        notas:      ['']
    });

    // ngOnInit carga las reservas del usuario, barberos y servicios al arrancar el componente.
    // getMisBookings() devuelve solo las reservas del usuario autenticado (token JWT en cabecera).
    ngOnInit(): void {
        this.bookingService.getMisBookings().subscribe({
            next: (res) => { this.bookings = res.data; this.cargando = false; this.cdr.detectChanges(); },
            error: (err) => { this.error = err.error?.message || 'Error al cargar las reservas'; this.cargando = false; this.cdr.detectChanges(); }
        });
        // Se cargan barberos y servicios para usarlos en el modal de edición
        this.bookingService.getBarberos().subscribe({ next: (res) => { this.barberos = res.data; } });
        this.bookingService.getServicios().subscribe({ next: (res) => { this.servicios = res.data; } });
    }

    // Construye el string con los nombres de los servicios de una reserva,
    // separados por coma. Si el idioma es inglés, traduce cada nombre.
    // booking.servicios puede ser un array de objetos { nombre } o de strings.
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

    // Extrae el nombre del barbero de una reserva.
    // booking.barbero puede ser un objeto populado { nombre } o solo un ID string.
    getNombreBarbero(booking: Booking): string {
        const b = booking.barbero as any;
        return b?.nombre || '';
    }

    // Traduce el nombre de un servicio al inglés si es necesario (usado en el modal de edición)
    getNombreServicioEdicion(nombre: string): string {
        return this.languageService.idioma() === 'en'
            ? (this.serviciosTraducidos[nombre] || nombre)
            : nombre;
    }

    // Abre el modal de reseña para una reserva concreta.
    // Guarda el ID de la reserva en reservaResena y resetea el formulario.
    abrirFormResena(bookingId: string): void {
        this.reservaResena = bookingId;
        this.formResena.reset({ puntuacion: 0, comentario: '' });
        this.errorResena = '';
    }

    // Cierra el modal de reseña sin enviar nada
    cerrarFormResena(): void { this.reservaResena = null; this.errorResena = ''; }

    // Actualiza la puntuación en el formulario cuando el usuario hace clic en una estrella
    setPuntuacion(valor: number): void { this.formResena.get('puntuacion')?.setValue(valor); }

    // Envía la reseña al backend a través del ReviewService.
    // Si el formulario es inválido o no hay reserva seleccionada, no hace nada.
    // Tras el éxito:
    //  1. Añade el ID al Set reservasReseniadas (para ocultar el botón en la vista)
    //  2. Cierra el modal
    //  3. Muestra un toast de SweetAlert2 con fondo oscuro y color dorado
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
                // Marca esta reserva como reseñada para que no aparezca el botón de nuevo
                if (this.reservaResena) this.reservasReseniadas.add(this.reservaResena);
                this.reservaResena = null;
                this.cdr.detectChanges();
                // SweetAlert2: ventana de éxito con temporizador de 2,5 segundos
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

    // Auto-selección: si el usuario elige Corte + Barba por separado,
    // se reemplazan automáticamente por "Corte y barba" (igual que en bookings.ts)
    private aplicarAutoSeleccion(ids: string[]): string[] {
        const corte      = this.servicios.find(s => s.nombre === 'Corte')?._id;
        const barba      = this.servicios.find(s => s.nombre === 'Barba')?._id;
        const corteBarba = this.servicios.find(s => s.nombre === 'Corte y barba')?._id;
        if (corte && barba && corteBarba && ids.includes(corte) && ids.includes(barba))
            return [...ids.filter(id => id !== corte && id !== barba), corteBarba];
        return ids;
    }

    // Devuelve los IDs de servicios incompatibles con el servicio dado.
    // Lógica idéntica a bookings.ts (se duplica para que el modal de edición sea autónomo)
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

    // Toggle de servicio en el formulario de edición.
    // Igual que en bookings.ts pero actúa sobre formEditar en lugar de form.
    // Además recalcula el precio y las horas disponibles tras cada cambio.
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

    // Comprueba si un servicio está seleccionado en el formulario de edición
    servicioEdicionSeleccionado(id: string): boolean {
        return (this.formEditar.get('servicios')?.value || []).includes(id);
    }

    // Recalcula el precio total de la edición sumando los servicios seleccionados.
    // Añade 1€ si el checkbox 'cejas' está marcado.
    actualizarPrecioEdicion(): void {
        const ids: string[] = this.formEditar.get('servicios')?.value || [];
        const precio = this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.precio, 0);
        this.precioEdicion = precio + (this.formEditar.get('cejas')?.value ? 1 : 0);
        this.cdr.detectChanges();
    }

    // Getter que calcula la duración total (en minutos) de los servicios seleccionados en edición.
    // Se usa para consultar la disponibilidad horaria.
    get duracionEdicion(): number {
        const ids: string[] = this.formEditar.get('servicios')?.value || [];
        return this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.duracion, 0);
    }

    // Consulta al backend las horas disponibles para la edición.
    // Solo actúa si hay barbero, fecha y al menos un servicio seleccionado.
    actualizarHorasEdicion(): void {
        const barberoId = this.formEditar.get('barbero')?.value;
        const fecha     = this.formEditar.get('fecha')?.value;
        const duracion  = this.duracionEdicion;
        if (!barberoId || !fecha || duracion === 0) return;
        this.bookingService.getDisponibilidad(barberoId, fecha, duracion).subscribe({
            next: (res) => { this.horasEdicion = res.data; this.cdr.detectChanges(); }
        });
    }

    // Abre el modal de edición con los datos actuales de la reserva pre-rellenados.
    // booking.servicios y booking.barbero pueden venir populados (objetos) o como IDs,
    // por eso se hace la extracción con ?._id || s.
    abrirEdicion(booking: Booking): void {
        this.reservaEditando = booking._id;
        this.errorEdicion    = '';
        const serviciosIds = (booking.servicios as any[]).map(s => s._id || s);
        const barberoId    = (booking.barbero as any)?._id || booking.barbero;
        // setValue rellena todos los campos del formulario a la vez
        this.formEditar.setValue({
            barbero: barberoId, servicios: serviciosIds,
            fecha: new Date(booking.fecha).toISOString().split('T')[0],
            hora: booking.hora, metodoPago: booking.metodoPago,
            cejas: booking.cejas || false, notas: booking.notas || ''
        });
        this.actualizarPrecioEdicion();
        this.actualizarHorasEdicion();
    }

    // Cierra el modal de edición y limpia el estado
    cerrarEdicion(): void { this.reservaEditando = null; this.errorEdicion = ''; this.horasEdicion = []; }

    // Envía la modificación al backend.
    // Si el formulario es inválido o no hay reserva seleccionada, no hace nada.
    // Tras el éxito, recarga la lista completa de reservas y muestra un toast de éxito.
    guardarEdicion(): void {
        if (this.formEditar.invalid || !this.reservaEditando) return;
        this.enviandoEdicion = true;
        this.bookingService.modificarBooking(this.reservaEditando, this.formEditar.value).subscribe({
            next: () => {
                this.enviandoEdicion = false;
                this.reservaEditando = null;
                this.horasEdicion    = [];
                // Recarga la lista para reflejar los cambios actualizados
                this.bookingService.getMisBookings().subscribe({ next: (res) => { this.bookings = res.data; this.cdr.detectChanges(); } });
                // SweetAlert2: notificación de éxito con temporizador automático
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

    // Cancela una reserva previa confirmación del usuario con SweetAlert2.
    // Swal.fire() devuelve una Promise; .then() se ejecuta cuando el usuario
    // hace clic en confirmar o cancelar.
    // Si confirma (result.isConfirmed), llama al backend y:
    //   · Elimina la reserva del array local con findIndex + splice (sin recargar)
    //   · Muestra un toast de éxito
    cancelarReserva(id: string): void {
        Swal.fire({
            title: this.languageService.idioma() === 'es' ? '¿Cancelar esta reserva?' : 'Cancel this booking?',
            text:  this.languageService.idioma() === 'es' ? 'Esta acción no se puede deshacer' : 'This action cannot be undone',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: this.languageService.idioma() === 'es' ? 'Sí, cancelar' : 'Yes, cancel',
            cancelButtonText:  this.languageService.idioma() === 'es' ? 'Volver' : 'Go back',
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return; // El usuario pulsó "Volver", no hacemos nada
            this.bookingService.cancelarBooking(id).subscribe({
                next: () => {
                    // Eliminamos la reserva del array local sin necesidad de recargar la página
                    const idx = this.bookings.findIndex(b => b._id === id);
                    if (idx !== -1) this.bookings.splice(idx, 1);
                    this.cdr.detectChanges();
                    Swal.fire({ icon: 'success', title: this.languageService.idioma() === 'es' ? 'Reserva cancelada' : 'Booking cancelled',
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Devuelve las clases CSS de Tailwind para el badge de estado de la reserva.
    // Cada estado tiene un color diferente para facilitar la lectura visual:
    //   · confirmada → verde
    //   · pendiente  → amarillo
    //   · completada → azul
    getEstadoColor(estado: string): string {
        switch (estado) {
            case 'confirmada': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pendiente':  return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'completada': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default:           return 'text-foreground/50';
        }
    }

    // Devuelve las clases CSS para el estado del pago:
    //   · pagado   → verde
    //   · pendiente → amarillo
    //   · fallido  → rojo
    getPagoColor(estado: string): string {
        switch (estado) {
            case 'pagado':    return 'text-green-400';
            case 'pendiente': return 'text-yellow-400';
            case 'fallido':   return 'text-red-400';
            default:          return 'text-foreground/50';
        }
    }
}
