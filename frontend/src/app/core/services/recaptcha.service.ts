import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser }               from '@angular/common';
import { environment }                     from '../../../environments/environment';

interface GrecaptchaV3 {
    ready:   (cb: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
    private readonly platformId = inject(PLATFORM_ID);
    private scriptPromesa: Promise<void> | null = null;

    private cargarScript(): Promise<void> {
        if (this.scriptPromesa) return this.scriptPromesa;

        this.scriptPromesa = new Promise<void>((resolve, reject) => {
            const win = window as unknown as Record<string, unknown>;
            const gr  = win['grecaptcha'] as GrecaptchaV3 | undefined;

            if (gr && typeof gr.execute === 'function') {
                resolve();
                return;
            }

            if (document.querySelector('script[src*="recaptcha/api.js"]')) {
                const poll = setInterval(() => {
                    const g = win['grecaptcha'] as GrecaptchaV3 | undefined;
                    if (g && typeof g.execute === 'function') {
                        clearInterval(poll);
                        resolve();
                    }
                }, 50);
                setTimeout(() => { clearInterval(poll); reject(new Error('reCAPTCHA timeout')); }, 10000);
                return;
            }

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

    async execute(action = 'submit'): Promise<string> {
        if (!environment.recaptchaSiteKey || !isPlatformBrowser(this.platformId)) return '';

        try {
            await this.cargarScript();
            const gr = (window as unknown as Record<string, unknown>)['grecaptcha'] as GrecaptchaV3;
            return await new Promise<string>((resolve) => {
                gr.ready(() => {
                    gr.execute(environment.recaptchaSiteKey, { action })
                        .then(resolve)
                        .catch(() => resolve(''));
                });
            });
        } catch {
            return '';
        }
    }
}
