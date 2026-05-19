// ─────────────────────────────────────────────────────────────────────────────
// user.validator.js
//
// Validaciones para la gestión de usuarios por parte del Admin.
// Hay dos conjuntos de reglas: creación (todos obligatorios) y
// actualización (todos opcionales).
//
// .optional() vs campos requeridos:
//   En la creación, todos los campos tienen reglas que se ejecutan siempre.
//   En la actualización, .optional() hace que la regla solo se evalúe si el
//   campo está presente en el body. Esto permite al Admin editar solo el
//   nombre sin necesidad de enviar todos los demás campos.
//
// .optional({ nullable: true, checkFalsy: true }) en password (actualización):
//   - nullable: true → acepta null sin error (el Admin envía null para "no cambiar")
//   - checkFalsy: true → acepta también string vacío '' sin validar
//   Juntos permiten que el Admin actualice al usuario sin tocar su contraseña,
//   simplemente omitiendo el campo o enviando null o ''.
//   Sin esto, si el Admin edita el rol pero no la contraseña, recibiría un
//   error de validación por mandar un campo vacío.
//
// customSanitizer:
//   Colapsa espacios múltiples en el nombre antes de guardarlo.
//   Ver auth.validator.js para más detalles sobre este patrón.
// ─────────────────────────────────────────────────────────────────────────────
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

    // .optional() → si el Admin no envía 'role', se usará el valor por defecto del controlador
    body('role')
        .optional()
        .isIn(['Admin', 'Cliente']).withMessage('El rol debe ser Admin o Cliente'),

    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano'),

    validationErrors
];

// ─── Validar actualización de usuario (todos los campos opcionales) ───────────
// En un PUT/PATCH de actualización, el Admin puede enviar solo los campos
// que quiere modificar. Por eso todos los campos son .optional().
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

    // nullable:true + checkFalsy:true → acepta null y '' sin validar,
    // lo que permite al Admin editar otros campos sin tocar la contraseña
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
