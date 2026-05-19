// ─────────────────────────────────────────────────────────────────────────────
// review.model.js
//
// Define la estructura de una Reseña en MongoDB.
//
// Decisión de diseño importante:
//   Las reseñas solo se pueden crear si existe una reserva COMPLETADA.
//   Esto impide que alguien deje una valoración sin haber sido cliente real.
//   La restricción unique en el campo "reserva" garantiza que solo se pueda
//   escribir UNA reseña por reserva completada.
//
// El campo "visible" permite al Admin ocultar reseñas inapropiadas sin borrarlas,
// manteniendo un registro histórico de todo el contenido.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

export const Review = mongoose.model('Review', new mongoose.Schema({

    // ID del cliente que escribe la reseña (referencia al modelo User)
    cliente: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: [true, 'El cliente es requerido']
    },

    // ID de la reserva completada a la que va ligada esta reseña
    // unique: true garantiza que no haya dos reseñas para la misma reserva
    // Es la forma de asegurar que el cliente realmente fue a la cita
    reserva: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'Booking',
        required: [true, 'La reserva es requerida'],
        unique:   true // Una sola reseña por reserva
    },

    // Puntuación de 1 a 5 estrellas (números enteros)
    // min y max son validaciones automáticas de Mongoose
    puntuacion: {
        type:     Number,
        required: [true, 'La puntuación es requerida'],
        min:      [1, 'La puntuación mínima es 1'],
        max:      [5, 'La puntuación máxima es 5']
    },

    // Texto del comentario con límites para evitar textos demasiado cortos o largos
    // trim:true elimina espacios al principio y final
    comentario: {
        type:      String,
        required:  [true, 'El comentario es requerido'],
        minlength: [10, 'El comentario debe tener al menos 10 caracteres'],
        maxlength: [500, 'El comentario no puede superar los 500 caracteres'],
        trim:      true
    },

    // El Admin puede ocultar la reseña con toggle (visible:false) sin borrarla
    // Así queda registro histórico y el admin puede revertir la ocultación si se equivoca
    visible: {
        type:    Boolean,
        default: true // Por defecto todas las reseñas son visibles al publicarse
    }

}, {
    timestamps:  true,      // createdAt nos dice cuándo se publicó la reseña
    collection:  'reviews',
    versionKey:  false
}));
