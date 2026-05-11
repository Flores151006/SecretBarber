import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly tema = signal<'dark' | 'light'>('dark');

    constructor() {
        const guardado = localStorage.getItem('theme') as 'dark' | 'light' | null;
        const inicial  = guardado ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        this.tema.set(inicial);
        this.aplicarTema(inicial);

        effect(() => {
            const t = this.tema();
            this.aplicarTema(t);
            localStorage.setItem('theme', t);
        });
    }

    toggle(): void {
        this.tema.update(t => t === 'dark' ? 'light' : 'dark');
    }

    esDark(): boolean {
        return this.tema() === 'dark';
    }

    private aplicarTema(t: 'dark' | 'light'): void {
        const html = document.documentElement;
        if (t === 'light') {
            html.classList.add('light');
        } else {
            html.classList.remove('light');
        }
    }
}
