import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
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
