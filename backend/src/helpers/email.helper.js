// ─────────────────────────────────────────────────────────────────────────────
// email.helper.js
//
// Plantillas HTML para los correos transaccionales de Secret Barber.
//
// ¿Por qué estilos inline en lugar de una hoja CSS?
//   Los clientes de correo (Gmail, Outlook, Apple Mail…) eliminan o ignoran
//   las etiquetas <style> y los archivos CSS externos por razones de seguridad.
//   La única forma de garantizar que el diseño se vea igual en todos ellos es
//   poner los estilos directamente en cada etiqueta con style="...".
//
// ¿Por qué tablas HTML en lugar de divs con flexbox/grid?
//   Outlook (que usa el motor de Word para renderizar) no entiende flexbox.
//   Las tablas son la única estructura de maquetación 100% compatible entre
//   clientes de correo. Es una técnica heredada pero sigue siendo el estándar
//   en el mundo del email marketing.
//
// Patrón de plantilla — funciones shell() y row():
//   shell(content) es el "contenedor maestro": envuelve cualquier contenido
//   con el header (logo) y el footer comunes a todos los correos.
//   row(icon, label, value) genera una fila de detalle reutilizable (barbero,
//   fecha, precio…) para no repetir ese bloque de tabla en cada plantilla.
//   Ambas son funciones puras que devuelven strings de HTML, fáciles de
//   componer y de testear.
// ─────────────────────────────────────────────────────────────────────────────
import { sendMail } from '../config/mailer.js';

// ── Paleta de colores centralizada ───────────────────────────────────────────
// Definir los colores aquí y referenciarlos con BASE.xxx evita que un cambio
// de marca obligue a editar docenas de cadenas dispersas por el archivo.
const BASE = {
    bg:       '#0A0A0A',
    surface:  '#141414',
    card:     '#1A1A1A',
    gold:     '#C9A84C',
    goldDim:  '#C9A84C22',
    text:     '#F0F0F0',
    muted:    '#888888',
    border:   '#2A2A2A',
};

// ── Contenedor maestro del correo ─────────────────────────────────────────────
// Recibe el bloque <tr> de contenido específico y lo rodea con el header y
// footer comunes. Es un template literal: ${content} se sustituye en tiempo
// de ejecución, por lo que cada correo tiene su propio cuerpo.
const shell = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Secret Barber</title>
</head>
<body style="margin:0;padding:0;background:${BASE.bg};font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BASE.bg};padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BASE.surface};border-radius:16px;border:1px solid ${BASE.border};overflow:hidden;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#111111 0%,#1a1500 100%);padding:36px 40px;text-align:center;border-bottom:1px solid ${BASE.goldDim};">
            <div style="display:inline-block;width:48px;height:48px;background:${BASE.gold};border-radius:50%;margin-bottom:14px;line-height:48px;font-size:22px;">✂</div>
            <h1 style="margin:0;color:${BASE.gold};font-size:28px;font-weight:700;letter-spacing:3px;font-family:Georgia,serif;">SECRET BARBER</h1>
            <p style="margin:6px 0 0;color:${BASE.muted};font-size:12px;letter-spacing:2px;text-transform:uppercase;">Barbería Premium</p>
          </td>
        </tr>

        ${content}

        <!-- FOOTER -->
        <tr>
          <td style="background:#0D0D0D;padding:28px 40px;text-align:center;border-top:1px solid ${BASE.border};">
            <p style="margin:0 0 8px;color:${BASE.muted};font-size:12px;">© ${new Date().getFullYear()} Secret Barber · Todos los derechos reservados</p>
            <p style="margin:0;color:#555;font-size:11px;">Si tienes algún problema, contáctanos por WhatsApp</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Fila de detalle reutilizable ──────────────────────────────────────────────
// Genera un <tr> con icono, etiqueta y valor. Se usa dentro de la tabla de
// detalles de la reserva para mantener consistencia visual sin repetir código.
const row = (icon, label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BASE.border};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="32" style="color:${BASE.gold};font-size:16px;">${icon}</td>
          <td style="color:${BASE.muted};font-size:13px;width:120px;">${label}</td>
          <td style="color:${BASE.text};font-size:14px;font-weight:600;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;

// ── Email verificación de cuenta ──────────────────────────────────────────────
export const enviarEmailVerificacion = async (usuario, token) => {
    const url = `${process.env.FRONTEND_URL}/confirmar-email?token=${token}`;

    const content = `
      <!-- BODY -->
      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;color:${BASE.text};font-size:22px;font-weight:700;">Activa tu cuenta</h2>
          <p style="margin:0 0 24px;color:${BASE.muted};font-size:14px;line-height:1.6;">
            Hola <strong style="color:${BASE.text};">${usuario.name}</strong>, bienvenido a Secret Barber.<br/>
            Confirma tu dirección de correo para empezar a reservar.
          </p>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
            <tr><td align="center">
              <a href="${url}"
                 style="display:inline-block;background:${BASE.gold};color:#000000;font-weight:700;font-size:15px;padding:16px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
                Verificar mi cuenta →
              </a>
            </td></tr>
          </table>

          <div style="background:${BASE.card};border:1px solid ${BASE.border};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;color:#555;font-size:12px;">⏱ Este enlace caduca en <strong style="color:${BASE.muted};">24 horas</strong></p>
            <p style="margin:8px 0 0;color:#555;font-size:12px;">Si no has creado esta cuenta, puedes ignorar este correo.</p>
          </div>
        </td>
      </tr>`;

    console.log('[EMAIL] Enviando verificación a', usuario.email);
    await sendMail({ to: usuario.email, subject: 'Activa tu cuenta en Secret Barber', html: shell(content) });
    console.log('[EMAIL] Verificación enviada correctamente');
};

// ── Email confirmación de reserva ─────────────────────────────────────────────
export const enviarConfirmacionReserva = async (usuario, booking) => {
    // Los servicios pueden llegar como objetos populados {nombre, precio...}
    // o como strings simples dependiendo de si se hizo .populate() antes de llamar aquí
    const nombreServicios = Array.isArray(booking.servicios)
        ? booking.servicios.map(s => s.nombre || s).join(', ')
        : booking.servicios || 'No especificado';

    const nombreBarbero = booking.barbero?.nombre || booking.barbero || 'No especificado';

    // toLocaleDateString formatea la fecha según el idioma y la región.
    // 'es-ES' + opciones produce algo como "martes, 20 de mayo de 2025",
    // mucho más legible para el usuario que el formato ISO 2025-05-20.
    const fecha = new Date(booking.fecha).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Badge visual distinto según el método de pago para que el cliente
    // sepa de un vistazo si ya pagó o si pagará en el local
    const pagoBadge = booking.metodoPago === 'tarjeta'
        ? `<span style="background:#16432a;color:#4ade80;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;">PAGADO</span>`
        : `<span style="background:#2a1f00;color:${BASE.gold};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;">PAGO EN LOCAL</span>`;

    const content = `
      <!-- ESTADO BADGE -->
      <tr>
        <td style="padding:32px 40px 0;text-align:center;">
          <div style="display:inline-block;background:#16432a;border:1px solid #22c55e44;border-radius:24px;padding:8px 24px;margin-bottom:20px;">
            <span style="color:#4ade80;font-size:13px;font-weight:700;letter-spacing:1px;">✓ RESERVA RECIBIDA</span>
          </div>
          <h2 style="margin:0 0 8px;color:${BASE.text};font-size:24px;font-weight:700;">¡Nos vemos pronto, ${usuario.name.split(' ')[0]}!</h2>
          <p style="margin:0;color:${BASE.muted};font-size:14px;">Aquí tienes el resumen de tu cita</p>
        </td>
      </tr>

      <!-- DETALLES -->
      <tr>
        <td style="padding:24px 40px;">
          <div style="background:${BASE.card};border:1px solid ${BASE.border};border-radius:12px;padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${row('', 'Barbero', nombreBarbero)}
              ${row('', 'Servicios', nombreServicios)}
              ${row('', 'Fecha', fecha)}
              ${row('', 'Hora', booking.hora)}
              ${row('', 'Total', `<strong style="color:${BASE.gold};font-size:16px;">${booking.precio}&euro;</strong>`)}
              ${booking.cejas ? row('', 'Cejas', 'Incluido (+1&euro;)') : ''}
              <tr><td style="padding:10px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" style="color:${BASE.gold};font-size:16px;"></td>
                    <td style="color:${BASE.muted};font-size:13px;width:120px;">Pago</td>
                    <td>${pagoBadge}</td>
                  </tr>
                </table>
              </td></tr>
              ${booking.notas ? row('', 'Notas', `<em style="color:${BASE.muted};">${booking.notas}</em>`) : ''}
            </table>
          </div>
        </td>
      </tr>

      <!-- INFO CANCELACION -->
      <tr>
        <td style="padding:0 40px 36px;">
          <div style="background:#0D0D0D;border:1px solid ${BASE.border};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;color:#555;font-size:12px;line-height:1.7;">
              ¿Necesitas cambiar algo? Puedes <strong style="color:${BASE.muted};">modificar o cancelar</strong> tu cita desde
              <strong style="color:${BASE.muted};">Mis reservas</strong> en cualquier momento.
            </p>
          </div>
        </td>
      </tr>`;

    console.log('[EMAIL] Enviando confirmación de reserva a', usuario.email);
    await sendMail({ to: usuario.email, subject: `Tu cita del ${fecha} está confirmada — Secret Barber`, html: shell(content) });
    console.log('[EMAIL] Confirmación de reserva enviada correctamente');
};

// ── Email reserva confirmada por el peluquero ─────────────────────────────────
// Se envía cuando el admin cambia el estado de la reserva a 'confirmada'.
// Diferencia con enviarConfirmacionReserva: ese email se manda al crear la reserva
// (recepción). Este se manda cuando el peluquero la revisa y la acepta expresamente.
export const enviarEmailReservaConfirmada = async (usuario, booking) => {
    const nombreServicios = Array.isArray(booking.servicios)
        ? booking.servicios.map(s => s.nombre || s).join(', ')
        : booking.servicios || 'No especificado';

    const nombreBarbero = booking.barbero?.nombre || booking.barbero || 'No especificado';

    const fecha = new Date(booking.fecha).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Calcular cuántos días faltan para la cita (para el recordatorio)
    const hoy       = new Date(); hoy.setHours(0, 0, 0, 0);
    const diaCita   = new Date(booking.fecha); diaCita.setHours(0, 0, 0, 0);
    const diffMs    = diaCita.getTime() - hoy.getTime();
    const diffDias  = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const recordatorio = diffDias === 0
        ? 'Tu cita es <strong style="color:#F0F0F0;">hoy</strong>.'
        : diffDias === 1
            ? 'Tu cita es <strong style="color:#F0F0F0;">mañana</strong>. Recuerda tenerlo en cuenta.'
            : `Tu cita es en <strong style="color:#F0F0F0;">${diffDias} días</strong>. Apúntalo en tu agenda.`;

    const content = `
      <!-- CABECERA DE ESTADO -->
      <tr>
        <td style="padding:36px 40px 0;text-align:center;">
          <div style="display:inline-block;background:#16432a;border:1px solid #22c55e44;border-radius:24px;padding:10px 28px;margin-bottom:20px;">
            <span style="color:#4ade80;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Reserva confirmada</span>
          </div>
          <h2 style="margin:0 0 10px;color:#F0F0F0;font-size:24px;font-weight:700;">Tu cita ha sido confirmada</h2>
          <p style="margin:0;color:#888888;font-size:14px;line-height:1.6;">
            Hola <strong style="color:#F0F0F0;">${usuario.name.split(' ')[0]}</strong>,
            tu peluquero ha revisado y confirmado tu reserva. Todo está listo para el día de tu cita.
          </p>
        </td>
      </tr>

      <!-- RECORDATORIO -->
      <tr>
        <td style="padding:24px 40px 0;">
          <div style="background:#1a1500;border:1px solid #C9A84C33;border-radius:10px;padding:16px 22px;">
            <p style="margin:0;color:#C9A84C;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">Recordatorio</p>
            <p style="margin:0;color:#888888;font-size:14px;line-height:1.6;">${recordatorio}</p>
          </div>
        </td>
      </tr>

      <!-- DETALLES DE LA CITA -->
      <tr>
        <td style="padding:24px 40px;">
          <p style="margin:0 0 14px;color:#888888;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Detalles de la cita</p>
          <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;">

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 22px;border-bottom:1px solid #2A2A2A;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="color:#888888;font-size:13px;width:110px;">Barbero</td>
                    <td style="color:#F0F0F0;font-size:14px;font-weight:600;">${nombreBarbero}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 22px;border-bottom:1px solid #2A2A2A;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="color:#888888;font-size:13px;width:110px;">Servicio</td>
                    <td style="color:#F0F0F0;font-size:14px;font-weight:600;">${nombreServicios}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 22px;border-bottom:1px solid #2A2A2A;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="color:#888888;font-size:13px;width:110px;">Fecha</td>
                    <td style="color:#F0F0F0;font-size:14px;font-weight:600;">${fecha}</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 22px;border-bottom:1px solid #2A2A2A;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="color:#888888;font-size:13px;width:110px;">Hora</td>
                    <td style="color:#F0F0F0;font-size:14px;font-weight:600;">${booking.hora} h</td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 22px;">
                  <table width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="color:#888888;font-size:13px;width:110px;">Total</td>
                    <td style="color:#C9A84C;font-size:16px;font-weight:700;">${booking.precio} &euro;</td>
                  </tr></table>
                </td>
              </tr>
            </table>

          </div>
        </td>
      </tr>

      <!-- AVISO FINAL -->
      <tr>
        <td style="padding:0 40px 36px;">
          <div style="background:#0D0D0D;border:1px solid #2A2A2A;border-radius:8px;padding:16px 20px;">
            <p style="margin:0;color:#555555;font-size:12px;line-height:1.7;">
              Si necesitas cambiar o cancelar tu cita, puedes hacerlo desde
              <strong style="color:#888888;">Mis reservas</strong> antes de la fecha.
            </p>
          </div>
        </td>
      </tr>`;

    await sendMail({
        to:      usuario.email,
        subject: `Cita confirmada para el ${fecha} — Secret Barber`,
        html:    shell(content)
    });
};

// ── Email reset de contraseña ─────────────────────────────────────────────────
export const enviarEmailResetPassword = async (usuario, token) => {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const content = `
      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;color:${BASE.text};font-size:22px;font-weight:700;">Restablecer contraseña</h2>
          <p style="margin:0 0 24px;color:${BASE.muted};font-size:14px;line-height:1.6;">
            Hola <strong style="color:${BASE.text};">${usuario.name}</strong>, hemos recibido una solicitud para restablecer la contraseña de tu cuenta.<br/>
            Si no fuiste tú, puedes ignorar este correo.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
            <tr><td align="center">
              <a href="${url}"
                 style="display:inline-block;background:${BASE.gold};color:#000000;font-weight:700;font-size:15px;padding:16px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
                Restablecer contraseña →
              </a>
            </td></tr>
          </table>

          <div style="background:${BASE.card};border:1px solid ${BASE.border};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;color:#555;font-size:12px;">⏱ Este enlace caduca en <strong style="color:${BASE.muted};">1 hora</strong></p>
            <p style="margin:8px 0 0;color:#555;font-size:12px;">Si no solicitaste esto, tu contraseña no ha cambiado.</p>
          </div>
        </td>
      </tr>`;

    await sendMail({ to: usuario.email, subject: 'Restablece tu contraseña — Secret Barber', html: shell(content) });
};
