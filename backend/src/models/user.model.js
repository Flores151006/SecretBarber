// ─────────────────────────────────────────────────────────────────────────────
// user.model.js
//
// Define el "esquema" (estructura) del documento Usuario en MongoDB.
//
// ¿Qué es un esquema de Mongoose?
//   Es como una plantilla que dice qué campos tiene un usuario, de qué tipo son,
//   si son obligatorios, si deben ser únicos, etc. Mongoose valida automáticamente
//   los datos antes de guardarlos en la base de datos.
//
// Un documento Usuario en MongoDB tiene este aspecto:
// {
//   "_id": "6650abc123...",
//   "name": "Alejandro",
//   "email": "ale@gmail.com",
//   "password": "$2b$10$hasheado...",   ← nunca la contraseña real
//   "role": "Cliente",
//   "active": true,
//   "emailVerified": true,
//   ...
// }
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

export const User = mongoose.model('User', new mongoose.Schema({

    // ── Datos básicos ──────────────────────────────────────────────────────────
    name: {
        type:      String,
        required:  [true, 'El nombre es requerido'],
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
        trim: true // Elimina espacios al principio y final automáticamente
    },
    email: {
        type:      String,
        required:  [true, 'El email es requerido'],
        unique:    true,      // No puede haber dos usuarios con el mismo email
        lowercase: true,      // Siempre se guarda en minúsculas
        trim:      true,
        match: [/^\S+@\S+\.\S+$/, 'Debe proporcionar un email válido'] // Regex básico de email
    },

    // ── Contraseña ─────────────────────────────────────────────────────────────
    // null cuando el usuario se registra con Google (no tiene contraseña propia)
    // Cuando existe, es el HASH de bcrypt, nunca la contraseña en texto plano
    password: {
        type:      String,
        default:   null,
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        maxlength: [255] // Límite para evitar ataques de contraseñas muy largas
    },

    // ── Google OAuth ───────────────────────────────────────────────────────────
    // Solo se rellena cuando el usuario usa "Continuar con Google"
    // sparse: true es CRÍTICO: permite que múltiples usuarios tengan googleId=null
    // sin violar la restricción unique (un índice sparse excluye los valores null)
    googleId: {
        type:   String,
        unique: true,
        sparse: true
    },

    // URL de la foto de perfil — viene de Google OAuth o se sube manualmente
    avatar: {
        type:    String,
        default: null
    },

    // ── Control de acceso ──────────────────────────────────────────────────────
    // Solo dos roles: Admin (gestiona todo) o Cliente (reservas propias)
    role: {
        type: String,
        enum: {
            values:   ['Admin', 'Cliente'],
            message:  'El rol debe ser Admin o Cliente'
        },
        default:  'Cliente', // Por defecto todos los nuevos usuarios son clientes
        required: true
    },

    // active: false → el Admin ha desactivado la cuenta (usuario baneado)
    active: {
        type:    Boolean,
        default: true
    },

    // ── Verificación de email ──────────────────────────────────────────────────
    // Flujo: registro → emailVerified:false → clic en enlace → emailVerified:true
    emailVerified: {
        type:    Boolean,
        default: false
    },
    // Token aleatorio que se incluye en el enlace del correo de verificación
    // Se borra una vez el usuario verifica su email
    verificationToken: {
        type:    String,
        default: null
    },
    // Fecha en la que expira el token de verificación (24h después de crearlo)
    verificationTokenExpires: {
        type:    Date,
        default: null
    },

    // ── Restablecimiento de contraseña ─────────────────────────────────────────
    // Token que se envía por email cuando el usuario olvida su contraseña
    // Se borra una vez el usuario resetea la contraseña (o expira en 1h)
    passwordResetToken: {
        type:    String,
        default: null
    },
    passwordResetExpires: {
        type:    Date,
        default: null
    }

}, {
    timestamps:  true,    // Añade createdAt y updatedAt automáticamente a cada documento
    collection:  'users', // Nombre de la colección en MongoDB
    versionKey:  false    // Desactiva el campo __v que Mongoose añade por defecto
}));
