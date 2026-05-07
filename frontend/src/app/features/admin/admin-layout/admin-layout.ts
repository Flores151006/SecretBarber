import { Component, inject }              from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService }                   from '../../../core/services/auth.service';
import { NgIconComponent }               from '@ng-icons/core';
import { TranslateModule }               from '@ngx-translate/core';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIconComponent, TranslateModule],
    templateUrl: './admin-layout.html'
})
export class AdminLayoutComponent {
    authService = inject(AuthService);
    sidebarAbierto = false;



}