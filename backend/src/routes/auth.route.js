// ─────────────────────────────────────────────────────────────────────────────
// auth.route.js
//
// Rutas de autenticación: registro, login, tokens, verificación de email
// y recuperación de contraseña.
//
// ¿Qué es el rate limiting y por qué es necesario?
//   Sin límite de peticiones, un atacante puede hacer miles de intentos de
//   login por segundo (ataque de fuerza bruta) hasta dar con la contraseña
//   correcta. express-rate-limit rastrea cuántas peticiones llegan desde
//   cada IP y, si supera el límite, devuelve un 429 (Too Many Requests)
//   bloqueando temporalmente esa IP. Es la primera línea de defensa.
//
// Orden de middlewares en la cadena:
//   Express ejecuta los middlewares de izquierda a derecha / de arriba a abajo.
//   El orden importa: limiteAuth se ejecuta ANTES que validarRegistro, y este
//   ANTES que register. Si el rate limit falla, nunca se llega al validador.
//   Si el validador falla, nunca se llega al controlador. Así cada capa actúa
//   como un filtro.
//
//     IP → [limiteAuth] → [validarRegistro] → [register]
//                ↓               ↓
//           429 si abusa    400 si datos inválidos
// ─────────────────────────────────────────────────────────────────────────────
import { Router }   from 'express';
import rateLimit    from 'express-rate-limit';
import {
    register, login, refreshToken, logout,
    verificarEmail, reenviarVerificacion,
    forgotPassword, resetPassword
} from '../controllers/auth.controller.js';
import { validarRegistro, validarLogin } from '../validators/auth.validator.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Rate limiting en endpoints de autenticación — evita ataques de fuerza bruta.
// Si una IP supera el límite, recibe 429 (Too Many Requests) durante windowMs.
// Sin esto, un atacante podría probar miles de contraseñas por segundo.
const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
    max:      20,              // Máximo 20 intentos por IP en esa ventana
    message:  { message: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' },
    standardHeaders: true,     // Incluye X-RateLimit-* en la respuesta para que el cliente sepa cuánto esperar
    legacyHeaders:   false     // Desactiva las cabeceras antiguas X-RateLimit-* de versiones previas
});

// ── Rutas públicas con protección ────────────────────────────────────────────
// El orden de los middlewares es: limiteAuth → validarXxx → controlador
router.post('/register',            limiteAuth, validarRegistro, register);
router.post('/login',               limiteAuth, validarLogin,    login);

// refresh-token no necesita rate limit agresivo porque usa un token firmado, no contraseña
router.post('/refresh-token',                        refreshToken);

// logout requiere estar autenticado para poder invalidar el token
router.post('/logout',              autenticarToken, logout);

// Verificación de email: el token llega como query param (?token=...)
router.get('/verify-email',                          verificarEmail);
router.post('/resend-verification',                  reenviarVerificacion);

// forgot-password lleva rate limit para evitar spam de correos de reset
router.post('/forgot-password', limiteAuth, forgotPassword);
router.post('/reset-password',  resetPassword);

export { router as authRoutes };
