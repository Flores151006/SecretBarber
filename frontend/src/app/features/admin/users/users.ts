// ─────────────────────────────────────────────────────────────────────────────
// users.ts
//
// Componente de gestión de usuarios del panel de administración.
//
// Responsabilidades:
//   - Cargar la lista completa de usuarios registrados desde el backend.
//   - Filtrar usuarios por rol (Admin / Cliente / todos) y por búsqueda de texto.
//   - Activar o desactivar la cuenta de un usuario (flag 'active').
//   - Cambiar el rol de un usuario entre Admin y Cliente.
//   - Eliminar un usuario con confirmación SweetAlert2.
//   - Proteger al administrador activo de cambiarse el rol a sí mismo.
//
// Conceptos clave:
//   - signal<T>(): contenedor reactivo de Angular 17+. Cuando cambia su valor
//     Angular re-evalúa automáticamente todos los computed() que lo leen.
//   - computed(): signal derivado que se recalcula cuando cambian sus dependencias.
//     Aquí filtramos y buscamos usuarios sin bucles manuales ni flags extra.
//   - usuarios.update(fn): actualiza el signal aplicando una función al valor
//     anterior. El spread operator { ...u, active: !u.active } crea un nuevo
//     objeto con todos los campos del usuario original pero con active cambiado,
//     garantizando inmutabilidad y que Angular detecte el cambio.
//   - usuarios.set([]): reemplaza el valor del signal por uno nuevo.
//   - Swal.fire(): modal de confirmación/aviso de SweetAlert2.
// ─────────────────────────────────────────────────────────────────────────────

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

    // Servicios inyectados:
    //   userService → operaciones CRUD sobre usuarios
    //   authService → acceder al usuario conectado (para la protección de auto-cambio)
    //   translate   → textos i18n con ngx-translate
    //   cdr         → forzar detección de cambios tras operaciones asíncronas
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private translate   = inject(TranslateService);
    private cdr         = inject(ChangeDetectorRef);

    // signal<User[]>: array reactivo de usuarios.
    // Al llamar a .set() o .update() Angular notifica a los computed() que dependen de él.
    usuarios  = signal<User[]>([]);

    cargando  = true;
    error     = '';

    // Signals para los controles de filtrado.
    // Al ser signals, computed() los observa y se recalcula automáticamente cuando cambian.
    busqueda  = signal('');
    filtroRol = signal('todos');

    // computed(): signal derivado de solo lectura.
    // Se recalcula cada vez que cambian: usuarios(), filtroRol() o busqueda().
    // Aplica primero el filtro de rol y después el filtro de búsqueda de texto.
    usuariosFiltrados = computed(() => {
        // usuarios() lee el valor actual del signal
        let resultado = this.usuarios();

        // Filtro por rol: si filtroRol no es 'todos', descartamos los que no coincidan
        if (this.filtroRol() !== 'todos') {
            resultado = resultado.filter(u => u.role === this.filtroRol());
        }

        // Filtro por texto: busca coincidencia en nombre o email (insensible a mayúsculas)
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

    // Obtiene todos los usuarios del backend y los almacena en el signal 'usuarios'.
    // Tras recibir la respuesta desactiva el spinner y fuerza la detección de cambios.
    cargarUsuarios(): void {
        this.userService.getUsuarios().subscribe({
            next: (res) => {
                // .set() reemplaza el valor del signal; computed() se recalcula automáticamente
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

    // Activa o desactiva la cuenta de un usuario según su estado actual.
    //
    // El texto del diálogo Swal cambia dinámicamente:
    //   - Si usuario.active es true  → pregunta si desactivar
    //   - Si usuario.active es false → pregunta si activar
    //
    // Tras confirmar, llama al backend con { active: !usuario.active }.
    // En el éxito usa usuarios.update() con spread operator para crear un nuevo
    // objeto inmutable que solo cambia la propiedad 'active'.
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
                    // .update(fn): aplica la función al array actual del signal.
                    // .map() recorre todos los usuarios; cuando encuentra el modificado
                    // devuelve un nuevo objeto con spread { ...u } + active invertido.
                    // El resto de usuarios se devuelven sin cambios.
                    this.usuarios.update(lista => lista.map(u => u._id === usuario._id ? { ...u, active: !u.active } : u));
                    Swal.fire({ icon: 'success', title: t(!usuario.active ? 'ADMIN.USUARIOS.SWAL_USUARIO_ACTIVADO' : 'ADMIN.USUARIOS.SWAL_USUARIO_DESACTIVADO'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Cambia el rol de un usuario entre 'Admin' y 'Cliente'.
    //
    // Protección de seguridad:
    //   Antes de abrir el diálogo se comprueba si el usuario a modificar es el mismo
    //   que está conectado (authService.currentUser()?.id). Si coincide, se muestra
    //   un aviso y se sale de la función sin hacer ningún cambio, evitando que un
    //   admin se quede sin acceso accidentalmente.
    //
    // El nuevo rol es el contrario al actual: Admin → Cliente, Cliente → Admin.
    cambiarRol(usuario: User): void {
        const t = (k: string, p?: object) => this.translate.instant(k, p);

        // ── Protección contra auto-cambio de rol ────────────────────────────
        // currentUser() lee el signal del usuario conectado desde AuthService
        if (usuario._id === this.authService.currentUser()?.id) {
            Swal.fire({ icon: 'warning', title: t('ADMIN.USUARIOS.SWAL_NO_ROL'), text: t('ADMIN.USUARIOS.SWAL_NO_ROL_TEXTO'),
                background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' });
            return; // Salida temprana; no se ejecuta nada más
        }

        // Calculamos el nuevo rol antes de abrir el diálogo para mostrarlo en el mensaje
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
                    // Igual que en toggleActivo, actualizamos de forma inmutable con spread
                    this.usuarios.update(lista => lista.map(u => u._id === usuario._id ? { ...u, role: nuevoRol as any } : u));
                    Swal.fire({ icon: 'success', title: t('ADMIN.USUARIOS.SWAL_ROL_OK'), text: t('ADMIN.USUARIOS.SWAL_ROL_OK_TEXTO', { nombre: usuario.name, rol: nuevoRol }),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }

    // Elimina permanentemente un usuario tras doble confirmación.
    // Tras el éxito filtra el array con .filter() para excluir al usuario eliminado,
    // actualizando el signal sin necesidad de recargar la lista del servidor.
    eliminarUsuario(id: string): void {
        const t = (k: string, p?: object) => this.translate.instant(k, p);

        // Buscamos el usuario para mostrar su nombre en el mensaje de confirmación
        const usuario = this.usuarios().find(u => u._id === id);
        Swal.fire({
            title: t('ADMIN.USUARIOS.SWAL_ELIMINAR', { nombre: usuario?.name }), text: t('ADMIN.USUARIOS.SWAL_ELIMINAR_TEXTO'),
            icon: 'warning', showCancelButton: true,
            confirmButtonText: t('ADMIN.USUARIOS.SWAL_SI_ELIMINAR'), cancelButtonText: t('COMUN.CANCELAR'),
            // Botón rojo para indicar acción destructiva irreversible
            background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#ef4444', cancelButtonColor: '#374151'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.userService.eliminarUsuario(id).subscribe({
                next: () => {
                    // .filter() devuelve un nuevo array excluyendo el usuario eliminado.
                    // El signal detecta el cambio y computed() se recalcula.
                    this.usuarios.update(lista => lista.filter(u => u._id !== id));
                    Swal.fire({ icon: 'success', title: t('ADMIN.USUARIOS.SWAL_ELIMINADO'),
                        background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C', timer: 2000, showConfirmButton: false });
                },
                error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message, background: '#1C1C1C', color: '#F5F5F5', confirmButtonColor: '#C9A84C' })
            });
        });
    }
}
