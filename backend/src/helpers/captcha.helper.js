const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

// Umbral mínimo de puntuación para reCAPTCHA v3 (0.0 bot – 1.0 humano)
const SCORE_MINIMO = 0.5;

export const verificarCaptcha = async (token) => {
    if (!RECAPTCHA_SECRET) {
        console.warn('[CAPTCHA] RECAPTCHA_SECRET_KEY no configurada — verificación omitida');
        return { ok: true };
    }

    if (!token) {
        return { ok: false, message: 'Por favor, completa el CAPTCHA' };
    }

    try {
        const respuesta = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    `secret=${RECAPTCHA_SECRET}&response=${token}`
        });

        const datos = await respuesta.json();

        if (!datos.success) {
            return { ok: false, message: 'Verificación CAPTCHA fallida. Inténtalo de nuevo.' };
        }

        // v3: comprobar puntuación
        if (typeof datos.score === 'number' && datos.score < SCORE_MINIMO) {
            return { ok: false, message: 'Actividad sospechosa detectada. Inténtalo de nuevo.' };
        }

        return { ok: true };

    } catch (error) {
        console.error('[CAPTCHA] Error al verificar:', error.message);
        return { ok: true };
    }
};
