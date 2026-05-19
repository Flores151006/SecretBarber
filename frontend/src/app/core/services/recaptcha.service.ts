// ─────────────────────────────────────────────────────────────────────────────
// recaptcha.service.ts
//
// Servicio que gestiona la integración con Google reCAPTCHA v3 de forma
// completamente transparente para los componentes que lo usan.
//
// QUÉ ES reCAPTCHA v3:
// Es un sistema antispam de Google que analiza el comportamiento del usuario
// (movimientos del ratón, tiempo en la página, historial de navegación) y
// devuelve una PUNTUACIÓN de 0.0 a 1.0 (1.0 = muy probablemente humano).
// A diferencia de v2 ("No soy un robot"), v3 es INVISIBLE: el usuario
// nunca ve ningún widget ni tiene que resolver ningún reto.
// El token que devuelve execute() se envía al backend junto con el formulario;
// el backend lo verifica con la API de Google usando la clave SECRETA.
//
// CÓMO SE CARGA EL SCRIPT:
// En lugar de poner el <script> en index.html (que lo cargaría siempre),
// este servicio lo añade dinámicamente al <head> solo la primera vez que
// se necesita (lazy loading del script). Esto mejora el tiempo de carga inicial.
//
// DECISIÓN DE DISEÑO — scriptPromesa como caché:
// Si dos componentes llaman a execute() casi al mismo tiempo (p.ej. en el
// mismo ciclo de navegación), el script solo se inserta una vez. La promesa
// guardada en scriptPromesa se reutiliza para ambas llamadas.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser }               from '@angular/common';
import { environment }                     from '../../../environments/environment';

// Interfaz para tipar el objeto global window.grecaptcha.
// No existe un paquete de tipos oficial para reCAPTCHA v3, así que se define
// manualmente con los dos métodos que usamos.
interface GrecaptchaV3 {
    ready:   (cb: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
    // PLATFORM_ID permite detectar si el código se ejecuta en el navegador
    // o en el servidor (SSR). Los scripts del DOM solo se pueden insertar
    // en el navegador, por eso se comprueba isPlatformBrowser() antes de actuar.
    private readonly platformId = inject(PLATFORM_ID);

    // Caché de la promesa de carga del script. Si es null, el script no se ha
    // solicitado todavía. Una vez iniciada la carga, se guarda aquí para
    // no duplicar el <script> si se llama a execute() varias veces.
    private scriptPromesa: Promise<void> | null = null;

    // Inserta el script de reCAPTCHA v3 en el <head> de forma lazy y devuelve
    // una Promise que se resuelve cuando grecaptcha.execute está disponible.
    private cargarScript(): Promise<void> {
        // Si ya existe la promesa (el script ya fue solicitado), la reutiliza.
        if (this.scriptPromesa) return this.scriptPromesa;

        this.scriptPromesa = new Promise<void>((resolve, reject) => {
            const win = window as unknown as Record<string, unknown>;
            const gr  = win['grecaptcha'] as GrecaptchaV3 | undefined;

            // Caso 1: grecaptcha ya está cargado (por ejemplo, si index.html
            // lo incluye estáticamente). Se resuelve inmediatamente.
            if (gr && typeof gr.execute === 'function') {
                resolve();
                return;
            }

            // Caso 2: el <script> ya existe en el DOM (quizás lo añadió otra
            // instancia del servicio antes del primer resolve). Se hace polling
            // hasta que grecaptcha esté listo.
            if (document.querySelector('script[src*="recaptcha/api.js"]')) {
                const poll = setInterval(() => {
                    const g = win['grecaptcha'] as GrecaptchaV3 | undefined;
                    if (g && typeof g.execute === 'function') {
                        clearInterval(poll);
                        resolve();
                    }
                }, 50);
                // Timeout de seguridad: si en 10 segundos no carga, rechaza la promesa.
                setTimeout(() => { clearInterval(poll); reject(new Error('reCAPTCHA timeout')); }, 10000);
                return;
            }

            // Caso 3: el script no existe. Se crea y se añade al <head>.
            // El parámetro ?render=<siteKey> activa el modo v3 (invisible).
            const script   = document.createElement('script');
            script.src     = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
            script.async   = true;
            script.defer   = true;
            script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
            document.head.appendChild(script);

            // v3 no tiene onload callback — polling hasta que esté listo
            const poll = setInterval(() => {
                const g = win['grecaptcha'] as GrecaptchaV3 | undefined;
                if (g && typeof g.execute === 'function') {
                    clearInterval(poll);
                    resolve();
                }
            }, 50);
            setTimeout(() => { clearInterval(poll); reject(new Error('reCAPTCHA timeout')); }, 10000);
        });

        return this.scriptPromesa;
    }

    // Método público que los componentes llaman para obtener el token.
    // El parámetro "action" identifica qué acción protege (p.ej. 'login', 'register').
    // Google usa este valor para sus estadísticas y para ajustar la puntuación.
    // Si reCAPTCHA falla o no está disponible (SSR), devuelve '' para no bloquear
    // el flujo del formulario; el backend decidirá si requiere el token.
    async execute(action = 'submit'): Promise<string> {
        // No intenta cargar el script fuera del navegador (SSR/prerender)
        // ni si no hay clave configurada (entorno de tests).
        if (!environment.recaptchaSiteKey || !isPlatformBrowser(this.platformId)) return '';

        try {
            await this.cargarScript();
            const gr = (window as unknown as Record<string, unknown>)['grecaptcha'] as GrecaptchaV3;
            return await new Promise<string>((resolve) => {
                // gr.ready() espera a que la librería esté completamente inicializada
                // antes de llamar a execute(), que es la llamada que genera el token.
                gr.ready(() => {
                    gr.execute(environment.recaptchaSiteKey, { action })
                        .then(resolve)
                        .catch(() => resolve('')); // si falla, devuelve cadena vacía
                });
            });
        } catch {
            // En caso de cualquier error inesperado, la app sigue funcionando
            // pero sin token (el backend puede optar por rechazar o aceptar).
            return '';
        }
    }
}
