import { Component, inject, signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { TranslateModule }           from '@ngx-translate/core';
import { NgIconComponent }           from '@ng-icons/core';
import { AuthService }               from '../../core/services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type Rol = 'publico' | 'cliente' | 'admin';

interface EntradaAyuda {
    preguntaKey:  string;
    respuestaKey: string;
    youtubeId?:   string;
    duracion?:    string;
    roles:        Rol[];
}

@Component({
    selector:    'app-help',
    standalone:  true,
    imports:     [CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './help.html'
})
export class HelpComponent {
    private authService = inject(AuthService);
    private sanitizer   = inject(DomSanitizer);

    abiertoIdx = signal<number>(-1);

    readonly entradas: EntradaAyuda[] = [
        // Visibles para todos
        {
            preguntaKey:  'AYUDA.FAQ.Q1',
            respuestaKey: 'AYUDA.FAQ.A1',
            youtubeId: 'dQw4w9WgXcQ', duracion: '3:15',
            roles: ['publico', 'cliente', 'admin']
        },
        {
            preguntaKey:  'AYUDA.FAQ.Q7',
            respuestaKey: 'AYUDA.FAQ.A7',
            youtubeId: 'dQw4w9WgXcQ', duracion: '2:30',
            roles: ['publico', 'cliente', 'admin']
        },
        {
            preguntaKey:  'AYUDA.FAQ.Q4',
            respuestaKey: 'AYUDA.FAQ.A4',
            youtubeId: 'dQw4w9WgXcQ', duracion: '1:20',
            roles: ['publico', 'cliente', 'admin']
        },
        {
            preguntaKey:  'AYUDA.FAQ.Q3',
            respuestaKey: 'AYUDA.FAQ.A3',
            roles: ['publico', 'cliente', 'admin']
        },
        {
            preguntaKey:  'AYUDA.FAQ.Q8',
            respuestaKey: 'AYUDA.FAQ.A8',
            roles: ['publico', 'cliente', 'admin']
        },
        // Solo clientes
        {
            preguntaKey:  'AYUDA.FAQ.Q2',
            respuestaKey: 'AYUDA.FAQ.A2',
            youtubeId: 'dQw4w9WgXcQ', duracion: '2:45',
            roles: ['cliente', 'admin']
        },
        {
            preguntaKey:  'AYUDA.FAQ.Q5',
            respuestaKey: 'AYUDA.FAQ.A5',
            youtubeId: 'dQw4w9WgXcQ', duracion: '1:50',
            roles: ['cliente', 'admin']
        },
        {
            preguntaKey:  'AYUDA.FAQ.Q6',
            respuestaKey: 'AYUDA.FAQ.A6',
            roles: ['cliente', 'admin']
        },
        // Solo admin
        {
            preguntaKey:  'AYUDA.VIDEOS.ADMIN_RESERVAS_TITULO',
            respuestaKey: 'AYUDA.VIDEOS.ADMIN_RESERVAS_DESC',
            youtubeId: 'dQw4w9WgXcQ', duracion: '4:00',
            roles: ['admin']
        },
        {
            preguntaKey:  'AYUDA.VIDEOS.ADMIN_STATS_TITULO',
            respuestaKey: 'AYUDA.VIDEOS.ADMIN_STATS_DESC',
            youtubeId: 'dQw4w9WgXcQ', duracion: '3:30',
            roles: ['admin']
        },
        {
            preguntaKey:  'AYUDA.VIDEOS.ADMIN_USUARIOS_TITULO',
            respuestaKey: 'AYUDA.VIDEOS.ADMIN_USUARIOS_DESC',
            youtubeId: 'dQw4w9WgXcQ', duracion: '3:00',
            roles: ['admin']
        }
    ];

    get entradasFiltradas(): EntradaAyuda[] {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return this.entradas.filter(e => e.roles.includes('publico'));
        if (usuario.role === 'Admin') return this.entradas.filter(e => e.roles.includes('admin'));
        return this.entradas.filter(e => e.roles.includes('cliente'));
    }

    get rolLabelKey(): string {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return 'AYUDA.ROL_PUBLICO';
        if (usuario.role === 'Admin') return 'AYUDA.ROL_ADMIN';
        return 'AYUDA.ROL_CLIENTE';
    }

    toggle(idx: number): void {
        this.abiertoIdx.update(prev => prev === idx ? -1 : idx);
    }

    embedUrl(youtubeId: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`
        );
    }
}
