import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';
import { AuthService }               from '../../../core/services/auth.service';

@Component({
    selector: 'app-google-callback',
    standalone: true,
    imports: [],
    template: `
        <div class="min-h-screen bg-background flex items-center justify-center">
            <p class="text-foreground/50">Iniciando sesión con Google...</p>
        </div>
    `
})
export class GoogleCallbackComponent implements OnInit {
    private route  = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token');

        if (token) {
            this.authService.setToken(token);
            this.authService.cargarUsuarioDesdeToken();
            this.router.navigate(['/']);
        } else {
            this.router.navigate(['/login']);
        }
    }
}