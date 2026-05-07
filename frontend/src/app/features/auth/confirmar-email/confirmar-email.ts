import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { ActivatedRoute, RouterLink }         from '@angular/router';
import { AuthService }                        from '../../../core/services/auth.service';
import { NgIconComponent }                    from '@ng-icons/core';

type Estado = 'cargando' | 'exito' | 'error';

@Component({
    selector: 'app-confirmar-email',
    standalone: true,
    imports: [CommonModule, RouterLink, NgIconComponent],
    templateUrl: './confirmar-email.html'
})
export class ConfirmarEmailComponent implements OnInit {
    private route       = inject(ActivatedRoute);
    private authService = inject(AuthService);

    estado  = signal<Estado>('cargando');
    mensaje = signal('');

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.estado.set('error');
            this.mensaje.set('Enlace de verificación inválido.');
            return;
        }

        this.authService.verificarEmail(token).subscribe({
            next: (res) => {
                this.estado.set('exito');
                this.mensaje.set(res.message);
            },
            error: (err) => {
                this.estado.set('error');
                this.mensaje.set(err.error?.message || 'El enlace es inválido o ha expirado.');
            }
        });
    }
}
