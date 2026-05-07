import { Router } from 'express';
import passport   from '../config/passport.js';
import { generarAccessToken, generarRefreshToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Redirige a Google
router.get('/', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

// Callback de Google
router.get('/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`
}), (req, res) => {
    const usuario = req.user;

    // Convertir a objeto plano para JWT
    const payload = {
        id:    usuario._id.toString(),
        email: usuario.email,
        role:  usuario.role,
        name:  usuario.name
    };

    const accessToken  = generarAccessToken(payload);
    const refreshToken = generarRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   false,
        sameSite: 'lax',
        maxAge:   7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${accessToken}`);
});

export { router as googleRoutes };