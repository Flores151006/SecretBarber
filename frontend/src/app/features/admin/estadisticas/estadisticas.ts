import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIconComponent }    from '@ng-icons/core';
import { TranslateModule }    from '@ngx-translate/core';
import { BookingService }     from '../../../core/services/booking.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

type Filtro = 'hoy' | 'semana' | 'mes' | 'anio' | 'rango';

@Component({
    selector: 'app-estadisticas',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, BaseChartDirective, NgIconComponent, TranslateModule],
    templateUrl: './estadisticas.html'
})
export class EstadisticasComponent implements OnInit {
    private bookingService = inject(BookingService);
    private cdr            = inject(ChangeDetectorRef);
    private fb             = inject(FormBuilder);

    cargando        = signal(true);
    cargandoRango   = signal(false);
    error           = signal('');
    errorRango      = signal('');
    datos           = signal<any>(null);
    filtro          = signal<Filtro>('mes');
    mostrarRango    = signal(false);
    rangoAplicado   = signal(false);
    fechasAplicadas = signal<{ inicio: string; fin: string } | null>(null);

    rangoForm: FormGroup = this.fb.group({
        fechaInicio: ['', Validators.required],
        fechaFin:    ['', Validators.required]
    });

    readonly filtros = [
        { id: 'hoy'    as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_HOY'    },
        { id: 'semana' as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_SEMANA' },
        { id: 'mes'    as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_MES'    },
        { id: 'anio'   as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_ANIO'   },
    ];

    // Texto dinámico del botón de rango — muestra las fechas cuando está activo
    labelBotonRango = computed(() => {
        const fa = this.fechasAplicadas();
        if (fa) return `${this.formatearFechaCorta(fa.inicio)} — ${this.formatearFechaCorta(fa.fin)}`;
        return null; // null = mostrar texto i18n por defecto
    });

    ingresoActual = computed(() => {
        const d = this.datos();
        if (!d) return 0;
        const map: Record<Filtro, number> = {
            hoy:    d.resumen.totalHoy,
            semana: d.resumen.totalSemana,
            mes:    d.resumen.totalMes,
            anio:   d.resumen.totalAnio,
            rango:  d.resumen.totalRango ?? 0
        };
        return map[this.filtro()];
    });

    reservasActual = computed(() => {
        const d = this.datos();
        if (!d) return 0;
        const map: Record<Filtro, number> = {
            hoy:    d.resumen.reservasHoy,
            semana: d.resumen.reservasSemana,
            mes:    d.resumen.reservasMes,
            anio:   d.resumen.reservasAnio,
            rango:  d.resumen.reservasRango ?? 0
        };
        return map[this.filtro()];
    });

    ticketMedio = computed(() => this.datos()?.resumen.ticketMedio ?? 0);

    labelFiltro = computed(() => {
        if (this.filtro() === 'rango') {
            const fa = this.fechasAplicadas();
            return fa
                ? `${this.formatearFechaCorta(fa.inicio)} — ${this.formatearFechaCorta(fa.fin)}`
                : 'Rango personalizado';
        }
        const map: Record<Filtro, string> = {
            hoy:    'ADMIN.ESTADISTICAS.FILTRO_HOY',
            semana: 'ADMIN.ESTADISTICAS.FILTRO_SEMANA',
            mes:    'ADMIN.ESTADISTICAS.FILTRO_MES',
            anio:   'ADMIN.ESTADISTICAS.FILTRO_ANIO',
            rango:  ''
        };
        return map[this.filtro()];
    });

    barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
    doughnutData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        animation: { duration: 800, easing: 'easeInOutQuart' },
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y}€` } }
        },
        scales: {
            x: { ticks: { color: '#6B7280', font: { size: 11 } }, grid: { color: '#1F2937' } },
            y: { ticks: { color: '#6B7280', font: { size: 11 }, callback: (v) => `${v}€` }, grid: { color: '#1F2937' } }
        }
    };

    doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        animation: { duration: 800 },
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#9CA3AF', padding: 16, font: { size: 11 }, boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle' }
            },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} reservas` } }
        }
    };

    ngOnInit(): void {
        this.cargarDatos();
    }

    private cargarDatos(fechaInicio?: string, fechaFin?: string): void {
        this.bookingService.getEstadisticas(fechaInicio, fechaFin).subscribe({
            next: (res) => {
                this.datos.set(res.data);
                this.construirGraficos(res.data);
                this.cargando.set(false);
                this.cargandoRango.set(false);
                this.cdr.detectChanges();
            },
            error: (err) => {
                const msg = err.error?.message || 'Error al cargar estadísticas';
                if (fechaInicio) {
                    this.errorRango.set(msg);
                    this.cargandoRango.set(false);
                } else {
                    this.error.set(msg);
                    this.cargando.set(false);
                }
            }
        });
    }

    setFiltro(f: Filtro): void {
        this.filtro.set(f);
        this.mostrarRango.set(false);
        this.errorRango.set('');
    }

    toggleRango(): void {
        if (this.rangoAplicado()) {
            // Si ya hay un rango activo, simplemente volver a mostrarlo para editar
            this.mostrarRango.update(v => !v);
            this.filtro.set('rango');
        } else {
            this.mostrarRango.update(v => !v);
            if (this.mostrarRango()) this.filtro.set('rango');
        }
    }

    limpiarRango(): void {
        this.rangoAplicado.set(false);
        this.fechasAplicadas.set(null);
        this.mostrarRango.set(false);
        this.errorRango.set('');
        this.rangoForm.reset();
        this.filtro.set('mes');
    }

    aplicarRango(): void {
        if (this.rangoForm.invalid) return;
        const { fechaInicio, fechaFin } = this.rangoForm.value;
        if (new Date(fechaInicio) > new Date(fechaFin)) {
            this.errorRango.set('La fecha de inicio no puede ser posterior a la fecha de fin');
            return;
        }
        this.errorRango.set('');
        this.cargandoRango.set(true);
        this.filtro.set('rango');
        this.rangoAplicado.set(true);
        this.fechasAplicadas.set({ inicio: fechaInicio, fin: fechaFin });
        this.mostrarRango.set(false);
        this.cargarDatos(fechaInicio, fechaFin);
    }

    get maxFecha(): string {
        return new Date().toISOString().split('T')[0];
    }

    formatearFechaCorta(dateStr: string): string {
        const fecha = new Date(dateStr + 'T00:00:00');
        return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    private construirGraficos(data: any): void {
        this.barChartData.set({
            labels: data.ingresosPorMes.map((m: any) => m.mes),
            datasets: [{
                data:                data.ingresosPorMes.map((m: any) => m.total),
                backgroundColor:     'rgba(201, 168, 76, 0.15)',
                borderColor:         '#C9A84C',
                borderWidth:         2,
                borderRadius:        8,
                borderSkipped:       false,
                hoverBackgroundColor:'rgba(201, 168, 76, 0.4)',
            }]
        });

        const coloresFondo = [
            'rgba(99,  102, 241, 0.85)',
            'rgba(236, 72,  153, 0.85)',
            'rgba(20,  184, 166, 0.85)',
            'rgba(245, 158, 11,  0.85)',
            'rgba(139, 92,  246, 0.85)',
        ];

        this.doughnutData.set({
            labels:   data.serviciosRanking.map((s: any) => s.nombre),
            datasets: [{
                data:            data.serviciosRanking.map((s: any) => s.count),
                backgroundColor: coloresFondo,
                borderColor:     '#0F172A',
                borderWidth:     3,
                hoverOffset:     12,
                hoverBorderColor:'#1E293B',
            }]
        });
    }
}
