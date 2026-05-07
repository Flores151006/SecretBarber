import { body, param, validationResult } from 'express-validator';

const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }
    next();
};

// ─── Validar ID de MongoDB ────────────────────────────────────────────────────
export const validarId = [
    param('id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID debe ser un ObjectId válido de MongoDB'),
    validationErrors
];

// ─── Validar creación de reserva ──────────────────────────────────────────────
export const validarBooking = [
    body('barbero')
        .notEmpty().withMessage('El barbero es requerido')
        .isMongoId().withMessage('El barbero debe ser un ID válido'),

    body('servicios')
        .isArray({ min: 1 }).withMessage('Selecciona al menos un servicio')
        .custom(servicios => servicios.every(s => /^[a-f\d]{24}$/i.test(s)))
        .withMessage('Algún servicio tiene un ID inválido'),

    body('cejas')
        .optional()
        .isBoolean().withMessage('El campo cejas debe ser verdadero o falso'),

    body('fecha')
        .notEmpty().withMessage('La fecha es requerida')
        .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)')
        .custom(value => {
            const fecha = new Date(value);
            const hoy   = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fecha < hoy)
                throw new Error('No puedes reservar en una fecha pasada');

            const dia = fecha.getUTCDay();
            // 0=domingo, 1=lunes — solo martes(2) a viernes(5)
            if (dia < 2 || dia > 5)
                throw new Error('La barbería solo abre de martes a viernes');

            return true;
        }),

    body('hora')
        .notEmpty().withMessage('La hora es requerida')
        .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM)')
        .custom(value => {
            const [horas, minutos] = value.split(':').map(Number);

            if (horas < 16 || horas >= 21)
                throw new Error('El horario de la barbería es de 16:00 a 21:00');

            if (minutos !== 0 && minutos !== 30)
                throw new Error('Las citas son solo a en punto (:00) o y media (:30)');

            return true;
        }),

    body('metodoPago')
        .notEmpty().withMessage('El método de pago es requerido')
        .isIn(['tarjeta', 'efectivo']).withMessage('El método de pago debe ser tarjeta o efectivo'),

    body('notas')
        .optional()
        .isLength({ max: 300 }).withMessage('Las notas no pueden superar los 300 caracteres')
        .trim(),

    validationErrors
];