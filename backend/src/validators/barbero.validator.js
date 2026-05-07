import { body } from 'express-validator';

export const barberoValidator = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('diasTrabajo').isArray({ min: 1 }).withMessage('Indica al menos un día'),
    body('diasTrabajo.*').isInt({ min: 0, max: 6 }).withMessage('Día inválido'),
    body('horaInicio').matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato HH:MM'),
    body('horaFin').matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato HH:MM'),
];