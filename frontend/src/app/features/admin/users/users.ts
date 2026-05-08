import { Component, inject, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService }   from '../../../core/services/user.service';
import { AuthService }   from '../../../core/services/auth.service';
import { User }          from '../../../shared/models/user.model';
import Swal              from 'sweetalert2';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIconComponent, TranslateModule],
    templateUrl: './users.html'
})
export class UsersComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private translate   = inject(TranslateService);
    private cdr         = inject(ChangeDetectorRef);

    usuarios  = signal<User[]>([]);
    cargando  = true;
    error     = '';
    busqueda  = signal('');
    filtroRol = signal('todos');

    usuariosFiltrados = computed(() => {
        let resultado = this.usuarios();

        if (this.filtroRol() !== 'todos') {
            resultado = resultado.filter(u => u.role === this.filtroRol());
        }

        const termino = this.busqueda().trim().toLowerCase();
        if (termino) {
            resultado = resultado.filter(u =>
                u.name.toLowerCase().includes(termino) ||
                u.email.toLowerCase().includes(termino)
            );
        }

        return resultado;
    });

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    cargarUsuarios(): void {
        this.userService.getUsuarios().subscribe({
            next: (res) => {
                this.usuarios.set(res.data);
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error    = err.error?.message || 'Error al cargar usuarios';
                this.cargando = false;
                this.cdr.detectChanges();
            }
        });
    }

    toggleActivo(usuario: User): void {
        const t = (k: string, p?: object) => this.translate.instant(k, p);
        Swal.fire({
            title: t(usuario.active ? 'ADMIN.USUARIOS.SWAL_DESACTIVAR' : 'ADMIN.USUARIOS.SWAL_ACTIVAR', { nombre: usuario.name }),
            text:  t(usuario.active ? 'ADMIN.USUARIOS.SWAL_DESACTIVAR_TEXTO' : 'ADMIN.USUARIOS.SWAL_ACTIVAR_TEXTO'),
            icon: 'question', showCancelButton: true,
            confirmButtonText: t(usuario.active ? 'ADMIN.USUARIOS.SWAL_SI_DESACTIVAR' : 'ADMIN.USUARIOS.SWAL_SI_ACTIVAR'),
            cancelButtonText: t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.userService.actualizarUsuario(usuario._id, { active: !usuario.active }).subscribe({
                next: () => {
                    this.usuarios.update(lista => lista.map(u => u._id === usuario._id ? { ...u, active: !u.active } : u));
                    Swal.fire({ icon: 'success', title: t(!usuario.active ? 'ADMIN.USUARIOS.SWAL_USUARIO_ACTIVADO' : 'ADMIN.USUARIOS.SWAL_USUARIO_DESACTIVADO'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    cambiarRol(usuario: User): void {
        const t = (k: string, p?: object) => this.translate.instant(k, p);
        if (usuario._id === this.authService.currentUser()?.id) {
            Swal.fire({ icon: 'warning', title: t('ADMIN.USUARIOS.SWAL_NO_ROL'), text: t('ADMIN.USUARIOS.SWAL_NO_ROL_TEXTO'),
                background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' });
            return;
        }
        const nuevoRol = usuario.role === 'Admin' ? 'Cliente' : 'Admin';
        Swal.fire({
            title: t('ADMIN.USUARIOS.SWAL_HACER_ROL', { nombre: usuario.name, rol: nuevoRol }),
            text:  t(nuevoRol === 'Admin' ? 'ADMIN.USUARIOS.SWAL_ROL_ADMIN_TEXTO' : 'ADMIN.USUARIOS.SWAL_ROL_CLIENTE_TEXTO'),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('ADMIN.USUARIOS.SWAL_SI_CAMBIAR_ROL'), cancelButtonText: t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.userService.actualizarUsuario(usuario._id, { role: nuevoRol as any }).subscribe({
                next: () => {
                    this.usuarios.update(lista => lista.map(u => u._id === usuario._id ? { ...u, role: nuevoRol as any } : u));
                    Swal.fire({ icon: 'success', title: t('ADMIN.USUARIOS.SWAL_ROL_OK'), text: t('ADMIN.USUARIOS.SWAL_ROL_OK_TEXTO', { nombre: usuario.name, rol: nuevoRol }),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    eliminarUsuario(id: string): void {
        const t = (k: string, p?: object) => this.translate.instant(k, p);
        const usuario = this.usuarios().find(u => u._id === id);
        Swal.fire({
            title: t('ADMIN.USUARIOS.SWAL_ELIMINAR', { nombre: usuario?.name }), text: t('ADMIN.USUARIOS.SWAL_ELIMINAR_TEXTO'),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('ADMIN.USUARIOS.SWAL_SI_ELIMINAR'), cancelButtonText: t('COMUN.CANCELAR'),
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.userService.eliminarUsuario(id).subscribe({
                next: () => {
                    this.usuarios.update(lista => lista.filter(u => u._id !== id));
                    Swal.fire({ icon: 'success', title: t('ADMIN.USUARIOS.SWAL_ELIMINADO'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }
}