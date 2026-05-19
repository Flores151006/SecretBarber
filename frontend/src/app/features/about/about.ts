// ─────────────────────────────────────────────────────────────────────────────
// about.ts
//
// Componente de la página "Sobre nosotros" / "Acerca de" de Secret Barber.
// Es una página completamente estática: no realiza peticiones al backend
// ni tiene lógica de negocio.
//
// Toda la información del proyecto (descripción, tecnologías usadas,
// integrantes del equipo, contexto del TFG) se define directamente en
// la plantilla HTML (about.html) usando claves de traducción de ngx-translate.
//
// Imports del componente:
//   - CommonModule: directivas básicas de Angular como *ngIf, *ngFor, [ngClass]
//   - TranslateModule: directiva | translate para las claves de traducción
//   - NgIconComponent: iconos de la librería @ng-icons/lucide
//
// Al no necesitar lógica, la clase del componente está vacía.
// Este patrón es habitual en páginas de contenido puramente informativo.
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './about.html'
})
export class AboutComponent {}
