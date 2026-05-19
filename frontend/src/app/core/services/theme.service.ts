// ─────────────────────────────────────────────────────────────────────────────
// theme.service.ts
//
// Servicio que gestiona el tema visual de la aplicación (dark / light).
// Se integra con Tailwind CSS para aplicar el tema y con localStorage para
// persistir la preferencia del usuario entre sesiones.
//
// CÓMO FUNCIONA EL DARK MODE CON TAILWIND CSS:
// Tailwind usa la estrategia "class" para el modo oscuro (configurado en
// tailwind.config.js con darkMode: 'class'). Esto significa que todos los
// estilos con el prefijo "dark:" se activan cuando el elemento <html> tiene
// la clase 'dark' (o en este proyecto, cuando NO tiene la clase 'light').
// Este servicio añade/quita esa clase en document.documentElement (= <html>)
// mediante el método aplicarTema().
//
// CONCEPTO CLAVE — signal() + effect():
// - signal<'dark'|'light'> almacena el tema activo de forma reactiva.
//   Los componentes que lean this.tema() se re-renderizan automáticamente
//   cuando el valor cambia.
// - effect() es un efecto secundario que se ejecuta CADA VEZ que cualquier
//   signal que lee cambia de valor. Aquí se usa para sincronizar el tema
//   con el DOM y con localStorage sin tener que llamar a aplicarTema()
//   manualmente en cada lugar donde se modifique el tema.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, signal, effect } from '@angular/core';

// Singleton: una instancia global que mantiene el estado del tema.
// Al ser singleton, el tema es consistente en toda la app sin necesidad
// de pasar props entre componentes.
@Injectable({ providedIn: 'root' })
export class ThemeService {
    // Signal reactivo que contiene el tema actual.
    // 'dark' es el valor inicial por defecto; se sobreescribe en el constructor
    // con el valor de localStorage o la preferencia del sistema operativo.
    readonly tema = signal<'dark' | 'light'>('dark');

    constructor() {
        // 1. Intenta recuperar la preferencia guardada por el usuario.
        const guardado = localStorage.getItem('theme') as 'dark' | 'light' | null;

        // 2. Si no hay preferencia guardada, respeta la configuración del SO:
        //    window.matchMedia('(prefers-color-scheme: light)') devuelve true
        //    si el usuario tiene el modo claro activado en su sistema operativo.
        const inicial  = guardado ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

        // 3. Aplica el tema inicial sin esperar al primer render de Angular.
        this.tema.set(inicial);
        this.aplicarTema(inicial);

        // effect() se suscribe automáticamente al signal this.tema().
        // Cada vez que tema cambia (al llamar a toggle()), este bloque se ejecuta:
        //   - Actualiza la clase CSS en el <html>
        //   - Persiste la elección en localStorage
        // De esta manera no hay que llamar a aplicarTema() en el método toggle();
        // el efecto se dispara solo cuando el signal cambia.
        effect(() => {
            const t = this.tema();
            this.aplicarTema(t);
            localStorage.setItem('theme', t);
        });
    }

    // Alterna entre dark y light. Los componentes llaman a este método
    // cuando el usuario pulsa el botón de cambio de tema.
    // .update() es el método de signal para transformar el valor actual.
    toggle(): void {
        this.tema.update(t => t === 'dark' ? 'light' : 'dark');
    }

    // Método de conveniencia para simplificar las comprobaciones en las plantillas.
    // Evita que los templates tengan que comparar strings: en lugar de
    //   *ngIf="tema() === 'dark'"
    // se puede usar:
    //   *ngIf="esDark()"
    esDark(): boolean {
        return this.tema() === 'dark';
    }

    // Aplica el tema modificando la clase del elemento <html>.
    // document.documentElement siempre apunta al elemento raíz del documento (<html>).
    // Tailwind activa los estilos dark: cuando la clase 'dark' está presente.
    // NOTA: en este proyecto se usa 'light' como clase toggle (en lugar de 'dark')
    // porque el tema por defecto es oscuro; se añade 'light' para cambiar a claro.
    private aplicarTema(t: 'dark' | 'light'): void {
        const html = document.documentElement;
        if (t === 'light') {
            html.classList.add('light');
        } else {
            html.classList.remove('light');
        }
    }
}
