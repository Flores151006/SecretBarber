// ─────────────────────────────────────────────────────────────────────────────
// settings.ts
//
// Componente de configuración de la cuenta del usuario en Secret Barber.
// Organizado en 4 secciones seleccionables mediante un signal:
//   · perfil     → cambiar nombre y avatar (foto de perfil)
//   · seguridad  → cambiar contraseña
//   · apariencia → cambiar tema (claro/oscuro) e idioma
//   · cuenta     → información general y eliminación de cuenta
//
// Puntos técnicos importantes:
//  - signal<T>(valor) crea un Signal reactivo: cuando su valor cambia,
//    Angular actualiza automáticamente las partes de la plantilla que lo leen.
//    Es la alternativa moderna a los observables para estado local.
//  - signal.set(v) asigna un nuevo valor al signal.
//  - signal.update(fn) actualiza el valor aplicando una función.
//  - signal() (con paréntesis) lee el valor actual del signal.
//  - WritableSignal<T> es el tipo de un signal que se puede modificar.
//  - inject() inyecta dependencias sin constructor.
//  - @ViewChild obtiene una referencia al elemento DOM del input de avatar,
//    necesario para disparar el click del input file programáticamente.
//  - FormBuilder construye los formularios reactivos con validaciones.
//  - FileReader: API del navegador para leer archivos locales del usuario.
//    Se usa para convertir la imagen de avatar a base64 antes de enviarla.
//  - Canvas: API del navegador para recortar la imagen a cuadrado (200x200px).
//  - SweetAlert2 muestra la confirmación de eliminación de cuenta.
//  - passwordsMatch: validador personalizado a nivel de grupo que comprueba
//    que 'passwordNueva' y 'passwordConfirm' sean iguales.
// ─────────────────────────────────────────────────────────────────────────────

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
    // Servicios inyectados con inject() — alternativa moderna al constructor
    private userService = inject(UserService);
    authService         = inject(AuthService); // público para acceder en la plantilla
    private translate   = inject(TranslateService);
    private fb          = inject(FormBuilder);

    themeService    = inject(ThemeService);    // público: se usa en la plantilla para cambiar tema
    languageService = inject(LanguageService); // público: se usa en la plantilla para cambiar idioma

    // @ViewChild obtiene una referencia al <input type="file"> con #avatarInput en el HTML.
    // Necesario para llamar a .click() programáticamente cuando el usuario pulsa
    // el botón de cambiar foto (que tiene un aspecto visual personalizado).
    @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

    // signal<User | null>(null): Signal reactivo con el usuario actual.
    // null indica que aún no se han cargado los datos del backend.
    usuario       = signal<User | null>(null);

    // Signal que controla qué sección del panel de ajustes está activa.
    // Tipo unión literal: solo puede ser uno de estos cuatro valores.
    seccionActiva = signal<'perfil' | 'seguridad' | 'apariencia' | 'cuenta'>('perfil');

    // Signals booleanos para los estados de carga de los formularios
    guardandoPerfil = signal(false);
    guardandoPass   = signal(false);

    // Signals de string para mensajes de error y éxito de cada sección
    errorPerfil     = signal('');
    errorPass       = signal('');
    exitoPerfil     = signal('');
    exitoPass       = signal('');

    // Signal que guarda la previsualización del avatar como Data URL (base64).
    // null significa que no hay imagen nueva pendiente de guardar.
    avatarPreview = signal<string | null>(null);

    // Flags para mostrar/ocultar los campos de contraseña (type="password" vs "text")
    verPassActual = false;
    verPassNueva  = false;
    verPassConf   = false;

    // Formulario de perfil: solo el campo nombre, con mínimo 3 caracteres
    perfilForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]]
    });

    // Formulario de cambio de contraseña.
    // El tercer argumento { validators: this.passwordsMatch } aplica un validador
    // a nivel del grupo completo para comparar las dos contraseñas.
    passForm = this.fb.group({
        passwordActual:  ['', Validators.required],
        passwordNueva:   ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', Validators.required]
    }, { validators: this.passwordsMatch });

    // ngOnInit carga el perfil del usuario desde el backend.
    // patchValue rellena solo los campos especificados del formulario (no todos).
    // actualizarAvatarLocal sincroniza el avatar en el estado global de AuthService.
    ngOnInit(): void {
        this.userService.getPerfil().subscribe({
            next: (res) => {
                this.usuario.set(res.data);                         // actualiza el signal con los datos del servidor
                this.perfilForm.patchValue({ name: res.data.name }); // pre-rellena el formulario
                this.authService.actualizarAvatarLocal(res.data.avatar ?? null); // sincroniza el navbar
            },
            error: () => {}
        });
    }

    // Validador personalizado de grupo: devuelve null si las contraseñas coinciden
    // o { noMatch: true } si son distintas. Angular usa este objeto para marcar
    // el formulario como inválido y mostrar el error en la plantilla.
    private passwordsMatch(group: AbstractControl) {
        const p1 = group.get('passwordNueva')?.value;
        const p2 = group.get('passwordConfirm')?.value;
        return p1 === p2 ? null : { noMatch: true };
    }

    // Guarda los cambios de perfil (nombre y/o avatar).
    // Flujo:
    //   1. Valida el formulario; si es inválido, marca todos los campos como tocados
    //      para mostrar los errores de validación en la plantilla.
    //   2. Envía el nuevo nombre al backend.
    //   3. Si hay un avatar pendiente (avatarPreview no es null), también lo envía.
    //   4. Actualiza el estado local del usuario y muestra el mensaje de éxito.
    //   5. setTimeout limpia el mensaje de éxito tras 3 segundos.
    guardarPerfil(): void {
        if (this.perfilForm.invalid) { this.perfilForm.markAllAsTouched(); return; }
        this.guardandoPerfil.set(true);
        this.errorPerfil.set('');
        this.exitoPerfil.set('');

        this.userService.updatePerfil({ name: this.perfilForm.value.name! }).subscribe({
            next: (res) => {
                // signal.update() modifica el objeto del usuario sin reemplazar toda la referencia
                this.usuario.update(u => u ? { ...u, name: res.data.name } : u);
                this.authService.actualizarNombreLocal(res.data.name); // actualiza el nombre en el navbar
                this.perfilForm.markAsPristine(); // marca el formulario como sin cambios pendientes

                const preview = this.avatarPreview();
                if (preview) {
                    // Si hay una imagen nueva, también actualizamos el avatar
                    this.userService.updateAvatar(preview).subscribe({
                        next: (avatarRes) => {
                            this.usuario.update(u => u ? { ...u, avatar: avatarRes.data.avatar } : u);
                            this.authService.actualizarAvatarLocal(avatarRes.data.avatar ?? null);
                            this.avatarPreview.set(null); // limpia la previsualización
                            this.exitoPerfil.set(this.translate.instant('SETTINGS.EXITO_PERFIL'));
                            this.guardandoPerfil.set(false);
                            setTimeout(() => this.exitoPerfil.set(''), 3000); // oculta el mensaje tras 3s
                        },
                        error: (err) => {
                            this.errorPerfil.set(this.errorMsg(err));
                            this.guardandoPerfil.set(false);
                        }
                    });
                } else {
                    // Sin avatar nuevo, solo guardamos el nombre
                    this.exitoPerfil.set(this.translate.instant('SETTINGS.EXITO_PERFIL'));
                    this.guardandoPerfil.set(false);
                    setTimeout(() => this.exitoPerfil.set(''), 3000);
                }
            },
            error: (err) => {
                this.errorPerfil.set(this.errorMsg(err));
                this.guardandoPerfil.set(false);
            }
        });
    }

    // Cambia la contraseña del usuario.
    // El backend verifica primero que 'passwordActual' sea correcta antes de
    // actualizar la contraseña por 'passwordNueva'.
    // Tras el éxito, resetea el formulario y muestra el mensaje de éxito 3 segundos.
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
                this.passForm.reset(); // limpia todos los campos del formulario
                setTimeout(() => this.exitoPass.set(''), 3000);
            },
            error: (err) => {
                this.errorPass.set(this.errorMsg(err));
                this.guardandoPass.set(false);
            }
        });
    }

    // Elimina la cuenta del usuario tras una doble confirmación.
    // SweetAlert2 muestra un diálogo de advertencia; si el usuario confirma,
    // se llama al backend para borrar la cuenta y luego se hace logout.
    // translate.instant() traduce las claves al idioma activo.
    eliminarCuenta(): void {
        const t = (k: string) => this.translate.instant(k); // atajo para traducciones
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
            if (!result.isConfirmed) return; // El usuario canceló el diálogo
            this.userService.eliminarCuenta().subscribe({
                next: () => {
                    this.authService.logout(); // limpia el token y redirige al login
                },
                error: (err) => Swal.fire({
                    icon: 'error', title: 'Error', text: err.error?.message,
                    background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C'
                })
            });
        });
    }

    // Descarta los cambios no guardados del formulario de perfil.
    // patchValue restaura el nombre original desde el signal 'usuario'.
    // markAsPristine indica a Angular que el formulario no tiene cambios pendientes.
    cancelarCambios(): void {
        this.perfilForm.patchValue({ name: this.usuario()?.name ?? '' });
        this.perfilForm.markAsPristine();
        this.avatarPreview.set(null); // descarta la previsualización del avatar
        this.errorPerfil.set('');
    }

    // Activa el input file del avatar de forma programática.
    // El input está oculto en el HTML; este método simula el clic para abrir
    // el selector de archivos del sistema operativo cuando el usuario
    // hace clic en el avatar o en el botón de cambiar foto.
    triggerAvatarInput(): void {
        this.avatarInput.nativeElement.click();
    }

    // Maneja la selección de un archivo de imagen para el avatar.
    // Proceso completo:
    //   1. Comprueba que se seleccionó un archivo y que es una imagen.
    //   2. Crea un FileReader (API del navegador para leer archivos locales).
    //   3. reader.readAsDataURL() lee el archivo y lo convierte a Data URL (base64).
    //   4. reader.onload se dispara cuando la lectura termina.
    //   5. Dentro, se crea un elemento <img> para cargar la imagen en memoria.
    //   6. img.onload se dispara cuando la imagen está lista para procesar.
    //   7. Se crea un <canvas> de 200x200 px.
    //   8. Se calcula el recorte cuadrado centrado: sx/sy son las coordenadas
    //      del punto de inicio del recorte (centrado horizontal y verticalmente).
    //   9. ctx.drawImage dibuja la imagen recortada en el canvas 200x200.
    //   10. canvas.toDataURL genera el Data URL JPEG con 85% de calidad.
    //   11. Se guarda en el signal avatarPreview para mostrar la previsualización.
    onAvatarSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        // Comprueba que el archivo sea una imagen (image/jpeg, image/png, etc.)
        if (!file.type.startsWith('image/')) { this.errorPerfil.set(this.translate.instant('SETTINGS.ERROR_IMAGEN')); return; }

        // FileReader: API del navegador para leer archivos del sistema
        const reader = new FileReader();
        reader.onload = (e) => {
            // Cargamos la imagen en un elemento <img> virtual para obtener sus dimensiones
            const img = new Image();
            img.onload = () => {
                // Creamos un canvas de 200x200 para recortar la imagen como cuadrado
                const canvas = document.createElement('canvas');
                canvas.width = 200; canvas.height = 200;
                const ctx = canvas.getContext('2d')!;
                // Calculamos el recorte centrado: tomamos el lado más corto como referencia
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;   // desplazamiento horizontal para centrar
                const sy = (img.height - minDim) / 2;  // desplazamiento vertical para centrar
                // Dibuja la imagen recortada (cuadrado central) escalada a 200x200
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 200, 200);
                // toDataURL genera una cadena base64 que se puede enviar directamente al backend
                this.avatarPreview.set(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = e.target?.result as string; // dispara img.onload
        };
        reader.readAsDataURL(file); // dispara reader.onload cuando termina
    }

    // Determina si el usuario se registró mediante Google OAuth.
    // Los usuarios de Google no tienen contraseña propia, por lo que
    // se oculta la sección de cambio de contraseña.
    esGoogleUser(): boolean {
        return !this.usuario()?.email || this.usuario() === null
            ? false
            : this.authService.currentUser()?.id !== undefined && !this.usuario()?.active;
    }

    // Formatea una fecha ISO a formato legible en español (ej: "15 de enero de 2025")
    formatFecha(date: string): string {
        return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Devuelve la inicial del nombre del usuario en mayúscula, para mostrar
    // como avatar de texto cuando el usuario no tiene foto de perfil
    iniciales(): string {
        return this.usuario()?.name?.charAt(0)?.toUpperCase() ?? '?';
    }

    // Helper privado para extraer el mensaje de error más útil de la respuesta HTTP.
    // Si el status es 0, la petición no llegó al servidor (sin conexión a red).
    private errorMsg(err: any): string {
        if (err?.status === 0) return this.translate.instant('COMUN.ERROR_RED');
        return err?.error?.message || this.translate.instant('COMUN.ERROR');
    }
}
