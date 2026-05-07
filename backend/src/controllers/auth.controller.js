import bcrypt    from 'bcrypt';
import crypto    from 'crypto';
import { User }  from '../models/user.model.js';
import {
    generarAccessToken,
    generarRefreshToken,
    verificarRefreshToken
} from '../middlewares/auth.middleware.js';
import { enviarEmailVerificacion } from '../helpers/email.helper.js';
import { verificarCaptcha }        from '../helpers/captcha.helper.js';

// ─── Registro ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password, captchaToken } = req.body;

        const captcha = await verificarCaptcha(captchaToken);
        if (!captcha.ok) {
            return res.status(400).json({ message: captcha.message });
        }

        const existe = await User.findOne({ email });
        if (existe) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        const hashPassword       = await bcrypt.hash(password, 10);
        const verificationToken  = crypto.randomBytes(32).toString('hex');
        const tokenExpires       = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await User.create({
            name,
            email,
            password: hashPassword,
            emailVerified:            false,
            verificationToken,
            verificationTokenExpires: tokenExpires
        });

        let emailEnviado = true;
        try {
            await enviarEmailVerificacion({ name, email }, verificationToken);
        } catch (emailError) {
            emailEnviado = false;
            console.error('[REGISTRO] Error al enviar email de verificación:', emailError.message);
        }

        res.status(201).json({
            message: emailEnviado
                ? 'Cuenta creada. Revisa tu correo para verificar la cuenta.'
                : 'Cuenta creada. Hubo un problema al enviar el correo. Puedes solicitar el reenvío desde la pantalla de verificación.'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario', error: error.message });
    }
};

// ─── Verificar email ──────────────────────────────────────────────────────────
export const verificarEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Token no proporcionado' });
        }

        const usuario = await User.findOne({ verificationToken: token });

        if (!usuario) {
            return res.status(400).json({ message: 'Token inválido o ya utilizado' });
        }

        if (usuario.verificationTokenExpires < new Date()) {
            return res.status(400).json({ message: 'El enlace de verificación ha expirado' });
        }

        usuario.emailVerified            = true;
        usuario.verificationToken        = null;
        usuario.verificationTokenExpires = null;
        await usuario.save();

        res.status(200).json({ message: 'Email verificado correctamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        res.status(500).json({ message: 'Error al verificar el email', error: error.message });
    }
};

// ─── Reenviar email de verificación ──────────────────────────────────────────
export const reenviarVerificacion = async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await User.findOne({ email, emailVerified: false });

        if (!usuario) {
            // No revelar si existe o ya está verificado
            return res.status(200).json({ message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.' });
        }

        const nuevoToken   = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        usuario.verificationToken        = nuevoToken;
        usuario.verificationTokenExpires = tokenExpires;
        await usuario.save();

        await enviarEmailVerificacion(usuario, nuevoToken);

        res.status(200).json({ message: 'Nuevo enlace de verificación enviado.' });

    } catch (error) {
        res.status(500).json({ message: 'Error al reenviar el correo', error: error.message });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password, captchaToken } = req.body;

        const captcha = await verificarCaptcha(captchaToken);
        if (!captcha.ok) {
            return res.status(400).json({ message: captcha.message });
        }

        const usuario = await User.findOne({ email });

        if (!usuario || !usuario.password) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const passwordCorrecta = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecta) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        if (!usuario.active) {
            return res.status(403).json({ message: 'Cuenta desactivada. Contacta con el administrador' });
        }

        // Solo bloquear si hay verificación pendiente (verificationToken != null)
        // Los usuarios existentes antes de esta mejora no tienen token y pueden entrar
        if (!usuario.emailVerified && usuario.verificationToken) {
            return res.status(403).json({
                message: 'Debes verificar tu correo electrónico antes de iniciar sesión.',
                emailNoVerificado: true
            });
        }

        const payload = { id: usuario._id, email: usuario.email, role: usuario.role };

        const accessToken  = generarAccessToken(payload);
        const refreshToken = generarRefreshToken(payload);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure:   false,
            sameSite: 'Lax',
            maxAge:   7 * 24 * 60 * 60 * 1000
        });

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
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({ message: 'Refresh token no proporcionado' });
        }

        const payload = verificarRefreshToken(token);

        const nuevoAccessToken = generarAccessToken({
            id:    payload.id,
            email: payload.email,
            role:  payload.role
        });

        res.status(200).json({ accessToken: nuevoAccessToken });

    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'Lax'
    });
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
};
