import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { ActivatedRoute, RouterLink }         from '@angular/router';
import { AuthService }                        from '../../../core/services/auth.service';
import { NgIconComponent }                    from '@ng-icons/core';

@Component({
    selector: 'app-verificar-email',
    standalone: true,
    imports: [CommonModule, RouterLink, NgIconComponent],
    templateUrl: './verificar-email.html'
})
export class VerificarEmailComponent implements OnInit {
    private route       = inject(ActivatedRoute);
    private authService = inject(AuthService);

    email        = signal('');
    reenviando   = signal(false);
    reenviado    = signal(false);
    errorReenvio = signal('');

    ngOnInit(): void {
        const emailParam = this.route.snapshot.queryParamMap.get('email');
        if (emailParam) this.email.set(emailParam);
    }

    reenviar(): void {
        if (!this.email() || this.reenviando()) return;
        this.reenviando.set(true);
        this.errorReenvio.set('');

        this.authService.reenviarVerificacion(this.email()).subscribe({
            next: () => {
                this.reenviando.set(false);
                this.reenviado.set(true);
            },
            error: (err) => {
                this.reenviando.set(false);
                this.errorReenvio.set(err.error?.message || 'Error al reenviar el correo');
            }
        });
    }
}
