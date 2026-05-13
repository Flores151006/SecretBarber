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
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './navbar.html'
})
export class NavbarComponent implements OnInit {
    authService     = inject(AuthService);
    languageService = inject(LanguageService);
    themeService    = inject(ThemeService);
    private userService = inject(UserService);
    menuAbierto = false;

    constructor() {
        effect(() => {
            const user = this.authService.currentUser();
            if (user && !this.authService.avatarUrl()) {
                untracked(() => {
                    this.userService.getPerfil().subscribe({
                        next: (res) => this.authService.actualizarAvatarLocal(res.data.avatar ?? null),
                        error: () => {}
                    });
                });
            }
        });
    }

    ngOnInit(): void {}

    inicialUsuario(): string {
        return this.authService.currentUser()?.name?.charAt(0)?.toUpperCase() ?? '?';
    }

    toggleMenu(): void {
        this.menuAbierto = !this.menuAbierto;
    }

    logout(): void {
        this.authService.logout();
    }
}
