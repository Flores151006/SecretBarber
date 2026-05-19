// ─────────────────────────────────────────────────────────────────────────────
// admin-layout.ts
//
// Layout principal (shell) del panel de administración de Secret Barber.
//
// Responsabilidades:
//   - Actúa como contenedor raíz para todas las rutas hijas del área /admin.
//   - Renderiza el sidebar lateral de navegación permanente.
//   - Inyecta AuthService para mostrar el nombre/avatar del usuario conectado.
//   - Gestiona el estado del sidebar en móvil (abierto/cerrado).
//
// Conceptos clave:
//   - RouterOutlet: punto de inserción donde Angular renderiza la ruta hija
//     activa (reservas, usuarios, reseñas, estadísticas…).
//   - RouterLinkActive: añade automáticamente una clase CSS al enlace cuya
//     ruta coincide con la URL actual, resaltando la sección activa en el sidebar.
//   - inject(): función de Angular 14+ que obtiene una dependencia desde el
//     contexto de inyección sin necesidad de declararla en el constructor.
//   - standalone: true → el componente no pertenece a ningún NgModule;
//     importa directamente las directivas que necesita.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject }              from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService }                   from '../../../core/services/auth.service';
import { NgIconComponent }               from '@ng-icons/core';
import { TranslateModule }               from '@ngx-translate/core';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    // Importamos las directivas de routing y los módulos de UI necesarios
    imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIconComponent, TranslateModule],
    templateUrl: './admin-layout.html'
})
export class AdminLayoutComponent {

    // inject(AuthService) obtiene el servicio de autenticación.
    // Lo usamos en la plantilla para mostrar el nombre y el rol
    // del administrador conectado en la cabecera del sidebar.
    authService = inject(AuthService);

    // Controla si el sidebar está desplegado en pantallas pequeñas (responsive).
    // En escritorio el sidebar siempre es visible; en móvil se alterna con este flag.
    sidebarAbierto = false;



}
