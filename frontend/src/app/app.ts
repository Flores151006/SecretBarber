// ─────────────────────────────────────────────────────────────────────────────
// app.ts
//
// Componente raíz de la aplicación. Es el "contenedor" principal que envuelve
// toda la UI. Contiene la barra de navegación (Navbar), el <router-outlet>
// donde Angular renderiza la página activa según la ruta, y el footer.
//
// DECISIÓN DE DISEÑO:
// - Es un "standalone component" (standalone: true), lo que significa que
//   no necesita estar declarado en ningún NgModule; se autogestiona.
// - Se inyecta ThemeService en el constructor para que el servicio de tema
//   se instancie desde el primer momento y aplique la clase CSS correcta
//   (dark/light) sobre el <html> antes de que el usuario vea nada.
// - Los iconos de redes sociales del footer se declaran en viewProviders para
//   que solo estén disponibles en este componente (no globalmente).
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapInstagram, bootstrapTiktok, bootstrapWhatsapp } from '@ng-icons/bootstrap-icons';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';

@Component({
    selector: 'app-root',   // etiqueta HTML que representa este componente: <app-root>
    standalone: true,       // no necesita NgModule; Angular 17+ recomienda este enfoque
    imports: [
        RouterOutlet,       // muestra el componente correspondiente a la ruta activa
        RouterLink,         // directiva para navegar entre rutas con [routerLink]
        NavbarComponent,    // barra de navegación superior
        NgIcon,             // componente para mostrar iconos de @ng-icons
        TranslateModule     // pipes y directivas de internacionalización (| translate)
    ],
    // viewProviders: registra iconos SOLO para este componente y su plantilla.
    // Es diferente de provideIcons() en app.config (que es global).
    // Aquí se limita el scope para no inflar el registro global con iconos
    // que solo usa el footer de este componente.
    viewProviders: [provideIcons({ bootstrapInstagram, bootstrapTiktok, bootstrapWhatsapp })],
    templateUrl: './app.html'
})
export class AppComponent {
    // inject() es la forma moderna de inyectar dependencias en Angular 14+.
    // Es equivalente a poner private _theme: ThemeService en el constructor,
    // pero más conciso. La variable con _ indica que es de uso interno.
    // Se inyecta aquí para que el ThemeService arranque junto con el componente
    // raíz y aplique el tema guardado en localStorage desde el primer render.
    private _theme = inject(ThemeService);

    // Se calcula una sola vez al crear el componente para mostrar el año
    // actual en el copyright del footer sin hardcodearlo.
    currentYear = new Date().getFullYear();
}
