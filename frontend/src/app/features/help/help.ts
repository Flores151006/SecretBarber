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
    roles:        Rol[];
}

interface VideoRol {
    youtubeId: string;
    tituloKey: string;
    descKey:   string;
    duracion:  string;
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

    abiertoIdx   = signal<number>(-1);
    videoAbierto = signal<boolean>(false);

    private readonly videos: Record<Rol, VideoRol> = {
        publico: {
            youtubeId: 'dQw4w9WgXcQ',
            tituloKey: 'AYUDA.VIDEOS.REGISTRO_TITULO',
            descKey:   'AYUDA.VIDEOS.REGISTRO_DESC',
            duracion:  '2:45'
        },
        cliente: {
            youtubeId: 'dQw4w9WgXcQ',
            tituloKey: 'AYUDA.VIDEOS.RESERVAR_TITULO',
            descKey:   'AYUDA.VIDEOS.RESERVAR_DESC',
            duracion:  '3:20'
        },
        admin: {
            youtubeId: 'dQw4w9WgXcQ',
            tituloKey: 'AYUDA.VIDEOS.ADMIN_RESERVAS_TITULO',
            descKey:   'AYUDA.VIDEOS.ADMIN_RESERVAS_DESC',
            duracion:  '4:00'
        }
    };

    readonly entradas: EntradaAyuda[] = [
        { preguntaKey: 'AYUDA.FAQ.Q1', respuestaKey: 'AYUDA.FAQ.A1', roles: ['publico', 'cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q7', respuestaKey: 'AYUDA.FAQ.A7', roles: ['publico', 'cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q4', respuestaKey: 'AYUDA.FAQ.A4', roles: ['publico', 'cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q3', respuestaKey: 'AYUDA.FAQ.A3', roles: ['publico', 'cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q8', respuestaKey: 'AYUDA.FAQ.A8', roles: ['publico', 'cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q9', respuestaKey: 'AYUDA.FAQ.A9', roles: ['publico', 'cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q2', respuestaKey: 'AYUDA.FAQ.A2', roles: ['cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q5', respuestaKey: 'AYUDA.FAQ.A5', roles: ['cliente', 'admin'] },
        { preguntaKey: 'AYUDA.FAQ.Q6', respuestaKey: 'AYUDA.FAQ.A6', roles: ['cliente', 'admin'] },
        { preguntaKey: 'AYUDA.VIDEOS.ADMIN_STATS_TITULO',    respuestaKey: 'AYUDA.VIDEOS.ADMIN_STATS_DESC',    roles: ['admin'] },
        { preguntaKey: 'AYUDA.VIDEOS.ADMIN_USUARIOS_TITULO', respuestaKey: 'AYUDA.VIDEOS.ADMIN_USUARIOS_DESC', roles: ['admin'] }
    ];

    get entradasFiltradas(): EntradaAyuda[] {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return this.entradas.filter(e => e.roles.includes('publico'));
        if (usuario.role === 'Admin') return this.entradas.filter(e => e.roles.includes('admin'));
        return this.entradas.filter(e => e.roles.includes('cliente'));
    }

    get videoDelRol(): VideoRol {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return this.videos['publico'];
        if (usuario.role === 'Admin') return this.videos['admin'];
        return this.videos['cliente'];
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
