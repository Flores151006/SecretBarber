export const sendMail = async ({ to, subject, html }) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
            'accept':       'application/json',
            'api-key':      process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender:      { name: 'Secret Barber', email: process.env.BREVO_FROM_EMAIL },
            to:          [{ email: to }],
            subject,
            htmlContent: html
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Brevo error ${response.status}`);
    }

    const data = await response.json();
    console.log('[MAILER] ✅ Email enviado, id:', data.messageId);
};
