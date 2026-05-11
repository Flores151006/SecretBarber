import { Component, inject, signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink }                from '@angular/router';
import { NgIconComponent }           from '@ng-icons/core';
import { TranslateModule }           from '@ngx-translate/core';
import { AuthService }               from '../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent, TranslateModule],
    templateUrl: './forgot-password.html'
})
export class ForgotPasswordComponent {
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    });

    cargando = signal(false);
    enviado  = signal(false);
    error    = signal('');

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.cargando.set(true);
        this.error.set('');

        this.authService.forgotPassword(this.form.value.email!).subscribe({
            next: () => {
                this.enviado.set(true);
                this.cargando.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Error al procesar la solicitud');
                this.cargando.set(false);
            }
        });
    }
}
