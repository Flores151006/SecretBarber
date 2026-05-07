import { transporter } from '../config/mailer.js';

export const enviarEmailVerificacion = async (usuario, token) => {
    const url = `${process.env.FRONTEND_URL}/confirmar-email?token=${token}`;
    await transporter.sendMail({
        from:    `"Secret Barber" <${process.env.EMAIL_USER}>`,
        to:      usuario.email,
        subject: '✉️ Confirma tu cuenta - Secret Barber',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111111; color: #F5F5F5; padding: 40px; border-radius: 8px;">
                <h1 style="color: #C9A84C; font-family: Georgia, serif; text-align: center;">Secret Barber</h1>
                <div style="border-top: 1px solid #C9A84C33; margin: 20px 0;"></div>

                <h2 style="color: #F5F5F5;">Confirma tu cuenta ✉️</h2>
                <p style="color: #999;">Hola <strong style="color: #F5F5F5;">${usuario.name}</strong>, gracias por registrarte en Secret Barber.</p>
                <p style="color: #999;">Haz clic en el siguiente enlace para verificar tu dirección de correo y activar tu cuenta:</p>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="${url}"
                       style="display: inline-block; background: #C9A84C; color: #111111; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                        Verificar mi cuenta
                    </a>
                </div>

                <p style="color: #666; font-size: 13px;">Este enlace expira en <strong style="color: #F5F5F5;">24 horas</strong>.</p>
                <p style="color: #666; font-size: 13px;">Si no has creado esta cuenta, ignora este correo.</p>

                <div style="border-top: 1px solid #C9A84C33; margin: 20px 0;"></div>
                <p style="color: #C9A84C; text-align: center; font-size: 12px;">© ${new Date().getFullYear()} Secret Barber. Todos los derechos reservados.</p>
            </div>
        `
    });
};

export const enviarConfirmacionReserva = async (usuario, booking) => {

    const nombreServicios = Array.isArray(booking.servicios)
        ? booking.servicios.map(s => s.nombre || s).join(', ')
        : booking.servicios || 'No especificado';

    const nombreBarbero = booking.barbero?.nombre || booking.barbero || 'No especificado';

    await transporter.sendMail({
        from:    `"Secret Barber" <${process.env.EMAIL_USER}>`,
        to:      usuario.email,
        subject: '✂️ Confirmación de tu reserva - Secret Barber',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111111; color: #F5F5F5; padding: 40px; border-radius: 8px;">
                <h1 style="color: #C9A84C; font-family: Georgia, serif; text-align: center;">Secret Barber</h1>
                <div style="border-top: 1px solid #C9A84C33; margin: 20px 0;"></div>

                <h2 style="color: #F5F5F5;">¡Tu reserva está confirmada! ✅</h2>
                <p style="color: #999;">Hola <strong style="color: #F5F5F5;">${usuario.name}</strong>, aquí tienes los detalles de tu cita:</p>

                <div style="background: #1C1C1C; border: 1px solid #C9A84C33; border-radius: 8px; padding: 24px; margin: 24px 0;">
                    <p style="margin: 8px 0;">💈 <strong>Barbero:</strong> ${nombreBarbero}</p>
                    <p style="margin: 8px 0;">✂️ <strong>Servicios:</strong> ${nombreServicios}</p>
                    <p style="margin: 8px 0;">📅 <strong>Fecha:</strong> ${new Date(booking.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="margin: 8px 0;">🕐 <strong>Hora:</strong> ${booking.hora}</p>
                    <p style="margin: 8px 0;">💰 <strong>Precio:</strong> ${booking.precio}€</p>
                    <p style="margin: 8px 0;">✂️ <strong>Cejas:</strong> ${booking.cejas ? 'Sí (+1€)' : 'No'}</p>
                    <p style="margin: 8px 0;">💳 <strong>Método de pago:</strong> ${booking.metodoPago === 'efectivo' ? 'Efectivo en local' : 'Tarjeta (pagado)'}</p>
                    ${booking.notas ? `<p style="margin: 8px 0;">📝 <strong>Notas:</strong> ${booking.notas}</p>` : ''}
                </div>
                

                <p style="color: #999; font-size: 14px;">Si necesitas cancelar o modificar tu cita, puedes hacerlo desde tu cuenta en nuestra web.</p>

                <div style="border-top: 1px solid #C9A84C33; margin: 20px 0;"></div>
                <p style="color: #C9A84C; text-align: center; font-size: 12px;">© ${new Date().getFullYear()} Secret Barber. Todos los derechos reservados.</p>
            </div>
        `
    });
};