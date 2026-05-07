import { body, param, validationResult } from 'express-validator';

const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }
    next();
};

// ─── Validar ID ───────────────────────────────────────────────────────────────
export const validarId = [
    param('id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID debe ser un ObjectId válido de MongoDB'),

    validationErrors
];

// ─── Validar creación de usuario (todos los campos obligatorios) ──────────────
export const validarUsuario = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
        .customSanitizer(value => value.replace(/\s+/g, ' ').trim()),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe proporcionar un email válido')
        .isLength({ max: 150 }).withMessage('El email no puede exceder 150 caracteres')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número'),

    body('role')
        .optional()
        .isIn(['Admin', 'Cliente']).withMessage('El rol debe ser Admin o Cliente'),

    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano'),

    validationErrors
];

// ─── Validar actualización de usuario (todos los campos opcionales) ───────────
export const validarActualizacion = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
        .customSanitizer(value => value.replace(/\s+/g, ' ').trim()),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Debe proporcionar un email válido')
        .isLength({ max: 150 }).withMessage('El email no puede exceder 150 caracteres')
        .normalizeEmail(),

    body('password')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número'),

    body('role')
        .optional()
        .isIn(['Admin', 'Cliente']).withMessage('El rol debe ser Admin o Cliente'),

    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano'),

    validationErrors
];