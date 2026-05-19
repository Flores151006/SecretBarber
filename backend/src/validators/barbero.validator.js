// ─────────────────────────────────────────────────────────────────────────────
// barbero.validator.js
//
// Reglas de validación para la creación de un barbero.
//
// Encadenamiento de métodos (body chaining):
//   body('campo').regla1().withMessage('...').regla2().withMessage('...')
//   Cada método devuelve el mismo objeto validador, permitiendo encadenar
//   reglas sin necesidad de crear variables intermedias. La ejecución es
//   secuencial: si la primera regla falla, las siguientes también se evalúan
//   para recopilar todos los errores en una sola pasada.
//
// .isArray({ min: 1 }):
//   Verifica que diasTrabajo sea un array con al menos un elemento.
//   Esto es necesario porque un barbero debe trabajar al menos un día.
//   La sintaxis body('diasTrabajo.*') aplica la validación a CADA elemento
//   del array (el * es un comodín de express-validator para arrays).
// ─────────────────────────────────────────────────────────────────────────────
import { body } from 'express-validator';

export const barberoValidator = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),

    body('email').isEmail().withMessage('Email inválido'),

    // Verifica que se envíe un array con al menos un día de trabajo
    body('diasTrabajo').isArray({ min: 1 }).withMessage('Indica al menos un día'),

    // body('diasTrabajo.*') valida cada elemento del array individualmente.
    // Los días se representan como números 0-6 (0=domingo, 6=sábado) siguiendo
    // la convención de JavaScript (Date.getDay())
    body('diasTrabajo.*').isInt({ min: 0, max: 6 }).withMessage('Día inválido'),

    // Regex de formato HH:MM — ver barbero.model.js para explicación detallada
    body('horaInicio').matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato HH:MM'),
    body('horaFin').matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato HH:MM'),
];
