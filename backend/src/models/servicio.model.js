// ─────────────────────────────────────────────────────────────────────────────
// servicio.model.js
//
// Define la estructura y el modelo Mongoose del servicio de barbería
// (corte, arreglo de barba, tratamiento, etc.).
//
// Decisiones de diseño relevantes:
//
//   unique en nombre:
//     Impide que existan dos servicios con el mismo nombre en la base de datos.
//     Mongoose crea un índice único en MongoDB para garantizarlo a nivel de BD,
//     no solo a nivel de aplicación. Sin esto podría darse el caso de que dos
//     peticiones simultáneas creen el mismo servicio por una condición de carrera.
//
//   min:15 en duración:
//     La duración mínima de 15 minutos es una restricción de negocio: no tiene
//     sentido ofrecer un servicio que dure menos porque el sistema de reservas
//     trabaja en franjas de 30 minutos y habría huecos incoherentes en la agenda.
//     Ponerlo en el modelo garantiza que ningún código, por error u omisión,
//     pueda guardar un servicio con duración menor.
//
//   activo (softdelete):
//     Al igual que los barberos, los servicios no se borran físicamente para
//     preservar el historial de reservas que los referenciaron.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';

export const Servicio = mongoose.model('Servicio', new mongoose.Schema({

    nombre: {
        type:     String,
        required: [true, 'El nombre es requerido'],
        trim:     true,
        unique:   true  // Índice único en MongoDB: no puede haber dos servicios con el mismo nombre
    },
    precio: {
        type:     Number,
        required: [true, 'El precio es requerido'],
        min:      [0, 'El precio no puede ser negativo']  // Un precio negativo no tiene sentido de negocio
    },
    duracion: {
        type:     Number,
        required: [true, 'La duración es requerida'],
        min:      [15, 'La duración mínima es 15 minutos']  // Restricción de negocio: franja mínima reservable
    },
    // Campo de softdelete: poner activo:false "oculta" el servicio sin perder datos históricos
    activo: {
        type:    Boolean,
        default: true
    }

}, {
    timestamps:  true,        // Añade createdAt y updatedAt automáticamente
    collection:  'servicios', // Nombre explícito de la colección en MongoDB
    versionKey:  false        // Elimina el campo __v de los documentos
}));
