// ─────────────────────────────────────────────────────────────────────────────
// auth.middleware.js
//
// Este archivo contiene todo lo relacionado con los tokens JWT (JSON Web Token).
// Un JWT es básicamente un "carnet digital" firmado digitalmente que el usuario
// lleva consigo para demostrar que ha iniciado sesión sin que el servidor tenga
// que consultar la base de datos en cada petición.
//
// ¿Por qué DOS tokens (access + refresh)?
//   - El "access token" dura solo 15 minutos → si alguien te lo roba solo
//     puede usarlo 15 min, luego expira. Mayor seguridad.
//   - El "refresh token" dura 7 días → se guarda en una cookie HTTP-only
//     (invisible para JavaScript, protegiéndola de ataques XSS) y sirve
//     para pedir un nuevo access token sin que el usuario tenga que
//     volver a poner su contraseña cada 15 minutos.
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { SECRET_KEY, REFRESH_SECRET_KEY } from '../config.js';

// Tiempos de expiración de los tokens
// Se exportan para que otros archivos puedan referirse a ellos sin repetir el valor
export const ACCESS_TOKEN_EXPIRY  = '15m'; // 15 minutos — token de corta vida
export const REFRESH_TOKEN_EXPIRY = '7d';  // 7 días — token de larga vida

// ─── Generar Access Token ─────────────────────────────────────────────────────
// Crea un token corto (15 min) con los datos del usuario "firmados" digitalmente.
// El payload contiene: id, email y rol — suficiente para saber quién es el usuario.
// SECRET_KEY es la clave privada del servidor; sin ella nadie puede falsificar el token.
export const generarAccessToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// ─── Generar Refresh Token ────────────────────────────────────────────────────
// Crea el token de larga duración (7 días) usando una clave DIFERENTE (REFRESH_SECRET_KEY).
// Al usar claves distintas, un access token robado no sirve para generar nuevos tokens.
export const generarRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

// ─── Verificar Access Token (middleware de ruta) ──────────────────────────────
// Este es un "middleware": una función que se ejecuta ANTES del controlador de cada
// ruta protegida. Si el token no es válido, para la petición aquí mismo y devuelve 401.
// Si es válido, guarda los datos del usuario en req.user para que el controlador los use.
//
// Flujo:
//   1. Angular envía el token en la cabecera: Authorization: Bearer <token>
//   2. Este middleware lo extrae con .split(' ')[1]
//   3. jwt.verify comprueba la firma y la expiración
//   4. Si todo va bien, req.user = { id, email, role } y pasa al siguiente
export const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Si no hay cabecera Authorization, rechazar con 401 (no autenticado)
    if (!authHeader) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // El formato es "Bearer eyJ..." — cogemos solo la parte del token (posición 1)
    const token = authHeader.split(' ')[1];

    // jwt.verify verifica la firma digital y la fecha de expiración
    // Si algo falla lanza un error que capturamos en el callback
    jwt.verify(token, SECRET_KEY, (err, payload) => {
        if (err) {
            // Token falsificado, caducado o mal formado → 401
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }
        // Inyectamos los datos del usuario en el objeto request
        // Desde aquí en adelante, req.user.id, req.user.role, etc. están disponibles
        req.user = payload; // { id, email, role }
        next(); // Pasar al siguiente middleware o al controlador final
    });
};

// ─── Verificar Refresh Token ──────────────────────────────────────────────────
// Versión síncrona (lanza excepción en vez de callback) que se usa solo cuando
// el cliente pide un nuevo access token (ruta /auth/refresh-token).
// Si el refresh token expiró o es inválido, lanza un error que el controlador captura.
export const verificarRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_SECRET_KEY);
    } catch {
        throw new Error('Refresh token inválido o expirado');
    }
};

// ─── Autorizar por Rol ────────────────────────────────────────────────────────
// Middleware de autorización: comprueba que el usuario (ya autenticado) tenga
// el rol adecuado para acceder a esa ruta.
//
// Se usa con "rest parameters" (...rolesPermitidos) para poder pasar uno o varios roles:
//   Ejemplo: autorizarRol('Admin')          → solo admins
//   Ejemplo: autorizarRol('Admin','Cliente') → ambos roles
//
// Devuelve una función (patrón "factory") para que Express pueda usarlo como middleware.
export const autorizarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.user.role)) {
            // 403 = autenticado pero sin permiso (distinto de 401 = no autenticado)
            return res.status(403).json({ message: 'No tienes permiso para acceder a esta ruta' });
        }
        next();
    };
};
