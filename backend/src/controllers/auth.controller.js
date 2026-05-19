// ─────────────────────────────────────────────────────────────────────────────
// auth.controller.js
//
// Controlador de autenticación: gestiona registro, login, verificación de email,
// tokens JWT, cierre de sesión y restablecimiento de contraseña.
//
// Un "controlador" en arquitectura MVC es la capa que recibe la petición HTTP,
// aplica la lógica de negocio y devuelve la respuesta. No sabe nada de la interfaz.
// ─────────────────────────────────────────────────────────────────────────────

import bcrypt    from 'bcrypt';
import crypto    from 'crypto';
import { User }  from '../models/user.model.js';
import {
    generarAccessToken,
    generarRefreshToken,
    verificarRefreshToken
} from '../middlewares/auth.middleware.js';
import { enviarEmailVerificacion, enviarEmailResetPassword } from '../helpers/email.helper.js';
import { verificarCaptcha }        from '../helpers/captcha.helper.js';

// ─── Registro ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Crea una nueva cuenta de usuario con contraseña hasheada y envía el correo de verificación.
export const register = async (req, res) => {
    try {
        const { name, email, password, captchaToken } = req.body;

        // 1. Verificar reCAPTCHA — comprobamos que quien se registra es humano y no un bot
        const captcha = await verificarCaptcha(captchaToken);
        if (!captcha.ok) {
            return res.status(400).json({ message: captcha.message });
        }

        // 2. Comprobar que el email no esté ya registrado para evitar duplicados
        // findOne devuelve null si no lo encuentra, o el documento si existe
        const existe = await User.findOne({ email });
        if (existe) {
            // 409 Conflict = recurso ya existe
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        // 3. Hashear la contraseña con bcrypt antes de guardarla
        // NUNCA se guarda la contraseña en texto plano — solo su "hash" (valor irreversible)
        // El número 10 es el "salt rounds": cuántas veces se mezcla la contraseña.
        // A más rondas, más seguro pero más lento. 10 es el estándar de la industria.
        const hashPassword = await bcrypt.hash(password, 10);

        // 4. Generar un token de verificación de email único y aleatorio
        // crypto.randomBytes(32) crea 32 bytes aleatorios criptográficamente seguros
        // .toString('hex') los convierte a texto hexadecimal (64 caracteres)
        const verificationToken  = crypto.randomBytes(32).toString('hex');

        // El token expira en 24 horas — Date.now() devuelve milisegundos
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 5. Crear el usuario en MongoDB — active:false hasta que verifique el email
        await User.create({
            name,
            email,
            password: hashPassword,         // Solo el hash, nunca la contraseña real
            active:                   false, // Cuenta inactiva hasta verificar email
            emailVerified:            false,
            verificationToken,              // Se borra una vez el usuario verifica
            verificationTokenExpires: tokenExpires
        });

        // 6. Enviar el correo de verificación de forma asíncrona (fire-and-forget)
        // No esperamos a que el correo se envíe (.catch en vez de await)
        // Así la respuesta al usuario es INMEDIATA aunque Brevo tarde unos segundos.
        // Si el envío falla, lo registramos en los logs del servidor.
        enviarEmailVerificacion({ name, email }, verificationToken)
            .catch(e => console.error('[REGISTRO] Error al enviar email de verificación:', e.message));

        // 7. Responder con 201 Created — el usuario puede registrarse exitosamente
        res.status(201).json({
            message: 'Cuenta creada. Revisa tu correo para verificar la cuenta.'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario', error: error.message });
    }
};

// ─── Verificar email ──────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=XXXX
// El usuario llega aquí al hacer clic en el enlace del correo de verificación.
// Angular llama a este endpoint con el token de la URL.
export const verificarEmail = async (req, res) => {
    try {
        // El token llega como parámetro de query: ?token=abc123...
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Token no proporcionado' });
        }

        // Buscar el usuario que tenga ESE token de verificación
        const usuario = await User.findOne({ verificationToken: token });

        if (!usuario) {
            // El token no existe o ya se usó (lo borramos después de verificar)
            return res.status(400).json({ message: 'Token inválido o ya utilizado' });
        }

        // Comprobar que el token no haya expirado (duración: 24h desde el registro)
        if (usuario.verificationTokenExpires < new Date()) {
            return res.status(400).json({ message: 'El enlace de verificación ha expirado' });
        }

        // Activar la cuenta y limpiar los campos del token
        // Una vez verificado, no necesitamos guardar más el token
        usuario.active                   = true;
        usuario.emailVerified            = true;
        usuario.verificationToken        = null; // Borrar el token — ya no es válido
        usuario.verificationTokenExpires = null;
        await usuario.save(); // Guardar los cambios en MongoDB

        res.status(200).json({ message: 'Email verificado correctamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        res.status(500).json({ message: 'Error al verificar el email', error: error.message });
    }
};

// ─── Reenviar email de verificación ──────────────────────────────────────────
// POST /api/auth/resend-verification
// Si el usuario no recibió el correo o el enlace expiró, puede pedir uno nuevo.
export const reenviarVerificacion = async (req, res) => {
    try {
        const { email } = req.body;

        // Buscar usuario con ese email que AÚN no haya verificado
        const usuario = await User.findOne({ email, emailVerified: false });

        if (!usuario) {
            // IMPORTANTE: devolvemos 200 aunque no exista, para no revelar
            // si un email está registrado o no (protección anti-enumeración de usuarios)
            return res.status(200).json({ message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.' });
        }

        // Generar nuevo token y nueva fecha de expiración (otras 24 horas)
        const nuevoToken   = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        usuario.verificationToken        = nuevoToken;
        usuario.verificationTokenExpires = tokenExpires;
        await usuario.save();

        // En este caso sí esperamos al envío porque el usuario está esperando la confirmación
        await enviarEmailVerificacion(usuario, nuevoToken);

        res.status(200).json({ message: 'Nuevo enlace de verificación enviado.' });

    } catch (error) {
        res.status(500).json({ message: 'Error al reenviar el correo', error: error.message });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Valida credenciales y devuelve un access token + establece cookie de refresh token.
export const login = async (req, res) => {
    try {
        const { email, password, captchaToken } = req.body;

        // 1. reCAPTCHA — también protegemos el login contra bots y ataques de fuerza bruta
        const captcha = await verificarCaptcha(captchaToken);
        if (!captcha.ok) {
            return res.status(400).json({ message: captcha.message });
        }

        // 2. Buscar el usuario en la base de datos por email
        const usuario = await User.findOne({ email });

        // Si el usuario no existe O si se registró con Google (no tiene contraseña),
        // devolvemos el mismo mensaje genérico para no dar pistas al atacante
        if (!usuario || !usuario.password) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // 3. Comparar la contraseña introducida con el hash almacenado
        // bcrypt.compare aplica el mismo proceso de hash y compara los resultados
        // Esto es seguro porque bcrypt incluye el "salt" dentro del hash guardado
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecta) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // 4. Comprobar que la cuenta no esté desactivada por el administrador
        if (!usuario.active) {
            return res.status(403).json({ message: 'Cuenta desactivada. Contacta con el administrador' });
        }

        // 5. Bloquear si el email no está verificado
        // Excepción: usuarios creados antes de implementar la verificación (sin token guardado)
        // pueden entrar igualmente para no romper cuentas antiguas
        if (!usuario.emailVerified && usuario.verificationToken) {
            return res.status(403).json({
                message: 'Debes verificar tu correo electrónico antes de iniciar sesión.',
                emailNoVerificado: true // Angular usa este flag para mostrar el enlace de reenvío
            });
        }

        // 6. Preparar el "payload" del token: los datos que viajan DENTRO del JWT
        // Solo guardamos lo mínimo necesario — nunca la contraseña ni datos sensibles
        const payload = { id: usuario._id, email: usuario.email, role: usuario.role };

        // 7. Generar los dos tokens
        const accessToken  = generarAccessToken(payload);  // Dura 15 minutos
        const refreshToken = generarRefreshToken(payload); // Dura 7 días

        // 8. Enviar el refresh token como cookie HTTP-only
        // httpOnly: true → JavaScript NO puede acceder a esta cookie (protege de XSS)
        // secure: true en producción → la cookie solo viaja por HTTPS, nunca por HTTP plano
        // En desarrollo usamos false porque localhost no tiene certificado HTTPS
        // sameSite: 'Lax' → protege contra CSRF (la cookie no se envía en peticiones externas)
        // maxAge: 7 días en milisegundos
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge:   7 * 24 * 60 * 60 * 1000
        });

        // 9. Devolver el access token en el cuerpo de la respuesta (lo guarda Angular en localStorage)
        res.status(200).json({
            accessToken,
            user: {
                id:    usuario._id,
                name:  usuario.name,
                email: usuario.email,
                role:  usuario.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// Cuando el access token expira (cada 15 min), Angular llama a este endpoint
// con la cookie de refresh token para obtener uno nuevo sin pedir contraseña.
export const refreshToken = async (req, res) => {
    try {
        // La cookie llega automáticamente gracias a withCredentials:true en Angular
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({ message: 'Refresh token no proporcionado' });
        }

        // Verificar que el refresh token es válido y no ha expirado
        // Si falla, lanza una excepción que cae en el catch
        const payload = verificarRefreshToken(token);

        // Generar un nuevo access token con los mismos datos del usuario
        const nuevoAccessToken = generarAccessToken({
            id:    payload.id,
            email: payload.email,
            role:  payload.role
        });

        res.status(200).json({ accessToken: nuevoAccessToken });

    } catch (error) {
        // El refresh token era inválido o expiró → el usuario debe iniciar sesión de nuevo
        res.status(401).json({ message: error.message });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Elimina la cookie del refresh token del navegador del usuario.
// El access token no se puede "revocar" (no hay lista negra), pero al expirar en 15 min
// el usuario queda completamente desconectado.
export const logout = (req, res) => {
    // clearCookie borra la cookie del navegador enviando una cabecera Set-Cookie vacía
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'Lax'
    });
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// El usuario dice "olvidé mi contraseña" → generamos un enlace de recuperación por email.
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'El email es requerido' });

        // Buscar el usuario; toLowerCase() por si escribe el email en mayúsculas
        const usuario = await User.findOne({ email: email.toLowerCase() });

        if (!usuario) {
            return res.status(404).json({ message: 'No existe ninguna cuenta con ese correo electrónico' });
        }

        // No permitir el reset por email si la cuenta es de Google
        // Los usuarios de Google deben gestionar su contraseña desde Google
        if (usuario.googleId) {
            return res.status(400).json({ message: 'Esta cuenta usa Google. Restablece la contraseña desde Google.' });
        }

        // Generar token aleatorio y fecha de expiración (1 hora)
        const token   = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora = 3.600.000 ms

        // Guardar token y expiración en el usuario
        usuario.passwordResetToken   = token;
        usuario.passwordResetExpires = expires;
        await usuario.save();

        // Enviar el email con el enlace de recuperación
        await enviarEmailResetPassword(usuario, token);

        res.status(200).json({ message: 'Enlace enviado. Revisa tu correo.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar la solicitud', error: error.message });
    }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// El usuario llega aquí tras hacer clic en el enlace del email de recuperación.
// Recibe el token (de la URL) y la nueva contraseña.
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ message: 'Token y contraseña son requeridos' });
        if (password.length < 8) return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });

        // Buscar el usuario con ESE token Y que no haya expirado
        // $gt: new Date() → "mayor que ahora" (el campo expires está en el futuro)
        const usuario = await User.findOne({
            passwordResetToken:   token,
            passwordResetExpires: { $gt: new Date() } // Operador MongoDB: campo > ahora
        });

        if (!usuario) {
            // No existe el token O ya expiró
            return res.status(400).json({ message: 'El enlace no es válido o ha expirado' });
        }

        // Hashear la nueva contraseña antes de guardarla (igual que en el registro)
        usuario.password             = await bcrypt.hash(password, 10);
        // Limpiar los campos del token — ya no sirven, el reset fue completado
        usuario.passwordResetToken   = null;
        usuario.passwordResetExpires = null;
        await usuario.save();

        res.status(200).json({ message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al restablecer la contraseña', error: error.message });
    }
};
