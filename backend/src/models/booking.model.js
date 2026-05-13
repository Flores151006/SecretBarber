import mongoose from 'mongoose';

export const Booking = mongoose.model('Booking', new mongoose.Schema({

    cliente: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: [true, 'El cliente es requerido']
    },
    barbero: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'Barbero',
        required: [true, 'El barbero es requerido']
    },
    servicios: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Servicio'
    }],
    fecha: {
        type:     Date,
        required: [true, 'La fecha es requerida']
    },
    hora: {
        type:     String,
        required: [true, 'La hora es requerida'],
        match:    [/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)']
    },
    duracionTotal: {
        type:     Number,
        required: [true, 'La duración total es requerida']
    },
    precio: {
        type:     Number,
        required: [true, 'El precio es requerido'],
        min:      [0, 'El precio no puede ser negativo']
    },
    cejas: {
        type:    Boolean,
        default: false
    },
    metodoPago: {
        type:     String,
        enum:     { values: ['tarjeta', 'efectivo'], message: 'Método de pago inválido' },
        required: [true, 'El método de pago es requerido']
    },
    estadoPago: {
        type:    String,
        enum:    ['pendiente', 'pagado', 'fallido'],
        default: 'pendiente'
    },
    stripeSessionId: {
        type:    String,
        default: null
    },
    estado: {
        type:    String,
        enum:    { values: ['pendiente', 'confirmada', 'completada'], message: 'Estado inválido' },
        default: 'pendiente'
    },
    notas: {
        type:      String,
        maxlength: [300, 'Las notas no pueden superar 300 caracteres'],
        default:   null
    }

}, {
    timestamps:  true,
    collection:  'bookings',
    versionKey:  false
}));