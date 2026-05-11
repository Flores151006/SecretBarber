import { Router } from 'express';
import {
    register, login, refreshToken, logout,
    verificarEmail, reenviarVerificacion,
    forgotPassword, resetPassword
} from '../controllers/auth.controller.js';
import { validarRegistro, validarLogin } from '../validators/auth.validator.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register',            validarRegistro, register);
router.post('/login',               validarLogin,    login);
router.post('/refresh-token',                        refreshToken);
router.post('/logout',              autenticarToken, logout);
router.get('/verify-email',                          verificarEmail);
router.post('/resend-verification',                  reenviarVerificacion);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

export { router as authRoutes };
