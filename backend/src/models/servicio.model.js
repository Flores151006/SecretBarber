import mongoose from 'mongoose';

export const Servicio = mongoose.model('Servicio', new mongoose.Schema({

    nombre: {
        type:     String,
        required: [true, 'El nombre es requerido'],
        trim:     true,
        unique:   true
    },
    precio: {
        type:     Number,
        required: [true, 'El precio es requerido'],
        min:      [0, 'El precio no puede ser negativo']
    },
    duracion: {
        type:     Number,
        required: [true, 'La duración es requerida'],
        min:      [15, 'La duración mínima es 15 minutos']
    },
    activo: {
        type:    Boolean,
        default: true
    }

}, {
    timestamps:  true,
    collection:  'servicios',
    versionKey:  false
}));
