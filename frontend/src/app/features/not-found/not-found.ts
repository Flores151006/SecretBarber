// ─────────────────────────────────────────────────────────────────────────────
// not-found.ts
//
// Componente de error 404 de Secret Barber.
// Se muestra cuando el usuario navega a una ruta que no existe en el router.
//
// Angular Router muestra este componente gracias a la ruta comodín definida
// en el archivo de rutas (app.routes.ts):
//   { path: '**', component: NotFoundComponent }
// El '**' captura cualquier URL que no haya coincidido con ninguna ruta anterior.
//
// El componente es completamente estático: no necesita lógica TypeScript.
// La plantilla HTML (not-found.html) muestra:
//   - Un código de error visual "404"
//   - Un mensaje descriptivo (traducido con ngx-translate)
//   - Un botón/enlace con routerLink="/" para volver a la página principal
//
// routerLink: directiva de Angular que genera un enlace de navegación dentro
// del SPA (Single Page Application) sin recargar la página completa.
// Es equivalente a llamar a router.navigate(['/']) pero declarativo en HTML.
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from '@angular/core';
import { RouterLink }      from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink, TranslateModule, NgIconComponent],
    templateUrl: './not-found.html'
})
export class NotFoundComponent {}
