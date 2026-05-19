// ─────────────────────────────────────────────────────────────────────────────
// auth.validator.js
//
// Reglas de validación y saneamiento para los endpoints de autenticación.
//
// ¿Qué es express-validator?
//   Es una librería que permite encadenar reglas de validación sobre los campos
//   de una petición (body, params, query…). Cada llamada a body('campo')
//   devuelve un objeto sobre el que se encadenan métodos como .isEmail(),
//   .isLength(), .matches()... Si alguna regla falla, el error se acumula
//   internamente. Luego, en el controlador (o en validationErrors aquí abajo),
//   se recogen todos esos errores con validationResult(req).
//
// .matches(regex):
//   Verifica que el valor cumple la expresión regular. Aquí se usa para:
//   - Nombre: solo letras (incluidas tildes/ñ) y espacios, sin números ni símbolos
//   - Password: al menos una mayúscula y al menos un dígito
//
// .normalizeEmail():
//   Normaliza el email para evitar duplicados por formato:
//   convierte a minúsculas, elimina puntos en Gmail (a.b@gmail.com = ab@gmail.com), etc.
//   Es un sanitizador: modifica el valor en lugar de solo validarlo.
//
// customSanitizer:
//   Permite transformar el valor con una función propia. Aquí se usa para
//   colapsar espacios múltiples en el nombre (ej: "Juan   López" → "Juan López")
//   además del .trim() que elimina espacios al inicio y final.
// ─────────────────────────────────────────────────────────────────────────────
import { body, validationResult } from 'express-validator';

// Middleware reutilizable que recoge los errores acumulados por los validadores
// y devuelve 400 con el listado de errores si los hay, o llama a next() si todo está bien
const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }
    next();
};

// ─── Registro ─────────────────────────────────────────────────────────────────
export const validarRegistro = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
        // Regex que permite letras latinas con tildes, la ñ y espacios, pero rechaza
        // números, símbolos (@, #…) y caracteres de otros alfabetos
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
        // customSanitizer: colapsa espacios múltiples ("Juan  López" → "Juan López")
        .customSanitizer(value => value.replace(/\s+/g, ' ').trim()),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe proporcionar un email válido')
        .isLength({ max: 150 }).withMessage('El email no puede exceder 150 caracteres')
        // normalizeEmail() estandariza el formato para evitar duplicados por capitalización
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        // Se usan dos .matches() separados para dar mensajes de error específicos
        // en lugar de un único regex complejo que solo diría "formato inválido"
        .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número'),

    validationErrors
];

// ─── Login ────────────────────────────────────────────────────────────────────
// El login no valida la contraseña con las mismas reglas de registro porque
// el mensaje de error revelaría información sobre el formato esperado.
// Solo se verifica que no esté vacía; la autenticación real la hace bcrypt.
export const validarLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe proporcionar un email válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),

    validationErrors
];
