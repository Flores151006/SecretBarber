import mongoose from 'mongoose';

export const User = mongoose.model('User', new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Debe proporcionar un email válido']
    },
    // Null cuando el usuario se registra con Google (no tiene contraseña propia)
    password: {
        type: String,
        default: null,
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        maxlength: [255]
    },
    // Solo se rellena cuando el usuario usa Google OAuth
    googleId: {
        type:   String,
        unique: true,
        sparse: true  // no incluye en el índice documentos sin este campo
    },
    // URL del avatar — viene de Google o se deja vacío en registro tradicional
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: {
            values: ['Admin', 'Cliente'],
            message: 'El rol debe ser Admin o Cliente'
        },
        default: 'Cliente',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationTokenExpires: {
        type: Date,
        default: null
    }

}, {
    timestamps: true,       // createdAt y updatedAt — útil para el panel de Admin
    collection: 'users',
    versionKey: false
}));