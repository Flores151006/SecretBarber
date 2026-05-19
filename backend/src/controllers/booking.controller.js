// ─────────────────────────────────────────────────────────────────────────────
// booking.controller.js
//
// Controlador principal de reservas. Gestiona todo el ciclo de vida de una cita:
// consultar disponibilidad, crear, modificar, cancelar y actualizar estado/pago.
// También integra Stripe para pagos con tarjeta y gestiona los webhooks de Stripe.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'stripe';
import { validationResult } from 'express-validator';
import { Booking }  from '../models/booking.model.js';
import { Servicio } from '../models/servicio.model.js';
import { Barbero }  from '../models/barbero.model.js';
import { User }     from '../models/user.model.js';
import { enviarConfirmacionReserva, enviarEmailReservaConfirmada } from '../helpers/email.helper.js';
import { STRIPE_SECRET_KEY } from '../config.js';

// Inicializar el cliente de Stripe con la clave secreta del servidor
// Esta clave NUNCA llega al frontend — solo existe en el backend
const stripe = new Stripe(STRIPE_SECRET_KEY);

// ─── Helpers de conversión de tiempo ─────────────────────────────────────────
// Estas funciones convierten entre formato "HH:MM" y minutos totales desde las 00:00.
// Por ejemplo: "10:30" → 630 minutos, 630 → "10:30"
// Trabajar con minutos (números enteros) hace el cálculo de solapamientos mucho más sencillo

// Convierte "HH:MM" a minutos totales (ej: "10:30" → 630)
const toMinutes = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
};

// Convierte minutos totales a "HH:MM" (ej: 630 → "10:30")
const toHora = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

// ── GET /disponibilidad ───────────────────────────────────────────────────────
// Calcula qué franjas horarias están libres para un barbero, fecha y duración dados.
// Angular llama a este endpoint cada vez que el usuario cambia barbero, fecha o servicios.
export const getDisponibilidad = async (req, res) => {
    try {
        const { barbero: barberoId, fecha, duracion } = req.query;
        if (!barberoId || !fecha || !duracion)
            return res.status(400).json({ message: 'Faltan parámetros: barbero, fecha, duracion' });

        // Verificar que el barbero existe y está activo
        const barbero = await Barbero.findById(barberoId);
        if (!barbero || !barbero.activo)
            return res.status(404).json({ message: 'Barbero no encontrado' });

        // getUTCDay() devuelve 0 (domingo) a 6 (sábado)
        // Si el día de la semana no está en los días de trabajo del barbero, no hay huecos
        const diaSemana = new Date(fecha).getUTCDay();
        if (!barbero.diasTrabajo.includes(diaSemana))
            return res.json({ data: [] }); // Día no laborable → lista vacía

        const durMin    = parseInt(duracion);
        const inicioMin = toMinutes(barbero.horaInicio); // Ej: "09:00" → 540
        const finMin    = toMinutes(barbero.horaFin);    // Ej: "20:00" → 1200

        // Obtener todas las reservas existentes de ese barbero en esa fecha
        const reservas = await Booking.find({
            barbero: barberoId,
            fecha:   new Date(fecha)
        });

        // Convertir cada reserva a un objeto {inicio, fin} en minutos
        // "fin" es inicio + duración total del servicio reservado
        const ocupados = reservas.map(r => ({
            inicio: toMinutes(r.hora),
            fin:    toMinutes(r.hora) + r.duracionTotal
        }));

        // ── Algoritmo de slots disponibles ────────────────────────────────────
        // Iteramos en pasos de 30 minutos desde la apertura hasta el cierre
        // Para cada slot candidato, comprobamos si solapa con alguna reserva existente
        const disponibles = [];
        for (let min = inicioMin; min + durMin <= finMin; min += 30) {
            const finReserva = min + durMin;

            // Fórmula de solapamiento de intervalos:
            // A solapa con B si: A.inicio < B.fin Y A.fin > B.inicio
            // Esta fórmula cubre todos los casos de solapamiento posibles
            const solapada = ocupados.some(o => min < o.fin && finReserva > o.inicio);

            if (!solapada) disponibles.push(toHora(min)); // Slot libre → añadir a la lista
        }

        res.json({ data: disponibles });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener disponibilidad', error: error.message });
    }
};

// ── GET / — Todas las reservas (Admin) ───────────────────────────────────────
// Solo accesible para admins. Devuelve todas las reservas con los datos populados.
// .populate() hace el equivalente a un JOIN en SQL, trayendo los datos completos
// del cliente, barbero y servicios en vez de solo sus IDs.
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('cliente',   'name email')   // Solo traemos nombre y email del cliente
            .populate('barbero',   'nombre')        // Solo el nombre del barbero
            .populate('servicios', 'nombre precio duracion') // Nombre, precio y duración de cada servicio
            .sort({ fecha: 1, hora: 1 }); // Ordenar por fecha ascendente, luego por hora
        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// ── GET /mis — Mis reservas ───────────────────────────────────────────────────
// Devuelve solo las reservas del usuario autenticado.
// req.user.id viene del middleware autenticarToken (del JWT)
export const getMisBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ cliente: req.user.id })
            .populate('barbero',   'nombre')
            .populate('servicios', 'nombre precio duracion')
            .sort({ fecha: 1, hora: 1 });
        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tus reservas', error: error.message });
    }
};

// ── POST / — Crear reserva ────────────────────────────────────────────────────
// El cliente selecciona barbero, servicios, fecha, hora y método de pago.
// Si paga con tarjeta → creamos una sesión de Stripe y devolvemos la URL de pago.
// Si paga en efectivo → creamos la reserva directamente con estado 'pendiente'.
export const crearBooking = async (req, res) => {
    try {
        // Validar los datos del cuerpo de la petición (express-validator)
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { barbero: barberoId, servicios: serviciosIds, fecha, hora, metodoPago, cejas, notas } = req.body;

        // Verificar que el barbero existe y está activo
        const barbero = await Barbero.findById(barberoId);
        if (!barbero || !barbero.activo)
            return res.status(404).json({ message: 'Barbero no encontrado' });

        // Verificar que todos los servicios existen y están activos
        // $in es un operador MongoDB que busca documentos donde _id esté en el array
        const servicios = await Servicio.find({ _id: { $in: serviciosIds }, activo: true });
        if (servicios.length !== serviciosIds.length)
            return res.status(400).json({ message: 'Algún servicio no existe o está inactivo' });

        // Calcular precio y duración total sumando todos los servicios seleccionados
        let precio        = servicios.reduce((acc, s) => acc + s.precio, 0);
        let duracionTotal = servicios.reduce((acc, s) => acc + s.duracion, 0);
        if (cejas) precio += 1; // Las cejas cuestan 1€ extra

        // Verificar que no hay solapamiento con reservas existentes ese día
        const reservasDelDia = await Booking.find({
            barbero: barberoId,
            fecha:   new Date(fecha)
        });
        const finReserva = toMinutes(hora) + duracionTotal;
        const solapada = reservasDelDia.some(r => {
            const rInicio = toMinutes(r.hora);
            const rFin    = rInicio + r.duracionTotal;
            return toMinutes(hora) < rFin && finReserva > rInicio; // Fórmula de solapamiento
        });
        if (solapada) return res.status(409).json({ message: 'Esa franja horaria ya está ocupada' });

        // ── Pago en efectivo ──────────────────────────────────────────────────
        if (metodoPago === 'efectivo') {
            // Crear la reserva directamente — no necesita confirmación de pago
            const booking = await Booking.create({
                cliente: req.user.id, barbero: barberoId, servicios: serviciosIds,
                fecha, hora, duracionTotal, precio, cejas: cejas || false,
                metodoPago: 'efectivo', estadoPago: 'pendiente', estado: 'pendiente', notas: notas || null
            });

            // Poblar los datos del booking para incluirlos en el email de confirmación
            const bookingPopulado = await Booking.findById(booking._id)
                .populate('servicios', 'nombre')
                .populate('barbero',   'nombre');

            // Enviar email de confirmación de forma asíncrona (no bloquea la respuesta)
            User.findById(req.user.id).then(usuario => {
                if (usuario) enviarConfirmacionReserva(usuario, bookingPopulado)
                    .catch(e => console.error('[EMAIL] Error al enviar confirmación:', e.message));
            });

            return res.status(201).json({ message: 'Reserva creada. Pago en local.', bookingId: booking._id });
        }

        // ── Pago con tarjeta (Stripe Checkout) ────────────────────────────────
        if (metodoPago === 'tarjeta') {
            // Crear la reserva primero con estadoPago:'pendiente'
            // El estado cambiará a 'pagado'/'confirmada' cuando Stripe nos notifique
            const booking = await Booking.create({
                cliente: req.user.id, barbero: barberoId, servicios: serviciosIds,
                fecha, hora, duracionTotal, precio, cejas: cejas || false,
                metodoPago: 'tarjeta', estadoPago: 'pendiente', estado: 'pendiente', notas: notas || null
            });

            const nombreServicios = servicios.map(s => s.nombre).join(', ');

            // Crear una sesión de Stripe Checkout
            // El usuario será redirigido a la página de pago segura de Stripe
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment', // Un solo pago (no suscripción)
                line_items: [{
                    price_data: {
                        currency:     'eur',
                        product_data: { name: `Secret Barber — ${nombreServicios}` },
                        unit_amount:  precio * 100 // Stripe trabaja en CÉNTIMOS, no euros
                    },
                    quantity: 1
                }],
                // Guardamos el ID de la reserva en metadata para vincularlo en el webhook
                metadata: { bookingId: booking._id.toString() },
                // URL a la que redirige Stripe si el pago se completa
                success_url: `${process.env.FRONTEND_URL}/reserva/confirmada?session_id={CHECKOUT_SESSION_ID}`,
                // URL a la que redirige Stripe si el usuario cancela el pago
                cancel_url:  `${process.env.FRONTEND_URL}/reserva/cancelada`
            });

            // Guardar el ID de la sesión de Stripe en la reserva (útil para seguimiento)
            await Booking.findByIdAndUpdate(booking._id, { stripeSessionId: session.id });

            // Devolver la URL de Stripe al frontend — Angular redirige al usuario ahí
            return res.status(200).json({ url: session.url });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error al crear la reserva', error: error.message });
    }
};

// ── POST /webhook — Stripe webhook ───────────────────────────────────────────
// Stripe llama a este endpoint automáticamente cuando ocurre un evento de pago.
// Es como una "notificación push" de Stripe al backend.
//
// CRÍTICO: Este endpoint recibe el cuerpo como Buffer RAW (bytes en bruto), NO como JSON.
// Stripe firma cada webhook con una firma digital y necesita el cuerpo original para
// verificar esa firma. Si Express parsea el body antes (con express.json()),
// la verificación falla porque el contenido ya no es el original.
// Por eso en app.js declaramos express.raw() ANTES de express.json() para esta ruta.
export const stripeWebhook = async (req, res) => {
    // La firma de Stripe viene en la cabecera HTTP 'stripe-signature'
    const sig    = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        // constructEvent verifica la firma criptográfica del webhook
        // Si req.body no es el Buffer original, esta línea lanza una excepción
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (error) {
        return res.status(400).json({ message: `Webhook error: ${error.message}` });
    }

    // Solo nos interesan los pagos completados
    if (event.type === 'checkout.session.completed') {
        const session   = event.data.object;
        // Recuperamos el ID de la reserva que guardamos en metadata al crear la sesión
        const bookingId = session.metadata.bookingId;

        // Actualizar la reserva: marcarla como pagada y confirmada
        // { new: true } → devuelve el documento DESPUÉS de la actualización
        const booking = await Booking.findByIdAndUpdate(bookingId, {
            estadoPago: 'pagado', estado: 'confirmada'
        }, { new: true })
            .populate('servicios', 'nombre')
            .populate('barbero',   'nombre');

        // Enviar email de confirmación al cliente
        if (booking) {
            const usuario = await User.findById(booking.cliente);
            if (usuario) await enviarConfirmacionReserva(usuario, booking);
        }
    }
    // Stripe requiere un 200 para saber que el webhook fue procesado correctamente
    res.status(200).json({ received: true });
};

// ── PATCH /:id — Cancelar reserva (Cliente) ──────────────────────────────────
// El cliente cancela su propia reserva. En vez de marcarla como 'cancelada',
// la ELIMINAMOS de la base de datos para mantener la BD limpia.
export const cancelarBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });

        // Un cliente solo puede cancelar SUS propias reservas
        // El admin no tiene esta restricción (su rol es 'Admin')
        if (req.user.role === 'Cliente' && booking.cliente.toString() !== req.user.id)
            return res.status(403).json({ message: 'No puedes cancelar una reserva que no es tuya' });

        // Solo se pueden cancelar reservas pendientes o confirmadas (no completadas)
        if (!['pendiente', 'confirmada'].includes(booking.estado))
            return res.status(400).json({ message: 'No puedes cancelar esta reserva' });

        // Eliminación real del documento — la reserva desaparece de la BD
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Reserva cancelada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cancelar la reserva', error: error.message });
    }
};

// ── PATCH /:id/estado — Actualizar estado (Admin) ────────────────────────────
// El admin puede cambiar el estado de una reserva: confirmarla, completarla o cancelarla.
// Si el nuevo estado es 'cancelada', eliminamos la reserva directamente.
export const actualizarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['pendiente', 'confirmada', 'completada', 'cancelada'].includes(estado))
            return res.status(400).json({ message: 'Estado no válido' });

        // Caso especial: cancelar → borrar el documento en vez de actualizar el estado
        if (estado === 'cancelada') {
            const deleted = await Booking.findByIdAndDelete(req.params.id);
            if (!deleted) return res.status(404).json({ message: 'Reserva no encontrada' });
            return res.status(200).json({ message: 'Reserva cancelada y eliminada' });
        }

        // Para los demás estados, actualizar el campo estado normalmente
        const booking = await Booking.findByIdAndUpdate(req.params.id, { estado }, { new: true })
            .populate('barbero',   'nombre')
            .populate('servicios', 'nombre precio');
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });

        // Si el admin confirma la reserva, notificar al cliente por email
        if (estado === 'confirmada') {
            User.findById(booking.cliente).then(usuario => {
                if (usuario) enviarEmailReservaConfirmada(usuario, booking)
                    .catch(e => console.error('[EMAIL] Error al enviar confirmación de admin:', e.message));
            });
        }

        res.status(200).json({ message: `Reserva marcada como ${estado}` });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado', error: error.message });
    }
};

// ── PATCH /:id/pago — Actualizar pago (Admin) ────────────────────────────────
// El admin marca una reserva de efectivo como pagada cuando el cliente paga en la barbería.
export const actualizarPago = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { estadoPago: 'pagado' },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
        res.status(200).json({ message: 'Reserva marcada como pagada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el pago', error: error.message });
    }
};

// ── PATCH /:id/modificar — Modificar reserva (Cliente) ───────────────────────
// El cliente puede cambiar barbero, servicios, fecha, hora y método de pago
// siempre que la reserva esté en estado 'pendiente' o 'confirmada'.
// Al modificar, vuelve a estado 'pendiente' para que el barbero reconfirme.
export const modificarBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });

        // Verificar que la reserva pertenece al usuario que hace la petición
        if (booking.cliente.toString() !== req.user.id)
            return res.status(403).json({ message: 'No puedes modificar una reserva que no es tuya' });

        // Solo se pueden modificar reservas que aún no han ocurrido o están por confirmar
        if (!['pendiente', 'confirmada'].includes(booking.estado))
            return res.status(400).json({ message: 'Solo puedes modificar reservas pendientes o confirmadas' });

        const { servicios: serviciosIds, barbero: barberoId, fecha, hora, metodoPago, cejas, notas } = req.body;

        // Recalcular precio y duración con los nuevos servicios seleccionados
        const servicios   = await Servicio.find({ _id: { $in: serviciosIds }, activo: true });
        let precio        = servicios.reduce((acc, s) => acc + s.precio, 0);
        let duracionTotal = servicios.reduce((acc, s) => acc + s.duracion, 0);
        if (cejas) precio += 1;

        // Verificar solapamiento con otras reservas, EXCLUYENDO la propia reserva actual
        // $ne: booking._id → "not equal" — excluir el propio documento de la búsqueda
        const finReserva = toMinutes(hora) + duracionTotal;
        const reservasDelDia = await Booking.find({
            barbero: barberoId,
            fecha:   new Date(fecha),
            _id:     { $ne: booking._id } // Excluir la reserva que estamos modificando
        });
        const solapada = reservasDelDia.some(r => {
            const rInicio = toMinutes(r.hora);
            const rFin    = rInicio + r.duracionTotal;
            return toMinutes(hora) < rFin && finReserva > rInicio;
        });
        if (solapada) return res.status(409).json({ message: 'Esa franja horaria ya está ocupada' });

        // Actualizar la reserva con los nuevos datos
        // estado:'pendiente' → el barbero debe volver a confirmar la cita modificada
        await Booking.findByIdAndUpdate(req.params.id, {
            servicios: serviciosIds, barbero: barberoId,
            fecha, hora, duracionTotal, precio,
            cejas: cejas || false, metodoPago, notas: notas || null,
            estado: 'pendiente' // Resetear estado para que el admin la reconfirme
        });

        res.status(200).json({ message: 'Reserva modificada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al modificar la reserva', error: error.message });
    }
};


// ── GET /estadisticas — Estadísticas económicas (Admin) ──────────────────────
// Devuelve KPIs (ingresos, número de reservas, ticket medio) y datos para gráficos
// filtrados por diferentes periodos de tiempo.
export const getEstadisticas = async (req, res) => {
    try {
        const { filtro = 'mes', fechaInicio, fechaFin } = req.query;

        const ahora     = new Date();
        const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

        // Calcular las fechas de inicio y fin según el filtro seleccionado
        let inicio, fin;

        switch (filtro) {
            case 'hoy':
                inicio = new Date(hoyInicio);
                fin    = new Date(hoyInicio); fin.setHours(23, 59, 59, 999);
                break;
            case 'semana':
                inicio = new Date(hoyInicio); inicio.setDate(inicio.getDate() - 6);
                fin    = new Date(hoyInicio); fin.setHours(23, 59, 59, 999);
                break;
            case 'anio':
                inicio = new Date(ahora.getFullYear(), 0, 1);   // 1 enero
                fin    = new Date(ahora.getFullYear(), 11, 31, 23, 59, 59, 999); // 31 diciembre
                break;
            case 'rango':
                // Rango personalizado — el admin elige fechaInicio y fechaFin
                if (!fechaInicio || !fechaFin)
                    return res.status(400).json({ message: 'Faltan fechaInicio y fechaFin' });
                inicio = new Date(fechaInicio);
                fin    = new Date(fechaFin); fin.setHours(23, 59, 59, 999);
                if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin)
                    return res.status(400).json({ message: 'Rango de fechas inválido' });
                break;
            default: // 'mes' — mes actual por defecto
                inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                fin    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Solo contamos reservas con pago confirmado (no pendientes de pago)
        // $gte = mayor o igual que, $lte = menor o igual que
        const pagadas = await Booking.find({
            estadoPago: 'pagado',
            fecha: { $gte: inicio, $lte: fin }
        }).populate('servicios', 'nombre precio');

        // ── KPIs ──────────────────────────────────────────────────────────────
        // reduce acumula la suma de todos los precios
        // Math.round(...* 100) / 100 redondea a 2 decimales para evitar errores de punto flotante
        const total       = Math.round(pagadas.reduce((acc, b) => acc + b.precio, 0) * 100) / 100;
        const reservas    = pagadas.length;
        const ticketMedio = reservas > 0 ? Math.round((total / reservas) * 100) / 100 : 0;

        // ── Datos para el gráfico de barras ───────────────────────────────────
        // Agrupa los ingresos por periodo (hora, día, semana, mes) para la visualización
        let ingresosPorPeriodo = [];

        if (filtro === 'hoy') {
            // Agrupar por hora (de 8h a 20h)
            ingresosPorPeriodo = Array.from({ length: 13 }, (_, i) => {
                const h = 8 + i;
                const t = pagadas
                    .filter(b => parseInt(b.hora.split(':')[0]) === h)
                    .reduce((acc, b) => acc + b.precio, 0);
                return { label: `${String(h).padStart(2, '0')}h`, total: Math.round(t * 100) / 100 };
            });

        } else if (filtro === 'semana') {
            // Agrupar por día de la semana (últimos 7 días)
            ingresosPorPeriodo = Array.from({ length: 7 }, (_, i) => {
                const dia    = new Date(hoyInicio); dia.setDate(dia.getDate() - 6 + i);
                const diaFin = new Date(dia); diaFin.setHours(23, 59, 59, 999);
                const t      = pagadas
                    .filter(b => { const f = new Date(b.fecha); return f >= dia && f <= diaFin; })
                    .reduce((acc, b) => acc + b.precio, 0);
                return {
                    label: dia.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                    total: Math.round(t * 100) / 100
                };
            });

        } else if (filtro === 'mes') {
            // Agrupar por día del mes actual
            const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
            ingresosPorPeriodo = Array.from({ length: diasEnMes }, (_, i) => {
                const dia    = new Date(ahora.getFullYear(), ahora.getMonth(), i + 1);
                const diaFin = new Date(ahora.getFullYear(), ahora.getMonth(), i + 1, 23, 59, 59, 999);
                const t      = pagadas
                    .filter(b => { const f = new Date(b.fecha); return f >= dia && f <= diaFin; })
                    .reduce((acc, b) => acc + b.precio, 0);
                return { label: `${i + 1}`, total: Math.round(t * 100) / 100 };
            });

        } else if (filtro === 'anio') {
            // Agrupar por mes del año
            ingresosPorPeriodo = Array.from({ length: 12 }, (_, i) => {
                const mesInicio = new Date(ahora.getFullYear(), i, 1);
                const mesFin    = new Date(ahora.getFullYear(), i + 1, 0, 23, 59, 59, 999);
                const t         = pagadas
                    .filter(b => { const f = new Date(b.fecha); return f >= mesInicio && f <= mesFin; })
                    .reduce((acc, b) => acc + b.precio, 0);
                return {
                    label: mesInicio.toLocaleDateString('es-ES', { month: 'short' }),
                    total: Math.round(t * 100) / 100
                };
            });

        } else { // rango personalizado
            const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 31) {
                // Rango corto (≤31 días) → agrupar por día
                ingresosPorPeriodo = Array.from({ length: diffDays }, (_, i) => {
                    const dia    = new Date(inicio); dia.setDate(dia.getDate() + i); dia.setHours(0, 0, 0, 0);
                    const diaFin = new Date(dia); diaFin.setHours(23, 59, 59, 999);
                    const t      = pagadas
                        .filter(b => { const f = new Date(b.fecha); return f >= dia && f <= diaFin; })
                        .reduce((acc, b) => acc + b.precio, 0);
                    return {
                        label: dia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                        total: Math.round(t * 100) / 100
                    };
                });
            } else {
                // Rango largo (>31 días) → agrupar por mes para que el gráfico sea legible
                const meses  = [];
                const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
                while (cursor <= fin) { meses.push(new Date(cursor)); cursor.setMonth(cursor.getMonth() + 1); }
                ingresosPorPeriodo = meses.map(mesInicio => {
                    const mesFin = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + 1, 0, 23, 59, 59, 999);
                    const t      = pagadas
                        .filter(b => { const f = new Date(b.fecha); return f >= mesInicio && f <= mesFin; })
                        .reduce((acc, b) => acc + b.precio, 0);
                    return {
                        label: mesInicio.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                        total: Math.round(t * 100) / 100
                    };
                });
            }
        }

        // ── Ranking de servicios más populares ────────────────────────────────
        // Contamos cuántas veces aparece cada servicio en las reservas del periodo
        const conteoServicios = {};
        pagadas.forEach(b => {
            (b.servicios || []).forEach(s => {
                const nombre = s.nombre || 'Desconocido';
                conteoServicios[nombre] = (conteoServicios[nombre] || 0) + 1;
            });
        });
        // Ordenar de mayor a menor y quedarnos con el Top 5
        const serviciosRanking = Object.entries(conteoServicios)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([nombre, count]) => ({ nombre, count }));

        res.json({
            data: {
                resumen: { total, reservas, ticketMedio },
                ingresosPorPeriodo,
                serviciosRanking
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};
