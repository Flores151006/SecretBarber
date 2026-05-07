import { body } from 'express-validator';

export const servicioValidator = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
    body('duracion').isInt({ min: 15 }).withMessage('Duración mínima 15 minutos'),
    body('activo').optional().isBoolean()
];