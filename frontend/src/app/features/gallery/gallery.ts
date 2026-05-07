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
    categoriaActiva = 'todos';

    categorias = [
        { id: 'todos',  nombre: 'GALERIA.CAT_TODOS'  },
        { id: 'cortes', nombre: 'GALERIA.CAT_CORTES' },
        { id: 'mechas', nombre: 'GALERIA.CAT_MECHAS' },
        { id: 'tintes', nombre: 'GALERIA.CAT_TINTES' }
    ];

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

    get trabajosFiltrados() {
        if (this.categoriaActiva === 'todos') return this.trabajos;
        return this.trabajos.filter(t => t.categoria === this.categoriaActiva);
    }
}