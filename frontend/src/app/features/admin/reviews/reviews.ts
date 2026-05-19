// ─────────────────────────────────────────────────────────────────────────────
// reviews.ts
//
// Componente de gestión de reseñas del panel de administración.
//
// Responsabilidades:
//   - Cargar todas las reseñas del sistema (visibles y ocultas) desde el backend.
//   - Filtrar reseñas por número de estrellas (1–5) o mostrar todas (0 = sin filtro).
//   - Alternar la visibilidad de una reseña (mostrar en la web pública / ocultar).
//   - Eliminar una reseña de forma permanente con confirmación SweetAlert2.
//
// Conceptos clave:
//   - signal<Review[]>(): array reactivo. Al modificarlo con .set() o .update()
//     Angular recalcula reviewsFiltradas automáticamente.
//   - computed(): signal derivado de solo lectura. reviewsFiltradas se actualiza
//     cada vez que cambian reviews() o filtroEstrellas() sin ningún código extra.
//   - toggleVisibilidad: usa spread operator { ...r, visible: !r.visible } para
//     crear un objeto nuevo (inmutable) con la visibilidad invertida, en lugar
//     de mutar el objeto original. Esto garantiza que Angular detecte el cambio.
//   - eliminarReview: usa .filter() para excluir la reseña eliminada del array,
//     actualizando el signal sin recargar datos del servidor.
//   - Swal.fire(): modal de SweetAlert2 que devuelve una Promise con result.isConfirmed.
// ─────────────────────────────────────────────────────────────────────────────

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

    // Servicios inyectados:
    //   reviewService → operaciones CRUD sobre reseñas
    //   translate     → textos i18n con ngx-translate
    //   cdr           → forzar detección de cambios en callbacks async
    private reviewService = inject(ReviewService);
    private translate     = inject(TranslateService);
    private cdr           = inject(ChangeDetectorRef);

    // signal<Review[]>: lista reactiva de todas las reseñas cargadas del backend.
    reviews         = signal<Review[]>([]);

    cargando        = true;
    error           = '';

    // Filtro por estrellas: 0 = mostrar todas; 1–5 = mostrar solo esa puntuación.
    // Al ser un signal, computed() se recalcula al instante cuando cambia.
    filtroEstrellas = signal(0);

    // computed() derivado: devuelve el subconjunto de reseñas que pasan el filtro.
    // Si filtroEstrellas() === 0 no se aplica ningún filtro (devuelve todo).
    // En caso contrario, filtra las que tienen exactamente esa puntuación.
    reviewsFiltradas = computed(() => {
        if (this.filtroEstrellas() === 0) return this.reviews();
        return this.reviews().filter(r => r.puntuacion === this.filtroEstrellas());
    });

    ngOnInit(): void {
        this.cargarReviews();
    }

    // Obtiene todas las reseñas desde el endpoint de administración,
    // que incluye tanto las visibles como las ocultas.
    cargarReviews(): void {
        this.reviewService.getReviewsAdmin().subscribe({
            next: (res) => {
                // .set() reemplaza el signal; computed() se recalcula automáticamente
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

    // Cambia la visibilidad de una reseña (pública ↔ oculta).
    //
    // El texto del diálogo Swal es dinámico:
    //   - review.visible === true  → "¿Ocultar esta reseña?"
    //   - review.visible === false → "¿Mostrar esta reseña?"
    //
    // Tras confirmar, llama al backend para persistir el cambio.
    // En el éxito actualiza el signal con .update() y spread operator:
    //   { ...r, visible: !r.visible } crea un nuevo objeto con todos los campos
    //   del original pero con la propiedad 'visible' invertida.
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
            // Si el usuario cierra el modal sin confirmar, salimos sin hacer nada
            if (!result.isConfirmed) return;
            this.reviewService.toggleVisibilidad(review._id).subscribe({
                next: () => {
                    // .map() recorre la lista; al encontrar la reseña modificada
                    // devuelve un nuevo objeto con spread y visible invertido.
                    this.reviews.update(lista => lista.map(r => r._id === review._id ? { ...r, visible: !r.visible } : r));
                    // Nota: el título del éxito también es dinámico (mismo truco con ternario)
                    Swal.fire({ icon: 'success', title: t(!review.visible ? 'ADMIN.RESENAS.SWAL_VISIBLE' : 'ADMIN.RESENAS.SWAL_OCULTA_OK'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Elimina permanentemente una reseña tras confirmación del administrador.
    // Tras el éxito usa .filter() para excluir la reseña del signal,
    // evitando una petición de recarga al servidor.
    eliminarReview(id: string): void {
        const t = (k: string) => this.translate.instant(k);
        Swal.fire({
            title: t('ADMIN.RESENAS.SWAL_ELIMINAR'), text: t('ADMIN.RESENAS.SWAL_ELIMINAR_TEXTO'),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('ADMIN.RESENAS.SWAL_SI_ELIMINAR'), cancelButtonText: t('COMUN.CANCELAR'),
            // Botón rojo para indicar acción destructiva e irreversible
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.reviewService.eliminarReview(id).subscribe({
                next: () => {
                    // .filter() devuelve un nuevo array sin la reseña eliminada.
                    // El signal detecta el cambio y computed() se recalcula.
                    this.reviews.update(lista => lista.filter(r => r._id !== id));
                    Swal.fire({ icon: 'success', title: t('ADMIN.RESENAS.SWAL_ELIMINADA'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Genera la representación visual de la puntuación en estrellas.
    // '★'.repeat(n) crea n estrellas rellenas; '☆'.repeat(5-n) crea el resto vacías.
    // Ejemplo: puntuacion=3 → '★★★☆☆'
    estrellas(puntuacion: number): string {
        return '★'.repeat(puntuacion) + '☆'.repeat(5 - puntuacion);
    }
}
