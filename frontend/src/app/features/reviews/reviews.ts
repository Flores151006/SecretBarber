// ─────────────────────────────────────────────────────────────────────────────
// reviews.ts
//
// Componente de la página pública de reseñas de Secret Barber.
// Muestra todas las reseñas visibles/aprobadas, la puntuación media general
// y el tiempo relativo de cada reseña (p.ej. "hace 3 días").
//
// Puntos clave:
//  - inject() inyecta ReviewService y ChangeDetectorRef sin constructor.
//  - ngOnInit carga las reseñas del backend mediante un Observable.
//    El backend las devuelve ya ordenadas por fecha descendente (más recientes primero).
//  - mediaTotal: getter que calcula la media aritmética de puntuaciones.
//    Math.round(...* 10) / 10 redondea a 1 decimal (ej: 4.666... → 4.7).
//  - mediaTotalRedondeada: redondea al entero más cercano para pintar las
//    estrellas llenas en la plantilla.
//  - esReciente: comprueba si una reseña tiene menos de 7 días, útil para
//    mostrar un badge "Nueva" o similar en la vista.
//  - tiempoRelativo: convierte una fecha a texto legible calculando la
//    diferencia con Date.now() en milisegundos y convirtiéndola a la unidad
//    más apropiada (minutos → horas → días → meses → años).
//  - stars = [1,2,3,4,5]: array usado en la plantilla con *ngFor para
//    generar las 5 estrellas de puntuación.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';
import { ReviewService }   from '../../core/services/review.service';
import { Review }          from '../../shared/models/review.model';

@Component({
    selector: 'app-reviews',
    standalone: true,
    imports: [CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './reviews.html'
})
export class ReviewsComponent implements OnInit {
    // inject() — forma moderna de inyectar dependencias (Angular 14+)
    private reviewService = inject(ReviewService);
    private cdr           = inject(ChangeDetectorRef);

    reviews: Review[] = []; // array que se rellena tras la llamada al backend
    cargando = true;         // muestra un spinner mientras se cargan los datos
    error    = '';           // mensaje de error si falla la petición HTTP
    stars    = [1, 2, 3, 4, 5]; // array auxiliar para renderizar 5 estrellas con *ngFor

    // ngOnInit se ejecuta una sola vez cuando Angular crea el componente.
    // Llama al backend para obtener las reseñas visibles.
    // .subscribe({ next, error }) consume el Observable de getReviews():
    //   - next: recibe los datos cuando la petición HTTP tiene éxito
    //   - error: recibe el error si la petición falla (ej: red caída, 500)
    ngOnInit(): void {
        this.reviewService.getReviews().subscribe({
            next: (res) => {
                // El backend ya devuelve las reseñas ordenadas por createdAt desc
                this.reviews  = res.data;
                this.cargando = false;
                this.cdr.detectChanges(); // fuerza re-renderizado tras recibir los datos
            },
            error: (err) => {
                this.error    = err.error?.message || 'Error al cargar las reseñas';
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Getter: calcula la media de puntuaciones de todas las reseñas.
    // Si no hay reseñas, devuelve 0 para evitar división por cero.
    // reduce() acumula la suma de puntuaciones (acc = acumulador, r = reseña actual).
    // El truco * 10 / 10 redondea a exactamente 1 decimal: 4.666 → 4.7
    get mediaTotal(): number {
        if (!this.reviews.length) return 0;
        const suma = this.reviews.reduce((acc, r) => acc + r.puntuacion, 0);
        return Math.round((suma / this.reviews.length) * 10) / 10;
    }

    // Getter: versión entera de la media, para saber cuántas estrellas llenas pintar
    get mediaTotalRedondeada(): number {
        return Math.round(this.mediaTotal);
    }

    // Devuelve true si la reseña fue creada hace 7 días o menos.
    // Date.now() devuelve el timestamp actual en milisegundos.
    // Se divide entre (1000 * 60 * 60 * 24) para convertir ms a días.
    esReciente(fechaStr: string | Date): boolean {
        const fecha = new Date(fechaStr);
        const diasDiferencia = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
        return diasDiferencia <= 7;
    }

    // Convierte una fecha a texto relativo legible (ej: "hace 2 días").
    // Calcula la diferencia con el momento actual y elige la unidad más grande
    // que sea entera: primero minutos, luego horas, días, meses y años.
    // El operador ternario (cond ? val1 : val2) elige singular o plural.
    tiempoRelativo(fechaStr: string | Date): string {
        const fecha = new Date(fechaStr);
        const ahora = Date.now();
        const diff  = ahora - fecha.getTime(); // diferencia en milisegundos
        const mins  = Math.floor(diff / 60000);         // ms → minutos
        const horas = Math.floor(mins / 60);            // minutos → horas
        const dias  = Math.floor(horas / 24);           // horas → días
        const meses = Math.floor(dias / 30);            // días → meses (aprox.)
        const anios = Math.floor(dias / 365);           // días → años (aprox.)

        if (mins < 60)  return `hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
        if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
        if (dias < 30)  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
        if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        return `hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
    }
}
