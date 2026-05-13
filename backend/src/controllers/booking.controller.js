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
            fecha:   new Date(fecha)
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
            fecha:   new Date(fecha)
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

            User.findById(req.user.id).then(usuario => {
                if (usuario) enviarConfirmacionReserva(usuario, bookingPopulado)
                    .catch(e => console.error('[EMAIL] Error al enviar confirmación:', e.message));
            });

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
        await Booking.findByIdAndDelete(req.params.id);
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
        if (estado === 'cancelada') {
            const deleted = await Booking.findByIdAndDelete(req.params.id);
            if (!deleted) return res.status(404).json({ message: 'Reserva no encontrada' });
            return res.status(200).json({ message: 'Reserva cancelada y eliminada' });
        }
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
            _id: { $ne: booking._id }
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
        const { filtro = 'mes', fechaInicio, fechaFin } = req.query;

        const ahora     = new Date();
        const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

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
                inicio = new Date(ahora.getFullYear(), 0, 1);
                fin    = new Date(ahora.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'rango':
                if (!fechaInicio || !fechaFin)
                    return res.status(400).json({ message: 'Faltan fechaInicio y fechaFin' });
                inicio = new Date(fechaInicio);
                fin    = new Date(fechaFin); fin.setHours(23, 59, 59, 999);
                if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin)
                    return res.status(400).json({ message: 'Rango de fechas inválido' });
                break;
            default: // 'mes'
                inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                fin    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Solo reservas pagadas en el período
        const pagadas = await Booking.find({
            estadoPago: 'pagado',
            fecha: { $gte: inicio, $lte: fin }
        }).populate('servicios', 'nombre precio');

        // KPIs del período
        const total       = Math.round(pagadas.reduce((acc, b) => acc + b.precio, 0) * 100) / 100;
        const reservas    = pagadas.length;
        const ticketMedio = reservas > 0 ? Math.round((total / reservas) * 100) / 100 : 0;

        // Gráfico de barras — granularidad según filtro
        let ingresosPorPeriodo = [];

        if (filtro === 'hoy') {
            ingresosPorPeriodo = Array.from({ length: 13 }, (_, i) => {
                const h     = 8 + i;
                const t     = pagadas
                    .filter(b => parseInt(b.hora.split(':')[0]) === h)
                    .reduce((acc, b) => acc + b.precio, 0);
                return { label: `${String(h).padStart(2, '0')}h`, total: Math.round(t * 100) / 100 };
            });

        } else if (filtro === 'semana') {
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

        } else { // rango
            const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 31) {
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

        // Ranking de servicios — filtrado por período
        const conteoServicios = {};
        pagadas.forEach(b => {
            (b.servicios || []).forEach(s => {
                const nombre = s.nombre || 'Desconocido';
                conteoServicios[nombre] = (conteoServicios[nombre] || 0) + 1;
            });
        });
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