// ─────────────────────────────────────────────────────────────────────────────
// gallery.ts
//
// Componente de galería de trabajos de Secret Barber.
// Muestra una cuadrícula de fotos filtrable por categoría:
//   · todos  → muestra todas las fotos
//   · cortes → solo fotos de cortes de pelo
//   · mechas → solo fotos de mechas
//   · tintes → solo fotos de tintes
//
// Puntos técnicos:
//  - categoriaActiva: propiedad de clase simple (no signal) que guarda
//    la categoría seleccionada actualmente. Como el componente no necesita
//    detección de cambios especial, una propiedad normal es suficiente.
//  - categorias: array de objetos { id, nombre } donde 'nombre' es una clave
//    de traducción (GALERIA.CAT_TODOS, etc.) para soporte multiidioma.
//  - trabajos: array estático con todas las fotos de la galería.
//    Cada objeto tiene id, categoria, titulo, descripcion e imagen (ruta relativa a /assets).
//  - trabajosFiltrados: getter (propiedad calculada) que filtra el array
//    'trabajos' según la categoría activa.
//    Al ser un getter, Angular lo recalcula automáticamente cada vez que la
//    plantilla lo lee. Si categoriaActiva es 'todos', devuelve todo el array.
//    De lo contrario, usa .filter() para devolver solo los que coincidan.
//  - En la plantilla HTML se itera sobre 'trabajosFiltrados' con *ngFor.
//    Al hacer clic en un botón de categoría, se actualiza 'categoriaActiva'
//    y Angular re-evalúa el getter automáticamente.
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-gallery',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './gallery.html'
})
export class GalleryComponent {
    // Categoría actualmente seleccionada en el filtro. Valor inicial: 'todos'
    categoriaActiva = 'todos';

    // Array de categorías para los botones del filtro.
    // 'nombre' es una clave de traducción (ngx-translate) → GALERIA.CAT_TODOS se traduce en runtime
    categorias = [
        { id: 'todos',  nombre: 'GALERIA.CAT_TODOS'  },
        { id: 'cortes', nombre: 'GALERIA.CAT_CORTES' },
        { id: 'mechas', nombre: 'GALERIA.CAT_MECHAS' },
        { id: 'tintes', nombre: 'GALERIA.CAT_TINTES' }
    ];

    // Array estático con todas las fotos de la galería.
    // 'imagen' contiene la ruta relativa al directorio /assets (configurado en angular.json).
    // Este array se podría cargar desde el backend, pero al ser contenido
    // estático se define aquí para simplificar.
   trabajos = [
    { id: 1,  categoria: 'cortes', titulo: 'Corte 1', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte1.jpeg' },
    { id: 2,  categoria: 'cortes', titulo: 'Corte 2', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte2.jpeg' },
    { id: 3,  categoria: 'cortes', titulo: 'Corte 3', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte3.jpeg' },
    { id: 4,  categoria: 'cortes', titulo: 'Corte 4', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte4.jpeg' },
    { id: 5,  categoria: 'cortes', titulo: 'Corte 5', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte5.jpeg' },
    { id: 6,  categoria: 'cortes', titulo: 'Corte 6', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte6.jpeg' },
    { id: 7,  categoria: 'cortes', titulo: 'Corte 7', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte7.jpeg' },
    { id: 8,  categoria: 'cortes', titulo: 'Corte 8', descripcion: 'Corte clásico o moderno a tu estilo', imagen: 'gallery/Corte8.jpeg' },
    { id: 9,  categoria: 'mechas', titulo: 'Mechas 1', descripcion: 'Mechas con color a elegir', imagen: 'gallery/Mechas1.jpeg' },
    { id: 10, categoria: 'mechas', titulo: 'Mechas 2', descripcion: 'Mechas con color a elegir', imagen: 'gallery/Mechas2.jpeg' },
    { id: 11, categoria: 'mechas', titulo: 'Mechas 3', descripcion: 'Mechas con color a elegir', imagen: 'gallery/Mechas3.jpeg' },
    { id: 12, categoria: 'mechas', titulo: 'Mechas 4', descripcion: 'Mechas con color a elegir', imagen: 'gallery/Mechas4.jpeg' },
    { id: 13, categoria: 'mechas', titulo: 'Mechas 5', descripcion: 'Mechas con color a elegir', imagen: 'gallery/Mechas5.jpeg' },
    { id: 14, categoria: 'tintes', titulo: 'Tinte 1',  descripcion: 'Tinte completo a elegir',  imagen: 'gallery/Tinte1.jpeg' },
    { id: 15, categoria: 'tintes', titulo: 'Tinte 2',  descripcion: 'Tinte completo a elegir',  imagen: 'gallery/Tinte2.jpeg' },
    { id: 16, categoria: 'tintes', titulo: 'Tinte 3',  descripcion: 'Tinte completo a elegir',  imagen: 'gallery/Tinte3.jpeg' },
    { id: 17, categoria: 'tintes', titulo: 'Tinte 4',  descripcion: 'Tinte completo a elegir',  imagen: 'gallery/Tinte4.jpeg' },
];

    // Getter (propiedad calculada): devuelve el subconjunto de trabajos a mostrar.
    // Se recalcula cada vez que Angular renderiza la plantilla.
    // Si la categoría es 'todos', devuelve el array completo sin filtrar.
    // En caso contrario, usa .filter() para seleccionar solo los que coincidan
    // con la categoría activa (comparación exacta de strings).
    get trabajosFiltrados() {
        if (this.categoriaActiva === 'todos') return this.trabajos;
        return this.trabajos.filter(t => t.categoria === this.categoriaActiva);
    }
}
