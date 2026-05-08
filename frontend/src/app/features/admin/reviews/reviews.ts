import { Component, inject, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReviewService } from '../../../core/services/review.service';
import { Review }        from '../../../shared/models/review.model';
import Swal              from 'sweetalert2';

@Component({
    selector: 'app-admin-reviews',
    standalone: true,
    imports: [CommonModule, NgIconComponent, TranslateModule],
    templateUrl: './reviews.html'
})
export class AdminReviewsComponent implements OnInit {

    private reviewService = inject(ReviewService);
    private translate     = inject(TranslateService);
    private cdr           = inject(ChangeDetectorRef);

    reviews         = signal<Review[]>([]);
    cargando        = true;
    error           = '';
    filtroEstrellas = signal(0);

    reviewsFiltradas = computed(() => {
        if (this.filtroEstrellas() === 0) return this.reviews();
        return this.reviews().filter(r => r.puntuacion === this.filtroEstrellas());
    });

    ngOnInit(): void {
        this.cargarReviews();
    }

    cargarReviews(): void {
        this.reviewService.getReviewsAdmin().subscribe({
            next: (res) => {
                this.reviews.set(res.data);
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error    = err.error?.message || 'Error al cargar reseñas';
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    toggleVisibilidad(review: Review): void {
        const t = (k: string) => this.translate.instant(k);
        Swal.fire({
            title: t(review.visible ? 'ADMIN.RESENAS.SWAL_OCULTAR' : 'ADMIN.RESENAS.SWAL_MOSTRAR'),
            text:  t(review.visible ? 'ADMIN.RESENAS.SWAL_OCULTAR_TEXTO' : 'ADMIN.RESENAS.SWAL_MOSTRAR_TEXTO'),
            icon: 'question', showCancelButton: true,
            confirmButtonText: t(review.visible ? 'ADMIN.RESENAS.SWAL_SI_OCULTAR' : 'ADMIN.RESENAS.SWAL_SI_MOSTRAR'),
            cancelButtonText: t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.reviewService.toggleVisibilidad(review._id).subscribe({
                next: () => {
                    this.reviews.update(lista => lista.map(r => r._id === review._id ? { ...r, visible: !r.visible } : r));
                    Swal.fire({ icon: 'success', title: t(!review.visible ? 'ADMIN.RESENAS.SWAL_VISIBLE' : 'ADMIN.RESENAS.SWAL_OCULTA_OK'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    eliminarReview(id: string): void {
        const t = (k: string) => this.translate.instant(k);
        Swal.fire({
            title: t('ADMIN.RESENAS.SWAL_ELIMINAR'), text: t('ADMIN.RESENAS.SWAL_ELIMINAR_TEXTO'),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('ADMIN.RESENAS.SWAL_SI_ELIMINAR'), cancelButtonText: t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.reviewService.eliminarReview(id).subscribe({
                next: () => {
                    this.reviews.update(lista => lista.filter(r => r._id !== id));
                    Swal.fire({ icon: 'success', title: t('ADMIN.RESENAS.SWAL_ELIMINADA'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    estrellas(puntuacion: number): string {
        return '★'.repeat(puntuacion) + '☆'.repeat(5 - puntuacion);
    }
}