import mongoose from 'mongoose';

export const Review = mongoose.model('Review', new mongoose.Schema({

    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El cliente es requerido']
    },
    // Reseña vinculada a una reserva completada — evita reseñas falsas
    reserva: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'La reserva es requerida'],
        unique: true // Una reseña por reserva
    },
    puntuacion: {
        type: Number,
        required: [true, 'La puntuación es requerida'],
        min: [1, 'La puntuación mínima es 1'],
        max: [5, 'La puntuación máxima es 5']
    },
    comentario: {
        type: String,
        required: [true, 'El comentario es requerido'],
        minlength: [10, 'El comentario debe tener al menos 10 caracteres'],
        maxlength: [500, 'El comentario no puede superar los 500 caracteres'],
        trim: true
    },
    // El Admin puede ocultar reseñas inapropiadas sin borrarlas
    visible: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    collection: 'reviews',
    versionKey: false
}));