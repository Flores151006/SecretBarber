import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { NgIconComponent }  from '@ng-icons/core';
import { TranslateModule, TranslateService }  from '@ngx-translate/core';
import { UserService }   from '../../../core/services/user.service';
import { AuthService }   from '../../../core/services/auth.service';
import { ThemeService }  from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/languaje.service';
import { User }          from '../../../shared/models/user.model';
import Swal              from 'sweetalert2';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NgIconComponent, TranslateModule],
    templateUrl: './settings.html'
})
export class SettingsComponent implements OnInit {
    private userService = inject(UserService);
    authService         = inject(AuthService);
    private translate   = inject(TranslateService);
    private fb          = inject(FormBuilder);

    themeService    = inject(ThemeService);
    languageService = inject(LanguageService);

    @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

    usuario       = signal<User | null>(null);
    seccionActiva = signal<'perfil' | 'seguridad' | 'apariencia' | 'cuenta'>('perfil');

    guardandoPerfil = signal(false);
    guardandoPass   = signal(false);
    errorPerfil     = signal('');
    errorPass       = signal('');
    exitoPerfil     = signal('');
    exitoPass       = signal('');

    avatarPreview   = signal<string | null>(null);
    guardandoAvatar = signal(false);
    exitoAvatar     = signal('');
    errorAvatar     = signal('');

    verPassActual = false;
    verPassNueva  = false;
    verPassConf   = false;

    perfilForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]]
    });

    passForm = this.fb.group({
        passwordActual:  ['', Validators.required],
        passwordNueva:   ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', Validators.required]
    }, { validators: this.passwordsMatch });

    ngOnInit(): void {
        this.userService.getPerfil().subscribe({
            next: (res) => {
                this.usuario.set(res.data);
                this.perfilForm.patchValue({ name: res.data.name });
                this.authService.actualizarAvatarLocal(res.data.avatar ?? null);
            },
            error: () => {}
        });
    }

    private passwordsMatch(group: AbstractControl) {
        const p1 = group.get('passwordNueva')?.value;
        const p2 = group.get('passwordConfirm')?.value;
        return p1 === p2 ? null : { noMatch: true };
    }

    guardarPerfil(): void {
        if (this.perfilForm.invalid) { this.perfilForm.markAllAsTouched(); return; }
        this.guardandoPerfil.set(true);
        this.errorPerfil.set('');
        this.exitoPerfil.set('');

        this.userService.updatePerfil({ name: this.perfilForm.value.name! }).subscribe({
            next: (res) => {
                this.usuario.update(u => u ? { ...u, name: res.data.name } : u);
                this.authService.actualizarNombreLocal(res.data.name);
                this.exitoPerfil.set(this.translate.instant('SETTINGS.EXITO_PERFIL'));
                this.guardandoPerfil.set(false);
                setTimeout(() => this.exitoPerfil.set(''), 3000);
            },
            error: (err) => {
                this.errorPerfil.set(err.error?.message || 'Error al guardar');
                this.guardandoPerfil.set(false);
            }
        });
    }

    cambiarPassword(): void {
        if (this.passForm.invalid) { this.passForm.markAllAsTouched(); return; }
        this.guardandoPass.set(true);
        this.errorPass.set('');
        this.exitoPass.set('');

        const { passwordActual, passwordNueva } = this.passForm.value;
        this.userService.cambiarPassword(passwordActual!, passwordNueva!).subscribe({
            next: () => {
                this.exitoPass.set(this.translate.instant('SETTINGS.EXITO_PASS'));
                this.guardandoPass.set(false);
                this.passForm.reset();
                setTimeout(() => this.exitoPass.set(''), 3000);
            },
            error: (err) => {
                this.errorPass.set(err.error?.message || 'Error al cambiar contraseña');
                this.guardandoPass.set(false);
            }
        });
    }

    eliminarCuenta(): void {
        const t = (k: string) => this.translate.instant(k);
        Swal.fire({
            title: t('SETTINGS.ELIMINAR_TITULO'),
            text:  t('SETTINGS.ELIMINAR_DESC'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('SETTINGS.BTN_ELIMINAR'),
            cancelButtonText:  t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5',
            confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.userService.eliminarCuenta().subscribe({
                next: () => {
                    this.authService.logout();
                },
                error: (err) => Swal.fire({
                    icon: 'error', title: 'Error', text: err.error?.message,
                    background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C'
                })
            });
        });
    }

    triggerAvatarInput(): void {
        this.avatarInput.nativeElement.click();
    }

    onAvatarSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { this.errorAvatar.set('Solo se permiten imágenes'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 200; canvas.height = 200;
                const ctx = canvas.getContext('2d')!;
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 200, 200);
                this.avatarPreview.set(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    guardarAvatar(): void {
        const avatar = this.avatarPreview();
        if (!avatar) return;
        this.guardandoAvatar.set(true);
        this.errorAvatar.set('');
        this.userService.updateAvatar(avatar).subscribe({
            next: (res) => {
                this.usuario.update(u => u ? { ...u, avatar: res.data.avatar } : u);
                this.authService.actualizarAvatarLocal(res.data.avatar ?? null);
                this.avatarPreview.set(null);
                this.exitoAvatar.set(this.translate.instant('SETTINGS.EXITO_AVATAR'));
                this.guardandoAvatar.set(false);
                setTimeout(() => this.exitoAvatar.set(''), 3000);
            },
            error: (err) => {
                this.errorAvatar.set(err.error?.message || 'Error al subir la imagen');
                this.guardandoAvatar.set(false);
            }
        });
    }

    cancelarAvatar(): void {
        this.avatarPreview.set(null);
        this.errorAvatar.set('');
    }

    esGoogleUser(): boolean {
        return !this.usuario()?.email || this.usuario() === null
            ? false
            : this.authService.currentUser()?.id !== undefined && !this.usuario()?.active;
    }

    formatFecha(date: string): string {
        return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    iniciales(): string {
        return this.usuario()?.name?.charAt(0)?.toUpperCase() ?? '?';
    }
}
