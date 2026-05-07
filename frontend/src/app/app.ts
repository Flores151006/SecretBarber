import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapInstagram, bootstrapTiktok, bootstrapWhatsapp } from '@ng-icons/bootstrap-icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, NavbarComponent, NgIcon, TranslateModule],
    viewProviders: [provideIcons({ bootstrapInstagram, bootstrapTiktok, bootstrapWhatsapp })],
    templateUrl: './app.html'
})
export class AppComponent {
    currentYear = new Date().getFullYear();
}