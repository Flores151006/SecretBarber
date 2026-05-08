import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async ({ to, subject, html }) => {
    const { data, error } = await resend.emails.send({
        from:    'Secret Barber <onboarding@resend.dev>',
        to,
        subject,
        html
    });
    if (error) throw new Error(error.message);
    console.log('[MAILER] ✅ Email enviado, id:', data.id);
};
