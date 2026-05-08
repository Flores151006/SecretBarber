import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) {
        console.error('[MAILER] ❌ Error de conexión SMTP:', error.message);
        console.error('[MAILER] Usuario:', process.env.EMAIL_USER);
        console.error('[MAILER] Pass configurado:', !!process.env.EMAIL_PASS);
    } else {
        console.log('[MAILER] ✅ Conexión SMTP verificada correctamente');
    }
});