import { Component, inject }            from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }                  from '../../../core/services/auth.service';
import { LanguageService }              from '../../../core/services/languaje.service';
import { TranslateModule }              from '@ngx-translate/core';
import { CommonModule }                 from '@angular/common';
import { NgIconComponent }              from '@ng-icons/core';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './navbar.html'
})
export class NavbarComponent {
    authService     = inject(AuthService);
    languageService = inject(LanguageService);
    menuAbierto     = false;

    toggleMenu(): void {
        this.menuAbierto = !this.menuAbierto;
    }

    logout(): void {
        this.authService.logout();
    }
}