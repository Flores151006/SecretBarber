import { body, param, validationResult } from 'express-validator';

const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }
    next();
};

export const validarId = [
    param('id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID debe ser un ObjectId válido de MongoDB'),

    validationErrors
];

export const validarReview = [
    body('reserva')
        .notEmpty().withMessage('La reserva es requerida')
        .isMongoId().withMessage('El ID de reserva no es válido'),

    body('puntuacion')
        .notEmpty().withMessage('La puntuación es requerida')
        .isInt({ min: 1, max: 5 }).withMessage('La puntuación debe ser un número entre 1 y 5'),

    body('comentario')
        .trim()
        .notEmpty().withMessage('El comentario es requerido')
        .isLength({ min: 10, max: 500 }).withMessage('El comentario debe tener entre 10 y 500 caracteres'),

    validationErrors
];