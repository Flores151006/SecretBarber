import mongoose from 'mongoose';

export const Barbero = mongoose.model('Barbero', new mongoose.Schema({

    nombre: {
        type:     String,
        required: [true, 'El nombre es requerido'],
        trim:     true
    },
    email: {
        type:      String,
        required:  [true, 'El email es requerido'],
        unique:    true,
        trim:      true,
        lowercase: true
    },
    diasTrabajo: {
        type:     [Number],
        required: [true, 'Los días de trabajo son requeridos'],
        // 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado, 0=domingo
        validate: {
            validator: (dias) => dias.every(d => d >= 0 && d <= 6),
            message:   'Los días deben estar entre 0 (domingo) y 6 (sábado)'
        }
    },
    horaInicio: {
        type:     String,
        required: [true, 'La hora de inicio es requerida'],
        match:    [/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)']
    },
    horaFin: {
        type:     String,
        required: [true, 'La hora de fin es requerida'],
        match:    [/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)']
    },
    activo: {
        type:    Boolean,
        default: true
    }

}, {
    timestamps:  true,
    collection:  'barberos',
    versionKey:  false
}));