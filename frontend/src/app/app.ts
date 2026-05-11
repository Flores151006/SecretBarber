import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapInstagram, bootstrapTiktok, bootstrapWhatsapp } from '@ng-icons/bootstrap-icons';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, NavbarComponent, NgIcon, TranslateModule],
    viewProviders: [provideIcons({ bootstrapInstagram, bootstrapTiktok, bootstrapWhatsapp })],
    templateUrl: './app.html'
})
export class AppComponent {
    private _theme = inject(ThemeService);
    currentYear = new Date().getFullYear();
}