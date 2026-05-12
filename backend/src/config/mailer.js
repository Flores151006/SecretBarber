import nodemailer from 'nodemailer';
import { setDefaultResultOrder } from 'dns';

// Render no tiene IPv6 — forzar resolución DNS a IPv4
setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false, // STARTTLS en puerto 587
    family: 4,     // Forzar socket IPv4
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

export const sendMail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `"Secret Barber" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html
    });
    console.log('[MAILER] ✅ Email enviado, id:', info.messageId);
};
