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
    private fb             = inject(FormBuilder);
    private bookingService = inject(BookingService);
    private router         = inject(Router);
    private cdr            = inject(ChangeDetectorRef);
    languageService        = inject(LanguageService);

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

getNombreServicio(nombre: string): string {
    if (this.languageService.idioma() === 'en') {
        return this.serviciosTraducidos[nombre] || nombre;
    }
    return nombre;
}

    barberos:    Barbero[]  = [];
    servicios:   Servicio[] = [];
    horas:       string[]   = [];
    cargando     = false;
    error        = '';
    errorFecha   = '';
    fechaMin     = new Date().toISOString().split('T')[0];

    fotosBarberos: Record<string, string> = {
        'Chory':  'gallery/chory.jpg',
        'Kronno': 'gallery/kronno.jpg'
    };

    form: FormGroup = this.fb.group({
        barbero:    ['', Validators.required],
        servicios:  [[], Validators.required],
        fecha:      ['', Validators.required],
        hora:       ['', Validators.required],
        metodoPago: ['', Validators.required],
        cejas:      [false],
        notas:      ['']
    });

    ngOnInit(): void {
        this.bookingService.getBarberos().subscribe({
            next: (res) => { this.barberos = res.data; this.cdr.detectChanges(); }
        });
        this.bookingService.getServicios().subscribe({
            next: (res) => { this.servicios = res.data; this.cdr.detectChanges(); }
        });
    }

    seleccionarBarbero(id: string): void {
        this.form.get('barbero')?.setValue(id);
        this.form.get('hora')?.setValue('');
        this.horas = [];
        this.actualizarHoras();
    }

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

    toggleServicio(id: string): void {
        const actuales: string[] = this.form.get('servicios')?.value || [];
        let nuevos: string[];
        if (actuales.includes(id)) {
            nuevos = actuales.filter(s => s !== id);
        } else {
            const incompatibles = this.getIncompatibles(id);
            nuevos = [...actuales.filter(s => !incompatibles.includes(s)), id];
        }
        this.form.get('servicios')?.setValue(nuevos);
        this.form.get('hora')?.setValue('');
        this.horas = [];
        this.actualizarHoras();
    }

    servicioSeleccionado(id: string): boolean {
        return (this.form.get('servicios')?.value || []).includes(id);
    }

    get precioTotal(): number {
        const ids: string[] = this.form.get('servicios')?.value || [];
        const precio = this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.precio, 0);
        return precio + (this.form.get('cejas')?.value ? 1 : 0);
    }

    get duracionTotal(): number {
        const ids: string[] = this.form.get('servicios')?.value || [];
        return this.servicios.filter(s => ids.includes(s._id)).reduce((acc, s) => acc + s.duracion, 0);
    }

    esDiaValido(fecha: string): boolean {
        if (!fecha) return true;
        const dia = new Date(fecha).getUTCDay();
        return dia >= 2 && dia <= 5;
    }

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

    actualizarHoras(): void {
        const barberoId = this.form.get('barbero')?.value;
        const fecha     = this.form.get('fecha')?.value;
        const duracion  = this.duracionTotal;
        if (!barberoId || !fecha || duracion === 0) return;
        this.bookingService.getDisponibilidad(barberoId, fecha, duracion).subscribe({
            next: (res) => { this.horas = res.data; this.cdr.detectChanges(); }
        });
    }

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
                if (res.url) window.location.href = res.url;
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