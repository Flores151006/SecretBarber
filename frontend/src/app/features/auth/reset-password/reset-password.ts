import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NgIconComponent }                    from '@ng-icons/core';
import { TranslateModule }                    from '@ngx-translate/core';
import { AuthService }                        from '../../../core/services/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent, TranslateModule],
    templateUrl: './reset-password.html'
})
export class ResetPasswordComponent implements OnInit {
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private route       = inject(ActivatedRoute);
    private router      = inject(Router);

    token    = signal('');
    cargando = signal(false);
    exito    = signal(false);
    error    = signal('');
    verPass  = false;
    verPass2 = false;

    form = this.fb.group({
        password:        ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', Validators.required]
    }, { validators: this.passwordsMatch });

    ngOnInit(): void {
        const t = this.route.snapshot.queryParamMap.get('token') ?? '';
        if (!t) { this.error.set('Token no proporcionado'); return; }
        this.token.set(t);
    }

    private passwordsMatch(group: AbstractControl) {
        const p1 = group.get('password')?.value;
        const p2 = group.get('passwordConfirm')?.value;
        return p1 === p2 ? null : { noMatch: true };
    }

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.cargando.set(true);
        this.error.set('');

        this.authService.resetPassword(this.token(), this.form.value.password!).subscribe({
            next: () => {
                this.exito.set(true);
                this.cargando.set(false);
                setTimeout(() => this.router.navigate(['/login']), 3000);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Error al restablecer la contraseña');
                this.cargando.set(false);
            }
        });
    }
}
