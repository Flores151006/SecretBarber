// ─────────────────────────────────────────────────────────────────────────────
// google.route.js
//
// Flujo de autenticación OAuth 2.0 con Google.
//
// ¿Cómo funciona OAuth con Google? (flujo completo)
//
//   1. El usuario hace clic en "Continuar con Google" en el frontend.
//      El frontend redirige al usuario a GET /auth/google (esta ruta).
//
//   2. passport.authenticate('google') redirige al usuario a la página de
//      login de Google, solicitando acceso a 'profile' y 'email'.
//
//   3. El usuario acepta. Google redirige de vuelta a /auth/google/callback
//      con un código de autorización en la URL.
//
//   4. Passport intercambia ese código por el perfil del usuario con la API
//      de Google. La estrategia configurada en passport.js busca o crea el
//      usuario en nuestra base de datos y lo pone en req.user.
//
//   5. Generamos nuestros propios tokens JWT (Access + Refresh) y enviamos
//      el refreshToken en una cookie httpOnly (inaccesible desde JavaScript
//      del frontend, más segura contra XSS).
//
//   6. Redirigimos al frontend con el accessToken en la URL para que Angular
//      lo guarde y lo use en las siguientes peticiones.
//
// ¿Por qué session: false?
//   Passport puede usar sesiones de servidor para recordar al usuario entre
//   peticiones. En esta app usamos JWT (stateless), por lo que no necesitamos
//   sesiones. session: false evita que Passport intente guardar datos en sesión.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import passport   from '../config/passport.js';
import { generarAccessToken, generarRefreshToken } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Paso 1: Iniciar flujo OAuth → redirige al login de Google ─────────────────
router.get('/', passport.authenticate('google', {
    scope: ['profile', 'email'], // Pedimos solo nombre, foto y email (principio de mínimo privilegio)
    session: false               // No usar sesiones de servidor; usamos JWT
}));

// ── Paso 2: Callback — Google redirige aquí tras la autenticación ─────────────
router.get('/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` // Si falla, volvemos al login con error
}), (req, res) => {
    const usuario = req.user; // Passport ya ha buscado/creado el usuario en la BD

    // Construir el payload del JWT con solo los datos que necesita el frontend.
    // No incluimos datos sensibles en el payload porque el JWT no está cifrado,
    // solo firmado: cualquiera puede decodificarlo (aunque no manipularlo).
    const payload = {
        id:    usuario._id.toString(),
        email: usuario.email,
        role:  usuario.role,
        name:  usuario.name
    };

    const accessToken  = generarAccessToken(payload);
    const refreshToken = generarRefreshToken(payload);

    // El refreshToken va en una cookie httpOnly: el navegador la envía automáticamente
    // pero el JavaScript del frontend no puede leerla, protegiéndola de ataques XSS
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'lax',                                 // Protección básica contra CSRF
        maxAge:   7 * 24 * 60 * 60 * 1000               // 7 días en milisegundos
    });

    // El accessToken sí va en la URL porque el frontend (Angular) necesita leerlo
    // para incluirlo en las cabeceras Authorization de las peticiones posteriores
    res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${accessToken}`);
});

export { router as googleRoutes };
