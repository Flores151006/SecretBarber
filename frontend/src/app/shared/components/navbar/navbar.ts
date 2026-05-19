// ─────────────────────────────────────────────────────────────────────────────
// navbar.ts
//
// Componente de la barra de navegación — aparece en todas las páginas de la app.
//
// Responsabilidades:
//   - Mostrar enlaces de navegación adaptados al rol del usuario
//   - Mostrar el avatar y nombre del usuario logueado (o botones de login/registro)
//   - Toggle del menú hamburguesa en móvil
//   - Botón para cambiar tema (oscuro/claro) visible siempre
//   - Botón de idioma (ES/EN)
//
// Problema resuelto en este componente:
//   El avatar no aparecía en el navbar hasta visitar la página de Settings.
//   Causa: ngOnInit() se ejecuta al crear el componente (antes del login).
//   Si el usuario ya estaba logueado al recargar la página, ngOnInit veía un
//   usuario pero no llamaba a getPerfil() por la lógica de inicialización.
//   Solución: usar effect() que se re-ejecuta cada vez que currentUser() cambia,
//   incluso si el cambio ocurre DESPUÉS de que el navbar se crea (ej: tras hacer login).
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, OnInit, effect, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }     from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/languaje.service';
import { ThemeService }    from '../../../core/services/theme.service';
import { UserService }     from '../../../core/services/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule }    from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-navbar',
    standalone: true, // Componente independiente — no necesita estar declarado en un módulo
    imports: [RouterLink, RouterLinkActive, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './navbar.html'
})
export class NavbarComponent implements OnInit {
    // Inyectar los servicios que necesita el navbar
    authService     = inject(AuthService);     // Estado del usuario (logueado/no logueado, avatar)
    languageService = inject(LanguageService); // Cambio de idioma ES/EN
    themeService    = inject(ThemeService);    // Cambio de tema oscuro/claro
    private userService = inject(UserService); // Para obtener el perfil completo con avatar

    menuAbierto = false; // Controla si el menú hamburguesa está desplegado en móvil

    constructor() {
        // effect() se ejecuta cada vez que algún signal que lea dentro cambie.
        // Aquí leemos authService.currentUser() → se re-ejecuta al hacer login o logout.
        //
        // ¿Por qué no usar ngOnInit()?
        //   ngOnInit se ejecuta UNA SOLA VEZ al crear el componente.
        //   Si el navbar se crea antes de que el usuario haga login (caso normal),
        //   ngOnInit vería currentUser() = null y no haría la petición del avatar.
        //   Con effect(), cuando el usuario hace login y currentUser() cambia,
        //   este bloque se re-ejecuta automáticamente y puede cargar el avatar.
        effect(() => {
            const user = this.authService.currentUser();
            // Solo cargar el avatar si hay usuario logueado Y no tenemos ya el avatar
            if (user && !this.authService.avatarUrl()) {
                // untracked() evita que getPerfil() reactive el effect infinitamente.
                // Sin untracked(), si getPerfil() causara un cambio en algún signal
                // que lee este effect, se formaría un bucle infinito.
                untracked(() => {
                    this.userService.getPerfil().subscribe({
                        next: (res) => this.authService.actualizarAvatarLocal(res.data.avatar ?? null),
                        error: () => {} // Silenciar errores de avatar — no son críticos
                    });
                });
            }
        });
    }

    ngOnInit(): void {}

    // Devuelve la primera letra del nombre del usuario en mayúscula (ej: "A")
    // Se usa como avatar de texto cuando el usuario no tiene foto de perfil
    // El encadenamiento opcional (?.) evita errores si currentUser() es null
    inicialUsuario(): string {
        return this.authService.currentUser()?.name?.charAt(0)?.toUpperCase() ?? '?';
    }

    // Alterna el estado abierto/cerrado del menú hamburguesa en móvil
    toggleMenu(): void {
        this.menuAbierto = !this.menuAbierto;
    }

    // Delega el logout al servicio de autenticación
    // AuthService limpia el estado, borra el token y redirige a /login
    logout(): void {
        this.authService.logout();
    }
}
