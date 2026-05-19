// ─────────────────────────────────────────────────────────────────────────────
// booking.model.js
//
// Define la estructura de una Reserva en MongoDB.
//
// Una reserva conecta a un CLIENTE con un BARBERO y unos SERVICIOS en una
// fecha y hora concreta. También gestiona el pago (efectivo o Stripe).
//
// Las referencias a otros documentos (cliente, barbero, servicios) se guardan
// como ObjectId (el ID de MongoDB). Cuando se necesitan los datos completos,
// se usa .populate() para que Mongoose haga la consulta relacionada.
// Esto es el equivalente a un JOIN en SQL.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

export const Booking = mongoose.model('Booking', new mongoose.Schema({

    // ── Referencias a otros documentos (como claves foráneas en SQL) ───────────
    cliente: {
        type:     mongoose.Schema.Types.ObjectId, // ID del documento User
        ref:      'User',   // .populate('cliente') trae los datos del usuario
        required: [true, 'El cliente es requerido']
    },
    barbero: {
        type:     mongoose.Schema.Types.ObjectId, // ID del documento Barbero
        ref:      'Barbero',
        required: [true, 'El barbero es requerido']
    },
    // Array de servicios — una reserva puede incluir varios servicios a la vez
    // (ej: Corte + Tinte = dos ObjectId en el array)
    servicios: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Servicio' // .populate('servicios') trae los detalles de cada servicio
    }],

    // ── Datos de la cita ───────────────────────────────────────────────────────
    fecha: {
        type:     Date,
        required: [true, 'La fecha es requerida']
    },
    // Hora en formato "HH:MM" — se guarda como string para evitar problemas de zona horaria
    hora: {
        type:     String,
        required: [true, 'La hora es requerida'],
        match:    [/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)']
        // Regex: acepta 00:00 - 23:59
    },
    // Duración total de todos los servicios sumados (en minutos)
    // Se precalcula al crear la reserva para usarlo en el algoritmo de disponibilidad
    duracionTotal: {
        type:     Number,
        required: [true, 'La duración total es requerida']
    },
    // Precio total de todos los servicios (+ 1€ si se añaden cejas)
    precio: {
        type:     Number,
        required: [true, 'El precio es requerido'],
        min:      [0, 'El precio no puede ser negativo']
    },
    // Opción adicional: arreglo de cejas por 1€ extra
    cejas: {
        type:    Boolean,
        default: false
    },

    // ── Pago ───────────────────────────────────────────────────────────────────
    metodoPago: {
        type:     String,
        enum:     { values: ['tarjeta', 'efectivo'], message: 'Método de pago inválido' },
        required: [true, 'El método de pago es requerido']
    },
    // Estado del pago — se actualiza a 'pagado' vía webhook de Stripe (tarjeta)
    // o manualmente por el Admin (efectivo)
    estadoPago: {
        type:    String,
        enum:    ['pendiente', 'pagado', 'fallido'],
        default: 'pendiente'
    },
    // ID de la sesión de Stripe Checkout — permite relacionar el webhook con la reserva
    // Solo tiene valor cuando metodoPago === 'tarjeta'
    stripeSessionId: {
        type:    String,
        default: null
    },

    // ── Estado de la reserva ───────────────────────────────────────────────────
    // Ciclo de vida: pendiente → confirmada → completada
    // Si se cancela (cliente o admin), la reserva se ELIMINA de la BD (no cambia estado)
    estado: {
        type:    String,
        enum:    { values: ['pendiente', 'confirmada', 'completada'], message: 'Estado inválido' },
        default: 'pendiente'
    },

    // Notas opcionales del cliente (alergias, preferencias, etc.)
    notas: {
        type:      String,
        maxlength: [300, 'Las notas no pueden superar 300 caracteres'],
        default:   null
    }

}, {
    timestamps: true,        // createdAt y updatedAt gestionados por Mongoose
    collection: 'bookings',
    versionKey: false
}));
