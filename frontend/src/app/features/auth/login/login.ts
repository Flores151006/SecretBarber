import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup,
         Validators, ReactiveFormsModule }       from '@angular/forms';
import { Router, RouterLink, ActivatedRoute }    from '@angular/router';
import { AuthService }                           from '../../../core/services/auth.service';
import { RecaptchaService }                      from '../../../core/services/recaptcha.service';
import { CommonModule }                          from '@angular/common';
import { TranslateModule }                       from '@ngx-translate/core';
import { NgIconComponent }                       from '@ng-icons/core';

@Component({
    selector:    'app-login',
    standalone:  true,
    imports:     [ReactiveFormsModule, RouterLink, CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './login.html'
})
export class LoginComponent {
    private fb          = inject(FormBuilder);
    private authService = inject(AuthService);
    private recaptcha   = inject(RecaptchaService);
    private router      = inject(Router);
    private route       = inject(ActivatedRoute);
    private cdr         = inject(ChangeDetectorRef);

    form: FormGroup = this.fb.group({
        email:    ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
    });

    cargando          = false;
    error             = '';
    verPass           = false;
    emailNoVerificado = false;

    async submit(): Promise<void> {
        if (this.form.invalid) return;

        this.cargando          = true;
        this.error             = '';
        this.emailNoVerificado = false;

        const captchaToken = await this.recaptcha.execute('login');

        this.authService.login({ ...this.form.value, captchaToken }).subscribe({
            next: (res) => {
                this.cargando = false;
                this.cdr.detectChanges();
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
                if (returnUrl) {
                    this.router.navigateByUrl(returnUrl);
                } else if (res.user.role === 'Admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: (err) => {
                this.cargando = false;
                if (err.error?.emailNoVerificado) {
                    this.emailNoVerificado = true;
                    this.error             = err.error.message;
                } else {
                    this.error = err.error?.message || 'Email o contraseña incorrectos';
                }
                this.cdr.detectChanges();
            }
        });
    }

    get emailDelForm(): string {
        return this.form.get('email')?.value || '';
    }
}
