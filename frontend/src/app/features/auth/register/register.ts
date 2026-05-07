import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup,
         Validators, ReactiveFormsModule }       from '@angular/forms';
import { Router, RouterLink }                    from '@angular/router';
import { AuthService }                           from '../../../core/services/auth.service';
import { RecaptchaService }                      from '../../../core/services/recaptcha.service';
import { CommonModule }                          from '@angular/common';
import { TranslateModule }                       from '@ngx-translate/core';
import { NgIconComponent }                       from '@ng-icons/core';

@Component({
    selector:    'app-register',
    standalone:  true,
    imports:     [ReactiveFormsModule, RouterLink, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './register.html'
})
export class RegisterComponent {
    private fb          = inject(FormBuilder);
    private authService = inject(AuthService);
    private recaptcha   = inject(RecaptchaService);
    private router      = inject(Router);
    private cdr         = inject(ChangeDetectorRef);

    form: FormGroup = this.fb.group({
        name:          ['', [Validators.required, Validators.minLength(3)]],
        email:         ['', [Validators.required, Validators.email]],
        password:      ['', [Validators.required, Validators.minLength(8),
                             Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/)]],
        confirmarPass: ['', Validators.required]
    }, { validators: this.passwordsIguales });

    cargando = false;
    error    = '';
    verPass  = false;

    passwordsIguales(group: FormGroup) {
        const pass    = group.get('password')?.value;
        const confirm = group.get('confirmarPass')?.value;
        return pass === confirm ? null : { noCoinciden: true };
    }

    async submit(): Promise<void> {
        if (this.form.invalid) return;

        this.cargando = true;
        this.error    = '';

        const captchaToken = await this.recaptcha.execute('register');
        const { name, email, password } = this.form.value;

        this.authService.register({ name, email, password, captchaToken } as any).subscribe({
            next: () => {
                this.cargando = false;
                this.cdr.detectChanges();
                this.router.navigate(['/verificar-email'], { queryParams: { email } });
            },
            error: (err) => {
                this.cargando = false;
                this.error    = err.error?.message || 'Error al registrarse';
                this.cdr.detectChanges();
            }
        });
    }
}
