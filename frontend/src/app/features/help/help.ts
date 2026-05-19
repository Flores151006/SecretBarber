// ─────────────────────────────────────────────────────────────────────────────
// help.ts
//
// Componente de ayuda de Secret Barber.
// Muestra un vídeo tutorial diferente según el rol del usuario y una sección
// de preguntas frecuentes (FAQ) filtrada también por rol.
//
// Estructura principal:
//   - Un único vídeo de YouTube por rol (Record<Rol, VideoRol>):
//       · publico → vídeo sobre cómo registrarse
//       · cliente → vídeo sobre cómo hacer una reserva
//       · admin   → vídeo sobre cómo gestionar reservas en el panel
//   - FAQ como array de EntradaAyuda, cada entrada con claves de traducción
//     y una lista de roles que pueden verla.
//
// Interfaces definidas:
//   - Rol: tipo unión con los 3 posibles roles ('publico' | 'cliente' | 'admin')
//   - EntradaAyuda: { preguntaKey, respuestaKey, roles } — una fila del FAQ
//   - VideoRol: { youtubeId, tituloKey, descKey, duracion } — datos de un vídeo
//
// Puntos técnicos:
//   - inject(AuthService): obtiene el usuario autenticado para saber el rol.
//   - inject(DomSanitizer): necesario para marcar las URLs de YouTube como
//     seguras. Angular bloquea URLs dinámicas en iframes por defecto; hay que
//     usar bypassSecurityTrustResourceUrl() para permitirlas explícitamente.
//   - signal<number>(-1): índice de la pregunta FAQ abierta en el acordeón.
//     -1 significa que ninguna está abierta. Al cambiar, Angular re-renderiza.
//   - signal<boolean>(false): controla si el vídeo está reproduciendo (iframe)
//     o mostrando la miniatura (thumbnail). Al hacer clic en el thumbnail,
//     se pone a true y se carga el iframe de YouTube con autoplay=1.
//   - Record<Rol, VideoRol>: tipo de TypeScript que obliga a que el objeto
//     tenga exactamente una entrada por cada valor del tipo Rol.
//   - entradasFiltradas (getter): filtra el FAQ según el rol del usuario actual.
//   - videoDelRol (getter): devuelve el objeto VideoRol del rol actual.
//   - toggle(idx): abre/cierra una entrada del FAQ. Si idx ya está abierto,
//     lo cierra (vuelve a -1). signal.update(fn) aplica una función al valor actual.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, inject, signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { TranslateModule }           from '@ngx-translate/core';
import { NgIconComponent }           from '@ng-icons/core';
import { AuthService }               from '../../core/services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Tipo unión: solo puede ser uno de estos tres valores exactos
type Rol = 'publico' | 'cliente' | 'admin';

// Estructura de una entrada del FAQ: claves de traducción + roles que pueden verla
interface EntradaAyuda {
    preguntaKey:  string; // clave i18n para la pregunta (ej: 'AYUDA.FAQ.Q1')
    respuestaKey: string; // clave i18n para la respuesta
    roles:        Rol[];  // roles que pueden ver esta entrada
}

// Estructura de un vídeo tutorial por rol
interface VideoRol {
    youtubeId: string; // ID del vídeo de YouTube (parte final de la URL)
    tituloKey: string; // clave i18n para el título del vídeo
    descKey:   string; // clave i18n para la descripción breve
    duracion:  string; // duración en formato "MM:SS" (texto informativo)
}

@Component({
    selector:    'app-help',
    standalone:  true,
    imports:     [CommonModule, TranslateModule, NgIconComponent],
    templateUrl: './help.html'
})
export class HelpComponent {
    // inject() — inyección sin constructor
    private authService = inject(AuthService);
    // DomSanitizer es necesario para usar URLs dinámicas en [src] de iframes de forma segura
    private sanitizer   = inject(DomSanitizer);

    // Signal con el índice de la pregunta FAQ abierta en el acordeón.
    // -1 = ninguna pregunta abierta
    abiertoIdx   = signal<number>(-1);

    // Signal que controla el estado del reproductor de vídeo:
    //   false → se muestra el thumbnail (imagen de previsualización)
    //   true  → se muestra el iframe de YouTube con autoplay
    videoAbierto = signal<boolean>(false);

    // Record<Rol, VideoRol>: objeto con exactamente una entrada por cada rol posible.
    // TypeScript comprueba en compilación que no falte ningún rol.
    // 'private readonly' porque este objeto nunca cambia en tiempo de ejecución.
    private readonly videos: Record<Rol, VideoRol> = {
        publico: {
            youtubeId: 'dQw4w9WgXcQ', // ID de YouTube del vídeo de registro
            tituloKey: 'AYUDA.VIDEOS.REGISTRO_TITULO',
            descKey:   'AYUDA.VIDEOS.REGISTRO_DESC',
            duracion:  '2:45'
        },
        cliente: {
            youtubeId: 'dQw4w9WgXcQ', // ID de YouTube del vídeo de cómo reservar
            tituloKey: 'AYUDA.VIDEOS.RESERVAR_TITULO',
            descKey:   'AYUDA.VIDEOS.RESERVAR_DESC',
            duracion:  '3:20'
        },
        admin: {
            youtubeId: 'dQw4w9WgXcQ', // ID de YouTube del vídeo de gestión de reservas
            tituloKey: 'AYUDA.VIDEOS.ADMIN_RESERVAS_TITULO',
            descKey:   'AYUDA.VIDEOS.ADMIN_RESERVAS_DESC',
            duracion:  '4:00'
        }
    };

    // Array completo de entradas del FAQ.
    // Cada entrada especifica qué roles pueden verla en el campo 'roles'.
    // Las entradas sin video son preguntas de texto puro (acordeón FAQ).
    // 'readonly' porque el contenido no cambia; el filtrado se hace en el getter.
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
        // Estas dos entradas solo las ve el administrador
        { preguntaKey: 'AYUDA.VIDEOS.ADMIN_STATS_TITULO',    respuestaKey: 'AYUDA.VIDEOS.ADMIN_STATS_DESC',    roles: ['admin'] },
        { preguntaKey: 'AYUDA.VIDEOS.ADMIN_USUARIOS_TITULO', respuestaKey: 'AYUDA.VIDEOS.ADMIN_USUARIOS_DESC', roles: ['admin'] }
    ];

    // Getter que devuelve las entradas del FAQ visibles para el usuario actual.
    // authService.currentUser() devuelve null si no hay sesión iniciada.
    // La comparación usa role === 'Admin' (con mayúscula, como lo guarda el backend).
    get entradasFiltradas(): EntradaAyuda[] {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return this.entradas.filter(e => e.roles.includes('publico'));
        if (usuario.role === 'Admin') return this.entradas.filter(e => e.roles.includes('admin'));
        return this.entradas.filter(e => e.roles.includes('cliente'));
    }

    // Getter que devuelve el objeto VideoRol correspondiente al rol del usuario.
    // Si no hay sesión → vídeo de público; Admin → vídeo de admin; resto → cliente.
    get videoDelRol(): VideoRol {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return this.videos['publico'];
        if (usuario.role === 'Admin') return this.videos['admin'];
        return this.videos['cliente'];
    }

    // Getter que devuelve la clave de traducción para la etiqueta de rol.
    // Se usa en la plantilla para mostrar p.ej. "Sección para: Clientes"
    get rolLabelKey(): string {
        const usuario = this.authService.currentUser();
        if (!usuario)                 return 'AYUDA.ROL_PUBLICO';
        if (usuario.role === 'Admin') return 'AYUDA.ROL_ADMIN';
        return 'AYUDA.ROL_CLIENTE';
    }

    // Abre o cierra una entrada del FAQ.
    // signal.update(fn) aplica la función al valor actual del signal:
    //   · Si el índice pulsado ya estaba abierto (prev === idx) → cierra (-1)
    //   · Si era diferente → abre el nuevo (idx)
    toggle(idx: number): void {
        this.abiertoIdx.update(prev => prev === idx ? -1 : idx);
    }

    // Genera la URL segura del iframe de YouTube para el vídeo dado.
    // bypassSecurityTrustResourceUrl() es necesario porque Angular bloquea
    // URLs dinámicas en iframes para prevenir ataques XSS. Al llamar a este
    // método, declaramos explícitamente que la URL es de confianza.
    // La URL incluye parámetros:
    //   · rel=0           → no muestra vídeos relacionados al terminar
    //   · modestbranding=1 → oculta el logo de YouTube
    //   · autoplay=1      → reproduce automáticamente al cargar el iframe
    embedUrl(youtubeId: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`
        );
    }
}
