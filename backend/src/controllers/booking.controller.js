import Stripe from 'stripe';
import { validationResult } from 'express-validator';
import { Booking }  from '../models/booking.model.js';
import { Servicio } from '../models/servicio.model.js';
import { Barbero }  from '../models/barbero.model.js';
import { User }     from '../models/user.model.js';
import { enviarConfirmacionReserva } from '../helpers/email.helper.js';
import { STRIPE_SECRET_KEY } from '../config.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

const toMinutes = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
};
const toHora = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

// ── GET /disponibilidad ───────────────────────────────────────────────────────
export const getDisponibilidad = async (req, res) => {
    try {
        const { barbero: barberoId, fecha, duracion } = req.query;
        if (!barberoId || !fecha || !duracion)
            return res.status(400).json({ message: 'Faltan parámetros: barbero, fecha, duracion' });

        const barbero = await Barbero.findById(barberoId);
        if (!barbero || !barbero.activo)
            return res.status(404).json({ message: 'Barbero no encontrado' });

        const diaSemana = new Date(fecha).getUTCDay();
        if (!barbero.diasTrabajo.includes(diaSemana))
            return res.json({ data: [] });

        const durMin    = parseInt(duracion);
        const inicioMin = toMinutes(barbero.horaInicio);
        const finMin    = toMinutes(barbero.horaFin);

        const reservas = await Booking.find({
            barbero: barberoId,
            fecha:   new Date(fecha),
            estado:  { $nin: ['cancelada'] }
        });

        const ocupados = reservas.map(r => ({
            inicio: toMinutes(r.hora),
            fin:    toMinutes(r.hora) + r.duracionTotal
        }));

        const disponibles = [];
        for (let min = inicioMin; min + durMin <= finMin; min += 30) {
            const finReserva = min + durMin;
            const solapada = ocupados.some(o => min < o.fin && finReserva > o.inicio);
            if (!solapada) disponibles.push(toHora(min));
        }

        res.json({ data: disponibles });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener disponibilidad', error: error.message });
    }
};

// ── GET / — Todas las reservas (Admin) ───────────────────────────────────────
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('cliente', 'name email')
            .populate('barbero', 'nombre')
            .populate('servicios', 'nombre precio duracion')
            .sort({ fecha: 1, hora: 1 });
        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
};

// ── GET /mis — Mis reservas ───────────────────────────────────────────────────
export const getMisBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ cliente: req.user.id })
            .populate('barbero', 'nombre')
            .populate('servicios', 'nombre precio duracion')
            .sort({ fecha: 1, hora: 1 });
        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tus reservas', error: error.message });
    }
};

// ── POST / — Crear reserva ────────────────────────────────────────────────────
export const crearBooking = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { barbero: barberoId, servicios: serviciosIds, fecha, hora, metodoPago, cejas, notas } = req.body;

        const barbero = await Barbero.findById(barberoId);
        if (!barbero || !barbero.activo)
            return res.status(404).json({ message: 'Barbero no encontrado' });

        const servicios = await Servicio.find({ _id: { $in: serviciosIds }, activo: true });
        if (servicios.length !== serviciosIds.length)
            return res.status(400).json({ message: 'Algún servicio no existe o está inactivo' });

        let precio        = servicios.reduce((acc, s) => acc + s.precio, 0);
        let duracionTotal = servicios.reduce((acc, s) => acc + s.duracion, 0);
        if (cejas) precio += 1;

        const reservasDelDia = await Booking.find({
            barbero: barberoId,
            fecha:   new Date(fecha),
            estado:  { $nin: ['cancelada'] }
        });
        const finReserva = toMinutes(hora) + duracionTotal;
        const solapada = reservasDelDia.some(r => {
            const rInicio = toMinutes(r.hora);
            const rFin    = rInicio + r.duracionTotal;
            return toMinutes(hora) < rFin && finReserva > rInicio;
        });
        if (solapada) return res.status(409).json({ message: 'Esa franja horaria ya está ocupada' });

        if (metodoPago === 'efectivo') {
            const booking = await Booking.create({
                cliente: req.user.id, barbero: barberoId, servicios: serviciosIds,
                fecha, hora, duracionTotal, precio, cejas: cejas || false,
                metodoPago: 'efectivo', estadoPago: 'pendiente', estado: 'pendiente', notas: notas || null
            });

            // ── Populate para el email ────────────────────────────────────────
            const bookingPopulado = await Booking.findById(booking._id)
                .populate('servicios', 'nombre')
                .populate('barbero', 'nombre');

            const usuario = await User.findById(req.user.id);
            try { await enviarConfirmacionReserva(usuario, bookingPopulado); } catch (e) {
                console.error('[EMAIL] Error al enviar confirmación:', e.message);
            }

            return res.status(201).json({ message: 'Reserva creada. Pago en local.', bookingId: booking._id });
        }

        if (metodoPago === 'tarjeta') {
            const booking = await Booking.create({
                cliente: req.user.id, barbero: barberoId, servicios: serviciosIds,
                fecha, hora, duracionTotal, precio, cejas: cejas || false,
                metodoPago: 'tarjeta', estadoPago: 'pendiente', estado: 'pendiente', notas: notas || null
            });

            const nombreServicios = servicios.map(s => s.nombre).join(', ');
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: { name: `Secret Barber — ${nombreServicios}` },
                        unit_amount: precio * 100
                    },
                    quantity: 1
                }],
                metadata: { bookingId: booking._id.toString() },
                success_url: `${process.env.FRONTEND_URL}/reserva/confirmada?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url:  `${process.env.FRONTEND_URL}/reserva/cancelada`
            });

            await Booking.findByIdAndUpdate(booking._id, { stripeSessionId: session.id });
            return res.status(200).json({ url: session.url });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error al crear la reserva', error: error.message });
    }
};

// ── POST /webhook — Stripe webhook ───────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
    const sig    = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (error) {
        return res.status(400).json({ message: `Webhook error: ${error.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session   = event.data.object;
        const bookingId = session.metadata.bookingId;

        // ── Populate para el email ────────────────────────────────────────────
        const booking = await Booking.findByIdAndUpdate(bookingId, {
            estadoPago: 'pagado', estado: 'confirmada'
        }, { new: true })
            .populate('servicios', 'nombre')
            .populate('barbero', 'nombre');

        if (booking) {
            const usuario = await User.findById(booking.cliente);
            if (usuario) await enviarConfirmacionReserva(usuario, booking);
        }
    }
    res.status(200).json({ received: true });
};

// ── PATCH /:id — Cancelar reserva (Cliente) ──────────────────────────────────
export const cancelarBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
        if (req.user.role === 'Cliente' && booking.cliente.toString() !== req.user.id)
            return res.status(403).json({ message: 'No puedes cancelar una reserva que no es tuya' });
        if (!['pendiente', 'confirmada'].includes(booking.estado))
            return res.status(400).json({ message: 'No puedes cancelar esta reserva' });
        await Booking.findByIdAndUpdate(req.params.id, { estado: 'cancelada' });
        res.status(200).json({ message: 'Reserva cancelada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cancelar la reserva', error: error.message });
    }
};

// ── PATCH /:id/estado — Actualizar estado (Admin) ────────────────────────────
export const actualizarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['pendiente', 'confirmada', 'completada', 'cancelada'].includes(estado))
            return res.status(400).json({ message: 'Estado no válido' });
        const booking = await Booking.findByIdAndUpdate(req.params.id, { estado }, { new: true });
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
        res.status(200).json({ message: `Reserva marcada como ${estado}` });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado', error: error.message });
    }
};

// ── PATCH /:id/pago — Actualizar pago (Admin) ────────────────────────────────
export const actualizarPago = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, { estadoPago: 'pagado' }, { new: true });
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
        res.status(200).json({ message: 'Reserva marcada como pagada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el pago', error: error.message });
    }
};

// ── PATCH /:id/modificar — Modificar reserva (Cliente) ───────────────────────
export const modificarBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
        if (booking.cliente.toString() !== req.user.id)
            return res.status(403).json({ message: 'No puedes modificar una reserva que no es tuya' });
        if (!['pendiente', 'confirmada'].includes(booking.estado))
            return res.status(400).json({ message: 'Solo puedes modificar reservas pendientes o confirmadas' });

        const { servicios: serviciosIds, barbero: barberoId, fecha, hora, metodoPago, cejas, notas } = req.body;

        const servicios   = await Servicio.find({ _id: { $in: serviciosIds }, activo: true });
        let precio        = servicios.reduce((acc, s) => acc + s.precio, 0);
        let duracionTotal = servicios.reduce((acc, s) => acc + s.duracion, 0);
        if (cejas) precio += 1;

        const finReserva = toMinutes(hora) + duracionTotal;
        const reservasDelDia = await Booking.find({
            barbero: barberoId, fecha: new Date(fecha),
            estado: { $nin: ['cancelada'] }, _id: { $ne: booking._id }
        });
        const solapada = reservasDelDia.some(r => {
            const rInicio = toMinutes(r.hora);
            const rFin    = rInicio + r.duracionTotal;
            return toMinutes(hora) < rFin && finReserva > rInicio;
        });
        if (solapada) return res.status(409).json({ message: 'Esa franja horaria ya está ocupada' });

        await Booking.findByIdAndUpdate(req.params.id, {
            servicios: serviciosIds, barbero: barberoId,
            fecha, hora, duracionTotal, precio,
            cejas: cejas || false, metodoPago, notas: notas || null, estado: 'pendiente'
        });

        res.status(200).json({ message: 'Reserva modificada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al modificar la reserva', error: error.message });
    }
};


// ── GET /estadisticas — Estadísticas económicas (Admin) ──────────────────────
export const getEstadisticas = async (req, res) => {
    try {
        const ahora   = new Date();
        const hoy     = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const semana  = new Date(hoy); semana.setDate(semana.getDate() - 7);
        const mes     = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const anio    = new Date(ahora.getFullYear(), 0, 1);

        // Reservas pagadas
        const pagadas = await Booking.find({ estadoPago: 'pagado' })
            .populate('servicios', 'nombre precio');

        // Ingresos totales por periodos predefinidos
        const totalAnio  = pagadas.filter(b => new Date(b.fecha) >= anio).reduce((acc, b) => acc + b.precio, 0);
        const totalMes   = pagadas.filter(b => new Date(b.fecha) >= mes).reduce((acc, b) => acc + b.precio, 0);
        const totalSemana= pagadas.filter(b => new Date(b.fecha) >= semana).reduce((acc, b) => acc + b.precio, 0);
        const totalHoy   = pagadas.filter(b => new Date(b.fecha) >= hoy).reduce((acc, b) => acc + b.precio, 0);

        // Número de reservas por periodos predefinidos
        const reservasAnio  = pagadas.filter(b => new Date(b.fecha) >= anio).length;
        const reservasMes   = pagadas.filter(b => new Date(b.fecha) >= mes).length;
        const reservasSemana= pagadas.filter(b => new Date(b.fecha) >= semana).length;
        const reservasHoy   = pagadas.filter(b => new Date(b.fecha) >= hoy).length;

        // ── Rango personalizado ───────────────────────────────────────────────
        let totalRango    = null;
        let reservasRango = null;

        const { fechaInicio, fechaFin } = req.query;
        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin    = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999); // incluir todo el día final

            if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && inicio <= fin) {
                const enRango = pagadas.filter(b => {
                    const f = new Date(b.fecha);
                    return f >= inicio && f <= fin;
                });
                totalRango    = Math.round(enRango.reduce((acc, b) => acc + b.precio, 0) * 100) / 100;
                reservasRango = enRango.length;
            }
        }

        // Ingresos por mes (últimos 12 meses) para el gráfico
        const ingresosPorMes = Array.from({ length: 12 }, (_, i) => {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - 11 + i, 1);
            const fin   = new Date(ahora.getFullYear(), ahora.getMonth() - 11 + i + 1, 1);
            const total = pagadas
                .filter(b => new Date(b.fecha) >= fecha && new Date(b.fecha) < fin)
                .reduce((acc, b) => acc + b.precio, 0);
            return {
                mes:   fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                total: Math.round(total * 100) / 100
            };
        });

        // Servicio más solicitado
        const conteoServicios = {};
        pagadas.forEach(b => {
            (b.servicios).forEach(s => {
                const nombre = s.nombre || 'Desconocido';
                conteoServicios[nombre] = (conteoServicios[nombre] || 0) + 1;
            });
        });
        const serviciosRanking = Object.entries(conteoServicios)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([nombre, count]) => ({ nombre, count }));

        // Ticket medio (sobre el año completo)
        const ticketMedio = reservasAnio > 0
            ? Math.round((totalAnio / reservasAnio) * 100) / 100
            : 0;

        res.json({
            data: {
                resumen: {
                    totalAnio, totalMes, totalSemana, totalHoy,
                    reservasAnio, reservasMes, reservasSemana, reservasHoy,
                    ticketMedio, totalRango, reservasRango
                },
                ingresosPorMes,
                serviciosRanking
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};