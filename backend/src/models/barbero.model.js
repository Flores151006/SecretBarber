// ─────────────────────────────────────────────────────────────────────────────
// barbero.model.js
//
// Define la estructura (Schema) y el modelo Mongoose del barbero.
//
// ¿Qué es un Schema de Mongoose?
//   MongoDB es una base de datos "sin esquema": acepta cualquier documento.
//   Mongoose añade una capa de validación y tipado que nos permite definir
//   exactamente qué campos tiene un documento, de qué tipo son y qué reglas
//   deben cumplir. Si intentamos guardar algo que no cumple el schema,
//   Mongoose lanza un error antes de siquiera tocar la base de datos.
//
// ¿Qué es timestamps?
//   La opción { timestamps: true } hace que Mongoose añada automáticamente
//   dos campos: createdAt (fecha de creación) y updatedAt (última modificación).
//   Es muy útil para auditoría sin tener que gestionarlo manualmente.
//
// ¿Qué es versionKey: false?
//   Por defecto Mongoose añade un campo __v (version key) a cada documento
//   para controlar versiones en actualizaciones concurrentes. En este proyecto
//   no se usa esa funcionalidad, así que se desactiva para mantener los
//   documentos limpios.
//
// Softdelete con el campo 'activo':
//   En lugar de borrar físicamente un barbero de la base de datos, lo
//   marcamos como activo:false. Esto preserva el historial de reservas
//   asociadas a él. Ver también barbero.controller.js → eliminarBarbero.
// ─────────────────────────────────────────────────────────────────────────────
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
        unique:    true,   // Crea un índice único en MongoDB; no puede haber dos barberos con el mismo email
        trim:      true,
        lowercase: true    // Mongoose convierte a minúsculas antes de guardar (evita duplicados por mayúsculas)
    },
    diasTrabajo: {
        type:     [Number],
        required: [true, 'Los días de trabajo son requeridos'],
        // 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado, 0=domingo
        // Validación custom: la función recibe el array completo y debe devolver true/false.
        // Es más expresiva que un enum cuando la regla afecta a cada elemento del array.
        validate: {
            validator: (dias) => dias.every(d => d >= 0 && d <= 6),
            message:   'Los días deben estar entre 0 (domingo) y 6 (sábado)'
        }
    },
    horaInicio: {
        type:     String,
        required: [true, 'La hora de inicio es requerida'],
        // Regex que valida el formato HH:MM:
        //   [0-1]\d  → horas 00-19
        //   2[0-3]   → horas 20-23
        //   [0-5]\d  → minutos 00-59
        match:    [/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)']
    },
    horaFin: {
        type:     String,
        required: [true, 'La hora de fin es requerida'],
        match:    [/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido (HH:MM)']
    },
    // Campo de softdelete: false significa "dado de baja" sin borrar el documento
    activo: {
        type:    Boolean,
        default: true
    }

}, {
    timestamps:  true,       // Añade createdAt y updatedAt automáticamente
    collection:  'barberos', // Nombre explícito de la colección en MongoDB
    versionKey:  false        // Elimina el campo __v de los documentos
}));
