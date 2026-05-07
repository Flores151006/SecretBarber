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
    private reviewService = inject(ReviewService);
    languageService       = inject(LanguageService);

    resenas = signal<Review[]>([]);

    servicios = [
        { nombre: 'Corte',                       nombreEn: 'Haircut',             precio: 8,  icono: 'lucideScissors', descripcion: 'Corte clásico o moderno a tu estilo',    descripcionEn: 'Classic or modern cut to your style' },
        { nombre: 'Corte y barba',               nombreEn: 'Haircut & beard',     precio: 10, icono: 'lucideScissors', descripcion: 'Pack completo con descuento',             descripcionEn: 'Complete pack with discount' },
        { nombre: 'Mechas',                      nombreEn: 'Highlights',          precio: 15, icono: 'lucideWand2',    descripcion: 'Mechas con color a elegir',               descripcionEn: 'Highlights with color of your choice' },
        { nombre: 'Mechas blancas',              nombreEn: 'White highlights',    precio: 20, icono: 'lucideWand2',    descripcion: 'Mechas blancas con color a elegir',       descripcionEn: 'White highlights with color of your choice' },
        { nombre: 'Tinte blanco entero',         nombreEn: 'Full bleach',         precio: 50, icono: 'lucideSparkles', descripcion: 'Decoloración total del cabello',          descripcionEn: 'Full hair bleaching' },
        { nombre: 'Tinte blanco entero + color', nombreEn: 'Full bleach + color', precio: 55, icono: 'lucideSparkles', descripcion: 'Decoloración total con color a elegir',   descripcionEn: 'Full bleach with color of your choice' },
        { nombre: 'Cejas',                       nombreEn: 'Eyebrows',            precio: 1,  icono: 'lucideUser',     descripcion: 'Perfilado y arreglo de cejas',            descripcionEn: 'Eyebrow shaping and grooming' },
    ];

    ngOnInit(): void {
        this.reviewService.getReviews().subscribe({
            next: (res) => {
                const top3 = res.data
                    .sort((a, b) => b.puntuacion - a.puntuacion)
                    .slice(0, 3);
                this.resenas.set(top3);
            }
        });
    }

    getNombreCliente(resena: Review): string {
        const cliente = resena.cliente as any;
        return cliente?.name || 'Cliente';
    }
}