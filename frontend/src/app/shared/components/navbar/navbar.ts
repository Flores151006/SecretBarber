import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }     from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/languaje.service';
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
    private userService = inject(UserService);
    menuAbierto = false;

    ngOnInit(): void {
        if (this.authService.isLoggedIn()) {
            this.userService.getPerfil().subscribe({
                next: (res) => this.authService.actualizarAvatarLocal(res.data.avatar ?? null),
                error: () => {}
            });
        }
    }

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
