// ─────────────────────────────────────────────────────────────────────────────
// mailer.js
//
// Función centralizada para el envío de emails transaccionales.
// Usa la API REST de Brevo (antes Sendinblue) en lugar de SMTP directo.
//
// ¿Por qué Brevo y no SMTP propio?
//   Al intentar enviar emails desde un servidor genérico, los filtros de spam
//   de Gmail/Outlook los rechazan porque el dominio remitente no tiene los registros
//   DNS de seguridad (SPF y DKIM) correctamente configurados.
//   Brevo es un servicio profesional de email transaccional que ya tiene toda
//   la infraestructura de reputación configurada → los correos llegan a la bandeja
//   de entrada en lugar de spam.
//
// Esta función es un wrapper simple: encapsula la llamada a Brevo para que el
// resto del código solo tenga que llamar a sendMail({ to, subject, html }).
// ─────────────────────────────────────────────────────────────────────────────

export const sendMail = async ({ to, subject, html }) => {
    // Llamada a la API REST de Brevo usando fetch nativo de Node.js 18+
    // (no necesitamos instalar ninguna librería adicional)
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
            'accept':       'application/json',
            'api-key':      process.env.BREVO_API_KEY,   // Clave secreta de la cuenta Brevo
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            // Remitente — debe ser el email verificado en la cuenta de Brevo
            sender:      { name: 'Secret Barber', email: process.env.BREVO_FROM_EMAIL },
            // Destinatario — el email del usuario que recibirá el correo
            to:          [{ email: to }],
            subject,
            // htmlContent acepta HTML completo con estilos inline
            // Los estilos deben ser inline porque muchos clientes de email (Outlook, Apple Mail)
            // no soportan hojas de estilo externas ni <style> en el <head>
            htmlContent: html
        })
    });

    // Si la respuesta no es 2xx, Brevo devuelve un JSON con el mensaje de error
    if (!response.ok) {
        const err = await response.json().catch(() => ({})); // Si el JSON falla, objeto vacío
        throw new Error(err.message || `Brevo error ${response.status}`);
    }

    // Respuesta exitosa — Brevo devuelve el ID del mensaje (útil para debugging)
    const data = await response.json();
    console.log('[MAILER] ✅ Email enviado, id:', data.messageId);
};
