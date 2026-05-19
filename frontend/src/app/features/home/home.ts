// ─────────────────────────────────────────────────────────────────────────────
// home.ts
//
// Componente de la página principal (landing page) de Secret Barber.
// Presenta la barbería al usuario con secciones de servicios, galería y
// las 3 mejores reseñas de clientes.
//
// Puntos técnicos:
//  - inject() inyecta los servicios sin constructor.
//  - signal<Review[]>([]) crea un Signal reactivo que empieza como array vacío.
//    Cuando se llama a resenas.set(top3), Angular actualiza automáticamente
//    las partes de la plantilla que leen este signal.
//  - ReviewService se usa aquí (en lugar de un hipotético HomeService) porque
//    las reseñas son el único dato dinámico de esta página. Los servicios
//    están definidos de forma estática en el componente.
//  - ngOnInit carga las reseñas del backend, las ordena por puntuación
//    descendente y toma solo las 3 mejores para mostrar en el home.
//  - El array 'servicios' está definido de forma estática con precio, icono
//    y descripción tanto en español como en inglés (para el modo multiidioma).
//  - getNombreCliente: extrae el nombre del cliente de una reseña.
//    resena.cliente puede ser un objeto populado { name } o solo un ID string.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink }        from '@angular/router';
import { CommonModule }      from '@angular/common';
import { TranslateModule }   from '@ngx-translate/core';
import { NgIconComponent }   from '@ng-icons/core';
import { ReviewService }     from '../../core/services/review.service';
import { LanguageService }   from '../../core/services/languaje.service';
import { Review }            from '../../shared/models/review.model';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
    // inject() — inyección de dependencias sin constructor (Angular 14+)
    private reviewService = inject(ReviewService);
    languageService       = inject(LanguageService); // público para usarlo en la plantilla

    // Signal reactivo con las 3 mejores reseñas.
    // signal<Review[]>([]) inicializa con un array vacío.
    // Al llamar a resenas.set(top3) en ngOnInit, la plantilla se actualiza automáticamente.
    resenas = signal<Review[]>([]);

    // Array estático de servicios con sus precios, iconos y descripciones bilingues.
    // Se usa para la sección de precios/servicios de la landing page.
    // 'icono' es el nombre del icono de la librería @ng-icons (lucide).
    servicios = [
        { nombre: 'Corte',                       nombreEn: 'Haircut',             precio: 8,  icono: 'lucideScissors', descripcion: 'Corte clásico o moderno a tu estilo',    descripcionEn: 'Classic or modern cut to your style' },
        { nombre: 'Corte y barba',               nombreEn: 'Haircut & beard',     precio: 10, icono: 'lucideScissors', descripcion: 'Pack completo con descuento',             descripcionEn: 'Complete pack with discount' },
        { nombre: 'Mechas',                      nombreEn: 'Highlights',          precio: 15, icono: 'lucideWand2',    descripcion: 'Mechas con color a elegir',               descripcionEn: 'Highlights with color of your choice' },
        { nombre: 'Mechas blancas',              nombreEn: 'White highlights',    precio: 20, icono: 'lucideWand2',    descripcion: 'Mechas blancas con color a elegir',       descripcionEn: 'White highlights with color of your choice' },
        { nombre: 'Tinte blanco entero',         nombreEn: 'Full bleach',         precio: 50, icono: 'lucideSparkles', descripcion: 'Decoloración total del cabello',          descripcionEn: 'Full hair bleaching' },
        { nombre: 'Tinte blanco entero + color', nombreEn: 'Full bleach + color', precio: 55, icono: 'lucideSparkles', descripcion: 'Decoloración total con color a elegir',   descripcionEn: 'Full bleach with color of your choice' },
        { nombre: 'Cejas',                       nombreEn: 'Eyebrows',            precio: 1,  icono: 'lucideUser',     descripcion: 'Perfilado y arreglo de cejas',            descripcionEn: 'Eyebrow shaping and grooming' },
    ];

    // ngOnInit carga las reseñas del backend al iniciar el componente.
    // .sort() ordena el array por puntuación de mayor a menor (b - a = descendente).
    // .slice(0, 3) toma solo los 3 primeros elementos (las 3 mejores valoradas).
    // resenas.set(top3) actualiza el signal para que la plantilla se re-renderice.
    ngOnInit(): void {
        this.reviewService.getReviews().subscribe({
            next: (res) => {
                const top3 = res.data
                    .sort((a, b) => b.puntuacion - a.puntuacion) // ordena de mayor a menor puntuación
                    .slice(0, 3); // toma solo las 3 mejores
                this.resenas.set(top3); // actualiza el signal → Angular re-renderiza la sección
            }
        });
    }

    // Extrae el nombre del cliente de una reseña de forma segura.
    // resena.cliente puede venir populado como objeto { name: '...' }
    // o como un ID de MongoDB (string). En ese caso, se muestra 'Cliente'.
    getNombreCliente(resena: Review): string {
        const cliente = resena.cliente as any;
        return cliente?.name || 'Cliente';
    }
}
