// ─────────────────────────────────────────────────────────────────────────────
// captcha.helper.js
//
// Verifica los tokens de Google reCAPTCHA v3 para proteger el registro y login
// contra bots y ataques automatizados.
//
// ¿Cómo funciona reCAPTCHA v3?
//   A diferencia de reCAPTCHA v2 (las imágenes de semáforos), la v3 es INVISIBLE:
//   analiza el comportamiento del usuario en la página (movimientos de ratón, tiempo,
//   patrones de escritura) y asigna una PUNTUACIÓN entre 0.0 y 1.0:
//     - 0.0 → casi seguro que es un bot
//     - 1.0 → casi seguro que es un humano
//   El frontend genera un token con esa puntuación y lo envía al backend.
//   El backend lo verifica con la API de Google para confirmar que es auténtico.
// ─────────────────────────────────────────────────────────────────────────────

// La clave secreta del servidor (distinta a la clave pública del frontend)
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

// Umbral mínimo de puntuación para considerar al usuario como humano
// 0.5 es el valor recomendado por Google → debajo de este se bloquea la acción
const SCORE_MINIMO = 0.5;

export const verificarCaptcha = async (token) => {
    // Si no hay clave configurada (entorno de desarrollo sin CAPTCHA), dejamos pasar
    // Esto permite desarrollar sin tener que resolver CAPTCHAs constantemente
    if (!RECAPTCHA_SECRET) {
        console.warn('[CAPTCHA] RECAPTCHA_SECRET_KEY no configurada — verificación omitida');
        return { ok: true };
    }

    // El frontend debe enviar siempre un token; si no lo manda, es sospechoso
    if (!token) {
        return { ok: false, message: 'Por favor, completa el CAPTCHA' };
    }

    try {
        // Llamada a la API de Google para verificar el token
        // Se envía como application/x-www-form-urlencoded (formulario clásico, no JSON)
        const respuesta = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    `secret=${RECAPTCHA_SECRET}&response=${token}`
        });

        const datos = await respuesta.json();

        // datos.success: true si el token es auténtico (generado por nuestro frontend)
        if (!datos.success) {
            return { ok: false, message: 'Verificación CAPTCHA fallida. Inténtalo de nuevo.' };
        }

        // datos.score solo existe en reCAPTCHA v3 (en v2 no hay puntuación)
        // Verificamos con typeof para no romper si la respuesta no incluye score
        if (typeof datos.score === 'number' && datos.score < SCORE_MINIMO) {
            return { ok: false, message: 'Actividad sospechosa detectada. Inténtalo de nuevo.' };
        }

        // Token válido y puntuación suficiente → el usuario puede continuar
        return { ok: true };

    } catch (error) {
        // Si la API de Google está caída, dejamos pasar para no bloquear a usuarios reales
        // Es mejor un falso positivo (bot que pasa) que un falso negativo (usuario real bloqueado)
        console.error('[CAPTCHA] Error al verificar:', error.message);
        return { ok: true };
    }
};
