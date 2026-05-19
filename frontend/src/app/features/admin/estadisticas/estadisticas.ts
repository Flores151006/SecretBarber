// ─────────────────────────────────────────────────────────────────────────────
// estadisticas.ts
//
// Componente de estadísticas del panel de administración de Secret Barber.
//
// Responsabilidades:
//   - Mostrar KPIs globales: total de reservas, ingresos, tasa de cancelación, etc.
//   - Renderizar un gráfico de barras (ng2-charts / Chart.js) con los ingresos
//     por período (12 meses, 7 días, etc.) según el filtro temporal activo.
//   - Renderizar un gráfico donut con el ranking de servicios más populares.
//   - Filtrar los datos por períodos predefinidos: hoy, semana, mes, año.
//   - Permitir un rango de fechas personalizado mediante un formulario reactivo.
//
// Conceptos clave:
//   - BaseChartDirective (ng2-charts): directiva que envuelve Chart.js en Angular.
//     Se usa como selector en la plantilla: <canvas baseChart ...>.
//   - ChartData<'bar'> / ChartData<'doughnut'>: tipos de Chart.js que definen
//     los datos del gráfico: labels (etiquetas del eje X) y datasets (series de datos).
//   - ChartConfiguration<T>['options']: tipo para las opciones de configuración
//     del gráfico (colores, escalas, tooltips, leyenda, animaciones…).
//   - signal<T>(): los datos, el filtro, el estado de carga y los errores son
//     signals para que la plantilla reaccione de forma automática a los cambios.
//   - computed(): labelBotonRango y labelFiltro son labels derivados del filtro
//     activo y de las fechas aplicadas; se recalculan solos al cambiar sus deps.
//   - FormBuilder + ReactiveFormsModule: gestionan el formulario de rango de fechas.
//   - Validators.required: valida que ambas fechas estén rellenas antes de enviar.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIconComponent }    from '@ng-icons/core';
import { TranslateModule }    from '@ngx-translate/core';
import { BookingService }     from '../../../core/services/booking.service';
// BaseChartDirective: directiva principal de ng2-charts que convierte un <canvas>
// en un gráfico de Chart.js dentro de una plantilla Angular
import { BaseChartDirective } from 'ng2-charts';
// ChartConfiguration: tipo completo del gráfico (datos + opciones + tipo)
// ChartData: solo la parte de datos (labels + datasets)
import { ChartConfiguration, ChartData } from 'chart.js';

// Tipo de unión para los filtros temporales disponibles.
// 'rango' se activa cuando el admin introduce fechas personalizadas.
type Filtro = 'hoy' | 'semana' | 'mes' | 'anio' | 'rango';

@Component({
    selector: 'app-estadisticas',
    standalone: true,
    // BaseChartDirective debe importarse aquí (componente standalone) para poder
    // usar <canvas baseChart> en la plantilla
    imports: [CommonModule, ReactiveFormsModule, BaseChartDirective, NgIconComponent, TranslateModule],
    templateUrl: './estadisticas.html'
})
export class EstadisticasComponent implements OnInit {

    // Servicios inyectados
    private bookingService = inject(BookingService);  // peticiones HTTP de estadísticas
    private cdr            = inject(ChangeDetectorRef); // detección de cambios manual
    private fb             = inject(FormBuilder);       // construcción del formulario reactivo

    // ── Signals de estado ───────────────────────────────────────────────────
    // cargando: true durante la carga inicial (muestra skeleton/spinner)
    cargando        = signal(true);
    // actualizando: true durante cambios de filtro (muestra overlay de carga parcial)
    actualizando    = signal(false);
    error           = signal('');       // error en la carga inicial
    errorRango      = signal('');       // error de validación del rango de fechas
    datos           = signal<any>(null); // respuesta completa del backend con los KPIs
    filtro          = signal<Filtro>('mes'); // filtro temporal activo (por defecto: mes)
    mostrarRango    = signal(false);    // controla si se muestra el panel de rango
    rangoAplicado   = signal(false);    // true cuando hay un rango personalizado activo
    // Almacena las fechas del rango aplicado para mostrarlas en el botón
    fechasAplicadas = signal<{ inicio: string; fin: string } | null>(null);

    // Formulario reactivo para el selector de rango de fechas personalizado.
    // fb.group() crea un FormGroup con dos controles, ambos obligatorios (Validators.required).
    rangoForm: FormGroup = this.fb.group({
        fechaInicio: ['', Validators.required],
        fechaFin:    ['', Validators.required]
    });

    // Lista estática de filtros predefinidos para renderizar los botones en la plantilla.
    // El tipo 'as Filtro' garantiza compatibilidad con el tipo de unión definido arriba.
    readonly filtros = [
        { id: 'hoy'    as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_HOY'    },
        { id: 'semana' as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_SEMANA' },
        { id: 'mes'    as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_MES'    },
        { id: 'anio'   as Filtro, label: 'ADMIN.ESTADISTICAS.FILTRO_ANIO'   },
    ];

    // computed(): signal derivado con el texto del botón de rango.
    // Si hay fechas aplicadas, muestra el intervalo formateado (ej: "1 ene — 31 ene").
    // Si no, devuelve null para que la plantilla muestre el texto por defecto.
    labelBotonRango = computed(() => {
        const fa = this.fechasAplicadas();
        if (fa) return `${this.formatearFechaCorta(fa.inicio)} — ${this.formatearFechaCorta(fa.fin)}`;
        return null;
    });

    // computed(): etiqueta del filtro activo para mostrar en la cabecera de estadísticas.
    // Si el filtro es 'rango' y hay fechas aplicadas muestra el intervalo;
    // si el filtro es predefinido devuelve su clave i18n para que ngx-translate la traduzca.
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

    // ── Datos de los gráficos (signals) ─────────────────────────────────────
    // ChartData<'bar'>: estructura de datos del gráfico de barras.
    //   labels   → etiquetas del eje X (nombres de meses, días, etc.)
    //   datasets → array de series; cada serie tiene 'data' (valores numéricos)
    barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

    // ChartData<'doughnut'>: igual pero para el gráfico de dona (servicios populares)
    doughnutData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

    // ── Opciones del gráfico de barras (ingresos por período) ───────────────
    // ChartConfiguration<'bar'>['options']: tipo TypeScript de las opciones de Chart.js.
    // Se configura aquí en vez de en la plantilla para mantener el HTML limpio.
    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true, // el gráfico se adapta al ancho del contenedor
        animation: { duration: 600, easing: 'easeInOutQuart' }, // animación suave al cargar
        plugins: {
            legend: { display: false }, // ocultamos la leyenda (solo hay una serie)
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y}€` } } // formato €
        },
        scales: {
            // Eje X: etiquetas de períodos (meses, días…)
            x: { ticks: { color: '#6B7280', font: { size: 11 } }, grid: { color: '#1F2937' } },
            // Eje Y: valores en euros; callback personalizado añade el símbolo €
            y: { ticks: { color: '#6B7280', font: { size: 11 }, callback: (v) => `${v}€` }, grid: { color: '#1F2937' } }
        }
    };

    // ── Opciones del gráfico donut (servicios más populares) ────────────────
    // cutout: '70%' → deja el 70 % del centro vacío, creando el efecto de dona
    doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        animation: { duration: 600 },
        cutout: '70%', // tamaño del hueco central del gráfico de dona
        plugins: {
            legend: {
                position: 'bottom', // leyenda bajo el gráfico con los nombres de servicios
                labels: { color: '#9CA3AF', padding: 16, font: { size: 11 }, boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle' }
            },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} reservas` } }
        }
    };

    // Al iniciar el componente cargamos las estadísticas del mes actual por defecto
    ngOnInit(): void {
        this.cargarDatos('mes');
    }

    // Obtiene los datos estadísticos del backend según el filtro y rango opcionales.
    // Cuando se termina de cargar llama a construirGraficos() para poblar los signals
    // de ChartData con los datos recibidos.
    //
    // Manejo de errores diferenciado:
    //   - Si es la carga inicial (cargando() === true) → error general
    //   - Si es un cambio de filtro → errorRango (se muestra junto al selector)
    private cargarDatos(filtro: string, fechaInicio?: string, fechaFin?: string): void {
        this.bookingService.getEstadisticas(filtro, fechaInicio, fechaFin).subscribe({
            next: (res) => {
                this.datos.set(res.data);          // KPIs y datos brutos del backend
                this.construirGraficos(res.data);  // transforma los datos en ChartData
                this.cargando.set(false);
                this.actualizando.set(false);
                this.cdr.detectChanges();
            },
            error: (err) => {
                const msg = err.error?.message || 'Error al cargar estadísticas';
                if (this.cargando()) {
                    this.error.set(msg);
                    this.cargando.set(false);
                } else {
                    // Error durante cambio de filtro: no borramos los datos actuales
                    this.errorRango.set(msg);
                    this.actualizando.set(false);
                }
            }
        });
    }

    // Cambia el filtro temporal activo y lanza una nueva carga de datos.
    // Oculta el panel de rango personalizado si estaba abierto.
    setFiltro(f: Filtro): void {
        this.filtro.set(f);
        this.mostrarRango.set(false);
        this.errorRango.set('');
        this.actualizando.set(true); // muestra el indicador de actualización parcial
        this.cargarDatos(f);
    }

    // Alterna la visibilidad del panel de rango personalizado.
    // Si se abre, activa el filtro 'rango' para que la cabecera lo indique.
    toggleRango(): void {
        this.mostrarRango.update(v => !v); // invierte el valor booleano del signal
        if (this.mostrarRango()) this.filtro.set('rango');
    }

    // Restablece el filtro de rango: limpia fechas, resetea el formulario
    // y vuelve al filtro por defecto 'mes'.
    limpiarRango(): void {
        this.rangoAplicado.set(false);
        this.fechasAplicadas.set(null);
        this.mostrarRango.set(false);
        this.errorRango.set('');
        this.rangoForm.reset(); // limpia los campos fechaInicio y fechaFin del formulario
        this.setFiltro('mes');
    }

    // Valida y aplica el rango de fechas personalizado.
    //
    // Validaciones:
    //   1. El formulario debe ser válido (ambas fechas rellenas).
    //   2. La fecha de inicio no puede ser posterior a la de fin.
    //
    // Si todo es correcto, guarda las fechas en el signal fechasAplicadas
    // y llama a cargarDatos con filtro='rango' y las fechas como parámetros.
    aplicarRango(): void {
        if (this.rangoForm.invalid) return; // formulario incompleto → salida temprana
        const { fechaInicio, fechaFin } = this.rangoForm.value;

        // Validación de coherencia: inicio no puede ser posterior a fin
        if (new Date(fechaInicio) > new Date(fechaFin)) {
            this.errorRango.set('La fecha de inicio no puede ser posterior a la fecha de fin');
            return;
        }
        this.errorRango.set('');
        this.actualizando.set(true);
        this.filtro.set('rango');
        this.rangoAplicado.set(true);
        // Guardamos las fechas aplicadas para mostrarlas en el botón (labelBotonRango)
        this.fechasAplicadas.set({ inicio: fechaInicio, fin: fechaFin });
        this.mostrarRango.set(false);
        this.cargarDatos('rango', fechaInicio, fechaFin);
    }

    // Getter que devuelve la fecha máxima seleccionable en los inputs de tipo date.
    // Evita que el admin seleccione una fecha futura como inicio o fin del rango.
    get maxFecha(): string {
        return new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    }

    // Formatea una fecha ISO (YYYY-MM-DD) en formato corto en español.
    // Ejemplo: '2025-01-15' → '15 ene'
    // Se añade 'T00:00:00' para evitar el desfase de zona horaria al parsear solo la fecha.
    formatearFechaCorta(dateStr: string): string {
        const fecha = new Date(dateStr + 'T00:00:00');
        return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    // Transforma los datos brutos del backend en los objetos ChartData<'bar'>
    // y ChartData<'doughnut'> que ng2-charts/Chart.js necesita para renderizar.
    //
    // Gráfico de barras (ingresos):
    //   - labels   → array de strings con los nombres de los períodos (meses, días…)
    //   - datasets → un único dataset con los totales en euros; el estilo dorado
    //                (#C9A84C) mantiene la identidad visual de Secret Barber.
    //
    // Gráfico donut (servicios populares):
    //   - labels   → nombres de los servicios
    //   - datasets → contadores de reservas; cada servicio tiene un color del array
    //                coloresFondo definido aquí para no saturar la plantilla HTML.
    private construirGraficos(data: any): void {
        // ── Gráfico de barras: ingresos por período ─────────────────────────
        this.barChartData.set({
            labels: data.ingresosPorPeriodo.map((m: any) => m.label), // eje X
            datasets: [{
                data:                data.ingresosPorPeriodo.map((m: any) => m.total), // eje Y (€)
                backgroundColor:     'rgba(201, 168, 76, 0.15)', // fondo semitransparente dorado
                borderColor:         '#C9A84C',                  // borde dorado (color brand)
                borderWidth:         2,
                borderRadius:        8,                          // esquinas redondeadas en las barras
                borderSkipped:       false,                      // aplica el borde también en la base
                hoverBackgroundColor:'rgba(201, 168, 76, 0.4)',  // fondo más opaco al pasar el ratón
            }]
        });

        // Paleta de colores para el gráfico donut; se asignan en orden a cada servicio
        const coloresFondo = [
            'rgba(99,  102, 241, 0.85)', // índigo
            'rgba(236, 72,  153, 0.85)', // rosa
            'rgba(20,  184, 166, 0.85)', // verde azulado
            'rgba(245, 158, 11,  0.85)', // ámbar
            'rgba(139, 92,  246, 0.85)', // violeta
        ];

        // ── Gráfico donut: ranking de servicios ─────────────────────────────
        this.doughnutData.set({
            labels:   data.serviciosRanking.map((s: any) => s.nombre), // nombres de servicios
            datasets: [{
                data:            data.serviciosRanking.map((s: any) => s.count), // nº de reservas
                backgroundColor: coloresFondo,  // cada sector recibe un color de la paleta
                borderColor:     '#0F172A',     // borde oscuro entre sectores (separa visualmente)
                borderWidth:     3,
                hoverOffset:     12,            // los sectores se separan 12px al pasar el ratón
                hoverBorderColor:'#1E293B',
            }]
        });
    }
}
