// ─────────────────────────────────────────────────────────────────────────────
// passport.js
//
// Configura la autenticación con Google mediante OAuth 2.0 usando Passport.js.
//
// ¿Qué es OAuth 2.0?
//   Es un protocolo de autorización que permite a los usuarios acceder a tu app
//   usando su cuenta de Google (u otro proveedor) SIN compartir su contraseña
//   contigo. Google confirma la identidad del usuario y te devuelve sus datos.
//
// ¿Qué es Passport.js?
//   Una librería de Node.js que simplifica la autenticación con múltiples
//   "estrategias" (Google, Facebook, Twitter, etc.). Nosotros usamos la estrategia
//   de Google (passport-google-oauth20).
//
// Flujo completo:
//   1. Usuario hace clic en "Continuar con Google" en Angular
//   2. Angular redirige al backend: GET /api/auth/google
//   3. Passport redirige al usuario a la pantalla de login de Google
//   4. Google autentica al usuario y redirige al callback del backend
//   5. Passport llama a esta función "verify" con los datos del perfil de Google
//   6. El backend genera un código temporal y redirige de vuelta a Angular
//   7. Angular intercambia el código por un JWT
// ─────────────────────────────────────────────────────────────────────────────

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from '../config.js';

// Configurar la estrategia de Google con las credenciales de OAuth
// (clientID y clientSecret se obtienen desde Google Cloud Console)
passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL:  GOOGLE_CALLBACK_URL // URL a la que Google redirige después de autenticar
},
// Función "verify": se ejecuta después de que Google confirma la identidad del usuario
// Recibe: los tokens de Google (no los nuestros) y el perfil del usuario de Google
async (accessToken, refreshToken, profile, done) => {
    try {
        // ── Caso 1: el usuario ya existe y ya inició sesión con Google antes ──────
        // Buscar por googleId (identificador único de la cuenta de Google)
        let usuario = await User.findOne({ googleId: profile.id });

        if (usuario) {
            // Ya existe → simplemente devolvemos el usuario sin crear nada nuevo
            return done(null, usuario);
        }

        // ── Caso 2: el email de Google coincide con una cuenta registrada por email ─
        // El usuario se registró antes con email/contraseña y ahora usa Google
        usuario = await User.findOne({ email: profile.emails[0].value });

        if (usuario) {
            // Vincular el googleId a la cuenta existente para futuras sesiones
            usuario.googleId      = profile.id;
            usuario.avatar        = profile.photos[0]?.value; // Foto del perfil de Google
            usuario.emailVerified = true; // Google ya verificó el email, no hace falta nuestro flujo
            await usuario.save();
            return done(null, usuario);
        }

        // ── Caso 3: usuario completamente nuevo, nunca ha usado la app ────────────
        // Google ya verificó el email → emailVerified:true desde el principio
        // No necesita contraseña porque siempre iniciará sesión con Google
        usuario = await User.create({
            name:          profile.displayName,
            email:         profile.emails[0].value,
            googleId:      profile.id,
            avatar:        profile.photos[0]?.value, // ?. evita error si no tiene foto
            role:          'Cliente',
            active:        true,
            emailVerified: true // Google ya confirma que el email es válido
        });

        return done(null, usuario);
    } catch (error) {
        // done(error, null) → Passport propaga el error al manejador de errores de Express
        return done(error, null);
    }
}));

export default passport;
