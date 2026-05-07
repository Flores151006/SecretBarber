import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from '../config.js';

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL:  GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Buscar si ya existe el usuario con ese googleId
        let usuario = await User.findOne({ googleId: profile.id });

        if (usuario) {
            return done(null, usuario);
        }

        // Buscar si existe con el mismo email
        usuario = await User.findOne({ email: profile.emails[0].value });

        if (usuario) {
            // Vincular cuenta Google al usuario existente y marcar email como verificado
            usuario.googleId      = profile.id;
            usuario.avatar        = profile.photos[0]?.value;
            usuario.emailVerified = true;
            await usuario.save();
            return done(null, usuario);
        }

        // Crear nuevo usuario — Google ya verifica el email
        usuario = await User.create({
            name:          profile.displayName,
            email:         profile.emails[0].value,
            googleId:      profile.id,
            avatar:        profile.photos[0]?.value,
            role:          'Cliente',
            active:        true,
            emailVerified: true
        });

        return done(null, usuario);
    } catch (error) {
        return done(error, null);
    }
}));

export default passport;