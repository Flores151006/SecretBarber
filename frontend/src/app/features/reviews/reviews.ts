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
    private reviewService = inject(ReviewService);
    private cdr           = inject(ChangeDetectorRef);

    reviews: Review[] = [];
    cargando = true;
    error    = '';
    stars    = [1, 2, 3, 4, 5];

    ngOnInit(): void {
        this.reviewService.getReviews().subscribe({
            next: (res) => {
                // El backend ya devuelve las reseñas ordenadas por createdAt desc
                this.reviews  = res.data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error    = err.error?.message || 'Error al cargar las reseñas';
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    get mediaTotal(): number {
        if (!this.reviews.length) return 0;
        const suma = this.reviews.reduce((acc, r) => acc + r.puntuacion, 0);
        return Math.round((suma / this.reviews.length) * 10) / 10;
    }

    get mediaTotalRedondeada(): number {
        return Math.round(this.mediaTotal);
    }

    esReciente(fechaStr: string | Date): boolean {
        const fecha = new Date(fechaStr);
        const diasDiferencia = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
        return diasDiferencia <= 7;
    }

    tiempoRelativo(fechaStr: string | Date): string {
        const fecha = new Date(fechaStr);
        const ahora = Date.now();
        const diff  = ahora - fecha.getTime();
        const mins  = Math.floor(diff / 60000);
        const horas = Math.floor(mins / 60);
        const dias  = Math.floor(horas / 24);
        const meses = Math.floor(dias / 30);
        const anios = Math.floor(dias / 365);

        if (mins < 60)  return `hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
        if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
        if (dias < 30)  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
        if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        return `hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
    }
}