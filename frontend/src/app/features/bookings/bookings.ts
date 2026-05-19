// ─────────────────────────────────────────────────────────────────────────────
// bookings.ts
//
// Componente principal del formulario de nueva reserva de Secret Barber.
// Implementa un flujo multi-paso: selección de barbero → servicios → fecha
// → hora disponible → método de pago (Stripe o efectivo).
//
// Puntos clave:
//  - inject() es la forma moderna (Angular 14+) de inyectar dependencias
//    sin usar el constructor. Equivale a poner el servicio en el constructor.
//  - FormBuilder (fb) construye el FormGroup con validaciones declarativas.
//  - Validators.required marca el campo como obligatorio; el formulario no
//    se puede enviar si algún campo required está vacío.
//  - ChangeDetectorRef (cdr) obliga a Angular a re-renderizar la vista
//    manualmente, necesario porque el componente usa OnPush implícito.
//  - Si el backend devuelve { url }, el usuario paga con tarjeta → se redirige
//    a Stripe. Si devuelve { bookingId }, la reserva es en efectivo y se va a
//    la página de confirmación.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router }          from '@angular/router';
import { CommonModule }    from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';
import { BookingService }  from '../../core/services/booking.service';
import { LanguageService } from '../../core/services/languaje.service';
import { Barbero, Servicio } from '../../shared/models/booking.model';

@Component({
    selector: 'app-bookings',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './bookings.html'
})
export class BookingsComponent implements OnInit {
    // inject() inyecta el servicio sin necesidad de constructor
    private fb             = inject(FormBuilder);
    private bookingService = inject(BookingService);
    private router         = inject(Router);
    private cdr            = inject(ChangeDetectorRef);
    languageService        = inject(LanguageService); // público para usarlo en la plantilla HTML

    // Tabla de traducción manual para mostrar los nombres de servicios en inglés.
    // Se usa en getNombreServicio() cuando el idioma activo es 'en'.
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

// Devuelve el nombre del servicio en el idioma activo del usuario
getNombreServicio(nombre: string): string {
    if (this.languageService.idioma() === 'en') {
        return this.serviciosTraducidos[nombre] || nombre;
    }
    return nombre;
}

    // Arrays que se rellenan con las llamadas al backend en ngOnInit
    barberos:    Barbero[]  = [];
    servicios:   Servicio[] = [];
    horas:       string[]   = []; // horas disponibles según barbero + servicios + fecha

    cargando     = false; // controla el spinner de envío
    error        = '';    // mensaje de error al enviar el formulario
    errorFecha   = '';    // mensaje específico si se elige un día no permitido

    // Fecha mínima para el input date: hoy, en formato YYYY-MM-DD
    fechaMin     = new Date().toISOString().split('T')[0];

    // Mapeo de nombre de barbero → ruta de su foto (relativa a /assets)
    fotosBarberos: Record<string, string> = {
        'Chory':  'gallery/chory.jpg',
        'Kronno': 'gallery/kronno.jpg'
    };

    // FormGroup: define todos los campos del formulario con sus validaciones.
    // Validators.required impide enviar si el campo está vacío.
    // El campo 'servicios' espera un array de IDs; se valida que no esté vacío.
    form: FormGroup = this.fb.group({
        barbero:    ['', Validators.required],
        servicios:  [[], Validators.required],
        fecha:      ['', Validators.required],
        hora:       ['', Validators.required],
        metodoPago: ['', Validators.required],
        cejas:      [false], // checkbox opcional: +1€ al precio total
        notas:      ['']     // campo libre sin validación
    });

    // ngOnInit se ejecuta una sola vez al inicializarse el componente.
    // Carga la lista de barberos y servicios disponibles desde el backend.
    // .subscribe({ next, error }) es la forma de consumir un Observable:
    //   - next: se ejecuta cuando llegan los datos
    //   - error: se ejecuta si falla la petición HTTP
    ngOnInit(): void {
        this.bookingService.getBarberos().subscribe({
            next: (res) => { this.barberos = res.data; this.cdr.detectChanges(); }
        });
        this.bookingService.getServicios().subscribe({
            next: (res) => { this.servicios = res.data; this.cdr.detectChanges(); }
        });
    }

    // Cuando el usuario hace clic en un barbero:
    //  1. Se actualiza el valor del campo 'barbero' en el formulario
    //  2. Se resetea la hora (porque el barbero nuevo puede tener disponibilidad distinta)
    //  3. Se vuelven a pedir las horas disponibles con los datos actuales
    seleccionarBarbero(id: string): void {
        this.form.get('barbero')?.setValue(id);
        this.form.get('hora')?.setValue('');
        this.horas = [];
        this.actualizarHoras();
    }

    // Auto-selección inteligente: si el usuario elige "Corte" Y "Barba"
    // por separado, se reemplazan automáticamente por "Corte y barba" (que es
    // más barato que los dos juntos). Devuelve el array de IDs actualizado.
    private aplicarAutoSeleccion(ids: string[]): string[] {
        const corte      = this.servicios.find(s => s.nombre === 'Corte')?._id;
        const barba      = this.servicios.find(s => s.nombre === 'Barba')?._id;
        const corteBarba = this.servicios.find(s => s.nombre === 'Corte y barba')?._id;
        if (corte && barba && corteBarba && ids.includes(corte) && ids.includes(barba))
            return [...ids.filter(id => id !== corte && id !== barba), corteBarba];
        return ids;
    }

    // Calcula qué servicios son incompatibles con el servicio dado.
    // Por ejemplo: no se puede elegir "Corte y barba" junto con "Corte" o "Barba"
    // porque son equivalentes. Tampoco se pueden mezclar distintos tipos de tinte.
    // Devuelve un array de IDs de servicios que deben deseleccionarse.
    private getIncompatibles(id: string): string[] {
        const s = this.servicios.find(s => s._id === id);
        if (!s) return [];
        const nombre = s.nombre;
        const grupoTintes  = ['Tinte completo', 'Tinte blanco entero', 'Tinte blanco entero + color'];
        const grupoMechas  = ['Mechas', 'Mechas blancas'];
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

    // Maneja el clic en un chip de servicio.
    // Si el servicio ya estaba seleccionado → se quita.
    // Si no estaba → se eliminan los incompatibles y se añade el nuevo.
    // Siempre se aplica la auto-selección (Corte + Barba → Corte y barba).
    // Al cambiar servicios, la hora se resetea porque cambia la duración total.
    toggleServicio(id: string): void {
        const actuales: string[] = this.form.get('servicios')?.value || [];
        let nuevos: string[];
        if (actuales.includes(id)) {
            nuevos = actuales.filter(s => s !== id);
        } else {
            const incompatibles = this.getIncompatibles(id);
            nuevos = [...actuales.filter(s => !incompatibles.includes(s)), id];
        }
        nuevos = this.aplicarAutoSeleccion(nuevos);
        this.form.get('servicios')?.setValue(nuevos);
        this.form.get('hora')?.setValue('');
        this.horas = [];
        this.actualizarHoras();
    }

    // Comprueba si un servicio está en la lista de seleccionados del formulario
    servicioSeleccionado(id: string): boolean {
        return (this.form.get('servicios')?.value || []).includes(id);
    }

    // Getter calculado: suma los precios de todos los servicios seleccionados.
    // Si el checkbox 'cejas' está marcado, añade 1€ extra.
    // Al ser un getter, se recalcula automáticamente cada vez que Angular
    // evalúa la plantilla.
    get precioTotal(): number {
        const ids: string[] = this.form.get('servicios')?.value || [];
        const precio = this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.precio, 0);
        return precio + (this.form.get('cejas')?.value ? 1 : 0);
    }

    // Getter calculado: suma la duración (en minutos) de los servicios seleccionados.
    // Este valor se envía al backend para consultar los huecos disponibles.
    get duracionTotal(): number {
        const ids: string[] = this.form.get('servicios')?.value || [];
        return this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.duracion, 0);
    }

    // Comprueba si la fecha elegida es válida (martes a viernes: días 2-5 en getUTCDay).
    // Se usa getUTCDay en lugar de getDay para evitar problemas con zonas horarias.
    esDiaValido(fecha: string): boolean {
        if (!fecha) return true;
        const dia = new Date(fecha).getUTCDay();
        return dia >= 2 && dia <= 5; // 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes
    }

    // Se llama cuando el usuario cambia la fecha en el input.
    // Si el día no es válido (lunes, fin de semana), borra la fecha del formulario
    // y muestra un mensaje de error. Si es válido, actualiza las horas disponibles.
    onFechaChange(event: any): void {
        const fecha = event.target.value;
        if (!this.esDiaValido(fecha)) {
            this.form.get('fecha')?.setValue('');
            this.errorFecha = this.languageService.idioma() === 'es'
                ? 'RESERVAS.SOLO_MARTES_VIERNES'
                : 'RESERVAS.SOLO_MARTES_VIERNES';
        } else {
            this.errorFecha = '';
            this.form.get('hora')?.setValue('');
            this.horas = [];
            this.actualizarHoras();
        }
    }

    // Consulta al backend los huecos horarios disponibles para la combinación
    // barbero + fecha + duración. Solo se ejecuta si los tres datos están presentes
    // y la duración es mayor que 0 (es decir, se ha elegido al menos un servicio).
    actualizarHoras(): void {
        const barberoId = this.form.get('barbero')?.value;
        const fecha     = this.form.get('fecha')?.value;
        const duracion  = this.duracionTotal;
        if (!barberoId || !fecha || duracion === 0) return;
        this.bookingService.getDisponibilidad(barberoId, fecha, duracion).subscribe({
            next: (res) => { this.horas = res.data; this.cdr.detectChanges(); }
        });
    }

    // Envío del formulario de reserva.
    // Si el formulario es inválido, no hace nada (Angular marca los campos en rojo).
    // Llama a crearBooking con todos los datos del formulario.
    //
    // Según la respuesta del backend:
    //   - res.url presente → pago con tarjeta (Stripe): redirige a la URL de checkout
    //     usando window.location.href (salida del SPA hacia Stripe)
    //   - Sin res.url → pago en efectivo: navega a /reserva-confirmada (dentro del SPA)
    submit(): void {
        if (this.form.invalid) return;
        this.cargando = true;
        this.error    = '';
        const v = this.form.value;
        this.bookingService.crearBooking({
            barbero:   v.barbero, servicios: v.servicios, fecha: v.fecha,
            hora:      v.hora, metodoPago: v.metodoPago, cejas: v.cejas ?? false, notas: v.notas
        }).subscribe({
            next: (res: any) => {
                this.cargando = false;
                this.cdr.detectChanges();
                // Si el backend devuelve una URL de Stripe, redirigimos fuera del SPA
                if (res.url) window.location.href = res.url;
                // Si no hay URL, es pago en efectivo → navegamos dentro del SPA
                else this.router.navigate(['/reserva-confirmada']);
            },
            error: (err) => {
                this.cargando = false;
                this.error = err.error?.message || 'Error al crear la reserva';
                this.cdr.detectChanges();
            }
        });
    }
}
